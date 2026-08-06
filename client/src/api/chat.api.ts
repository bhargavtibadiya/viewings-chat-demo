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
   * Retrieves or creates the chat session for a property.
   *
   * @param data - Property identifier
   * @returns The API response containing the chat session
   */
  getSession: (data: IGetSessionThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.SESSION_BY_PROPERTY, ':propertyId', data.propertyId);
    return axiosInstance.get<IGetSessionThunkResponse>(url);
  },

  /**
   * Retrieves a page of messages from a chat session.
   *
   * @param data - Session identifier and optional pagination parameters
   * @returns The API response containing messages and pagination metadata
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
   * Sends a user message to a chat session.
   *
   * @param data - Session identifier and message content
   * @returns The API response containing the completed chat turn
   */
  sendMessage: (data: ISendMessageThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.MESSAGES, ':sessionId', data.sessionId);
    return axiosInstance.post<ISendMessageThunkResponse>(url, { content: data.content });
  },

  /**
   * Escalates a question from a chat session to the lister.
   *
   * @param data - Session identifier, question, and optional attributes
   * @returns The API response containing the completed chat turn
   */
  askLister: (data: IAskListerThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.ASK_LISTER, ':sessionId', data.sessionId);
    return axiosInstance.post<IAskListerThunkResponse>(url, {
      questionText: data.questionText,
      canonicalAttributes: data.canonicalAttributes,
    });
  },

  /**
   * Books an availability slot from a chat session.
   *
   * @param data - Session and availability slot identifiers
   * @returns The API response containing the completed chat turn
   */
  bookSlot: (data: IBookSlotThunkPayload) => {
    const url = replaceRouteParam(ROUTES.CHAT.BOOK_SLOT, ':sessionId', data.sessionId);
    return axiosInstance.post<IBookSlotThunkResponse>(url, { slotId: data.slotId });
  },
};
