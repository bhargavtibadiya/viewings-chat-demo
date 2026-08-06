export interface EvidencePrompt {
  id: string;
  label: string;
  /** Message to send into the active chat. Empty string = info-only (no send). */
  message: string;
  group: string;
  /** Suggested seed fixture for Demo control-panel jumps only — never used to leave the active chat. */
  fixtureKey: string | null;
  note?: string;
}

/**
 * Demo cases aligned with docs/qa/manual-ai-chat-test-plan.md +
 * Viewings_AI_Chat_Executive_Decision_Deck.md intent routes.
 */
export const EVIDENCE_PROMPTS: EvidencePrompt[] = [
  {
    id: 'D-01',
    label: 'Auto greeting (first open)',
    message: '',
    group: 'Greeting',
    fixtureKey: null,
    note: 'Open a property chat with no prior messages - welcome appears automatically (no send needed).',
  },
  {
    id: 'D-02',
    label: 'Greeting mid-session',
    message: 'Hello',
    group: 'Greeting',
    fixtureKey: null,
    note: 'Short “Hi again…” ack - does not repeat the full opening greeting',
  },
  {
    id: 'K-01',
    label: 'Buy a bed? (furnishing)',
    message: 'Do I need to buy a bed?',
    group: 'Intent routing',
    fixtureKey: 'unfurnished-rental',
    note: 'Must route to furnishing / included_furniture - NOT bedroom count',
  },
  {
    id: 'K-02',
    label: 'Dog play outside',
    message: 'Can my dog play outside?',
    group: 'Intent routing',
    fixtureKey: 'yard-fencing-unknown',
    note: 'outdoor_space + fencing + pets_policy; outdoor first; fencing unknown if missing',
  },
  {
    id: 'K-03',
    label: 'Bedroom → bathroom',
    message: 'Does the bedroom connect to the bathroom?',
    group: 'Intent routing',
    fixtureKey: 'ensuite-layout',
    note: 'ensuite / layout - NOT bedroom/bathroom counts',
  },
  {
    id: 'K-04',
    label: 'Stay warm (heating)',
    message: 'Does it stay warm?',
    group: 'Intent routing',
    fixtureKey: 'heating-fixture',
    note: 'heating + insulation; do not lead with air-conditioning',
  },
  {
    id: 'K-05',
    label: 'Wheelchair visit',
    message: 'My father uses a wheelchair. Can he visit?',
    group: 'Intent routing',
    fixtureKey: 'accessibility-unknown',
    note: 'Verified accessibility only; no viewing slots on this turn if unknown',
  },
  {
    id: 'K-06',
    label: 'Sale pet-friendly',
    message: "I don't like pets - is it pet-friendly?",
    group: 'Intent routing',
    fixtureKey: 'sale-pets',
    note: 'Sale: ownership / body corporate - not rental pets_policy language',
  },
  {
    id: 'K-07',
    label: 'Wheelchair (variant)',
    message: 'We need step-free access for a wheelchair user. Is that possible?',
    group: 'Intent routing',
    fixtureKey: 'accessibility-unknown',
    note: 'Same accessibility policy as K-05 - consistent handling',
  },
  {
    id: 'D-03',
    label: 'Listing fact (bedrooms)',
    message: 'How many bedrooms does this property have?',
    group: 'Facts',
    fixtureKey: null,
    note: 'Correct bedroom count from listing; no lister ask',
  },
  {
    id: 'D-04',
    label: 'Listing fact (rent / price)',
    message: 'What is the weekly rent? If this is a sale listing, what is the asking price?',
    group: 'Facts',
    fixtureKey: 'rental-pricing',
    note: 'Correct money figure from tools; no invented amount',
  },
  {
    id: 'D-05',
    label: 'Unknown → not specified',
    message: 'What is the floor area?',
    group: 'Facts',
    fixtureKey: null,
    note: 'Says not specified if missing; may offer to ask the lister',
  },
  {
    id: 'D-06',
    label: 'Multi-intent (one message)',
    message: 'How many bedrooms and bathrooms, and is parking included?',
    group: 'Multi-intent',
    fixtureKey: null,
    note: 'Answers all asked parts in one reply',
  },
  {
    id: 'D-11',
    label: 'Ask lister only if missing',
    message: 'Ask the lister about the floor area.',
    group: 'Escalation',
    fixtureKey: null,
    note: 'If listing already has sqm, answers it - does not escalate',
  },
  {
    id: 'D-12',
    label: 'Viewing slots',
    message: 'Show me available viewing times',
    group: 'Booking',
    fixtureKey: null,
    note: 'Live slots with real NZ times',
  },
  {
    id: 'D-13',
    label: 'Book a viewing',
    message: 'Book the first available viewing for me',
    group: 'Booking',
    fixtureKey: null,
    note: 'Or tap a slot button after D-12',
  },
  {
    id: 'D-14',
    label: 'Cancel booking',
    message: 'Cancel my booking',
    group: 'Booking',
    fixtureKey: null,
    note: 'After booking - cancels without pasting an id',
  },
  {
    id: 'D-15',
    label: 'Another date (reschedule)',
    message: 'What about next Tuesday?',
    group: 'Booking',
    fixtureKey: null,
    note: 'New slot cancels previous confirmed booking for this property',
  },
  {
    id: 'D-16',
    label: 'Off-topic refusal',
    message: 'What is the capital of France?',
    group: 'Scope',
    fixtureKey: null,
    note: 'Short property-only refusal',
  },
  {
    id: 'D-18',
    label: 'Mixed: property + code',
    message: 'How many bedrooms? Also write a Python sort function.',
    group: 'Scope',
    fixtureKey: null,
    note: 'Answers bedrooms; refuses coding',
  },
];

export function groupEvidencePrompts(prompts: EvidencePrompt[]): Record<string, EvidencePrompt[]> {
  return prompts.reduce<Record<string, EvidencePrompt[]>>((groups, prompt) => {
    const current = groups[prompt.group] ?? [];
    return {
      ...groups,
      [prompt.group]: [...current, prompt],
    };
  }, {});
}
