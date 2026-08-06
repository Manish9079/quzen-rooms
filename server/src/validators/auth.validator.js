import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(/^[a-z0-9_.]+$/, 'Username can only contain letters, numbers, dots and underscores'),
  displayName: z.string().trim().min(1, 'Display name is required').max(48),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(48).optional(),
  bio: z.string().trim().max(280).optional().nullable(),
  avatar: z.string().trim().url().optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});
