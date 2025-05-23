import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'
import { DatabaseError } from '../../lib/error'
import { logInfo, logError } from '../../lib/logger'

// Aggregált statisztikák: top users, top posts by likes, top posts by comments
export async function getAggregatedStats(req: Request, res: Response, next: NextFunction) {
  try {
    // Top 5 users by post count
    const topUsers = await prisma.user.findMany({
      take: 5,
      orderBy: [{ posts: { _count: 'desc' } }],
      select: {
        id: true,
        username: true,
        email: true,
        posts: { select: { id: true } }
      }
    })
    const topUsersWithCount = topUsers.map((u) => ({
      id: u.id,
      displayName: u.username || u.email || 'Ismeretlen',
      postCount: u.posts.length
    }))

    // Top 5 posts by like count
    const topPosts = await prisma.post.findMany({
      take: 5,
      orderBy: [{ likes: { _count: 'desc' } }],
      select: {
        id: true,
        title: true,
        _count: { select: { likes: true } }
      }
    })
    const topPostsWithCount = topPosts.map((p) => ({
      id: p.id,
      title: p.title,
      likeCount: p._count.likes
    }))

    // Top 5 posts by comment count
    const topCommentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: [{ comments: { _count: 'desc' } }],
      select: {
        id: true,
        title: true,
        _count: { select: { comments: true } }
      }
    })
    const topCommentPostsWithCount = topCommentPosts.map((p) => ({
      id: p.id,
      title: p.title,
      commentCount: p._count.comments
    }))

    // Összes poszt és felhasználó szám
    const totalPosts = await prisma.post.count()
    const totalUsers = await prisma.user.count()
    const totalLikes = await prisma.like.count()
    const totalComments = await prisma.comment.count()
    const totalTags = await prisma.tag.count()

    logInfo('Aggregated stats retrieved', {
      totalUsers,
      totalPosts,
      totalLikes,
      totalComments,
      totalTags,
      topUsersCount: topUsersWithCount.length,
      topPostsCount: topPostsWithCount.length,
      topCommentPostsCount: topCommentPostsWithCount.length
    })

    res.json({
      success: true,
      data: {
        topUsers: topUsersWithCount,
        topPosts: topPostsWithCount,
        topCommentPosts: topCommentPostsWithCount,
        totalPosts,
        totalUsers,
        totalLikes,
        totalComments,
        totalTags
      }
    })
  } catch (error) {
    const dbError = new DatabaseError('Failed to retrieve aggregated statistics', 'query', {
      error: (error as Error).message
    })
    next(dbError)
  }
}
