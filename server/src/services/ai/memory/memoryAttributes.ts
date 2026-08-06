import type { ApprovedAnswer } from '../../../generated/client.js';
import type { SessionMemory, SessionMemoryFact } from '../types/ai.types.js';

/** Attribute row shaped for tool / prompt consumption. */
export interface MemoryAttribute {
  key: string;
  value: string;
  source: string;
}

/**
 * Maps one approved lister answer onto one or more memory attributes.
 *
 * @param answer - Published approved answer row
 * @returns Attributes keyed by canonical attrs, or a single lister_answer fallback
 */
function approvedAnswerToAttributes(answer: ApprovedAnswer): MemoryAttribute[] {
  const attributes: string[] = [];
  if (Array.isArray(answer.canonicalAttributes)) {
    for (const item of answer.canonicalAttributes) {
      if (typeof item === 'string') {
        attributes.push(item);
      }
    }
  }

  // Q: why a synthetic lister_answer key? A: some answers have no canonical attrs yet
  if (attributes.length === 0) {
    return [
      {
        key: 'lister_answer',
        value: answer.answerText,
        source: 'lister_answer',
      },
    ];
  }

  return attributes.map((key) => ({
    key,
    value: answer.answerText,
    source: 'lister_answer',
  }));
}

/**
 * Converts session memory facts into memory attribute rows.
 *
 * @param facts - Session memory facts
 * @returns Attributes with normalized source labels
 */
export function memoryFactsToAttributes(facts: SessionMemoryFact[]): MemoryAttribute[] {
  return facts.map((fact) => ({
    key: fact.attribute,
    value: fact.value,
    source: fact.source === 'lister_answer' ? 'lister_answer' : 'session_memory',
  }));
}

/**
 * Merges session facts with approved answers; session facts win on key collision.
 *
 * @param memory - Current session memory
 * @param approvedAnswers - Published answers for the property
 * @returns Deduped attribute list for tool payloads
 */
export function buildMemoryToolAttributes(
  memory: SessionMemory,
  approvedAnswers: ApprovedAnswer[],
): MemoryAttribute[] {
  const byKey = new Map<string, MemoryAttribute>();

  for (const fact of memoryFactsToAttributes(memory.facts)) {
    byKey.set(fact.key, fact);
  }

  // [WHY] session facts override approved answers — seeker-session context is fresher
  for (const answer of approvedAnswers) {
    for (const attribute of approvedAnswerToAttributes(answer)) {
      if (!byKey.has(attribute.key)) {
        byKey.set(attribute.key, attribute);
      }
    }
  }

  return Array.from(byKey.values());
}
