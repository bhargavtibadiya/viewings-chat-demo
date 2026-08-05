import type { Prisma, Property, ListingAttribute, ListingType } from '#generated/client.js';
import prisma from '../../config/prisma.js';
import { createServiceError } from '../../utils/helpers/serviceError.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import { parseJsonStringArray } from '../../utils/helpers/json.js';
import { formatNzDateTime, formatNzTime } from '../../utils/helpers/date.js';
import type { PropertyQueryDtoType, AvailabilityQueryDtoType } from './dto/properties.dto.js';
import type {
  PaginatedPropertiesResponse,
  PropertyAvailabilityResponse,
  SafeListingAttribute,
  SafePropertyDetail,
  SafePropertySummary,
} from './types/properties.types.js';

type PropertyWithRelations = Property & {
  attributes: ListingAttribute[];
  lister: { id: string; name: string };
};

export class PropertiesService {
  private jsonToAttributeValue(value: Prisma.JsonValue): string | number | boolean | string[] | null {
    if (value === null) {
      return null;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (Array.isArray(value)) {
      const strings: string[] = [];
      for (const item of value) {
        if (typeof item === 'string') {
          strings.push(item);
        }
      }
      if (strings.length === value.length) {
        return strings;
      }
    }
    return JSON.stringify(value);
  }

  private toSafeAttribute(attribute: ListingAttribute): SafeListingAttribute {
    return {
      key: attribute.key,
      value: this.jsonToAttributeValue(attribute.value),
      source: attribute.source,
    };
  }

  private toSafeSummary(property: Property): SafePropertySummary {
    return {
      id: property.id,
      title: property.title,
      slug: property.slug,
      listingType: property.listingType,
      suburb: property.suburb,
      city: property.city,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parking: property.parking,
      rentWeekly: property.rentWeekly,
      bond: property.bond,
      price: property.price,
      availableFrom: property.availableFrom ? property.availableFrom.toISOString() : null,
      heroImageUrl: property.heroImageUrl,
      fixtureKey: property.fixtureKey,
    };
  }

  private toSafeDetail(property: PropertyWithRelations): SafePropertyDetail {
    const imageUrls = parseJsonStringArray(property.imageUrls);
    return {
      ...this.toSafeSummary(property),
      addressLine: property.addressLine,
      description: property.description,
      imageUrls,
      attributes: property.attributes.map((attribute) => this.toSafeAttribute(attribute)),
      lister: property.lister,
    };
  }

  async listProperties(filters: PropertyQueryDtoType): Promise<PaginatedPropertiesResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      ...notDeleted(),
      status: 'ACTIVE',
    };

    if (filters.listingType) {
      where.listingType = filters.listingType;
    }
    if (filters.suburb) {
      where.suburb = { contains: filters.suburb, mode: 'insensitive' };
    }
    if (filters.bedrooms) {
      where.bedrooms = filters.bedrooms;
    }
    if (filters.fixtureKey) {
      where.fixtureKey = filters.fixtureKey;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { suburb: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const rentWeeklyFilter: Prisma.IntNullableFilter = {};
      const priceFilter: Prisma.IntNullableFilter = {};

      if (filters.minPrice !== undefined) {
        rentWeeklyFilter.gte = filters.minPrice;
        priceFilter.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        rentWeeklyFilter.lte = filters.maxPrice;
        priceFilter.lte = filters.maxPrice;
      }

      const priceClause: Prisma.PropertyWhereInput = {
        OR: [
          { listingType: 'RENTAL', rentWeekly: rentWeeklyFilter },
          { listingType: 'SALE', price: priceFilter },
        ],
      };

      const existingAnd = where.AND;
      if (Array.isArray(existingAnd)) {
        where.AND = [...existingAnd, priceClause];
      } else if (existingAnd) {
        where.AND = [existingAnd, priceClause];
      } else {
        where.AND = [priceClause];
      }
    }

    const [total, records] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      properties: records.map((record) => this.toSafeSummary(record)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async getPropertyById(propertyId: string): Promise<SafePropertyDetail> {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ...notDeleted() },
      include: {
        attributes: { where: notDeleted() },
        lister: { select: { id: true, name: true } },
      },
    });

    if (!property) {
      throw createServiceError(404, 'Property not found');
    }

    return this.toSafeDetail(property);
  }

  async getAvailability(
    propertyId: string,
    query: AvailabilityQueryDtoType,
  ): Promise<PropertyAvailabilityResponse> {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ...notDeleted() },
    });

    if (!property) {
      throw createServiceError(404, 'Property not found');
    }

    const now = new Date();
    const from = query.from ? new Date(query.from) : now;

    const where: Prisma.AvailabilitySlotWhereInput = {
      propertyId,
      ...notDeleted(),
      startsAt: { gte: from },
      isBooked: false,
    };

    if (query.to) {
      where.startsAt = { gte: from, lte: new Date(query.to) };
    }

    const slots = await prisma.availabilitySlot.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      take: 50,
    });

    return {
      slots: slots.map((slot) => ({
        id: slot.id,
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        timezone: slot.timezone,
        isBooked: slot.isBooked,
        label: this.formatSlotLabel(slot.startsAt, slot.endsAt, slot.timezone),
      })),
    };
  }

  async getPropertyForTools(propertyId: string): Promise<SafePropertyDetail> {
    return this.getPropertyById(propertyId);
  }

  async searchListings(filters: {
    search?: string;
    listingType?: ListingType;
    suburb?: string;
    bedrooms?: number;
    limit?: number;
  }): Promise<SafePropertySummary[]> {
    const result = await this.listProperties({
      search: filters.search,
      listingType: filters.listingType,
      suburb: filters.suburb,
      bedrooms: filters.bedrooms,
      page: 1,
      limit: filters.limit ?? 10,
    });
    return result.properties;
  }

  formatSlotLabel(startsAt: Date, endsAt: Date, timezone: string): string {
    return `${formatNzDateTime(startsAt)} to ${formatNzTime(endsAt, timezone)} (${timezone})`;
  }
}

export const propertiesService = new PropertiesService();
