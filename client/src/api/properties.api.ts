import { axiosInstance } from '@/utils/api/axiosInstance';
import { replaceRouteParam, ROUTES } from '@/utils/helpers/routes';
import type {
  IGetPropertiesThunkPayload,
  IGetPropertiesThunkResponse,
  IGetPropertyByIdThunkPayload,
  IGetPropertyByIdThunkResponse,
  IGetAvailabilityThunkPayload,
  IGetAvailabilityThunkResponse,
} from '@/store/properties/properties.types';

export const propertiesService = {
  /**
   * @param data Optional search and filter params
   */
  getProperties: (data?: IGetPropertiesThunkPayload) => {
    const params: Record<string, string | number> = {};
    if (data?.search !== undefined) params.search = data.search;
    if (data?.listingType !== undefined) params.listingType = data.listingType;
    if (data?.suburb !== undefined) params.suburb = data.suburb;
    if (data?.bedrooms !== undefined) params.bedrooms = data.bedrooms;
    if (data?.minPrice !== undefined) params.minPrice = data.minPrice;
    if (data?.maxPrice !== undefined) params.maxPrice = data.maxPrice;

    return axiosInstance.get<IGetPropertiesThunkResponse>(ROUTES.PROPERTIES.LIST, { params });
  },

  /**
   * @param data Property id
   */
  getPropertyById: (data: IGetPropertyByIdThunkPayload) => {
    const url = replaceRouteParam(ROUTES.PROPERTIES.BY_ID, ':id', data.propertyId);
    return axiosInstance.get<IGetPropertyByIdThunkResponse>(url);
  },

  /**
   * @param data Property id for availability lookup
   */
  getAvailability: (data: IGetAvailabilityThunkPayload) => {
    const url = replaceRouteParam(ROUTES.PROPERTIES.AVAILABILITY, ':id', data.propertyId);
    return axiosInstance.get<IGetAvailabilityThunkResponse>(url);
  },
};
