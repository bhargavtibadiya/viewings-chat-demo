import type {
  ApiSuccessResponse,
  IChatSession,
  IChatMessage,
  IChatTurnResponse,
} from '@/store/types';

export const PENDING_USER_MESSAGE_ID_PREFIX = 'pending-user-';
export const CHAT_MESSAGES_FETCH_INITIAL_KEY = 'initial';
export const CHAT_MESSAGES_DEFAULT_LIMIT = 20;

export interface IChatMessagesPagination {
  limit: number;
  total: number;
  hasMoreOlder: boolean;
  oldestMessageId: string | null;
  newestMessageId: string | null;
}

export interface ISessionMessagesCache {
  messages: IChatMessage[];
  pagination: IChatMessagesPagination | null;
  fetchedKeys: string[];
}

/**
 * Builds the cache key for an initial or historical messages request.
 *
 * @param before - Optional cursor identifying the message before the requested page
 * @returns A stable key for the request's cache entry
 */
export function getMessagesFetchKey(before?: string): string {
  return before ? `before:${before}` : CHAT_MESSAGES_FETCH_INITIAL_KEY;
}

export interface IGetSessionThunkPayload {
  propertyId: string;
}

export interface IGetSessionThunkResponseData {
  session: IChatSession;
}

export type IGetSessionThunkResponse = ApiSuccessResponse<IGetSessionThunkResponseData>;

export interface IGetMessagesThunkPayload {
  sessionId: string;
  before?: string;
  limit?: number;
  skipCache?: boolean;
}

export interface IGetMessagesThunkResponseData {
  messages: IChatMessage[];
  pagination: IChatMessagesPagination;
}

export type IGetMessagesThunkResponse = ApiSuccessResponse<IGetMessagesThunkResponseData>;

export interface ISendMessageThunkPayload {
  sessionId: string;
  content: string;
}

export interface IAskListerThunkPayload {
  sessionId: string;
  questionText: string;
  canonicalAttributes?: string[];
}

export interface IBookSlotThunkPayload {
  sessionId: string;
  slotId: string;
  label?: string;
}

export type ISendMessageThunkResponse = ApiSuccessResponse<IChatTurnResponse>;
export type IAskListerThunkResponse = ApiSuccessResponse<IChatTurnResponse>;
export type IBookSlotThunkResponse = ApiSuccessResponse<IChatTurnResponse>;

export interface ChatSliceInterface {
  getSessionLoading: boolean;
  hasRequestedSession: boolean;
  session: IChatSession | null;
  getSessionError: string | null;
  getMessagesLoading: boolean;
  getOlderMessagesLoading: boolean;
  hasRequestedMessages: boolean;
  messages: IChatMessage[];
  messagesPagination: IChatMessagesPagination | null;
  getMessagesError: string | null;
  sessionMessagesCache: Record<string, ISessionMessagesCache>;
  sendMessageLoading: boolean;
  sendMessageError: string | null;
  askListerLoading: boolean;
  askListerError: string | null;
  bookSlotLoading: boolean;
  bookSlotId: string | null;
  bookSlotError: string | null;
  lastTurn: IChatTurnResponse | null;
  showDebugStrip: boolean;
}
