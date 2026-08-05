import { z } from 'zod';
import { PAGINATION, CHAT_MESSAGES } from '../../../utils/constants/pagination.js';

export const PostMessageDto = z.object({
  content: z.string().min(1, 'Message content is required').max(4000),
});

export const GetMessagesQueryDto = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .optional()
    .default(CHAT_MESSAGES.DEFAULT_LIMIT),
  before: z.string().min(1).optional(),
});

export type PostMessageDtoType = z.infer<typeof PostMessageDto>;
export type GetMessagesQueryDtoType = z.infer<typeof GetMessagesQueryDto>;
