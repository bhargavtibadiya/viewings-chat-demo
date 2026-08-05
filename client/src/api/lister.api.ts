import { axiosInstance } from '@/utils/api/axiosInstance';
import { replaceRouteParam, ROUTES } from '@/utils/helpers/routes';
import type {
  IGetQuestionsThunkResponse,
  IAnswerQuestionThunkPayload,
  IAnswerQuestionThunkResponse,
} from '@/store/lister/lister.types';

export const listerService = {
  getQuestions: () => axiosInstance.get<IGetQuestionsThunkResponse>(ROUTES.LISTER.QUESTIONS),

  answerQuestion: (data: IAnswerQuestionThunkPayload) => {
    const url = replaceRouteParam(ROUTES.LISTER.ANSWER, ':id', data.questionId);
    return axiosInstance.post<IAnswerQuestionThunkResponse>(url, { answerText: data.answerText });
  },
};
