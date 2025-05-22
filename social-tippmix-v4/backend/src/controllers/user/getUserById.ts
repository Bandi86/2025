import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/client';
import { NotFoundError, ValidationError } from '../../lib/error';
import { logInfo } from '../../lib/logger';

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError('ID parameter is required', [
        { field: 'id', message: 'ID parameter is required' },
      ]);
    }

    // Retrieve user, profile data, and counts of posts, comments, followers, following, notifications
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        profileImage: true,
        bio: true,
        website: true,
        location: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isOnline: true,
        lastLogin: true,
        status: true,
        posts: { select: { id: true } },
        comments: { select: { id: true } },
        followers: { select: { id: true } },
        following: { select: { id: true } },
        notifications: { select: { id: true, isRead: true } },
      },
    });

    if (!user) {
      throw new NotFoundError('User', id);
    }

    // Aggregate counts
    const postCount = user.posts.length;
    const commentCount = user.comments.length;
    const followerCount = user.followers.length;
    const followingCount = user.following.length;
    const notificationCount = user.notifications.length;
    const unreadNotificationCount = user.notifications.filter((n) => !n.isRead).length;

    logInfo('User profile retrieved', {
      userId: id,
      requestedBy: (req.user as any)?.id || 'unauthenticated',
    });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      profileImage: user.profileImage,
      bio: user.bio,
      website: user.website,
      location: user.location,
      birthDate: user.birthDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
      isOnline: user.isOnline,
      lastLogin: user.lastLogin,
      status: user.status,
      postCount,
      commentCount,
      followerCount,
      followingCount,
      notificationCount,
      unreadNotificationCount,
    });
  } catch (error) {
    next(error);
  }
}
