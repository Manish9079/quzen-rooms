import { z } from 'zod';

export const messagesQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000),
});
