import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  dedupeRepeatedContent,
  polishAssistantContent,
  toneDownExcessBold,
} from './responseQuality.js';

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

  it('preserves markdown bullet lists', () => {
    const input = [
      'Northcote Point Home is a 3-bedroom sale property asking **$1,750,000**.',
      '',
      'Key features:',
      '- Harbour views',
      '- Established terraced gardens',
      '- 2 parking spaces',
      '- Heat pump',
      '- Built in 1910',
    ].join('\n');

    const output = polishAssistantContent(input);
    assert.ok(output.includes('- Harbour views'));
    assert.ok(output.includes('- Heat pump'));
    assert.ok(output.includes('\n- '));
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

  it('tones down excess bold', () => {
    const input =
      '**A** is a **3-bed** home at **2 Beach Road** asking **$1,750,000** with **2 parks**.';
    const output = toneDownExcessBold(input, 3);
    const boldCount = (output.match(/\*\*/g) ?? []).length / 2;
    assert.equal(boldCount, 3);
    assert.ok(output.includes('$1,750,000') || output.includes('**$1,750,000**'));
  });
});
