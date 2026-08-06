// ============================================================================
// LISTER QUESTION ENRICHMENT
// Rebuild standalone lister questions from vague seeker follow-ups
// ============================================================================

export interface ListerQuestionMessage {
  role: string;
  content: string;
}

// ============================================================================
// DETECTION PATTERNS
// Regexes and topic labels used to classify vague follow-ups
// ============================================================================

const BARE_FOLLOW_UP =
  /^(why|why\?|how|how\?|ok|okay|yes|yeah|yep|sure|please|thanks|thank you|cheers|go ahead|do it|yes please|please do|i want to know(?:\s+it|\s+that|\s+this)?|tell me|let me know)[\s!.?]*$/i;

const ASK_LISTER_TRIGGER =
  /^(?:ok(?:ay)?[,.]?\s*)?(?:please\s+)?(?:ask(?:\s+them|\s+the\s+lister|\s+him|\s+her)?(?:\s+please)?|send(?:\s+it)?(?:\s+to\s+(?:them|the\s+lister))?|escalate|i want to know(?:\s+it|\s+that|\s+this)?)[\s!.?]*$/i;

const CTA_OFFER_ONLY =
  /^(?:would you like me to ask|i can ask the lister|shall i ask|want me to ask|i(?:'|’)ll ask the lister)/i;

const PROPERTY_CLAIM =
  /not (?:allowed|specified|available|permitted)|do not have|don't have|body corporate|unknown|unfortunately|are not|is not|no pets|pets are|parking|smoking|furnished|floor area|bedrooms?/i;

// [NOTE] maps assistant wording to stable labels for escalation questions
const UNKNOWN_TOPIC_PHRASES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bfloor\s*area\b|\bsqm\b|\bsquare\s+metr/i, label: 'floor area' },
  { pattern: /\bcouncil\s+rates?\b|\brates\b/i, label: 'council rates' },
  { pattern: /\bbody\s+corporate\b/i, label: 'body corporate details' },
  { pattern: /\binclusions?\b|\bincluded\b/i, label: 'inclusions' },
  { pattern: /\butilities\b|\bwater\s+rates?\b|\bpower\b/i, label: 'utilities' },
  { pattern: /\bpets?\b|\bdogs?\b|\bcats?\b/i, label: 'pets policy' },
  { pattern: /\bparking\b|\bgarage\b|\bcar\s*park/i, label: 'parking' },
  { pattern: /\bheating\b|\binsulation\b|\bheat\s+pump\b/i, label: 'heating' },
  { pattern: /\bfibre\b|\bfiber\b|\binternet\b|\bwifi\b/i, label: 'internet / fibre' },
  { pattern: /\baccessib|\bwheelchair\b|\bstep[\s-]?free\b/i, label: 'accessibility' },
  { pattern: /\bfurnish/i, label: 'furnishing' },
  { pattern: /\bavailable\s+from\b|\bmove[\s-]?in\b/i, label: 'available from / move-in date' },
  { pattern: /\byear\s+built\b|\bbuilt\b/i, label: 'year built' },
  { pattern: /\bowner\s+moving\b|\bwhy\s+.*moving\b/i, label: 'why the owner is moving' },
];

const UNKNOWN_SIGNAL =
  /not\s+specified|not\s+listed|don'?t\s+have|do\s+not\s+have|unknown|missing|i(?:'|’)ll\s+ask|ask\s+the\s+lister|would you like me to ask/i;

// ============================================================================
// EXPORTED CLASSIFIERS
// Detect vague follow-ups and named unknown topics from assistant text
// ============================================================================

/**
 * Detects whether seeker text is too vague to send to a lister as-is.
 *
 * @param text - Raw seeker message to classify
 * @returns True when the text is empty, a bare follow-up, or a short vague prompt
 */
export function isBareOrVagueListerQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return true;
  }
  if (BARE_FOLLOW_UP.test(trimmed) || ASK_LISTER_TRIGGER.test(trimmed)) {
    return true;
  }
  // [WHY] short prompts starting with why/how/etc. lack a topic without history
  if (trimmed.length < 16 && /^(why|how|what|and|but|ok|okay)\b/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Detects whether the seeker is confirming an ask-the-lister escalation.
 *
 * @param text - Raw seeker message to classify
 * @returns True when the text matches an ask/escalate confirmation phrase
 */
export function isAskListerConfirmation(text: string): boolean {
  return ASK_LISTER_TRIGGER.test(text.trim());
}

/**
 * Pulls topic labels the assistant marked as unknown or offered to escalate.
 *
 * @param assistantContent - Recent assistant reply that may name missing topics
 * @returns Deduplicated topic labels in phrase-table order, or empty if none signaled
 */
export function extractNamedUnknownTopics(assistantContent: string): string[] {
  if (!assistantContent || !UNKNOWN_SIGNAL.test(assistantContent)) {
    return [];
  }

  const found: string[] = [];
  const seen = new Set<string>();
  for (const { pattern, label } of UNKNOWN_TOPIC_PHRASES) {
    if (pattern.test(assistantContent) && !seen.has(label)) {
      seen.add(label);
      found.push(label);
    }
  }
  return found;
}

// ============================================================================
// PRIVATE RECONSTRUCTION HELPERS
// Turn chat history into a self-contained question a lister can answer
// ============================================================================

function normalizeRole(role: string): 'USER' | 'ASSISTANT' | 'OTHER' {
  const upper = role.toUpperCase();
  if (upper === 'USER') return 'USER';
  if (upper === 'ASSISTANT') return 'ASSISTANT';
  return 'OTHER';
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
  if (body.length < 8) {
    return 'Why is that the case for this property?';
  }

  // [WHY] rewrite "Pets are not allowed" → "Why are pets not allowed?"
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

function questionFromUnknownTopics(topics: string[]): string {
  if (topics.length === 1) {
    const topic = topics[0] ?? 'this detail';
    if (/^why\b/i.test(topic)) {
      return `${topic.charAt(0).toUpperCase()}${topic.slice(1)}?`.replace(/\?\?+$/, '?');
    }
    return `What is the ${topic} for this property?`;
  }
  return `Could you please clarify these details for this property: ${topics.join('; ')}?`;
}

function findSubstantiveUserTopics(messages: ListerQuestionMessage[]): string[] {
  const topics: string[] = [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message || normalizeRole(message.role) !== 'USER') {
      continue;
    }
    const content = message.content.trim();
    if (isBareOrVagueListerQuestion(content)) {
      continue;
    }
    topics.push(content);
    // [PERF] cap lookback — only the latest few topics matter for enrichment
    if (topics.length >= 3) {
      break;
    }
  }
  return topics;
}

// [NOTE] prefers property-fact replies; skips short CTA-only offers
function findRelevantAssistantClaim(messages: ListerQuestionMessage[]): string {
  let fallback = '';
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message || normalizeRole(message.role) !== 'ASSISTANT') {
      continue;
    }
    const content = message.content.trim();
    if (!content) {
      continue;
    }
    if (!fallback) {
      fallback = content;
    }
    // [WHY] short CTA-only offers lack a fact to rewrite into a why-question
    if (CTA_OFFER_ONLY.test(content) && content.length < 160) {
      continue;
    }
    if (PROPERTY_CLAIM.test(content) || content.length > 40) {
      return content;
    }
  }
  return fallback;
}

// ============================================================================
// MAIN ENRICHMENT
// Public entry: expand vague seeker text using recent chat context
// ============================================================================

/**
 * Returns a clear, standalone question a lister can answer without chat history.
 *
 * @param questionText - Seeker message that may be a bare follow-up
 * @param recentMessages - Recent user/assistant turns for topic reconstruction
 * @returns Enriched question text, or the original when already substantive
 */
export function enrichListerQuestion(
  questionText: string,
  recentMessages: ListerQuestionMessage[],
): string {
  const candidate = questionText.trim();
  if (!isBareOrVagueListerQuestion(candidate)) {
    return candidate;
  }

  const topics = findSubstantiveUserTopics(
    recentMessages.filter((message) => message.content.trim() !== candidate),
  );
  const lastUserTopic = topics[0] ?? '';
  const earlierUserTopic = topics[1] ?? '';
  const lastAssistant = findRelevantAssistantClaim(recentMessages);
  const assistantClaim = lastAssistant ? firstSentence(lastAssistant) : '';
  const namedUnknowns = lastAssistant ? extractNamedUnknownTopics(lastAssistant) : [];

  if (/^why\b/i.test(candidate) && assistantClaim) {
    return toWhyQuestion(assistantClaim);
  }

  if (ASK_LISTER_TRIGGER.test(candidate)) {
    // [WHY] prefer unknowns the assistant named — avoids bundling unrelated history
    if (namedUnknowns.length > 0) {
      return questionFromUnknownTopics(namedUnknowns);
    }
    if (/^why\b/i.test(lastUserTopic) && assistantClaim) {
      return toWhyQuestion(assistantClaim);
    }
    // [WHY] walk pets → why → ask them: reconstruct why from the fact reply
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
    if (/^why\b/i.test(candidate) && assistantClaim) {
      return toWhyQuestion(assistantClaim);
    }
    if (namedUnknowns.length > 0) {
      return questionFromUnknownTopics(namedUnknowns);
    }
    return `${lastUserTopic} — follow-up: ${candidate}`;
  }

  if (namedUnknowns.length > 0) {
    return questionFromUnknownTopics(namedUnknowns);
  }

  if (assistantClaim) {
    return `Can you clarify this for the property: ${stripLeadIn(assistantClaim)}?`;
  }

  return candidate;
}
