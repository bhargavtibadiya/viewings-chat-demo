import { axiosInstance } from '@/utils/api/axiosInstance';
import { replaceRouteParam, ROUTES } from '@/utils/helpers/routes';
import type {
  IGetTurnLogsThunkPayload,
  IGetTurnLogsThunkResponse,
} from '@/store/demo/demo.types';

export const demoService = {
  getTurnLogs: (data: IGetTurnLogsThunkPayload) => {
    const url = replaceRouteParam(ROUTES.DEMO.TURNS, ':sessionId', data.sessionId);
    return axiosInstance.get<IGetTurnLogsThunkResponse>(url);
  },
};
