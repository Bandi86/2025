import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { DatabaseError } from '../../lib/error';
import { logInfo } from '../../lib/logger';
import { PostCategory } from '@prisma/client';

export default async function getAllCategories(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if we only need enum values (e.g., /api/categories?enumsOnly=true)
    if (req.query.enumsOnly === 'true') {
      const categories = Object.values(PostCategory);

      // Get post counts per category if requested
      let categoryCounts = {};

      if (req.query.withCounts === 'true') {
        try {
          // Get post counts for each category
          const counts = await prisma.post.groupBy({
            by: ['category'],
            _count: {
              _all: true,
            },
          });

          // Convert to a more friendly format
          categoryCounts = counts.reduce((acc, curr) => {
            acc[curr.category] = curr._count._all;
            return acc;
          }, {} as Record<string, number>);
        } catch (countError) {
          // Log the error but continue with the main response
          logInfo('Failed to get category counts', {
            error: (countError as Error).message,
          });
        }
      }

      logInfo('Categories retrieved', {
        enumsOnly: true,
        withCounts: req.query.withCounts === 'true',
        categoryCount: categories.length,
      });

      res.json({
        success: true,
        categories,
        ...(req.query.withCounts === 'true' && { counts: categoryCounts }),
      });

      return;
    }

    // If we reach here, the client is asking for a Category table which doesn't exist
    // Return a structured response indicating this
    res.status(400).json({
      success: false,
      message:
        "The Category table doesn't exist, only enum values are available. Use ?enumsOnly=true",
      availableParams: {
        enumsOnly: "Set to 'true' to get PostCategory enum values",
        withCounts: "Set to 'true' to get post counts per category",
      },
    });
  } catch (error) {
    // Handle unexpected errors
    next(
      new DatabaseError('Failed to retrieve categories', 'query', {
        error: (error as Error).message,
      })
    );
  }
}
