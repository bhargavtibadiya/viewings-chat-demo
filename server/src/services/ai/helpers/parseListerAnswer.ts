export interface ParsedListerFact {
  attribute: string;
  value: string;
}

const ATTRIBUTE_PATTERNS: Record<string, RegExp[]> = {
  floor_area: [
    /(?:floor\s*area|living\s*area|total\s*area|size)[:\s]*(?:is\s*)?(?:approximately\s*)?(\d+(?:\.\d+)?)\s*(?:sqm|m²|square\s*met(?:re|er)s?)/i,
    /(?:approximately\s*)?(\d+(?:\.\d+)?)\s*(?:sqm|m²|square\s*met(?:re|er)s?)(?:\s*(?:of|total|living|floor)\s*area)?/i,
  ],
  year_built: [
    /(?:built|constructed|year\s*built)[:\s]*(?:in\s*)?(\d{4})/i,
    /(?:dating\s*from|from)\s*(\d{4})/i,
  ],
  council_rates: [
    /(?:council\s*rates|rates)[:\s]*(?:are\s*)?(\$[\d,]+(?:\.\d{2})?(?:\s*(?:per\s*year|p\.?a\.?|annually))?)/i,
  ],
  body_corporate: [
    /(?:body\s*corporate|body\s*corp)[:\s]*(?:is\s*)?(\$[\d,]+(?:\.\d{2})?(?:\s*(?:per\s*year|p\.?a\.?|annually))?)/i,
  ],
};

function tryPatterns(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export function parseListerAnswer(answerText: string, canonicalAttributes: string[]): ParsedListerFact[] {
  const trimmed = answerText.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const facts: ParsedListerFact[] = [];
  const seen = new Set<string>();

  for (const attribute of canonicalAttributes) {
    if (attribute === 'general') {
      continue;
    }

    const patterns = ATTRIBUTE_PATTERNS[attribute];
    const value = patterns ? tryPatterns(trimmed, patterns) : null;
    if (value) {
      facts.push({ attribute, value });
      seen.add(attribute);
    }
  }

  if (facts.length === 0 && canonicalAttributes.length === 1) {
    const attribute = canonicalAttributes[0];
    if (attribute && attribute !== 'general') {
      facts.push({ attribute, value: trimmed });
      seen.add(attribute);
    }
  }

  for (const [attribute, patterns] of Object.entries(ATTRIBUTE_PATTERNS)) {
    if (seen.has(attribute)) {
      continue;
    }
    const value = tryPatterns(trimmed, patterns);
    if (value) {
      facts.push({ attribute, value });
      seen.add(attribute);
    }
  }

  if (facts.length === 0) {
    facts.push({ attribute: canonicalAttributes[0] ?? 'lister_answer', value: trimmed });
  }

  return facts;
}
