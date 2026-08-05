/**
 * Client-side fallback to avoid sending bare follow-ups as lister questions.
 * Server also enriches; this covers CTA / ask-lister API paths if re-enabled.
 */

const BARE_FOLLOW_UP =
  /^(why|why\?|how|how\?|ok|okay|yes|yeah|yep|sure|please|thanks|thank you|cheers|go ahead|do it|yes please|please do)[\s!.?]*$/i;

const ASK_LISTER_TRIGGER =
  /^(?:ok(?:ay)?[,.]?\s*)?(?:please\s+)?(?:ask(?:\s+them|\s+the\s+lister|\s+him|\s+her)?|send(?:\s+it)?(?:\s+to\s+(?:them|the\s+lister))?|escalate)[\s!.?]*$/i;

const CTA_OFFER_ONLY =
  /^(?:would you like me to ask|i can ask the lister|shall i ask|want me to ask|i(?:'|’)ll ask the lister)/i;

const PROPERTY_CLAIM =
  /not (?:allowed|specified|available|permitted)|do not have|don't have|body corporate|unknown|unfortunately|are not|is not|no pets|pets are|parking|smoking|furnished|floor area|bedrooms?/i;

export interface EnrichableChatMessage {
  role: string;
  content: string;
}

export function isBareOrVagueListerQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (BARE_FOLLOW_UP.test(trimmed) || ASK_LISTER_TRIGGER.test(trimmed)) return true;
  if (trimmed.length < 16 && /^(why|how|what|and|but|ok|okay)\b/i.test(trimmed)) return true;
  return false;
}

function firstSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
  return (match?.[1] ?? cleaned).slice(0, 280);
}

function stripLeadIn(sentence: string): string {
  return sentence
    .replace(
      /^(?:yes|no|unfortunately|sorry|unfortunately[,.]?|based on (?:the )?listing[,.]?)\s*/i,
      '',
    )
    .replace(/\.$/, '')
    .trim();
}

function toWhyQuestion(claim: string): string {
  const body = stripLeadIn(claim);
  if (body.length < 8) return 'Why is that the case for this property?';

  const copulaMatch = body.match(/^(.+?)\s+(are|is|was|were|has|have)\s+(.+)$/i);
  if (copulaMatch?.[1] && copulaMatch[2] && copulaMatch[3]) {
    const subject = copulaMatch[1];
    const verb = copulaMatch[2].toLowerCase();
    const rest = copulaMatch[3].replace(/\?+$/, '');
    const subjectLower = `${subject.charAt(0).toLowerCase()}${subject.slice(1)}`;
    return `Why ${verb} ${subjectLower} ${rest}?`.replace(/\?\?+$/, '?');
  }

  const lower = `${body.charAt(0).toLowerCase()}${body.slice(1)}`;
  if (/^(pets|this property|the property|it|they|parking|smoking|furnishings?|rent|price)\b/i.test(body)) {
    return `Why ${lower}?`.replace(/\?\?+$/, '?');
  }
  return `Why is the following the case for this property: ${body}?`;
}

function findRelevantAssistantClaim(messages: EnrichableChatMessage[]): string {
  let fallback = '';
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message || message.role.toUpperCase() !== 'ASSISTANT') continue;
    const content = message.content.trim();
    if (!content) continue;
    if (!fallback) fallback = content;
    if (CTA_OFFER_ONLY.test(content) && content.length < 160) continue;
    if (PROPERTY_CLAIM.test(content) || content.length > 40) return content;
  }
  return fallback;
}

export function enrichListerQuestion(
  questionText: string,
  recentMessages: EnrichableChatMessage[],
): string {
  const candidate = questionText.trim();
  if (!isBareOrVagueListerQuestion(candidate)) {
    return candidate;
  }

  const topics: string[] = [];
  for (let i = recentMessages.length - 1; i >= 0; i -= 1) {
    const message = recentMessages[i];
    if (!message) continue;
    if (message.role.toUpperCase() !== 'USER') continue;
    const content = message.content.trim();
    if (content === candidate || isBareOrVagueListerQuestion(content)) continue;
    topics.push(content);
    if (topics.length >= 2) break;
  }

  const lastUserTopic = topics[0] ?? '';
  const earlierUserTopic = topics[1] ?? '';
  const lastAssistant = findRelevantAssistantClaim(recentMessages);
  const assistantClaim = lastAssistant ? firstSentence(lastAssistant) : '';

  if (/^why\b/i.test(candidate) && assistantClaim) {
    return toWhyQuestion(assistantClaim);
  }

  if (ASK_LISTER_TRIGGER.test(candidate)) {
    if (/^why\b/i.test(lastUserTopic) && assistantClaim) {
      return toWhyQuestion(assistantClaim);
    }
    if (assistantClaim && PROPERTY_CLAIM.test(assistantClaim)) {
      return toWhyQuestion(assistantClaim);
    }
    if (lastUserTopic) {
      return lastUserTopic.endsWith('?') ? lastUserTopic : `${lastUserTopic}?`;
    }
    if (earlierUserTopic) {
      return earlierUserTopic.endsWith('?') ? earlierUserTopic : `${earlierUserTopic}?`;
    }
  }

  if (lastUserTopic && candidate.length < 24) {
    return `${lastUserTopic} — follow-up: ${candidate}`;
  }

  if (assistantClaim) {
    return `Can you clarify this for the property: ${stripLeadIn(assistantClaim)}?`;
  }

  return candidate;
}
