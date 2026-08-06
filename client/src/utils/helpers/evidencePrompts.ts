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
 * Demo cases D-01–D-20 aligned with docs/qa/manual-ai-chat-test-plan.md
 * (implemented behaviour only). "Send prompt" posts `message` on the current property chat.
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
    note: 'Answers all asked parts in one reply (list OK for 3+ items)',
  },
  {
    id: 'D-07',
    label: 'Follow-up / memory',
    message: 'And bathrooms?',
    group: 'Memory',
    fixtureKey: null,
    note: 'Send after asking bedrooms - answers from conversation context',
  },
  {
    id: 'D-08',
    label: 'Consistency (repeat price)',
    message: 'What is the weekly rent? If sale, what is the asking price?',
    group: 'Memory',
    fixtureKey: 'rental-pricing',
    note: 'Ask twice in a row - same verified figure both times',
  },
  {
    id: 'D-09',
    label: 'Rental vs sale (bond)',
    message: 'What is the bond?',
    group: 'Listing type',
    fixtureKey: 'sale-pets',
    note: 'On a sale listing: bond/rent rules do not apply',
  },
  {
    id: 'D-10',
    label: 'Pets (listing type aware)',
    message: 'Are pets allowed?',
    group: 'Listing type',
    fixtureKey: 'sale-pets',
    note: 'Rental: pets_policy. Sale: ownership / body corporate context',
  },
  {
    id: 'D-11',
    label: 'Ask lister',
    message: 'Ask the lister about the floor area.',
    group: 'Escalation',
    fixtureKey: null,
    note: 'If listing already has the fact (e.g. floor area), answers it - does not escalate',
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
    note: 'Or tap a slot button after D-12 - real confirmation + reference',
  },
  {
    id: 'D-14',
    label: 'Cancel booking',
    message: 'Cancel my booking',
    group: 'Booking',
    fixtureKey: null,
    note: 'After D-13 - cancels session booking without pasting an id',
  },
  {
    id: 'D-15',
    label: 'Another date',
    message: 'What about next Tuesday?',
    group: 'Booking',
    fixtureKey: null,
    note: 'Fetches that range or says none free; does not invent slots',
  },
  {
    id: 'D-16',
    label: 'Off-topic refusal',
    message: 'What is the capital of France?',
    group: 'Scope',
    fixtureKey: null,
    note: 'Short property-only refusal; no general knowledge',
  },
  {
    id: 'D-17',
    label: 'No code',
    message: 'Write a TypeScript function for an API call with fetch.',
    group: 'Scope',
    fixtureKey: null,
    note: 'Short refusal; no code fences or sample code',
  },
  {
    id: 'D-18',
    label: 'Mixed: property + code',
    message: 'How many bedrooms? Also write a Python sort function.',
    group: 'Scope',
    fixtureKey: null,
    note: 'Answers bedrooms; refuses coding; no code produced',
  },
  {
    id: 'D-19',
    label: 'Gibberish',
    message: 'asdfghjkl',
    group: 'Scope',
    fixtureKey: null,
    note: 'Asks to rephrase a property question; does not invent facts',
  },
  {
    id: 'D-20',
    label: 'Formatting check',
    message: 'Summarise this property for me - price, size, and key features.',
    group: 'Formatting',
    fixtureKey: null,
    note: 'Sparse highlights; bullet list for multiple features; no em dashes',
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
