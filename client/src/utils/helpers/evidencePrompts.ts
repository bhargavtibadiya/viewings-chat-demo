export interface EvidencePrompt {
  id: string;
  label: string;
  message: string;
  group: string;
  fixtureKey: string | null;
}

export const EVIDENCE_PROMPTS: EvidencePrompt[] = [
  { id: 'E-01', label: 'Greeting', message: 'Hello', group: 'Basics', fixtureKey: null },
  {
    id: 'E-02',
    label: 'Buy a bed?',
    message: 'Do I need to buy a bed?',
    group: 'Attribute routing',
    fixtureKey: 'unfurnished-rental',
  },
  {
    id: 'E-03',
    label: 'Dog outside',
    message: 'Can my dog play outside?',
    group: 'Attribute routing',
    fixtureKey: 'yard-fencing-unknown',
  },
  {
    id: 'E-04',
    label: 'Ensuite',
    message: 'Does the bedroom connect to the bathroom?',
    group: 'Attribute routing',
    fixtureKey: 'ensuite-layout',
  },
  {
    id: 'E-05',
    label: 'Stay warm',
    message: 'Does it stay warm?',
    group: 'Attribute routing',
    fixtureKey: 'heating-fixture',
  },
  {
    id: 'E-06',
    label: 'Wheelchair',
    message: 'My father uses a wheelchair. Can he visit?',
    group: 'Grounding',
    fixtureKey: 'accessibility-unknown',
  },
  {
    id: 'E-07',
    label: 'Sale pets',
    message: "I don't like pets - is it pet-friendly?",
    group: 'Listing type',
    fixtureKey: 'sale-pets',
  },
  {
    id: 'E-08',
    label: 'Wheelchair variant',
    message: 'We need step-free access for a wheelchair user. Is that possible?',
    group: 'Grounding',
    fixtureKey: 'accessibility-unknown',
  },
  {
    id: 'E-09',
    label: 'CTA order',
    message: 'Can someone in a wheelchair attend a viewing here?',
    group: 'Grounding',
    fixtureKey: 'accessibility-unknown',
  },
  {
    id: 'E-10',
    label: 'Unknown / escalate',
    message: 'Why is the owner moving?',
    group: 'Escalation',
    fixtureKey: null,
  },
  {
    id: 'E-11a',
    label: 'Weekly rent',
    message: 'What is the weekly rent and bond?',
    group: 'Positives',
    fixtureKey: 'rental-pricing',
  },
  {
    id: 'E-11b',
    label: 'Move-in date',
    message: 'When can I move in?',
    group: 'Positives',
    fixtureKey: 'rental-pricing',
  },
  {
    id: 'E-11c',
    label: 'Work from home',
    message: 'Is this good for working from home?',
    group: 'Positives',
    fixtureKey: 'wfh-outdoor',
  },
  {
    id: 'E-11d',
    label: 'BBQ outside',
    message: 'Can we BBQ outside?',
    group: 'Positives',
    fixtureKey: 'wfh-outdoor',
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
