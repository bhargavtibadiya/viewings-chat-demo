import type { AnswerStatus } from '../../../generated/client.js';
import type { ChatAction, ChatFact } from '../types/ai.types.js';

/**
 * Picks CTA buttons from answer status and listing type.
 *
 * @param answerStatus - VERIFIED | LIMITED | UNKNOWN
 * @param listingType - RENTAL or SALE (SALE omits confirm_booking)
 * @returns Ordered chat actions for the turn
 */
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

  // [WHY] sale listings still offer times but booking CTA is rental-first in product copy
  if (listingType === 'RENTAL') {
    actions.push({ type: 'confirm_booking', label: 'Book a viewing' });
  }

  return actions;
}

/**
 * Derives answer status from gathered facts and unknown-attribute flags.
 *
 * @param facts - Facts collected this turn
 * @param hasUnknownAttributes - True when the model/tools signal missing data
 * @returns Prisma AnswerStatus value
 */
export function deriveAnswerStatus(facts: ChatFact[], hasUnknownAttributes: boolean): AnswerStatus {
  if (facts.length === 0 || hasUnknownAttributes) {
    return 'UNKNOWN';
  }

  // [WHY] memory/lister sources are softer than listing DB attributes
  const limitedSources = facts.some(
    (fact) => fact.source === 'session_memory' || fact.source === 'lister_answer',
  );

  if (limitedSources) {
    return 'LIMITED';
  }

  return 'VERIFIED';
}

/**
 * Converts raw attribute records into ChatFact entries, skipping unknowns.
 *
 * @param attributes - Key/value/source rows from tools or memory
 * @returns Normalized facts for the client payload
 */
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
