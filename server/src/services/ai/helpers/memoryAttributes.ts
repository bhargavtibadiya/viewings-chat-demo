import type { ApprovedAnswer } from '../../../generated/client.js';
import type { SessionMemory, SessionMemoryFact } from '../types/ai.types.js';

export interface MemoryAttribute {
  key: string;
  value: string;
  source: string;
}

function approvedAnswerToAttributes(answer: ApprovedAnswer): MemoryAttribute[] {
  const attributes: string[] = [];
  if (Array.isArray(answer.canonicalAttributes)) {
    for (const item of answer.canonicalAttributes) {
      if (typeof item === 'string') {
        attributes.push(item);
      }
    }
  }

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

export function memoryFactsToAttributes(facts: SessionMemoryFact[]): MemoryAttribute[] {
  return facts.map((fact) => ({
    key: fact.attribute,
    value: fact.value,
    source: fact.source === 'lister_answer' ? 'lister_answer' : 'session_memory',
  }));
}

export function buildMemoryToolAttributes(
  memory: SessionMemory,
  approvedAnswers: ApprovedAnswer[],
): MemoryAttribute[] {
  const byKey = new Map<string, MemoryAttribute>();

  for (const fact of memoryFactsToAttributes(memory.facts)) {
    byKey.set(fact.key, fact);
  }

  for (const answer of approvedAnswers) {
    for (const attribute of approvedAnswerToAttributes(answer)) {
      if (!byKey.has(attribute.key)) {
        byKey.set(attribute.key, attribute);
      }
    }
  }

  return Array.from(byKey.values());
}
