/**
 * Deterministic scope guards for the listing chat agent.
 * Prefer these over prompt-only controls for off-topic / jailbreak / code asks.
 */

export const SCOPE_REFUSAL =
  'I can only help with questions about this property — things like price, features, availability, or booking a viewing. What would you like to know?';

export const GREETING_ACK =
  'Hi! Ask me anything about this property — price, features, availability, or booking a viewing.';

export const THANKS_ACK = "You're welcome. Happy to help with anything else about this property.";

export type InputScopeClass = 'allow' | 'refuse' | 'greeting' | 'thanks';

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

const CODE_FENCE_PATTERN = /```/;

const DENSE_CODE_LINE =
  /^(?:import\s+|export\s+|from\s+\S+\s+import|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|function\s+\w+|class\s+\w+|def\s+\w+|public\s+|private\s+|if\s*\(|for\s*\(|while\s*\(|return\s+|await\s+|async\s+)/;

/**
 * Classify user input before calling the LLM.
 * `refuse` / `greeting` / `thanks` should short-circuit without tools.
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

  if (looksLikeJailbreak(trimmed) || looksLikeCodeOrOffTopicRequest(trimmed)) {
    return 'refuse';
  }

  return 'allow';
}

export function looksLikeJailbreak(input: string): boolean {
  return JAILBREAK_PATTERNS.some((pattern) => pattern.test(input));
}

export function looksLikeCodeOrOffTopicRequest(input: string): boolean {
  return (
    CODE_REQUEST_PATTERNS.some((pattern) => pattern.test(input)) ||
    OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(input))
  );
}

/**
 * Post-LLM output guard: block code fences and dense technical dumps.
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

export function cannedReplyForScope(scope: InputScopeClass): string | null {
  switch (scope) {
    case 'refuse':
      return SCOPE_REFUSAL;
    case 'greeting':
      return GREETING_ACK;
    case 'thanks':
      return THANKS_ACK;
    default:
      return null;
  }
}
