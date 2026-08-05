import type { ApiSuccessResponse, IListerQuestion } from '@/store/types';

export interface IGetQuestionsThunkResponseData {
  questions: IListerQuestion[];
}

export type IGetQuestionsThunkResponse = ApiSuccessResponse<IGetQuestionsThunkResponseData>;

export interface IAnswerQuestionThunkPayload {
  questionId: string;
  answerText: string;
}

export interface IAnswerQuestionThunkResponseData {
  question: IListerQuestion;
}

export type IAnswerQuestionThunkResponse = ApiSuccessResponse<IAnswerQuestionThunkResponseData>;

export interface ListerSliceInterface {
  getQuestionsLoading: boolean;
  hasRequestedQuestions: boolean;
  questions: IListerQuestion[];
  answerQuestionLoading: boolean;
}
