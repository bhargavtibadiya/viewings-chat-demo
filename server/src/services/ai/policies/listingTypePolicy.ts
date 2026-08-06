/**
 * Returns whether an attribute key is rental-only.
 *
 * @param attribute - Canonical attribute key
 * @returns True if the attribute must not appear on SALE listings
 */
export function rentalOnlyAttribute(attribute: string): boolean {
  const rentalAttributes = [
    'pets_policy',
    'bond',
    'weekly_rent',
    'furnishing',
    'rent_includes',
    'rent_period',
  ];
  return rentalAttributes.includes(attribute);
}

/**
 * Returns whether an attribute key is sale/body-corporate-only.
 *
 * @param attribute - Canonical attribute key
 * @returns True if the attribute must not appear on RENTAL listings
 */
export function saleOnlyAttribute(attribute: string): boolean {
  return (
    attribute === 'body_corporate_pets' ||
    attribute === 'body_corporate_rules' ||
    attribute === 'body_corporate_fees' ||
    attribute === 'body_corporate'
  );
}

/**
 * Filters attribute key lists for the active listing type.
 *
 * @param attributes - Candidate attribute keys
 * @param listingType - RENTAL or SALE
 * @returns Keys allowed for that listing type
 */
export function filterAttributesForListingType(
  attributes: string[],
  listingType: 'RENTAL' | 'SALE',
): string[] {
  if (listingType === 'SALE') {
    return attributes.filter((attribute) => !rentalOnlyAttribute(attribute));
  }
  return attributes.filter((attribute) => !saleOnlyAttribute(attribute));
}

/**
 * Filters attribute records by key against listing-type rules.
 *
 * @param attributes - Records that expose a `key` field
 * @param listingType - RENTAL or SALE
 * @returns Records whose keys are allowed
 */
export function filterAttributeRecordsForListingType<T extends { key: string }>(
  attributes: T[],
  listingType: 'RENTAL' | 'SALE',
): T[] {
  const allowedKeys = new Set(
    filterAttributesForListingType(
      attributes.map((attribute) => attribute.key),
      listingType,
    ),
  );
  return attributes.filter((attribute) => allowedKeys.has(attribute.key));
}

/**
 * Strip listing-type-inappropriate fields from the tool-facing property payload.
 *
 * @param property - Property detail used by get_property / tools
 * @returns Sanitized copy safe for the current listing type
 */
export function sanitizePropertyDetailForListingType<
  T extends {
    listingType: 'RENTAL' | 'SALE';
    rentWeekly: number | null;
    bond: number | null;
    attributes: Array<{ key: string }>;
  },
>(property: T): T {
  const listingType = property.listingType;
  const attributes = filterAttributeRecordsForListingType(property.attributes, listingType);

  if (listingType === 'SALE') {
    // [WARN] must null rent/bond on SALE so the model cannot quote rental figures
    return {
      ...property,
      rentWeekly: null,
      bond: null,
      attributes,
    };
  }

  return {
    ...property,
    attributes,
  };
}

/**
 * Builds system-prompt guidance for RENTAL vs SALE wording.
 *
 * @param listingType - Active listing type for the session property
 * @returns Multi-line instruction block for the agent system prompt
 */
export function buildListingTypeGuidance(listingType: 'RENTAL' | 'SALE'): string {
  if (listingType === 'SALE') {
    return [
      'This is a SALE listing.',
      '- Never use rental language: no weekly rent, bond, or rental pets_policy.',
      '- Pets: buyers own the property. Answer from body_corporate_pets / body_corporate_rules when present; otherwise say "not specified" and offer to ask the lister.',
      '- Body corporate: only state restrictions/fees that appear in listing attributes (body_corporate_pets, body_corporate_rules, body_corporate_fees). Never invent BC fees or rules.',
      '- If the user asks rental-only questions (weekly rent, bond, tenant pets policy), say those do not apply to this sale listing.',
    ].join('\n');
  }
  return [
    'This is a RENTAL listing.',
    '- Use pets_policy, bond, weekly_rent / rentWeekly, and furnishing from tools.',
    '- Do not invent sale body corporate ownership rules. Only use BC fields if present on this rental listing.',
  ].join('\n');
}
