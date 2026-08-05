import { axiosInstance } from '@/utils/api/axiosInstance';
import { replaceRouteParam, ROUTES } from '@/utils/helpers/routes';
import type {
  IGetSessionThunkPayload,
  IGetSessionThunkResponse,
  IGetMessagesThunkPayload,
  IGetMessagesThunkResponse,
  ISendMessageThunkPayload,
  ISendMessageThunkResponse,
} from '@/store/chat/chat.types';

export const chatService = {
  /**
   * @param data Property id to get or create a chat session
   */
  getSession: (data: IGetSessionThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.SESSION_BY_PROPERTY, ':propertyId', data.propertyId);
    return axiosInstance.get<IGetSessionThunkResponse>(url);
  },

  /**
   * @param data Session id for message history
   */
  getMessages: (data: IGetMessagesThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.MESSAGES, ':sessionId', data.sessionId);
    return axiosInstance.get<IGetMessagesThunkResponse>(url);
  },

  /**
   * @param data Session id and message content
   */
  sendMessage: (data: ISendMessageThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.MESSAGES, ':sessionId', data.sessionId);
    return axiosInstance.post<ISendMessageThunkResponse>(url, { content: data.content });
  },
};
