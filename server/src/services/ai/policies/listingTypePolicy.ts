export function rentalOnlyAttribute(attribute: string): boolean {
  const rentalAttributes = ['pets_policy', 'bond', 'weekly_rent', 'furnishing'];
  return rentalAttributes.includes(attribute);
}

export function saleOnlyAttribute(attribute: string): boolean {
  return attribute === 'body_corporate_pets';
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

export function buildListingTypeGuidance(listingType: 'RENTAL' | 'SALE'): string {
  if (listingType === 'SALE') {
    return 'This is a SALE listing. Do not apply rental pets policy or weekly rent language. Use body_corporate_pets and ownership context for pet questions.';
  }
  return 'This is a RENTAL listing. Use pets_policy, bond, weekly_rent, and furnishing attributes. Do not apply sale body corporate rules.';
}
