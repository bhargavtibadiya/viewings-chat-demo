/**
 * Post-process assistant text for readability without changing factual content.
 * Preserves markdown lists and light emphasis.
 */

// ============================================================================
// SENTENCE / LIST HELPERS
// Internal normalizers used by the exported polish pipeline
// ============================================================================

/**
 * Normalizes whitespace for sentence comparison.
 *
 * @param sentence - Raw sentence or paragraph text
 * @returns Lowercased, single-spaced key
 */
function normalizeSentence(sentence: string): string {
  return sentence.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Split into sentences while keeping trailing punctuation on each piece.
 *
 * @param text - Prose paragraph
 * @returns Non-empty sentence fragments
 */
function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g);
  if (!parts) {
    return [text];
  }
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

function isListLine(line: string): boolean {
  return /^([-*+]|\d+\.)\s+/.test(line.trim());
}

/**
 * Heuristic: treat a paragraph as a list block when multiple list lines appear.
 *
 * @param text - Paragraph text that may contain list lines
 * @returns True when the block should be deduped as a list
 */
function isListLikeBlock(text: string): boolean {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return false;
  }
  const listCount = lines.filter((line) => isListLine(line)).length;
  return listCount >= 2 || (listCount >= 1 && lines.length >= 2);
}

/**
 * Dedupe lines in a markdown list block without collapsing structure.
 *
 * @param text - List-like paragraph
 * @returns Deduped list text with blank lines preserved between sections
 */
function dedupeListBlock(text: string): string {
  const lines = text.split('\n');
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (kept.length > 0 && kept[kept.length - 1] !== '') {
        kept.push('');
      }
      continue;
    }

    const key = normalizeSentence(trimmed);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    kept.push(line.trimEnd());
  }

  return kept.join('\n').trim();
}

// ============================================================================
// RESPONSE QUALITY EXPORTS
// Deduping, length limits, style cleanup, and the combined polish pipeline
// ============================================================================

/**
 * Remove duplicated paragraphs and repeated consecutive/near-duplicate sentences.
 * Does not flatten markdown lists into a single prose line.
 *
 * @param content - Raw assistant reply text
 * @returns Deduped content with list structure preserved
 */
export function dedupeRepeatedContent(content: string): string {
  if (!content || content.trim().length === 0) {
    return content;
  }

  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const seenParagraphs = new Set<string>();
  const uniqueParagraphs: string[] = [];

  for (const paragraph of paragraphs) {
    const key = normalizeSentence(paragraph);
    if (seenParagraphs.has(key)) {
      continue;
    }
    seenParagraphs.add(key);

    if (isListLikeBlock(paragraph)) {
      uniqueParagraphs.push(dedupeListBlock(paragraph));
      continue;
    }

    const sentences = splitSentences(paragraph.replace(/\n+/g, ' '));
    const seen = new Set<string>();
    const kept: string[] = [];

    for (const sentence of sentences) {
      const sentenceKey = normalizeSentence(sentence);
      if (!sentenceKey || seen.has(sentenceKey)) {
        continue;
      }
      seen.add(sentenceKey);
      kept.push(sentence);
    }

    uniqueParagraphs.push(kept.join(' ').replace(/ {2,}/g, ' ').trim());
  }

  return uniqueParagraphs.filter((paragraph) => paragraph.length > 0).join('\n\n');
}

/**
 * Soft length trim by top-level blocks (paragraphs / list sections).
 *
 * @param content - Assistant reply text
 * @param maxParagraphs - Max top-level blocks to keep (default 12 for feature summaries)
 * @returns Trimmed content, or original trimmed text when under the limit
 */
export function limitResponseParagraphs(content: string, maxParagraphs = 12): string {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length <= maxParagraphs) {
    return content.trim();
  }

  return paragraphs.slice(0, maxParagraphs).join('\n\n');
}

/**
 * Replace em/en dashes so replies stay consistent with STYLE rules.
 *
 * @param content - Assistant reply text
 * @returns Content with dashes normalized and stray spaces cleaned
 */
export function stripEmDashes(content: string): string {
  return content
    .replace(/\u2014/g, ' - ') // [NOTE] em dash —
    .replace(/\u2013/g, '-') // [NOTE] en dash –
    .replace(/ {2,}/g, ' ')
    .replace(/ +([,.!?])/g, '$1')
    .replace(/ +\n/g, '\n')
    .replace(/\n +/g, '\n');
}

/**
 * Soften over-bold replies: if more than maxBold spans, unwrap extras (keep first few).
 * Leaves italics and underline alone.
 *
 * @param content - Assistant reply text with optional **bold** spans
 * @param maxBold - Maximum bold spans to keep (default 3)
 * @returns Content with excess bold unwrapped from the end
 */
export function toneDownExcessBold(content: string, maxBold = 3): string {
  const matches = [...content.matchAll(/\*\*([^*]+)\*\*/g)];
  if (matches.length <= maxBold) {
    return content;
  }

  let result = content;
  // [WHY] unwrap from the end so early highlights (e.g. price) stay
  for (let i = matches.length - 1; i >= maxBold; i -= 1) {
    const match = matches[i];
    if (!match || match.index === undefined) {
      continue;
    }
    const full = match[0];
    const inner = match[1] ?? '';
    result = `${result.slice(0, match.index)}${inner}${result.slice(match.index + full.length)}`;
  }
  return result;
}

/**
 * Runs the full post-process pipeline: dashes → dedupe → bold → paragraph limit.
 *
 * @param content - Raw assistant reply text
 * @returns Polished content safe to send to the client
 */
export function polishAssistantContent(content: string): string {
  return limitResponseParagraphs(
    toneDownExcessBold(dedupeRepeatedContent(stripEmDashes(content))),
  );
}
