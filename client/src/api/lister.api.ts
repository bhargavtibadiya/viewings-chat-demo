import { axiosInstance } from '@/utils/api/axiosInstance';
import { replaceRouteParam, ROUTES } from '@/utils/helpers/routes';
import type {
  IGetQuestionsThunkResponse,
  IAnswerQuestionThunkPayload,
  IAnswerQuestionThunkResponse,
} from '@/store/lister/lister.types';

export const listerService = {
  /**
   * Retrieves questions awaiting or completed by the lister.
   *
   * @returns The API response containing lister questions
   */
  getQuestions: () => axiosInstance.get<IGetQuestionsThunkResponse>(ROUTES.LISTER.QUESTIONS),

  /**
   * Records a lister's answer to an escalated question.
   *
   * @param data - Question identifier and answer text
   * @returns The API response containing the updated question
   */
  answerQuestion: (data: IAnswerQuestionThunkPayload) => {
    const url = replaceRouteParam(ROUTES.LISTER.ANSWER, ':id', data.questionId);
    return axiosInstance.post<IAnswerQuestionThunkResponse>(url, { answerText: data.answerText });
  },
};
