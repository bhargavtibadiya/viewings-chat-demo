import type OpenAI from 'openai';
import type { AnswerStatus, ChatMessage, ListingType } from '#generated/client.js';
import { getOpenAIClient, getOpenAIModel } from './openai.client.js';
import { toolDefinitions } from './tools/toolDefinitions.js';
import { toolHandlers } from './tools/toolHandlers.js';
import { buildListingTypeGuidance } from './policies/listingTypePolicy.js';
import { deriveAnswerStatus, pickActions } from './policies/ctaPolicy.js';
import { AI } from '../../utils/constants/pagination.js';
import type { AgentContext, AgentRunResult, ChatFact, ToolCallRecord } from './types/ai.types.js';
import { createLogger } from '../../utils/helpers/logger.js';
import { isRecord } from '../../utils/helpers/json.js';

const logger = createLogger('AgentLoop');

function isToolCallMessage(message: OpenAI.Chat.Completions.ChatCompletionMessage): boolean {
  return Boolean(message.tool_calls && message.tool_calls.length > 0);
}

function extractFactsFromToolResults(toolsCalled: ToolCallRecord[]): ChatFact[] {
  const facts: ChatFact[] = [];

  for (const tool of toolsCalled) {
    if (tool.name === 'get_property' || tool.name === 'read_session_memory' || tool.name === 'get_approved_answers') {
      try {
        const parsed: unknown = JSON.parse(tool.result);
        if (isRecord(parsed) && 'attributes' in parsed) {
          const attributesValue = parsed.attributes;
          if (Array.isArray(attributesValue)) {
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
                if (valueText && valueText !== 'unknown') {
                  facts.push({
                    attribute: item.key,
                    value: valueText,
                    source: 'listing_attribute',
                  });
                }
              }
            }
          }
        }
      } catch {
        logger.debug('Could not parse tool result for facts');
      }
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

export class AgentLoop {
  async run(
    context: AgentContext,
    recentMessages: ChatMessage[],
    listingType: ListingType,
    propertyTitle: string,
  ): Promise<AgentRunResult> {
    const start = Date.now();
    const client = getOpenAIClient();
    const model = getOpenAIModel();

    const systemPrompt = [
      'You are the Viewings AI assistant for a New Zealand property marketplace demo.',
      'Follow Understand, Verify, Answer, Act on every turn.',
      'Never invent property facts. Use tools for all factual claims.',
      'If data is missing, say it is not specified and offer to ask the lister.',
      buildListingTypeGuidance(listingType),
      'Timezone: Pacific/Auckland. Respond in English.',
      'Do not claim a booking or lister message was sent unless the corresponding tool succeeded.',
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
      });

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
            context,
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

    const facts = extractFactsFromToolResults(toolsCalled);
    const hasUnknown = detectUnknownIntent(finalContent);
    const answerStatus: AnswerStatus = deriveAnswerStatus(facts, hasUnknown);
    const actions = pickActions(answerStatus, listingType);

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
