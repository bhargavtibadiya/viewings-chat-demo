/**
 * Deterministic matching for OPEN lister escalations so we do not
 * re-offer ask-the-lister when a similar question is already pending.
 */

export const ALREADY_ASKED_LISTER_REPLY =
  "I've already asked the lister about that. I'll share their answer as soon as they respond.";

export interface OpenListerQuestionCandidate {
  id: string;
  questionText: string;
  canonicalAttributes?: string[] | null;
  resolvedIntent?: string | null;
}

/** Topic keyword groups → canonical attribute keys they imply. */
const TOPIC_GROUPS: Array<{ attributes: string[]; keywords: string[] }> = [
  {
    attributes: ['floor_area_sqm', 'floor_area', 'land_area_sqm'],
    keywords: [
      'floor area',
      'floor_area',
      'floorarea',
      'sqm',
      'm2',
      'm²',
      'square metre',
      'square meter',
      'square metr',
      'size of the home',
      'how big',
      'how large',
    ],
  },
  {
    attributes: ['bedrooms'],
    keywords: ['bedroom', 'bedrooms', 'beds'],
  },
  {
    attributes: ['bathrooms'],
    keywords: ['bathroom', 'bathrooms', 'baths'],
  },
  {
    attributes: ['accessibility', 'step_free_access', 'lift'],
    keywords: [
      'wheelchair',
      'accessibility',
      'accessible',
      'step-free',
      'stepfree',
      'step_free',
      'ramp',
      'disabled',
      'mobility',
      'lift',
      'elevator',
    ],
  },
  {
    attributes: ['pets_policy', 'body_corporate_pets'],
    keywords: ['pet', 'pets', 'dog', 'cat', 'animal', 'animals'],
  },
  {
    attributes: ['parking', 'parking_detail'],
    keywords: ['parking', 'garage', 'carpark', 'car-park', 'carport'],
  },
  {
    attributes: ['heating', 'cooling', 'insulation'],
    keywords: ['heating', 'heatpump', 'heat-pump', 'fireplace', 'cooling', 'insulation'],
  },
  {
    attributes: ['fencing', 'outdoor_space'],
    keywords: ['fencing', 'fence', 'yard', 'outdoor', 'garden', 'courtyard'],
  },
  {
    attributes: ['furnishing', 'included_furniture'],
    keywords: ['furnished', 'furnishing', 'furniture', 'unfurnished'],
  },
  {
    attributes: ['ensuite', 'bathroom_layout'],
    keywords: ['ensuite', 'en-suite', 'bathroom'],
  },
  {
    attributes: ['internet', 'fibre_status'],
    keywords: ['internet', 'fibre', 'fiber', 'wifi', 'broadband'],
  },
  {
    attributes: ['workspace'],
    keywords: ['workspace', 'wfh', 'office', 'study'],
  },
  {
    attributes: ['smoking_policy'],
    keywords: ['smoking', 'smoke', 'smoker'],
  },
];

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'my',
  'me',
  'i',
  'we',
  'you',
  'your',
  'this',
  'that',
  'it',
  'can',
  'could',
  'would',
  'should',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'with',
  'about',
  'from',
  'at',
  'by',
  'as',
  'if',
  'not',
  'no',
  'yes',
  'please',
  'property',
  'listing',
  'lister',
  'ask',
  'them',
  'there',
  'their',
  'what',
  'when',
  'where',
  'which',
  'who',
  'how',
  'why',
  'any',
  'available',
]);

export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeQuestionText(text)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function parseAttributes(value: string[] | null | undefined): string[] {
  if (!value || value.length === 0) {
    return [];
  }
  return value
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0 && item !== 'general');
}

export function inferTopicAttributes(text: string): string[] {
  const normalized = normalizeQuestionText(text);
  const attrs = new Set<string>();

  for (const group of TOPIC_GROUPS) {
    const hit = group.keywords.some((keyword) => {
      const needle = keyword.toLowerCase();
      return (
        normalized.includes(needle) ||
        normalized.split(' ').some((token) => token === needle || token.replace(/_/g, '-') === needle)
      );
    });
    if (hit) {
      for (const attribute of group.attributes) {
        attrs.add(attribute);
      }
    }
  }

  return [...attrs];
}

function attributesOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) {
    return false;
  }
  const setB = new Set(b);
  return a.some((item) => setB.has(item));
}

/** Jaccard similarity on meaningful tokens (0–1). */
export function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection += 1;
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function sharedTopicKeywords(a: string, b: string): boolean {
  const normA = normalizeQuestionText(a);
  const normB = normalizeQuestionText(b);

  for (const group of TOPIC_GROUPS) {
    const inA = group.keywords.some((keyword) => normA.includes(keyword.toLowerCase()));
    const inB = group.keywords.some((keyword) => normB.includes(keyword.toLowerCase()));
    if (inA && inB) {
      return true;
    }
  }

  return false;
}

export function questionsAreSimilar(
  candidate: { questionText: string; canonicalAttributes?: string[] | null },
  existing: OpenListerQuestionCandidate,
): boolean {
  const left = normalizeQuestionText(candidate.questionText);
  const right = normalizeQuestionText(existing.questionText);

  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  const candidateAttrs = [
    ...parseAttributes(candidate.canonicalAttributes),
    ...inferTopicAttributes(candidate.questionText),
  ];
  const existingAttrs = [
    ...parseAttributes(existing.canonicalAttributes),
    ...inferTopicAttributes(existing.questionText),
  ];

  if (attributesOverlap(candidateAttrs, existingAttrs)) {
    return true;
  }

  if (sharedTopicKeywords(candidate.questionText, existing.questionText)) {
    return true;
  }

  // Fuzzy text: require a modest overlap of content words.
  if (tokenSimilarity(candidate.questionText, existing.questionText) >= 0.45) {
    return true;
  }

  return false;
}

export function findSimilarOpenQuestion(
  openQuestions: OpenListerQuestionCandidate[],
  candidate: { questionText: string; canonicalAttributes?: string[] | null },
): OpenListerQuestionCandidate | null {
  const trimmed = candidate.questionText.trim();
  if (!trimmed || openQuestions.length === 0) {
    return null;
  }

  for (const existing of openQuestions) {
    if (questionsAreSimilar(candidate, existing)) {
      return existing;
    }
  }

  return null;
}

export function formatOpenQuestionsForPrompt(openQuestions: OpenListerQuestionCandidate[]): string {
  if (openQuestions.length === 0) {
    return '';
  }

  const lines = openQuestions.map((question, index) => {
    const attrs = parseAttributes(question.canonicalAttributes);
    const attrSuffix = attrs.length > 0 ? ` [attrs: ${attrs.join(', ')}]` : '';
    return `${index + 1}. "${question.questionText}"${attrSuffix}`;
  });

  return [
    'OPEN lister questions already sent for this session (awaiting answer):',
    ...lines,
    'If the user asks about any of these topics again, do NOT offer to ask the lister again.',
    `Tell them: ${ALREADY_ASKED_LISTER_REPLY}`,
    'If send_question_to_lister returns alreadyAsked=true, give that same message.',
  ].join('\n');
}
