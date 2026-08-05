import { axiosInstance } from '@/utils/api/axiosInstance';
import { replaceRouteParam, ROUTES } from '@/utils/helpers/routes';
import type {
  IGetSessionThunkPayload,
  IGetSessionThunkResponse,
  IGetMessagesThunkPayload,
  IGetMessagesThunkResponse,
  ISendMessageThunkPayload,
  ISendMessageThunkResponse,
  IAskListerThunkPayload,
  IAskListerThunkResponse,
  IBookSlotThunkPayload,
  IBookSlotThunkResponse,
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
    const params: Record<string, string | number> = {};
    if (data.before) {
      params.before = data.before;
    }
    if (data.limit !== undefined) {
      params.limit = data.limit;
    }
    return axiosInstance.get<IGetMessagesThunkResponse>(url, { params });
  },

  /**
   * @param data Session id and message content
   */
  sendMessage: (data: ISendMessageThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.MESSAGES, ':sessionId', data.sessionId);
    return axiosInstance.post<ISendMessageThunkResponse>(url, { content: data.content });
  },

  /**
   * @param data Session id and question to escalate to the lister
   */
  askLister: (data: IAskListerThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.ASK_LISTER, ':sessionId', data.sessionId);
    return axiosInstance.post<IAskListerThunkResponse>(url, {
      questionText: data.questionText,
      canonicalAttributes: data.canonicalAttributes,
    });
  },

  /**
   * @param data Session id and availability slot to book from chat
   */
  bookSlot: (data: IBookSlotThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.BOOK_SLOT, ':sessionId', data.sessionId);
    return axiosInstance.post<IBookSlotThunkResponse>(url, { slotId: data.slotId });
  },
};
