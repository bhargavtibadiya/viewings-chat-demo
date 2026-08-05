import type { ApiSuccessResponse, IProperty, IPropertyDetail, IAvailabilitySlot, ListingType } from '@/store/types';

export interface IGetPropertiesThunkPayload {
  search?: string;
  listingType?: ListingType;
  suburb?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface IGetPropertiesThunkResponseData {
  properties: IProperty[];
}

export type IGetPropertiesThunkResponse = ApiSuccessResponse<IGetPropertiesThunkResponseData>;

export interface IGetPropertyByIdThunkPayload {
  propertyId: string;
}

export interface IGetPropertyByIdThunkResponseData {
  property: IPropertyDetail;
}

export type IGetPropertyByIdThunkResponse = ApiSuccessResponse<IGetPropertyByIdThunkResponseData>;

export interface IGetAvailabilityThunkPayload {
  propertyId: string;
}

export interface IGetAvailabilityThunkResponseData {
  slots: IAvailabilitySlot[];
}

export type IGetAvailabilityThunkResponse = ApiSuccessResponse<IGetAvailabilityThunkResponseData>;

export interface PropertiesSliceInterface {
  getPropertiesLoading: boolean;
  hasRequestedProperties: boolean;
  properties: IProperty[];
  getPropertyByIdLoading: boolean;
  property: IPropertyDetail | null;
  getAvailabilityLoading: boolean;
  availabilitySlots: IAvailabilitySlot[];
  searchFilters: IGetPropertiesThunkPayload;
}
