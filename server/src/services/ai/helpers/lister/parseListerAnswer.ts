export interface ParsedListerFact {
  attribute: string;
  value: string;
}

// ============================================================================
// ATTRIBUTE PATTERNS
// Regex extractors for common lister-answer shapes (area, year, rates, body corp)
// ============================================================================

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

/**
 * Returns the first capture group that matches any of the given patterns.
 *
 * @param text - Lister answer text
 * @param patterns - Ordered regexes with a capture group for the value
 * @returns Trimmed capture, or null when none match
 */
function tryPatterns(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

// ============================================================================
// PARSE LISTER ANSWER
// Extract structured facts from free-text lister replies
// ============================================================================

/**
 * Parses a lister's free-text answer into one or more canonical attribute facts.
 *
 * @param answerText - Raw answer from the lister
 * @param canonicalAttributes - Attributes the open question was about
 * @returns Parsed facts (always at least one when answerText is non-empty)
 */
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

  // [WHY] single-attribute questions often get a bare value with no unit keywords to regex
  if (facts.length === 0 && canonicalAttributes.length === 1) {
    const attribute = canonicalAttributes[0];
    if (attribute && attribute !== 'general') {
      facts.push({ attribute, value: trimmed });
      seen.add(attribute);
    }
  }

  // [NOTE] second pass picks up extra structured attrs the question did not ask for
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

  // Q: why invent a fact when nothing matched? A: callers need something to store/approve
  if (facts.length === 0) {
    facts.push({ attribute: canonicalAttributes[0] ?? 'lister_answer', value: trimmed });
  }

  return facts;
}
