import { axiosInstance } from '@/utils/api/axiosInstance';
import { replaceRouteParam, ROUTES } from '@/utils/helpers/routes';
import type {
  IGetTurnLogsThunkPayload,
  IGetTurnLogsThunkResponse,
} from '@/store/demo/demo.types';

export const demoService = {
  /**
   * Retrieves debug turn logs for a chat session.
   *
   * @param data - Session identifier
   * @returns The API response containing the session's turn logs
   */
  getTurnLogs: (data: IGetTurnLogsThunkPayload) => {
    const url = replaceRouteParam(ROUTES.DEMO.TURNS, ':sessionId', data.sessionId);
    return axiosInstance.get<IGetTurnLogsThunkResponse>(url);
  },
};
