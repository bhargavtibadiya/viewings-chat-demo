import { z } from 'zod';

export const AnswerQuestionDto = z.object({
  answerText: z.string().min(1, 'Answer text is required').max(5000),
  canonicalAttributes: z.array(z.string().min(1)).optional(),
});

export type AnswerQuestionDtoType = z.infer<typeof AnswerQuestionDto>;

export interface CreateQuestionInput {
  propertyId: string;
  sessionId?: string;
  userId?: string;
  questionText: string;
  resolvedIntent?: string;
  canonicalAttributes?: string[];
}
