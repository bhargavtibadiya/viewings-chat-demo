export interface EvidencePrompt {
  id: string;
  label: string;
  message: string;
  group: string;
  /** Suggested seed fixture for Demo control-panel jumps only — never used to leave the active chat. */
  fixtureKey: string | null;
  note?: string;
}

/**
 * Evidence cases E-01–E-11 from Viewings_AI_Chat_Evidence_Appendix.md.
 * "Try this" always sends `message` as a human turn on the *current* property chat.
 */
export const EVIDENCE_PROMPTS: EvidencePrompt[] = [
  {
    id: 'E-01',
    label: 'Greeting',
    message: 'Hello',
    group: 'Basics',
    fixtureKey: null,
    note: 'Short contextual greeting; no restart loop',
  },
  {
    id: 'E-02',
    label: 'Buy a bed?',
    message: 'Do I need to buy a bed?',
    group: 'Attribute routing',
    fixtureKey: 'unfurnished-rental',
    note: 'Furnishing / included furniture — not bedroom count',
  },
  {
    id: 'E-03',
    label: 'Dog outside',
    message: 'Can my dog play outside?',
    group: 'Attribute routing',
    fixtureKey: 'yard-fencing-unknown',
    note: 'Outdoor space + fencing + pets policy',
  },
  {
    id: 'E-04',
    label: 'Ensuite',
    message: 'Does the bedroom connect to the bathroom?',
    group: 'Attribute routing',
    fixtureKey: 'ensuite-layout',
    note: 'Ensuite / layout relationship',
  },
  {
    id: 'E-05',
    label: 'Stay warm',
    message: 'Does it stay warm?',
    group: 'Attribute routing',
    fixtureKey: 'heating-fixture',
    note: 'Heating / insulation — not cooling only',
  },
  {
    id: 'E-06',
    label: 'Wheelchair',
    message: 'My father uses a wheelchair. Can he visit?',
    group: 'Grounding',
    fixtureKey: 'accessibility-unknown',
    note: 'Verified accessibility only; no slot dump',
  },
  {
    id: 'E-07',
    label: 'Sale pets',
    message: "I don't like pets - is it pet-friendly?",
    group: 'Listing type',
    fixtureKey: 'sale-pets',
    note: 'Sale vs rental pet-policy language',
  },
  {
    id: 'E-08',
    label: 'Wheelchair variant',
    message: 'We need step-free access for a wheelchair user. Is that possible?',
    group: 'Grounding',
    fixtureKey: 'accessibility-unknown',
    note: 'Same intent as E-06 — consistent handling',
  },
  {
    id: 'E-09',
    label: 'CTA order',
    message: 'Can someone in a wheelchair attend a viewing here?',
    group: 'Grounding',
    fixtureKey: 'accessibility-unknown',
    note: 'Answer first; CTA after grounding',
  },
  {
    id: 'E-10',
    label: 'Unknown / escalate',
    message: 'Why is the owner moving?',
    group: 'Escalation',
    fixtureKey: null,
    note: 'Honest unknown + ask-lister loop',
  },
  {
    id: 'E-11a',
    label: 'Weekly rent phrasing',
    message: 'What leaves my account every Friday?',
    group: 'Positives',
    fixtureKey: 'rental-pricing',
    note: 'Natural weekly-rent phrasing',
  },
  {
    id: 'E-11b',
    label: 'Move-in phrasing',
    message: 'Can I move in before Christmas?',
    group: 'Positives',
    fixtureKey: 'rental-pricing',
    note: 'Natural available-from / move-in phrasing',
  },
  {
    id: 'E-11c',
    label: 'Heating / cooling',
    message: 'Is there a heat pump, and does it have air conditioning?',
    group: 'Positives',
    fixtureKey: 'heating-fixture',
    note: 'Direct climate-control features',
  },
  {
    id: 'E-11d',
    label: 'Work from home',
    message: 'Is this good for working from home?',
    group: 'Positives',
    fixtureKey: 'wfh-outdoor',
    note: 'Remote-work suitability from listing facts',
  },
  {
    id: 'E-11e',
    label: 'BBQ outside',
    message: 'Can we BBQ outside?',
    group: 'Positives',
    fixtureKey: 'wfh-outdoor',
    note: 'Outdoor / barbecue lifestyle question',
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
