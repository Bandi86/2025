'use client'
import React, { useEffect } from 'react'
import { TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FileText, MessageCircle, ThumbsUp, Users, UserPlus, Repeat } from 'lucide-react'
import { usePostsStore } from '@/store/postsStore'
import { useCommentsStore } from '@/store/commentsStore'
import { useLikesStore } from '@/store/likesStore'
import { useFollowsStore } from '@/store/followsStore'
import { useSessionsStore } from '@/store/sessionsStore'

interface UserStatsProps {
  userId: string
}

type StatConfig = {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  getValue: () => number | undefined
}

export default function UserStats({ userId }: UserStatsProps) {
  const postsStore = usePostsStore()
  const commentsStore = useCommentsStore()
  const likesStore = useLikesStore()
  const followsStore = useFollowsStore()
  const sessionsStore = useSessionsStore()

  console.log('UserStats', { userId })
  console.log('postsStore', postsStore)
  console.log('commentsStore', commentsStore)
  console.log('likesStore', likesStore)
  console.log('followsStore', followsStore)
  console.log('sessionsStore', sessionsStore)
 

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        postsStore.fetchPosts(), // Add proper filter for user's posts
        commentsStore.fetchComments(userId),
        likesStore.getUserLikes(userId),
        followsStore.fetchFollowers(userId),
        followsStore.fetchFollowing(userId),
        sessionsStore.fetchSessions()
      ])
    }
    fetchData()
  }, [userId])

  const statConfig: StatConfig[] = [
    {
      key: 'posts',
      label: 'Posztok',
      description: 'A felhasználó által írt posztok száma',
      icon: <FileText className="w-5 h-5" />,
      getValue: () => postsStore.posts.filter((post) => post.author?.id === userId).length
    },
    {
      key: 'comments',
      label: 'Kommentek',
      description: 'A felhasználó által írt kommentek száma',
      icon: <MessageCircle className="w-5 h-5" />,
      getValue: () => commentsStore.totalComments
    },
    {
      key: 'likes',
      label: 'Lájkok',
      description: 'A felhasználó által adott lájkok száma',
      icon: <ThumbsUp className="w-5 h-5" />,
      getValue: () => likesStore.likes.length
    },
    {
      key: 'followers',
      label: 'Követők',
      description: 'A felhasználót követő személyek száma',
      icon: <Users className="w-5 h-5" />,
      getValue: () => followsStore.counts.followers
    },
    {
      key: 'following',
      label: 'Követések',
      description: 'A felhasználó által követett személyek száma',
      icon: <UserPlus className="w-5 h-5" />,
      getValue: () => followsStore.counts.following
    },
    {
      key: 'sessions',
      label: 'Munkamenetek',
      description: 'Aktív munkamenetek száma',
      icon: <Repeat className="w-5 h-5" />,
      getValue: () => sessionsStore.sessions.filter((s) => s.isActive).length
    }
  ]

  const loading =
    postsStore.loading ||
    commentsStore.loading ||
    likesStore.loading ||
    followsStore.loading ||
    sessionsStore.loading

  return (
    <TooltipProvider>
      <div className="stats stats-vertical md:stats-horizontal bg-base-200 shadow-lg mb-8">
        {statConfig.map(({ key, label, icon, description, getValue }) => (
          <TooltipTrigger key={key} tooltip={description}>
            <div className="stat flex flex-col items-center cursor-help">
              <div className="stat-title flex items-center gap-2 text-base-content/70">
                {icon}
                <span>{label}</span>
              </div>
              <div className="stat-value text-2xl font-bold mt-2">
                {loading ? (
                  <span className="loading loading-spinner loading-md" />
                ) : getValue() !== undefined ? (
                  getValue()
                ) : (
                  <span className="text-base-content/40">-</span>
                )}
              </div>
            </div>
          </TooltipTrigger>
        ))}
      </div>
    </TooltipProvider>
  )
}
