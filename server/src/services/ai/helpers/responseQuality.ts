/**
 * Post-process assistant text for readability without changing factual content.
 */

/** Normalize whitespace for sentence comparison. */
function normalizeSentence(sentence: string): string {
  return sentence.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Split into sentences while keeping trailing punctuation on each piece.
 */
function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g);
  if (!parts) {
    return [text];
  }
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/**
 * Remove duplicated paragraphs and repeated consecutive/near-duplicate sentences.
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
    uniqueParagraphs.push(paragraph);
  }

  const cleanedParagraphs = uniqueParagraphs.map((paragraph) => {
    const sentences = splitSentences(paragraph);
    const seen = new Set<string>();
    const kept: string[] = [];

    for (const sentence of sentences) {
      const key = normalizeSentence(sentence);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      kept.push(sentence);
    }

    return kept.join(' ').replace(/\s+/g, ' ').trim();
  });

  return cleanedParagraphs.filter((paragraph) => paragraph.length > 0).join('\n\n');
}

/**
 * Soft length trim: keep at most maxParagraphs paragraphs (does not cut mid-sentence inside a paragraph).
 */
export function limitResponseParagraphs(content: string, maxParagraphs = 4): string {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length <= maxParagraphs) {
    return content.trim();
  }

  return paragraphs.slice(0, maxParagraphs).join('\n\n');
}

/** Replace em/en dashes so replies stay consistent with STYLE rules. */
export function stripEmDashes(content: string): string {
  return content
    .replace(/\u2014/g, ' - ') // em dash —
    .replace(/\u2013/g, '-') // en dash –
    .replace(/ {2,}/g, ' ')
    .replace(/ +([,.!?])/g, '$1');
}

export function polishAssistantContent(content: string): string {
  return limitResponseParagraphs(dedupeRepeatedContent(stripEmDashes(content)));
}
