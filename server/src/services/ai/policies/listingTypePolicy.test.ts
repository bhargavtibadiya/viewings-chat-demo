import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterAttributesForListingType,
  filterAttributeRecordsForListingType,
  sanitizePropertyDetailForListingType,
} from './listingTypePolicy.js';

describe('listingTypePolicy', () => {
  it('filters rental-only attributes from SALE', () => {
    assert.deepEqual(
      filterAttributesForListingType(
        ['pets_policy', 'body_corporate_pets', 'parking'],
        'SALE',
      ),
      ['body_corporate_pets', 'parking'],
    );
  });

  it('sanitizes SALE property payload', () => {
    const sanitized = sanitizePropertyDetailForListingType({
      listingType: 'SALE' as const,
      rentWeekly: 650,
      bond: 2600,
      attributes: [
        { key: 'pets_policy', value: 'No pets' },
        { key: 'body_corporate_pets', value: 'Cats ok' },
        { key: 'parking', value: '1' },
      ],
    });

    assert.equal(sanitized.rentWeekly, null);
    assert.equal(sanitized.bond, null);
    assert.deepEqual(
      sanitized.attributes.map((attribute) => attribute.key),
      ['body_corporate_pets', 'parking'],
    );
  });

  it('keeps rental attributes on RENTAL', () => {
    const attrs = filterAttributeRecordsForListingType(
      [
        { key: 'pets_policy' },
        { key: 'body_corporate_pets' },
        { key: 'weekly_rent' },
      ],
      'RENTAL',
    );
    assert.deepEqual(
      attrs.map((attribute) => attribute.key),
      ['pets_policy', 'weekly_rent'],
    );
  });
});
