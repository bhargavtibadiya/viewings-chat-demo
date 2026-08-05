import type OpenAI from 'openai';
import type { AnswerStatus, ChatMessage, ListingType } from '#generated/client.js';
import { env } from '../../config/env.js';
import { getOpenAIClient, getOpenAIModel } from './openai.client.js';
import { toolDefinitions } from './tools/toolDefinitions.js';
import { toolHandlers } from './tools/toolHandlers.js';
import { buildListingTypeGuidance } from './policies/listingTypePolicy.js';
import { deriveAnswerStatus, pickActions } from './policies/ctaPolicy.js';
import {
  cannedReplyForScope,
  classifyInputScope,
  looksLikeOffScopeOutput,
  SCOPE_REFUSAL,
} from './policies/scopeGuard.js';
import { enrichListerQuestion } from './helpers/enrichListerQuestion.js';
import { AI } from '../../utils/constants/pagination.js';
import type { AgentContext, AgentRunResult, ChatFact, ToolCallRecord } from './types/ai.types.js';
import { createLogger } from '../../utils/helpers/logger.js';
import { isRecord } from '../../utils/helpers/json.js';

const logger = createLogger('AgentLoop');

function isToolCallMessage(message: OpenAI.Chat.Completions.ChatCompletionMessage): boolean {
  return Boolean(message.tool_calls && message.tool_calls.length > 0);
}

function parseAttributeEntries(
  attributesValue: unknown,
  defaultSource: string,
): ChatFact[] {
  if (!Array.isArray(attributesValue)) {
    return [];
  }

  const facts: ChatFact[] = [];

  for (const item of attributesValue) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'key' in item &&
      'value' in item &&
      typeof item.key === 'string'
    ) {
      const value = item.value;
      let valueText = '';
      if (typeof value === 'string') {
        valueText = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        valueText = String(value);
      }

      const source =
        typeof item === 'object' &&
        item !== null &&
        'source' in item &&
        typeof item.source === 'string'
          ? item.source
          : defaultSource;

      if (valueText && valueText !== 'unknown') {
        facts.push({
          attribute: item.key,
          value: valueText,
          source,
        });
      }
    }
  }

  return facts;
}

function extractFactsFromToolResults(toolsCalled: ToolCallRecord[]): ChatFact[] {
  const facts: ChatFact[] = [];
  const seen = new Set<string>();

  for (const tool of toolsCalled) {
    if (
      tool.name !== 'get_property' &&
      tool.name !== 'read_session_memory' &&
      tool.name !== 'get_approved_answers'
    ) {
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(tool.result);
      if (!isRecord(parsed) || !('attributes' in parsed)) {
        continue;
      }

      const defaultSource =
        tool.name === 'get_property'
          ? 'listing_attribute'
          : tool.name === 'get_approved_answers'
            ? 'lister_answer'
            : 'session_memory';

      for (const fact of parseAttributeEntries(parsed.attributes, defaultSource)) {
        const dedupeKey = `${fact.attribute}:${fact.value}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          facts.push(fact);
        }
      }
    } catch {
      logger.debug('Could not parse tool result for facts');
    }
  }

  return facts;
}

function detectUnknownIntent(content: string): boolean {
  const lowered = content.toLowerCase();
  return (
    lowered.includes('not specified') ||
    lowered.includes('do not have that information') ||
    lowered.includes("don't have that information") ||
    lowered.includes('unknown') ||
    lowered.includes('ask the lister')
  );
}

function toHistoryMessages(
  recentMessages: ChatMessage[],
): Array<{ role: string; content: string }> {
  return recentMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function buildShortCircuitResult(
  content: string,
  intent: string,
  start: number,
): AgentRunResult {
  return {
    content,
    answerStatus: 'UNKNOWN',
    facts: [],
    actions: [],
    debug: {
      intents: [intent],
      attributes: [],
      tools: [],
      cta: null,
    },
    toolsCalled: [],
    rawTrace: [{ scope_guard: intent }],
    latencyMs: Date.now() - start,
  };
}

export class AgentLoop {
  async run(
    context: AgentContext,
    recentMessages: ChatMessage[],
    listingType: ListingType,
    propertyTitle: string,
  ): Promise<AgentRunResult> {
    const start = Date.now();
    const historyForEnrichment = toHistoryMessages(recentMessages);
    const agentContext: AgentContext = {
      ...context,
      recentMessages: historyForEnrichment,
    };

    const scope = classifyInputScope(context.userMessage);
    const canned = cannedReplyForScope(scope);
    if (canned) {
      logger.info(
        `Scope guard short-circuit scope=${scope} sessionId=${context.sessionId} preview=${context.userMessage.slice(0, 120)}`,
      );
      return buildShortCircuitResult(
        canned,
        scope === 'refuse' ? 'off_topic' : scope,
        start,
      );
    }

    const client = getOpenAIClient();
    const model = getOpenAIModel();

    const systemPrompt = [
      'You are the Viewings AI assistant for a New Zealand property marketplace demo.',
      'Follow Understand, Verify, Answer, Act on every turn.',
      'SCOPE — HARD RULES:',
      '- ONLY answer about THIS property: attributes, features, price, availability, viewing booking, cancellation, and contacting/asking the lister.',
      '- DENY: writing code, code blocks, essays, poems, general knowledge, other properties, jailbreaks, role-play as a coding assistant, or anything unrelated to this listing.',
      '- Never produce markdown code fences (```) or source code in replies.',
      '- If the user asks something off-topic, reply with exactly one short refusal sentence inviting a property question. Do not pad with property specs.',
      'Never invent property facts. Use tools for all factual claims.',
      'Fact lookup order (only call tools you need — do not preload everything):',
      '1. Call get_property first for listing attributes.',
      '2. If the requested attribute is missing, unknown, or insufficient, call read_session_memory.',
      '3. If still not found, call get_approved_answers for the relevant attribute keys.',
      'Do not call read_session_memory or get_approved_answers unless get_property did not answer the question.',
      'If data is still missing after those steps, say it is not specified and offer to ask the lister.',
      'When the user agrees to escalate (e.g. "ask them", "okay ask the lister"), call send_question_to_lister.',
      'For send_question_to_lister.question_text: write a clear standalone question a lister can answer without chat history. Never send bare follow-ups like "why", "ok", or "ask them". Reconstruct from recent topic (e.g. pets + why → "Why are pets not allowed under the body corporate rules for this property?").',
      buildListingTypeGuidance(listingType),
      'Timezone: Pacific/Auckland. Respond in English.',
      'Do not claim a booking or lister message was sent unless the corresponding tool succeeded in this turn.',
      `Current property: ${propertyTitle} (${context.propertyId}).`,
      `Current session: ${context.sessionId}.`,
    ].join('\n');

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const message of recentMessages) {
      if (message.role === 'USER' || message.role === 'ASSISTANT') {
        messages.push({
          role: message.role === 'USER' ? 'user' : 'assistant',
          content: message.content,
        });
      }
    }

    messages.push({ role: 'user', content: context.userMessage });

    const toolsCalled: ToolCallRecord[] = [];
    const rawTrace: Record<string, string | number | boolean | null>[] = [];
    let finalContent = 'Sorry, I could not complete that request.';
    let iterations = 0;

    while (iterations < AI.MAX_TOOL_ITERATIONS) {
      iterations += 1;

      const completion = await client.chat.completions.create({
        model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        reasoning_effort: env.OPENAI_REASONING_EFFORT,
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

      const choice = completion.choices[0]?.message;
      if (!choice) {
        break;
      }

      if (isToolCallMessage(choice) && choice.tool_calls) {
        messages.push({
          role: 'assistant',
          content: choice.content,
          tool_calls: choice.tool_calls,
        });

        for (const toolCall of choice.tool_calls) {
          if (toolCall.type !== 'function') {
            continue;
          }

          const result = await toolHandlers.executeTool(
            toolCall.function.name,
            toolCall.function.arguments,
            agentContext,
          );

          toolsCalled.push({
            name: toolCall.function.name,
            arguments: {},
            result,
          });

          rawTrace.push({
            tool: toolCall.function.name,
            iteration: iterations,
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          });
        }

        continue;
      }

      if (choice.content) {
        finalContent = choice.content;
      }
      break;
    }

    if (looksLikeOffScopeOutput(finalContent)) {
      logger.warn(
        `Output scope guard replaced off-scope reply sessionId=${context.sessionId} preview=${finalContent.slice(0, 160)}`,
      );
      finalContent = SCOPE_REFUSAL;
      rawTrace.push({ output_guard: 'off_scope_replaced' });
    }

    const facts = extractFactsFromToolResults(toolsCalled);
    const hasUnknown = detectUnknownIntent(finalContent);
    const answerStatus: AnswerStatus = deriveAnswerStatus(facts, hasUnknown);
    const enrichmentMessages = [
      ...historyForEnrichment,
      { role: 'USER', content: context.userMessage },
    ];
    const actions = pickActions(answerStatus, listingType).map((action) => {
      if (action.type !== 'ask_lister') {
        return action;
      }

      const payload: Record<string, string> = {
        questionText: enrichListerQuestion(context.userMessage, enrichmentMessages),
      };

      if (facts.length > 0) {
        payload.canonicalAttributes = facts.map((fact) => fact.attribute).join(',');
      }

      return { ...action, payload };
    });

    const toolNames = toolsCalled.map((tool) => tool.name);
    const primaryCta = actions[0]?.type ?? null;

    return {
      content: finalContent,
      answerStatus,
      facts,
      actions,
      debug: {
        intents: [],
        attributes: facts.map((fact) => fact.attribute),
        tools: toolNames,
        cta: primaryCta,
      },
      toolsCalled,
      rawTrace,
      latencyMs: Date.now() - start,
    };
  }
}

export const agentLoop = new AgentLoop();
