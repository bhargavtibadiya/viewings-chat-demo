import type { SafeListingAttribute, SafePropertyDetail } from '../../../modules/properties/types/properties.types.js';
import { inferTopicAttributes } from './openListerQuestions.js';

export interface KnownListingFact {
  attribute: string;
  value: string;
  source: string;
}

const ATTRIBUTE_ALIASES: Record<string, string[]> = {
  floor_area: ['floor_area_sqm', 'floor_area', 'floorarea_sqm'],
  floor_area_sqm: ['floor_area_sqm', 'floor_area', 'floorarea_sqm'],
  land_area_sqm: ['land_area_sqm', 'land_area'],
  bedrooms: ['bedrooms', 'beds'],
  bathrooms: ['bathrooms', 'baths'],
  parking: ['parking', 'parking_detail'],
  weekly_rent: ['weekly_rent', 'rent_weekly'],
  pets_policy: ['pets_policy', 'body_corporate_pets'],
  body_corporate_pets: ['body_corporate_pets', 'pets_policy'],
};

function formatAttributeValue(value: string | number | boolean | string[] | null): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'unknown') {
      return null;
    }
    return trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join(', ');
    return joined.length > 0 ? joined : null;
  }
  return null;
}

function attributeLookupKeys(attribute: string): string[] {
  const normalized = attribute.trim().toLowerCase();
  const aliases = ATTRIBUTE_ALIASES[normalized] ?? [normalized];
  return [...new Set(aliases.map((key) => key.toLowerCase()))];
}

function findAttributeValue(
  attributes: SafeListingAttribute[],
  attribute: string,
): { key: string; value: string } | null {
  const keys = new Set(attributeLookupKeys(attribute));
  for (const item of attributes) {
    if (!keys.has(item.key.toLowerCase())) {
      continue;
    }
    const formatted = formatAttributeValue(item.value);
    if (formatted) {
      return { key: item.key, value: formatted };
    }
  }
  return null;
}

function coreFieldFact(
  property: SafePropertyDetail,
  attribute: string,
): KnownListingFact | null {
  const key = attribute.toLowerCase();
  if (key === 'bedrooms' || key === 'beds') {
    return {
      attribute: 'bedrooms',
      value: String(property.bedrooms),
      source: 'listing_field',
    };
  }
  if (key === 'bathrooms' || key === 'baths') {
    return {
      attribute: 'bathrooms',
      value: String(property.bathrooms),
      source: 'listing_field',
    };
  }
  if (key === 'parking') {
    return {
      attribute: 'parking',
      value: String(property.parking),
      source: 'listing_field',
    };
  }
  if ((key === 'weekly_rent' || key === 'rent_weekly') && property.rentWeekly != null) {
    return {
      attribute: 'weekly_rent',
      value: String(property.rentWeekly),
      source: 'listing_field',
    };
  }
  if (key === 'bond' && property.bond != null) {
    return {
      attribute: 'bond',
      value: String(property.bond),
      source: 'listing_field',
    };
  }
  if (key === 'price' && property.price != null) {
    return {
      attribute: 'price',
      value: String(property.price),
      source: 'listing_field',
    };
  }
  return null;
}

function displayFactValue(fact: KnownListingFact): string {
  if (fact.attribute.includes('floor_area') || fact.attribute.includes('sqm')) {
    return /m²|sqm/i.test(fact.value) ? fact.value : `${fact.value} m²`;
  }
  if (fact.attribute === 'weekly_rent' || fact.attribute === 'bond' || fact.attribute === 'price') {
    return fact.value.startsWith('$') ? fact.value : `$${fact.value}`;
  }
  return fact.value;
}

/**
 * Resolve listing facts that already answer an escalation topic.
 * If any requested topic has a real listing value, escalation should be blocked.
 */
export function findKnownListingAnswers(input: {
  property: SafePropertyDetail;
  questionText: string;
  canonicalAttributes?: string[] | null;
}): KnownListingFact[] {
  const requested = new Set<string>();

  for (const attr of input.canonicalAttributes ?? []) {
    if (typeof attr === 'string' && attr.trim()) {
      requested.add(attr.trim().toLowerCase());
    }
  }

  for (const attr of inferTopicAttributes(input.questionText)) {
    requested.add(attr.toLowerCase());
  }

  const lowered = input.questionText.toLowerCase();
  if (/\bfloor\s*area\b|\bsqm\b|\bm\s*2\b|\bm²\b|\bsquare\s+metr/i.test(lowered)) {
    requested.add('floor_area_sqm');
    requested.add('floor_area');
  }

  if (requested.size === 0) {
    return [];
  }

  const facts: KnownListingFact[] = [];
  const seen = new Set<string>();

  for (const attribute of requested) {
    const fromCore = coreFieldFact(input.property, attribute);
    if (fromCore && !seen.has(fromCore.attribute)) {
      seen.add(fromCore.attribute);
      facts.push(fromCore);
      continue;
    }

    const fromAttrs = findAttributeValue(input.property.attributes, attribute);
    if (fromAttrs && !seen.has(fromAttrs.key)) {
      seen.add(fromAttrs.key);
      facts.push({
        attribute: fromAttrs.key,
        value: fromAttrs.value,
        source: 'listing_attribute',
      });
    }
  }

  return facts;
}

export function formatAlreadyKnownListerReply(facts: KnownListingFact[]): string {
  if (facts.length === 0) {
    return 'That detail is already on the listing, so there is no need to ask the lister.';
  }

  if (facts.length === 1) {
    const fact = facts[0]!;
    const label = fact.attribute.replace(/_/g, ' ');
    return `No need to ask the lister - the listing already has that. The ${label} is **${displayFactValue(fact)}**.`;
  }

  const lines = facts.map((fact) => {
    const label = fact.attribute.replace(/_/g, ' ');
    return `- ${label}: **${displayFactValue(fact)}**`;
  });

  return `No need to ask the lister - the listing already has that:\n\n${lines.join('\n')}`;
}
