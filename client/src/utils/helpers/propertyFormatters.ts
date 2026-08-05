import type { IProperty, ListingType } from '@/store/types';

export function formatListingPrice(property: IProperty): string {
  if (property.listingType === 'RENTAL' && property.rentWeekly !== null) {
    return `$${property.rentWeekly.toLocaleString('en-NZ')}/week`;
  }
  if (property.price !== null) {
    return `$${property.price.toLocaleString('en-NZ')}`;
  }
  return 'Price on request';
}

export function formatListingType(listingType: ListingType): string {
  return listingType === 'RENTAL' ? 'Rent' : 'Sale';
}

export function formatDateTimeNz(iso: string): string {
  return new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Pacific/Auckland',
  }).format(new Date(iso));
}

export function findPropertyByFixtureKey(
  properties: IProperty[],
  fixtureKey: string | null,
): IProperty | null {
  if (fixtureKey === null) {
    return null;
  }
  return properties.find((property) => property.fixtureKey === fixtureKey) ?? null;
}
