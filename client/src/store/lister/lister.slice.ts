import { createSlice } from '@reduxjs/toolkit';
import { answerQuestionThunk, getQuestionsThunk } from '@/store/lister/lister.thunk';
import type { ListerSliceInterface } from '@/store/lister/lister.types';

const initialState: ListerSliceInterface = {
  getQuestionsLoading: false,
  hasRequestedQuestions: false,
  questions: [],
  answerQuestionLoading: false,
};

const listerSlice = createSlice({
  name: 'lister',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getQuestionsThunk.pending, (state) => ({
        ...state,
        getQuestionsLoading: true,
        hasRequestedQuestions: true,
      }))
      .addCase(getQuestionsThunk.fulfilled, (state, action) => ({
        ...state,
        getQuestionsLoading: false,
        questions: action.payload.data.questions,
      }))
      .addCase(getQuestionsThunk.rejected, (state) => ({
        ...state,
        getQuestionsLoading: false,
      }))
      .addCase(answerQuestionThunk.pending, (state) => ({
        ...state,
        answerQuestionLoading: true,
      }))
      .addCase(answerQuestionThunk.fulfilled, (state, action) => ({
        ...state,
        answerQuestionLoading: false,
        questions: state.questions.map((question) =>
          question.id === action.payload.data.question.id
            ? action.payload.data.question
            : question,
        ),
      }))
      .addCase(answerQuestionThunk.rejected, (state) => ({
        ...state,
        answerQuestionLoading: false,
      }));
  },
});

export default listerSlice.reducer;
