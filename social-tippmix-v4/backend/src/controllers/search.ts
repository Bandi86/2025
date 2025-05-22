import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/client';
import { PostCategory } from '@prisma/client';
import { ValidationError, DatabaseError } from '../lib/error';
import { searchSchema, SearchInput } from '../lib/validation';
import { logInfo, logError } from '../lib/logger';

export async function globalSearch(req: Request, res: Response, next: NextFunction) {
  try {
    // Parse and validate search parameters
    const validation = searchSchema.safeParse({
      query: req.query.q,
      type: req.query.type || 'all',
      page: req.query.page || '1',
      pageSize: req.query.pageSize || '10',
    });

    if (!validation.success) {
      throw ValidationError.fromZod(validation.error, 'Invalid search parameters');
    }

    const { query: q, type, page, pageSize } = validation.data as SearchInput;
    const take = Math.max(1, Math.min(100, parseInt(String(pageSize), 10) || 10));
    const skip = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * take;

    // Extract filters from query params
    const { role, category, authorId } = req.query;

    let results: any[] = [];
    let total = 0;

    try {
      // Search users
      if (type === 'users' || type === 'all') {
        const roleFilter = role
          ? { role: Array.isArray(role) ? String(role[0]) : String(role) }
          : {};

        const [users, usersCount] = await Promise.all([
          prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
              ...roleFilter,
            },
            skip: type === 'all' ? 0 : skip,
            take: type === 'all' ? 5 : take,
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              role: true,
              createdAt: true,
            },
          }),
          prisma.user.count({
            where: {
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
              ...roleFilter,
            },
          }),
        ]);

        if (type === 'users') {
          results = users;
          total = usersCount;
        } else if (type === 'all') {
          results = [...results, { type: 'users', items: users, total: usersCount }];
        }
      }

      // Search posts
      if (type === 'posts' || type === 'all') {
        let categoryValue = category
          ? Array.isArray(category)
            ? String(category[0])
            : String(category)
          : undefined;

        let categoryFilter = {};
        if (categoryValue) {
          // Validate category against PostCategory enum
          if (!Object.values(PostCategory).includes(categoryValue as PostCategory)) {
            throw new ValidationError(`Invalid category: ${categoryValue}`, [
              { field: 'category', message: `Invalid category value: ${categoryValue}` },
            ]);
          }
          categoryFilter = { category: { equals: categoryValue as PostCategory } };
        }

        const [posts, postsCount] = await Promise.all([
          prisma.post.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { content: { contains: q, mode: 'insensitive' } },
              ],
              ...categoryFilter,
            },
            skip: type === 'all' ? 0 : skip,
            take: type === 'all' ? 5 : take,
            include: {
              author: { select: { id: true, username: true, avatar: true } },
              tags: true,
              _count: { select: { likes: true, comments: true } },
            },
          }),
          prisma.post.count({
            where: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { content: { contains: q, mode: 'insensitive' } },
              ],
              ...categoryFilter,
            },
          }),
        ]);

        if (type === 'posts') {
          results = posts;
          total = postsCount;
        } else if (type === 'all') {
          results = [...results, { type: 'posts', items: posts, total: postsCount }];
        }
      }

      // Search comments
      if (type === 'comments' || type === 'all') {
        const authorIdValue = authorId
          ? Array.isArray(authorId)
            ? String(authorId[0])
            : String(authorId)
          : undefined;

        const [comments, commentsCount] = await Promise.all([
          prisma.comment.findMany({
            where: {
              content: { contains: q, mode: 'insensitive' },
              ...(authorIdValue ? { authorId: authorIdValue } : {}),
            },
            skip: type === 'all' ? 0 : skip,
            take: type === 'all' ? 5 : take,
            include: {
              author: { select: { id: true, username: true, avatar: true } },
              post: { select: { id: true, title: true } },
            },
          }),
          prisma.comment.count({
            where: {
              content: { contains: q, mode: 'insensitive' },
              ...(authorIdValue ? { authorId: authorIdValue } : {}),
            },
          }),
        ]);

        if (type === 'comments') {
          results = comments;
          total = commentsCount;
        } else if (type === 'all') {
          results = [...results, { type: 'comments', items: comments, total: commentsCount }];
        }
      }

      // Log search
      logInfo('Search performed', {
        query: q,
        type,
        filters: { role, category, authorId },
        resultsCount:
          type === 'all'
            ? results.reduce((acc, section) => acc + section.items.length, 0)
            : results.length,
        totalCount:
          type === 'all' ? results.reduce((acc, section) => acc + section.total, 0) : total,
      });

      // Return results
      res.json({
        success: true,
        query: q,
        type,
        total: type === 'all' ? null : total,
        page: Number(page),
        pageSize: take,
        results,
      });
    } catch (dbError) {
      throw new DatabaseError('Search operation failed', 'query', {
        error: (dbError as Error).message,
        query: q,
        type,
      });
    }
  } catch (error) {
    next(error);
  }
}
