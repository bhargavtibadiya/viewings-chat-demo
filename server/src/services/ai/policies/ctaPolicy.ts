import type { AnswerStatus } from '#generated/client.js';
import type { ChatAction, ChatFact } from '../types/ai.types.js';

export function pickActions(answerStatus: AnswerStatus, listingType: 'RENTAL' | 'SALE'): ChatAction[] {
  if (answerStatus === 'UNKNOWN') {
    return [{ type: 'ask_lister', label: 'Ask the lister' }];
  }

  if (answerStatus === 'LIMITED') {
    return [
      { type: 'ask_lister', label: 'Ask the lister for more detail' },
      { type: 'view_available_times', label: 'View available times' },
    ];
  }

  const actions: ChatAction[] = [
    { type: 'view_available_times', label: 'View available times' },
  ];

  if (listingType === 'RENTAL') {
    actions.push({ type: 'confirm_booking', label: 'Book a viewing' });
  }

  return actions;
}

export function deriveAnswerStatus(facts: ChatFact[], hasUnknownAttributes: boolean): AnswerStatus {
  if (facts.length === 0 || hasUnknownAttributes) {
    return 'UNKNOWN';
  }

  const limitedSources = facts.some(
    (fact) => fact.source === 'session_memory' || fact.source === 'lister_answer',
  );

  if (limitedSources) {
    return 'LIMITED';
  }

  return 'VERIFIED';
}

export function buildFactsFromAttributes(
  attributes: Array<{ key: string; value: string | number | boolean | string[] | null; source: string }>,
): ChatFact[] {
  const facts: ChatFact[] = [];

  for (const attribute of attributes) {
    if (attribute.value === null || attribute.value === 'unknown') {
      continue;
    }

    let valueText = '';
    if (typeof attribute.value === 'string') {
      valueText = attribute.value;
    } else if (typeof attribute.value === 'number' || typeof attribute.value === 'boolean') {
      valueText = String(attribute.value);
    } else if (Array.isArray(attribute.value)) {
      valueText = attribute.value.join(', ');
    }

    if (valueText) {
      facts.push({
        attribute: attribute.key,
        value: valueText,
        source: attribute.source,
      });
    }
  }

  return facts;
}
