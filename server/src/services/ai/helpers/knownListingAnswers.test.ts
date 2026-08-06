import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  findKnownListingAnswers,
  formatAlreadyKnownListerReply,
} from './knownListingAnswers.js';
import type { SafePropertyDetail } from '../../../modules/properties/types/properties.types.js';

function mockProperty(overrides: Partial<SafePropertyDetail> = {}): SafePropertyDetail {
  return {
    id: 'p1',
    title: 'Test Home',
    slug: 'test-home',
    listingType: 'RENTAL',
    suburb: 'Grey Lynn',
    city: 'Auckland',
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    rentWeekly: 650,
    bond: 2600,
    price: null,
    availableFrom: null,
    heroImageUrl: '',
    fixtureKey: null,
    addressLine: '1 Test St',
    description: 'Nice place',
    imageUrls: [],
    attributes: [{ key: 'floor_area_sqm', value: 42, source: 'listing' }],
    lister: { id: 'l1', name: 'Lister' },
    ...overrides,
  };
}

describe('knownListingAnswers', () => {
  it('blocks floor-area escalation when sqm is on the listing', () => {
    const facts = findKnownListingAnswers({
      property: mockProperty(),
      questionText: 'Ask the lister about the floor area.',
    });
    assert.equal(facts.length, 1);
    assert.equal(facts[0]?.attribute, 'floor_area_sqm');
    assert.equal(facts[0]?.value, '42');
  });

  it('returns core bathroom field for bathroom questions', () => {
    const facts = findKnownListingAnswers({
      property: mockProperty(),
      questionText: 'Ask them how many bathrooms there are',
      canonicalAttributes: ['bathrooms'],
    });
    assert.ok(facts.some((fact) => fact.attribute === 'bathrooms' && fact.value === '1'));
  });

  it('formats a clear already-known reply', () => {
    const reply = formatAlreadyKnownListerReply([
      { attribute: 'floor_area_sqm', value: '42', source: 'listing_attribute' },
    ]);
    assert.match(reply, /No need to ask the lister/i);
    assert.match(reply, /42/);
  });

  it('returns empty when the topic is missing from the listing', () => {
    const facts = findKnownListingAnswers({
      property: mockProperty({ attributes: [] }),
      questionText: 'Ask the lister why the owner is moving',
    });
    assert.equal(facts.length, 0);
  });
});
