import type { ListingType, Prisma } from '#generated/client.js';
import prisma from '../../../../config/prisma.js';
import { addDays } from '../../../../utils/helpers/date.js';

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
  attributes: AttributeSeed[];
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200';

function buildProperties(): PropertySeed[] {
  const rentals: PropertySeed[] = [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
        { key: 'lift', value: 'building lift' },
        { key: 'furnishing', value: 'unfurnished' },
      ],
    },
  ];

  const sales: PropertySeed[] = [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
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
      attributes: [
        { key: 'outdoor_space', value: 'terraced gardens' },
        { key: 'cooling', value: 'sea breeze' },
      ],
    },
  ];

  return [...rentals, ...sales];
}

function attributeToJson(value: string | number | boolean | string[]): Prisma.InputJsonValue {
  if (Array.isArray(value)) {
    return value;
  }
  return value;
}

function buildSlotTimes(base: Date, dayOffset: number, hour: number): { startsAt: Date; endsAt: Date } {
  const startsAt = addDays(base, dayOffset);
  startsAt.setUTCHours(hour, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setUTCMinutes(endsAt.getUTCMinutes() + 30);
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

    const existingSlots = await prisma.availabilitySlot.count({
      where: { propertyId: record.id, deletedAt: null },
    });

    if (existingSlots === 0) {
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
            isBooked: index === 0 && property.fixtureKey === 'wfh-outdoor',
          },
        });
      }
    }
  }
}
