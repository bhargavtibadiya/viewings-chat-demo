import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dedupeRepeatedContent, polishAssistantContent } from './responseQuality.js';

describe('responseQuality', () => {
  it('removes duplicated sentences', () => {
    const input =
      'Weekly rent is $650. Weekly rent is $650. Bond is four weeks.';
    const output = dedupeRepeatedContent(input);
    assert.equal(output, 'Weekly rent is $650. Bond is four weeks.');
  });

  it('removes duplicated paragraphs', () => {
    const input = 'Pets are not allowed.\n\nPets are not allowed.\n\nAsk about a viewing.';
    const output = dedupeRepeatedContent(input);
    assert.equal(output, 'Pets are not allowed.\n\nAsk about a viewing.');
  });

  it('polishAssistantContent keeps unique content', () => {
    const input = 'There are 2 bedrooms.\n\nThere are 2 bedrooms.';
    assert.equal(polishAssistantContent(input), 'There are 2 bedrooms.');
  });

  it('strips em dashes', () => {
    const input = 'Weekly rent is $650 — bond is four weeks.';
    assert.equal(
      polishAssistantContent(input),
      'Weekly rent is $650 - bond is four weeks.',
    );
  });
});
