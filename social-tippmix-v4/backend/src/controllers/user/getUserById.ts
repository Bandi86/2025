import { Request, Response } from 'express'
import prisma from '../../lib/client'

export async function getUserById(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'id paraméter kötelező' })
  }

  // Lekérjük a user-t, a profil adatait, és a posztok, kommentek, követők, követettek, értesítések számát
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
      notifications: { select: { id: true, isRead: true } }
    }
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Összesítés
  const postCount = user.posts.length
  const commentCount = user.comments.length
  const followerCount = user.followers.length
  const followingCount = user.following.length
  const notificationCount = user.notifications.length
  const unreadNotificationCount = user.notifications.filter((n) => !n.isRead).length

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
    unreadNotificationCount
  })
}
