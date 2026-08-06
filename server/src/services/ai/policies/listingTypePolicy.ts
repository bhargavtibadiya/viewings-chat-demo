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

export function saleOnlyAttribute(attribute: string): boolean {
  return (
    attribute === 'body_corporate_pets' ||
    attribute === 'body_corporate_rules' ||
    attribute === 'body_corporate_fees' ||
    attribute === 'body_corporate'
  );
}

export function filterAttributesForListingType(
  attributes: string[],
  listingType: 'RENTAL' | 'SALE',
): string[] {
  if (listingType === 'SALE') {
    return attributes.filter((attribute) => !rentalOnlyAttribute(attribute));
  }
  return attributes.filter((attribute) => !saleOnlyAttribute(attribute));
}

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
