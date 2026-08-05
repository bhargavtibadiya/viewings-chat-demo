import type {
  ApiSuccessResponse,
  IChatSession,
  IChatMessage,
  IChatTurnResponse,
} from '@/store/types';

export interface IGetSessionThunkPayload {
  propertyId: string;
}

export interface IGetSessionThunkResponseData {
  session: IChatSession;
}

export type IGetSessionThunkResponse = ApiSuccessResponse<IGetSessionThunkResponseData>;

export interface IGetMessagesThunkPayload {
  sessionId: string;
}

export interface IGetMessagesThunkResponseData {
  messages: IChatMessage[];
}

export type IGetMessagesThunkResponse = ApiSuccessResponse<IGetMessagesThunkResponseData>;

export interface ISendMessageThunkPayload {
  sessionId: string;
  content: string;
}

export type ISendMessageThunkResponse = ApiSuccessResponse<IChatTurnResponse>;

export interface ChatSliceInterface {
  getSessionLoading: boolean;
  session: IChatSession | null;
  getMessagesLoading: boolean;
  hasRequestedMessages: boolean;
  messages: IChatMessage[];
  sendMessageLoading: boolean;
  lastTurn: IChatTurnResponse | null;
  showDebugStrip: boolean;
}
