import type { ListingType, Prisma } from '../../../../generated/client.js';
import prisma from '../../../../config/prisma.js';
import { addDays, atLocalTimeInTimezone } from '../../../../utils/helpers/date.js';
import { TIMEZONE } from '../../../../utils/constants/pagination.js';

interface AttributeSeed {
  key: string;
  value: string | number | boolean | string[];
}

interface PropertySeed {
  slug: string;
  title: string;
  listingType: ListingType;
  suburb: string;
  addressLine: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  rentWeekly?: number;
  bond?: number;
  price?: number;
  description: string;
  heroImageUrl: string;
  fixtureKey?: string;
  /** Fixture/demo attributes that must always be present (override catalog values). */
  requiredAttributes?: AttributeSeed[];
  attributes: AttributeSeed[];
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200';

/** 25 property-related attribute categories used for seed variety. */
const ATTRIBUTE_CATALOG: AttributeSeed[] = [
  { key: 'furnishing', value: 'unfurnished' },
  { key: 'included_furniture', value: ['fridge', 'washing machine'] },
  { key: 'heating', value: 'heat pump' },
  { key: 'cooling', value: 'heat pump cooling mode' },
  { key: 'insulation', value: 'ceiling and underfloor insulated' },
  { key: 'outdoor_space', value: 'deck and lawn' },
  { key: 'fencing', value: 'fully fenced' },
  { key: 'pets_policy', value: 'cats allowed on application' },
  { key: 'ensuite', value: 'primary bedroom ensuite' },
  { key: 'bathroom_layout', value: 'ensuite plus main bathroom' },
  { key: 'internet', value: 'fibre ready' },
  { key: 'fibre_status', value: 'connected' },
  { key: 'workspace', value: 'study nook' },
  { key: 'accessibility', value: 'single-level living' },
  { key: 'step_free_access', value: 'ground floor entry' },
  { key: 'lift', value: 'building lift' },
  { key: 'body_corporate_pets', value: 'small pets may require approval' },
  { key: 'parking_detail', value: 'single covered car park' },
  { key: 'laundry', value: 'internal laundry with dryer' },
  { key: 'appliances', value: ['oven', 'cooktop', 'dishwasher', 'rangehood'] },
  { key: 'storage', value: 'attic and hallway cupboard' },
  { key: 'security', value: 'alarm and deadbolts' },
  { key: 'sunlight', value: 'north-facing living' },
  { key: 'floor_area_sqm', value: 95 },
  { key: 'year_built', value: 1998 },
];

const EXTRA_VALUE_OPTIONS: Record<string, Array<string | number | boolean | string[]>> = {
  furnishing: ['unfurnished', 'partly furnished', 'fully furnished'],
  included_furniture: [[], ['fridge'], ['fridge', 'washing machine'], ['bed', 'desk', 'sofa']],
  heating: ['heat pump', 'gas central', 'electric panel heaters', 'fireplace and heat pump'],
  cooling: ['heat pump cooling mode', 'ceiling fans', 'none', 'sea breeze'],
  insulation: ['unknown', 'partial', 'ceiling only', 'ceiling and underfloor insulated'],
  outdoor_space: ['balcony', 'courtyard', 'yard', 'deck and lawn', 'terraced gardens', 'entertaining deck'],
  fencing: ['unknown', 'none', 'partial', 'fully fenced'],
  pets_policy: ['no pets', 'cats allowed', 'dogs considered', 'negotiable'],
  ensuite: ['none', 'primary bedroom ensuite', 'two ensuite bedrooms'],
  bathroom_layout: ['main bathroom only', 'ensuite plus main bathroom', 'two bathrooms upstairs'],
  internet: ['adsl only', 'fibre ready', 'fibre 300/100', 'fibre 900/500'],
  fibre_status: ['not available', 'available', 'connected'],
  workspace: ['none', 'desk nook in living area', 'dedicated office', 'study plus rumpus'],
  accessibility: ['unknown', 'single-level living', 'stairs to entry', 'wide doorways'],
  step_free_access: ['unknown', 'none', 'ground floor entry', 'ground floor living'],
  lift: ['none', 'building lift'],
  body_corporate_pets: ['no pets', 'no pets per body corporate rules', 'small pets may require body corporate approval'],
  parking_detail: ['street only', 'single open park', 'single covered car park', 'double garage plus off-street'],
  laundry: ['shared building laundry', 'tub only', 'internal laundry', 'internal laundry with dryer'],
  appliances: [['oven', 'cooktop'], ['oven', 'cooktop', 'dishwasher'], ['oven', 'cooktop', 'dishwasher', 'rangehood']],
  storage: ['limited cupboard space', 'hallway cupboard', 'garage storage', 'attic and hallway cupboard'],
  security: ['standard locks', 'deadbolts', 'alarm', 'alarm and deadbolts'],
  sunlight: ['limited afternoon sun', 'east-facing bedrooms', 'north-facing living', 'all-day sun in living'],
  floor_area_sqm: [42, 65, 85, 95, 120, 160, 210],
  year_built: [1910, 1955, 1978, 1998, 2008, 2016, 2022],
};

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickCatalogValue(key: string, rng: () => number): string | number | boolean | string[] {
  const options = EXTRA_VALUE_OPTIONS[key];
  if (!options || options.length === 0) {
    const fallback = ATTRIBUTE_CATALOG.find((item) => item.key === key);
    return fallback?.value ?? 'unknown';
  }
  return options[Math.floor(rng() * options.length)]!;
}

function assignAttributes(
  slug: string,
  requiredAttributes: AttributeSeed[] = [],
): AttributeSeed[] {
  const rng = createRng(slug);
  const targetCount = 15 + Math.floor(rng() * 6); // 15–20
  const byKey = new Map<string, AttributeSeed>();

  for (const attribute of requiredAttributes) {
    byKey.set(attribute.key, attribute);
  }

  const remainingKeys = ATTRIBUTE_CATALOG.map((item) => item.key).filter((key) => !byKey.has(key));

  // Fisher–Yates shuffle of remaining catalog keys
  for (let index = remainingKeys.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const current = remainingKeys[index]!;
    remainingKeys[index] = remainingKeys[swapIndex]!;
    remainingKeys[swapIndex] = current;
  }

  for (const key of remainingKeys) {
    if (byKey.size >= targetCount) {
      break;
    }
    byKey.set(key, { key, value: pickCatalogValue(key, rng) });
  }

  // If required already exceeded target, keep all required; otherwise fill to target when catalog allows.
  return Array.from(byKey.values()).sort((left, right) => left.key.localeCompare(right.key));
}

function buildProperties(): PropertySeed[] {
  const rentals: Omit<PropertySeed, 'attributes'>[] = [
    {
      slug: 'unfurnished-parnell-studio',
      title: 'Unfurnished Studio in Parnell',
      listingType: 'RENTAL',
      suburb: 'Parnell',
      addressLine: '12 St Georges Bay Road',
      bedrooms: 1,
      bathrooms: 1,
      parking: 0,
      rentWeekly: 420,
      bond: 1680,
      description: 'Compact unfurnished studio close to the train station.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      fixtureKey: 'unfurnished-rental',
      requiredAttributes: [
        { key: 'furnishing', value: 'unfurnished' },
        { key: 'included_furniture', value: [] },
        { key: 'heating', value: 'heat pump' },
        { key: 'internet', value: 'fibre ready' },
      ],
    },
    {
      slug: 'mt-eden-yard-rental',
      title: 'Mt Eden Family Home with Yard',
      listingType: 'RENTAL',
      suburb: 'Mt Eden',
      addressLine: '44 Mount Eden Road',
      bedrooms: 3,
      bathrooms: 2,
      parking: 1,
      rentWeekly: 780,
      bond: 3120,
      description: 'Sunny home with fenced yard area and outdoor space.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      fixtureKey: 'yard-fencing-unknown',
      requiredAttributes: [
        { key: 'outdoor_space', value: 'yard' },
        { key: 'fencing', value: 'unknown' },
        { key: 'pets_policy', value: 'negotiable' },
        { key: 'heating', value: 'gas central' },
      ],
    },
    {
      slug: 'remuera-ensuite-rental',
      title: 'Remuera Bedroom with Ensuite',
      listingType: 'RENTAL',
      suburb: 'Remuera',
      addressLine: '8 Victoria Avenue',
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      rentWeekly: 650,
      bond: 2600,
      description: 'Modern apartment with primary bedroom ensuite.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      fixtureKey: 'ensuite-layout',
      requiredAttributes: [
        { key: 'ensuite', value: 'primary bedroom ensuite' },
        { key: 'bathroom_layout', value: 'ensuite plus main bathroom' },
        { key: 'furnishing', value: 'partly furnished' },
      ],
    },
    {
      slug: 'epsom-heating-rental',
      title: 'Epsom Villa with Heat Pump',
      listingType: 'RENTAL',
      suburb: 'Epsom',
      addressLine: '19 Greenlane Road',
      bedrooms: 3,
      bathrooms: 1,
      parking: 1,
      rentWeekly: 720,
      bond: 2880,
      description: 'Character villa with heat pump heating. Insulation not listed.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      fixtureKey: 'heating-fixture',
      requiredAttributes: [
        { key: 'heating', value: 'heat pump' },
        { key: 'cooling', value: 'heat pump cooling mode' },
        { key: 'insulation', value: 'unknown' },
      ],
    },
    {
      slug: 'newmarket-accessibility-rental',
      title: 'Newmarket Townhouse',
      listingType: 'RENTAL',
      suburb: 'Newmarket',
      addressLine: '5 Kent Street',
      bedrooms: 2,
      bathrooms: 1,
      parking: 1,
      rentWeekly: 690,
      bond: 2760,
      description: 'Two-level townhouse. Accessibility details not specified in listing.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      fixtureKey: 'accessibility-unknown',
      requiredAttributes: [
        { key: 'accessibility', value: 'unknown' },
        { key: 'step_free_access', value: 'unknown' },
        { key: 'lift', value: 'none' },
      ],
    },
    {
      slug: 'ponsonby-rent-wfh',
      title: 'Ponsonby Work-from-home Flat',
      listingType: 'RENTAL',
      suburb: 'Ponsonby',
      addressLine: '101 Ponsonby Road',
      bedrooms: 2,
      bathrooms: 1,
      parking: 0,
      rentWeekly: 640,
      bond: 2560,
      description: 'Bright flat with dedicated workspace nook, outdoor courtyard, and BBQ area.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      fixtureKey: 'wfh-outdoor',
      requiredAttributes: [
        { key: 'weekly_rent', value: 640 },
        { key: 'bond', value: 2560 },
        { key: 'workspace', value: 'desk nook in living area' },
        { key: 'fibre_status', value: 'connected' },
        { key: 'internet', value: 'fibre 900/500' },
        { key: 'outdoor_space', value: 'courtyard with BBQ area' },
        { key: 'bbq_allowed', value: true },
      ],
    },
    {
      slug: 'grey-lynn-pet-friendly-rental',
      title: 'Grey Lynn Pet-friendly Apartment',
      listingType: 'RENTAL',
      suburb: 'Grey Lynn',
      addressLine: '2 Francis Street',
      bedrooms: 2,
      bathrooms: 1,
      parking: 1,
      rentWeekly: 610,
      bond: 2440,
      description: 'Ground floor apartment with small courtyard.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'pets_policy', value: 'cats allowed' },
        { key: 'outdoor_space', value: 'courtyard' },
        { key: 'fencing', value: 'partial' },
      ],
    },
    {
      slug: 'takapuna-beach-rental',
      title: 'Takapuna Beachside Rental',
      listingType: 'RENTAL',
      suburb: 'Takapuna',
      addressLine: '16 Hurstmere Road',
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      rentWeekly: 700,
      bond: 2800,
      description: 'Walk to the beach from this modern rental with clear weekly rent and bond.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      fixtureKey: 'rental-pricing',
      requiredAttributes: [
        { key: 'weekly_rent', value: 700 },
        { key: 'bond', value: 2800 },
        { key: 'parking_detail', value: 'single covered car park' },
        { key: 'heating', value: 'electric panel heaters' },
      ],
    },
    {
      slug: 'henderson-family-rental',
      title: 'Henderson Family Home',
      listingType: 'RENTAL',
      suburb: 'Henderson',
      addressLine: '50 Lincoln Road',
      bedrooms: 4,
      bathrooms: 2,
      parking: 2,
      rentWeekly: 680,
      bond: 2720,
      description: 'Spacious family home near Westfield.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'outdoor_space', value: 'deck and lawn' },
        { key: 'fencing', value: 'fully fenced' },
      ],
    },
    {
      slug: 'cbd-apartment-rental',
      title: 'CBD High-rise Apartment',
      listingType: 'RENTAL',
      suburb: 'Auckland CBD',
      addressLine: '88 Queen Street',
      bedrooms: 1,
      bathrooms: 1,
      parking: 0,
      rentWeekly: 550,
      bond: 2200,
      description: 'City living with building gym access.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'lift', value: 'building lift' },
        { key: 'furnishing', value: 'unfurnished' },
      ],
    },
  ];

  const sales: Omit<PropertySeed, 'attributes'>[] = [
    {
      slug: 'mission-bay-sale-pets',
      title: 'Mission Bay Apartment (Sale)',
      listingType: 'SALE',
      suburb: 'Mission Bay',
      addressLine: '30 Tamaki Drive',
      bedrooms: 2,
      bathrooms: 1,
      parking: 1,
      price: 895000,
      description: 'Coastal apartment in a body corporate building.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      fixtureKey: 'sale-pets',
      requiredAttributes: [
        { key: 'body_corporate_pets', value: 'small pets may require body corporate approval' },
        { key: 'outdoor_space', value: 'balcony' },
      ],
    },
    {
      slug: 'devonport-character-sale',
      title: 'Devonport Character Cottage',
      listingType: 'SALE',
      suburb: 'Devonport',
      addressLine: '3 Vauxhall Road',
      bedrooms: 3,
      bathrooms: 1,
      parking: 1,
      price: 1250000,
      description: 'Renovated cottage with harbour glimpses.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'heating', value: 'fireplace and heat pump' },
        { key: 'insulation', value: 'ceiling and underfloor insulated' },
      ],
    },
    {
      slug: 'herne-bay-luxury-sale',
      title: 'Herne Bay Architect Home',
      listingType: 'SALE',
      suburb: 'Herne Bay',
      addressLine: '6 Sarsfield Street',
      bedrooms: 4,
      bathrooms: 3,
      parking: 2,
      price: 3200000,
      description: 'Architect-designed home with premium finishes.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'ensuite', value: 'two ensuite bedrooms' },
        { key: 'workspace', value: 'dedicated office' },
      ],
    },
    {
      slug: 'onehunga-townhouse-sale',
      title: 'Onehunga Modern Townhouse',
      listingType: 'SALE',
      suburb: 'Onehunga',
      addressLine: '21 Dress Smart Place',
      bedrooms: 3,
      bathrooms: 2,
      parking: 1,
      price: 980000,
      description: 'Low maintenance townhouse near transport.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'step_free_access', value: 'ground floor living' },
        { key: 'body_corporate_pets', value: 'no pets per body corporate rules' },
      ],
    },
    {
      slug: 'st-heliers-sale',
      title: 'St Heliers Coastal Sale',
      listingType: 'SALE',
      suburb: 'St Heliers',
      addressLine: '14 Turane Street',
      bedrooms: 3,
      bathrooms: 2,
      parking: 2,
      price: 2100000,
      description: 'Steps from the beach with outdoor entertaining.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'outdoor_space', value: 'entertaining deck' },
        { key: 'fencing', value: 'partial' },
      ],
    },
    {
      slug: 'albany-family-sale',
      title: 'Albany Family Home',
      listingType: 'SALE',
      suburb: 'Albany',
      addressLine: '7 Pinehurst Road',
      bedrooms: 4,
      bathrooms: 2,
      parking: 2,
      price: 1180000,
      description: 'Family home in a quiet cul-de-sac.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'outdoor_space', value: 'large lawn' },
        { key: 'fencing', value: 'fully fenced' },
      ],
    },
    {
      slug: 'kingsland-villa-sale',
      title: 'Kingsland Villa',
      listingType: 'SALE',
      suburb: 'Kingsland',
      addressLine: '55 New North Road',
      bedrooms: 3,
      bathrooms: 1,
      parking: 1,
      price: 1350000,
      description: 'Classic villa walking distance to Eden Park.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'heating', value: 'heat pump' },
        { key: 'insulation', value: 'partial' },
      ],
    },
    {
      slug: 'howick-sale',
      title: 'Howick Lifestyle Property',
      listingType: 'SALE',
      suburb: 'Howick',
      addressLine: '90 Moore Street',
      bedrooms: 4,
      bathrooms: 2,
      parking: 3,
      price: 1650000,
      description: 'Generous home with multiple living zones.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'workspace', value: 'study plus rumpus' },
        { key: 'parking_detail', value: 'double garage plus off-street' },
      ],
    },
    {
      slug: 'mangere-bridge-sale',
      title: 'Mangere Bridge Townhouse',
      listingType: 'SALE',
      suburb: 'Mangere Bridge',
      addressLine: '3 Coronation Road',
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      price: 820000,
      description: 'Affordable entry near the waterfront walkway.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'body_corporate_pets', value: 'no pets' },
        { key: 'accessibility', value: 'single-level living' },
      ],
    },
    {
      slug: 'northcote-sale',
      title: 'Northcote Point Home',
      listingType: 'SALE',
      suburb: 'Northcote Point',
      addressLine: '2 Beach Road',
      bedrooms: 3,
      bathrooms: 2,
      parking: 2,
      price: 1750000,
      description: 'Harbour views and established gardens.',
      heroImageUrl: PLACEHOLDER_IMAGE,
      requiredAttributes: [
        { key: 'outdoor_space', value: 'terraced gardens' },
        { key: 'cooling', value: 'sea breeze' },
      ],
    },
  ];

  return [...rentals, ...sales].map((property) => ({
    ...property,
    attributes: assignAttributes(property.slug, property.requiredAttributes),
  }));
}

function attributeToJson(value: string | number | boolean | string[]): Prisma.InputJsonValue {
  if (Array.isArray(value)) {
    return value;
  }
  return value;
}

function buildSlotTimes(base: Date, dayOffset: number, hour: number): { startsAt: Date; endsAt: Date } {
  const startsAt = atLocalTimeInTimezone(base, dayOffset, hour, 0, TIMEZONE);
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
  return { startsAt, endsAt };
}

export async function seedListings(listerId: string): Promise<void> {
  const properties = buildProperties();
  const now = new Date();

  for (const property of properties) {
    const record = await prisma.property.upsert({
      where: { slug: property.slug },
      create: {
        title: property.title,
        slug: property.slug,
        listingType: property.listingType,
        suburb: property.suburb,
        addressLine: property.addressLine,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.parking,
        rentWeekly: property.rentWeekly,
        bond: property.bond,
        price: property.price,
        availableFrom: property.listingType === 'RENTAL' ? addDays(now, 7) : null,
        description: property.description,
        heroImageUrl: property.heroImageUrl,
        imageUrls: [property.heroImageUrl],
        fixtureKey: property.fixtureKey,
        listerId,
      },
      update: {
        title: property.title,
        listingType: property.listingType,
        suburb: property.suburb,
        addressLine: property.addressLine,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.parking,
        rentWeekly: property.rentWeekly,
        bond: property.bond,
        price: property.price,
        description: property.description,
        heroImageUrl: property.heroImageUrl,
        fixtureKey: property.fixtureKey,
        listerId,
        deletedAt: null,
      },
    });

    const attributeKeys = property.attributes.map((attribute) => attribute.key);

    for (const attribute of property.attributes) {
      await prisma.listingAttribute.upsert({
        where: {
          propertyId_key: {
            propertyId: record.id,
            key: attribute.key,
          },
        },
        create: {
          propertyId: record.id,
          key: attribute.key,
          value: attributeToJson(attribute.value),
          source: 'SEED',
        },
        update: {
          value: attributeToJson(attribute.value),
          source: 'SEED',
          deletedAt: null,
        },
      });
    }

    // Drop stale seed attributes that are no longer assigned to this property.
    await prisma.listingAttribute.updateMany({
      where: {
        propertyId: record.id,
        source: 'SEED',
        deletedAt: null,
        key: { notIn: attributeKeys },
      },
      data: { deletedAt: new Date() },
    });

    // Refresh unbooked slots so wrong UTC-hour seeds are replaced with Auckland wall times.
    // Leave booked slots (and any slot with a booking row) alone.
    await prisma.availabilitySlot.deleteMany({
      where: {
        propertyId: record.id,
        isBooked: false,
        booking: { is: null },
      },
    });

    const remainingBooked = await prisma.availabilitySlot.count({
      where: { propertyId: record.id, deletedAt: null, isBooked: true },
    });

    const slotTemplates = [
      buildSlotTimes(now, 2, 9),
      buildSlotTimes(now, 3, 12),
      buildSlotTimes(now, 4, 17),
      buildSlotTimes(now, 6, 10),
    ];

    for (let index = 0; index < slotTemplates.length; index += 1) {
      const template = slotTemplates[index];
      await prisma.availabilitySlot.create({
        data: {
          propertyId: record.id,
          startsAt: template.startsAt,
          endsAt: template.endsAt,
          timezone: TIMEZONE,
          isBooked:
            remainingBooked === 0 && index === 0 && property.fixtureKey === 'wfh-outdoor',
        },
      });
    }
  }
}
