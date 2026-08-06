// ============================================================================
// CANNED REPLY CONSTANTS
// Fixed strings and greeting pools used when the agent short-circuits without tools
// ============================================================================

/**
 * Standard refusal when the user goes off-topic or attempts a jailbreak.
 *
 * @returns Fixed scope-refusal sentence inviting a property question
 */
export const SCOPE_REFUSAL =
  'I can only help with questions about this property - things like price, features, availability, or booking a viewing. What would you like to know?';

/**
 * Opening greetings for a brand-new session (pick one at random).
 *
 * @returns Pool of first-open greeting strings
 */
export const OPENING_GREETINGS: readonly string[] = [
  'Hi! Ask me anything about this property - price, features, availability, or booking a viewing.',
  'Welcome. I can help with listing details, pricing, or booking a viewing for this property.',
  'Kia ora. Curious about this place? Ask about features, cost, or available viewing times.',
  'Hello! I am here for this listing only - features, price, availability, or a viewing booking.',
  'Good to see you. What would you like to know about this property first?',
  'Hi there. I can cover the key facts on this listing, or help you book a viewing.',
];

/**
 * Opening greetings that include the property title when available.
 *
 * @returns Pool of templates containing `{title}` placeholders
 */
export const OPENING_GREETINGS_WITH_TITLE: readonly string[] = [
  'Hi! You are looking at **{title}**. Ask about price, features, availability, or booking a viewing.',
  'Welcome to **{title}**. What would you like to know - details, cost, or viewing times?',
  'Kia ora. I can help with **{title}**: features, pricing, or booking a viewing.',
  'Hello! Ready when you are for questions about **{title}**, or to book a viewing.',
];

/**
 * Short mid-session greeting acks (pick one at random).
 *
 * @returns Pool of returning-session greeting strings
 */
export const RETURNING_GREETINGS: readonly string[] = [
  'Hi again! What would you like to know?',
  'Hey - still here. What next about this property?',
  'Hello again. Happy to keep going on this listing.',
  'Hi! What else can I help with on this property?',
  'Welcome back. Ask away about this listing.',
];

/** @deprecated Prefer pickOpeningGreeting() - kept for tests/compat as first pool item. */
export const GREETING_ACK = OPENING_GREETINGS[0]!;

/** @deprecated Prefer pickReturningGreeting(). */
export const GREETING_ACK_RETURNING = RETURNING_GREETINGS[0]!;

/**
 * Ack when the user says thanks.
 *
 * @returns Fixed thanks reply
 */
export const THANKS_ACK = "You're welcome - anything else about this property?";

/**
 * Ack when input looks like gibberish or is otherwise unclear.
 *
 * @returns Fixed unclear-input reply
 */
export const UNCLEAR_ACK =
  "Sorry, I don't quite get that. Could you rephrase your question about this property?";

/**
 * Ack when the OpenAI call fails mid-loop.
 *
 * @returns Fixed temporary-failure reply
 */
export const API_FAILURE_ACK =
  "Sorry, I hit a temporary issue just now. Please try that again in a moment.";

/**
 * Hint embedded in empty get_availability tool results.
 *
 * @returns Fixed empty-slots hint for the model
 */
export const EMPTY_SLOTS_HINT =
  'No free viewing times in that range. Try another date, or ask me to check a wider window.';

/**
 * Picks a random entry from a greeting pool.
 *
 * @param pool - Non-empty readonly string pool
 * @returns One string from the pool
 */
function pickFromPool(pool: readonly string[]): string {
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? pool[0]!;
}

/**
 * Random first-open greeting; uses title variants when a title is provided.
 *
 * @param propertyTitle - Optional listing title to inject into the template
 * @returns A greeting string from the opening or titled pool
 */
export function pickOpeningGreeting(propertyTitle?: string | null): string {
  const title = propertyTitle?.trim();
  if (title) {
    const template = pickFromPool(OPENING_GREETINGS_WITH_TITLE);
    return template.replaceAll('{title}', title);
  }
  return pickFromPool(OPENING_GREETINGS);
}

/**
 * Random short ack when the user greets again mid-session.
 *
 * @returns A greeting string from the returning pool
 */
export function pickReturningGreeting(): string {
  return pickFromPool(RETURNING_GREETINGS);
}

/**
 * Result of pre-LLM input classification.
 */
export type InputScopeClass = 'allow' | 'refuse' | 'greeting' | 'thanks' | 'unclear';

// ============================================================================
// SCOPE CLASSIFIERS
// Deterministic pattern matchers that decide allow / refuse / greeting / thanks / unclear
// ============================================================================

const JAILBREAK_PATTERNS: RegExp[] = [
  /\b(ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|above|earlier|your)\s+(?:instructions?|prompts?|rules?|system\s+message)/i,
  /\byou\s+are\s+now\s+\S/i,
  /\b(?:act|pretend|roleplay|behave)\s+as\s+(?:a|an|the)?\s*(?:ai|assistant|chatbot|dan|bot|coding\s+assistant|software\s+engineer)\b/i,
  /\b(?:act|pretend|roleplay|behave)\b[^.!?]{0,40}\b(?:no\s+rules|without\s+(?:rules|restrictions|limits|filters)|ignor(?:e|ing)\s+(?:your\s+|the\s+)?(?:rules|restrictions|guidelines))\b/i,
  /<\|(?:im_start|im_end|endoftext|system|user|assistant)\|>/i,
  /(?:^|\n)\s*###\s*(?:system|instruction|prompt)/i,
  /\[INST\]|\[\/INST\]/i,
  /\b(?:reveal|show|display|repeat|print|output)\s+(?:me\s+)?(?:your|the)\s+(?:system\s+)?(?:prompt|instructions?|rules)/i,
  /\b(?:other|all)\s+listings?\s+(?:in|on|from)\s+(?:the\s+)?(?:database|system|platform)/i,
  /\b(?:developer\s+mode|dan\s+mode|jailbreak)\b/i,
];

const CODE_REQUEST_PATTERNS: RegExp[] = [
  /\b(?:write|generate|create|produce|give\s+me|show\s+me|paste|output)\b[\s\S]{0,80}\b(?:code(?:\s*block)?|snippet|script|function|class|module|endpoint|api\s+call|typescript|javascript|python|java|golang|rust|sql|html|css|regex)\b/i,
  /\b(?:write|implement|code)\s+(?:a|an|the|me\s+a|me\s+an)?\s*(?:ts|tsx|js|jsx|py|python|typescript|javascript)\s+(?:function|class|module|script|component|hook)\b/i,
  /\b(?:act\s+as|you\s+are)\s+(?:a\s+)?(?:coding|programming|software)\s+(?:assistant|engineer|developer|tutor)\b/i,
  /\b(?:debug|refactor|optimise|optimize)\s+(?:this|my|the)\s+(?:code|function|script|program)\b/i,
  /\b(?:leetcode|algorithm\s+problem|big[\s-]?o)\b/i,
  /```[\s\S]*```/,
  /(?:^|\n)\s*(?:function|const|let|var|class|import|export|def|public\s+static)\s+\w+/m,
];

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(?:write|draft|compose)\s+(?:an?\s+)?(?:essay|poem|story|novel|song|screenplay|cover\s+letter|resume|cv)\b/i,
  /\b(?:translate\s+this|summarise\s+this\s+article|summarize\s+this\s+article)\b/i,
  /\b(?:who\s+won|what\s+is\s+the\s+capital|weather\s+(?:today|tomorrow)|stock\s+price)\b/i,
  /\b(?:ignore\s+(?:the\s+)?(?:property|listing)|not\s+about\s+(?:the\s+)?(?:property|listing|house|apartment))\b/i,
  /\b(?:general\s+knowledge|unrelated\s+to\s+(?:this\s+)?(?:property|listing))\b/i,
];

const GREETING_PATTERN =
  /^(hi|hello|hey|good\s+(?:morning|afternoon|evening)|kia\s+ora|g'?day)[\s!.]*$/i;

const THANKS_PATTERN =
  /^(thanks|thank\s+you|cheers|ta|much\s+appreciated)[\s!.]*$/i;

const PROPERTY_QUESTION_PATTERNS: RegExp[] = [
  /\b(?:bedroom|bedrooms|beds?|bathroom|bathrooms|baths?|ensuite|toilet)\b/i,
  /\b(?:rent|bond|price|deposit|weekly\s+rent|asking\s+price)\b/i,
  /\b(?:pets?|dogs?|cats?|parking|garage|car\s*park)\b/i,
  /\b(?:viewing|open\s+home|availability|available\s+from|move[\s-]?in|book(?:ing)?)\b/i,
  /\b(?:fibre|fiber|internet|wifi|wi-?fi|broadband)\b/i,
  /\b(?:floor\s+area|sqm|square\s+metr|land\s+area|section\s+size)\b/i,
  /\b(?:council\s+rates|body\s+corporate|rates|utilities|inclusions?)\b/i,
  /\b(?:furnish(?:ed|ing)?|heating|insulation|heat\s+pump|air\s+cond)\b/i,
  /\b(?:suburb|address|location|lift|elevator|accessib|wheelchair|step[\s-]?free)\b/i,
  /\b(?:outdoor|yard|fencing|bbq|balcony|deck|garden)\b/i,
  /\b(?:this\s+)?(?:property|listing|house|apartment|flat|townhouse|villa)\b/i,
];

const CODE_FENCE_PATTERN = /```/;

const DENSE_CODE_LINE =
  /^(?:import\s+|export\s+|from\s+\S+\s+import|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|function\s+\w+|class\s+\w+|def\s+\w+|public\s+|private\s+|if\s*\(|for\s*\(|while\s*\(|return\s+|await\s+|async\s+)/;

/**
 * Classify user input before calling the LLM.
 * `refuse` / `greeting` / `thanks` / `unclear` should short-circuit without tools.
 *
 * @param input - Raw user message text
 * @returns Scope class that drives canned replies or LLM allow
 */
export function classifyInputScope(input: string): InputScopeClass {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return 'allow';
  }

  if (GREETING_PATTERN.test(trimmed)) {
    return 'greeting';
  }

  if (THANKS_PATTERN.test(trimmed)) {
    return 'thanks';
  }

  if (looksLikeJailbreak(trimmed)) {
    return 'refuse';
  }

  // [WHY] property keywords win over code/off-topic so mixed messages still reach the LLM
  if (looksLikeCodeOrOffTopicRequest(trimmed) && !looksLikePropertyQuestion(trimmed)) {
    return 'refuse';
  }

  if (looksLikeUnclearInput(trimmed)) {
    return 'unclear';
  }

  return 'allow';
}

/**
 * True when the input matches known jailbreak / prompt-injection patterns.
 *
 * @param input - Trimmed user text
 * @returns Whether any jailbreak pattern matched
 */
export function looksLikeJailbreak(input: string): boolean {
  return JAILBREAK_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * True when the input mentions listing-relevant topics (beds, rent, viewing, etc.).
 *
 * @param input - Trimmed user text
 * @returns Whether any property-question pattern matched
 */
export function looksLikePropertyQuestion(input: string): boolean {
  return PROPERTY_QUESTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * True when the input looks like a code request or clearly off-topic ask.
 *
 * @param input - Trimmed user text
 * @returns Whether any code or off-topic pattern matched
 */
export function looksLikeCodeOrOffTopicRequest(input: string): boolean {
  return (
    CODE_REQUEST_PATTERNS.some((pattern) => pattern.test(input)) ||
    OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(input))
  );
}

/**
 * Detect keyboard-mash / gibberish / punctuation-only noise.
 * Short legitimate tokens (pets, bond, wifi, hi) must not match.
 *
 * @param input - Raw user text
 * @returns Whether the input should be treated as unclear
 */
export function looksLikeUnclearInput(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) {
    return false;
  }

  if (looksLikePropertyQuestion(trimmed)) {
    return false;
  }

  // [NOTE] punctuation / symbol-only noise ("???", "...", "!!!")
  if (/^[^a-zA-Z0-9]+$/.test(trimmed)) {
    return true;
  }

  const letters = (trimmed.match(/[a-zA-Z]/g) || []).join('');
  // [WHY] keep short messages out of the gibberish path (pets?, bond, wifi, ok, hmm)
  if (letters.length < 6) {
    return false;
  }

  const compact = trimmed.replace(/\s+/g, '');
  const letterOnly = letters.toLowerCase();
  // [NOTE] long runs of the same character (aaaaa, hhhhh)
  if (/(.)\1{4,}/i.test(compact)) {
    return true;
  }

  // [NOTE] repeated short chunks: asdasdasd (asd×3), blahblah (blah×2)
  if (/^(.{2,5})\1+$/i.test(letterOnly)) {
    return true;
  }

  const vowelCount = (letters.match(/[aeiouAEIOU]/g) || []).length;
  const vowelRatio = vowelCount / letters.length;
  const hasWhitespace = /\s/.test(trimmed);
  const uniqueRatio = new Set(letterOnly).size / letterOnly.length;

  // [NOTE] single-token mash with very few distinct letters (asdasdasd, qqqwwwee)
  if (!hasWhitespace && letters.length >= 8 && uniqueRatio <= 0.4) {
    return true;
  }

  // [NOTE] consonant mash with almost no vowels (fghfggfghfh, asdfghjkl)
  if (vowelRatio <= 0.2 && letters.length >= 8) {
    return true;
  }

  // [NOTE] slightly shorter no-space mashes (e.g. "sdfghj")
  if (!hasWhitespace && vowelRatio < 0.15 && letters.length >= 6) {
    return true;
  }

  return false;
}

/**
 * Post-LLM output guard: block code fences and dense technical dumps.
 *
 * @param output - Assistant reply text
 * @returns Whether the output should be replaced with SCOPE_REFUSAL
 */
export function looksLikeOffScopeOutput(output: string): boolean {
  if (!output) {
    return false;
  }

  if (CODE_FENCE_PATTERN.test(output)) {
    return true;
  }

  const lines = output.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length >= 4) {
    const codeLike = lines.filter((line) => DENSE_CODE_LINE.test(line) || /[{};]$/.test(line));
    // [WHY] require both count and density so short prose with a brace is not refused
    if (codeLike.length >= 3 && codeLike.length / lines.length >= 0.5) {
      return true;
    }
  }

  const lower = output.toLowerCase();
  if (
    lower.includes('here is the code') ||
    lower.includes("here's the code") ||
    lower.includes('here is a typescript') ||
    lower.includes("here's a typescript") ||
    lower.includes('```typescript') ||
    lower.includes('```javascript') ||
    lower.includes('```python')
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// CANNED REPLY HELPERS
// Map a scope class to a deterministic reply without calling the LLM
// ============================================================================

/**
 * Options for choosing between opening and returning greeting pools.
 */
export interface CannedReplyOptions {
  /** True when the session already has assistant turns (or a prior greeting). */
  isReturningSession?: boolean;
}

/**
 * True when this chat already has an assistant message — treat further "hi/hello"
 * as mid-conversation, not a fresh open.
 *
 * @param recentMessages - Recent chat turns with a role field
 * @returns Whether any assistant turn is already present
 */
export function hasPriorAssistantTurn(
  recentMessages: Array<{ role: string; content?: string }>,
): boolean {
  return recentMessages.some((message) => message.role === 'ASSISTANT' || message.role === 'assistant');
}

/**
 * Returns a canned reply for a scope class, or null when the LLM should run.
 *
 * @param scope - Classification from classifyInputScope
 * @param options - Greeting pool selection options
 * @returns Canned reply string, or null for `allow`
 */
export function cannedReplyForScope(
  scope: InputScopeClass,
  options: CannedReplyOptions = {},
): string | null {
  switch (scope) {
    case 'refuse':
      return SCOPE_REFUSAL;
    case 'greeting':
      return options.isReturningSession ? pickReturningGreeting() : pickOpeningGreeting();
    case 'thanks':
      return THANKS_ACK;
    case 'unclear':
      return UNCLEAR_ACK;
    default:
      return null;
  }
}
