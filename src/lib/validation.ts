import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(60).optional(),
});

export const subscribeSchema = z.object({
  channelId: z.string().cuid(),
});

export const likeSchema = z.object({
  type: z.enum(['LIKE', 'DISLIKE']),
});

export const commentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  parentId: z.string().cuid().optional(),
});

export const videoUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(5000).nullable().optional(),
  tags: z.string().max(500).nullable().optional(),
}).refine((val) => val.title !== undefined || val.description !== undefined || val.tags !== undefined, {
  message: 'At least one field must be provided',
});

export const viewSchema = z.object({
  positionSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
});
