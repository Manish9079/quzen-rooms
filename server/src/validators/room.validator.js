import { z } from 'zod';

export const ROOM_CATEGORIES = ['STUDY', 'GAMING', 'ANIME', 'TECHNOLOGY', 'CODING', 'MUSIC', 'CHILL', 'OTHER'];

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required').max(60),
  description: z.string().trim().max(280).optional(),
  category: z.enum(ROOM_CATEGORIES).default('OTHER'),
  isPrivate: z.boolean().default(false),
  password: z.string().min(4).max(64).optional(),
  maxParticipants: z.number().int().min(2).max(200).default(20),
  chatEnabled: z.boolean().default(true),
  videoEnabled: z.boolean().default(true),
  screenShareEnabled: z.boolean().default(true),
}).refine((data) => !data.isPrivate || !!data.password, {
  message: 'Private rooms require a password',
  path: ['password'],
});

export const updateRoomSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  description: z.string().trim().max(280).optional(),
  category: z.enum(ROOM_CATEGORIES).optional(),
  isPrivate: z.boolean().optional(),
  password: z.string().min(4).max(64).optional().nullable(),
  maxParticipants: z.number().int().min(2).max(200).optional(),
  chatEnabled: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  screenShareEnabled: z.boolean().optional(),
  isLocked: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

export const joinRoomSchema = z.object({
  password: z.string().optional(),
});

export const publicRoomsQuerySchema = z.object({
  category: z.enum([...ROOM_CATEGORIES, 'ALL']).optional(),
  search: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
