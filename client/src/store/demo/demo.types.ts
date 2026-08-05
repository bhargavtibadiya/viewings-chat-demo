import type { ApiSuccessResponse, ITurnLog } from '@/store/types';

export interface IGetTurnLogsThunkPayload {
  sessionId: string;
}

export interface IGetTurnLogsThunkResponseData {
  turns: ITurnLog[];
}

export type IGetTurnLogsThunkResponse = ApiSuccessResponse<IGetTurnLogsThunkResponseData>;

export interface DemoSliceInterface {
  getTurnLogsLoading: boolean;
  turnLogs: ITurnLog[];
  activeSessionId: string | null;
}
