import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// User schemas
export const registerUserSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const loginUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Post schemas
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be at most 10000 characters'),
  category: z.enum(['HIR', 'TIPP', 'ELEMZES', 'EGYEB'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  imageUrl: z.string().url('Invalid image URL').optional(),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').optional(),
});

export const updatePostSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be at most 255 characters')
      .optional(),
    content: z
      .string()
      .min(10, 'Content must be at least 10 characters')
      .max(10000, 'Content must be at most 10000 characters')
      .optional(),
    category: z
      .enum(['HIR', 'TIPP', 'ELEMZES', 'EGYEB'], {
        errorMap: () => ({ message: 'Invalid category' }),
      })
      .optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const postQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(100).optional(),
  category: z.enum(['HIR', 'TIPP', 'ELEMZES', 'EGYEB']).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'title', 'likes']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  authorId: z.string().optional(),
  tag: z.string().max(50).optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be at most 1000 characters'),
  postId: z.string().min(1, 'Post ID is required'),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be at most 1000 characters'),
});

// Like schemas
export const likeSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().min(1, 'Target ID is required'),
});

// Search schemas
export const searchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be at most 100 characters'),
  type: z.enum(['posts', 'users', 'comments', 'all']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  mimetype: z
    .string()
    .refine(
      (mimetype) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimetype),
      'Only JPEG, PNG, WebP, and GIF images are allowed'
    ),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
});

// Admin schemas
export const adminUserQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(100).optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'username', 'email']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// Export types
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type LikeInput = z.infer<typeof likeSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
