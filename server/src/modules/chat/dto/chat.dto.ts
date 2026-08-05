import { z } from 'zod';

export const PostMessageDto = z.object({
  content: z.string().min(1, 'Message content is required').max(4000),
});

export type PostMessageDtoType = z.infer<typeof PostMessageDto>;
