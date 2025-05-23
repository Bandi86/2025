import axiosServer from '../axios/axios-config-server'

interface UserActivityData {
  postsLastWeek: number
  commentsLastWeek: number
  likesLastWeek: number
  avgPostsPerMonth: number
  engagementRate: number
  responseRate: number
  likesPerPost: number
  commentsPerPost: number
  postsPerWeek: number
}

export interface UserBadge {
  label: string
  color: string
  description: string
  icon?: string
}

export interface UserInteraction {
  id: string
  displayName: string
  avatar?: string
  interactionType: 'follower' | 'following' | 'commenter' | 'liker'
  count?: number
}

export interface UserInteractionData {
  topFollowers: UserInteraction[]
  topFollowing: UserInteraction[]
  topCommenters: UserInteraction[]
  topLikers: UserInteraction[]
}

export async function fetchUserActivity(userId: string): Promise<UserActivityData> {
  try {
    // In a real implementation, this would call an API endpoint that returns user activity metrics
    // const res = await axiosServer.get(`/user/${userId}/activity`)
    // return res.data

    // For now, we'll return mock data for demonstration
    return {
      postsLastWeek: 3,
      commentsLastWeek: 5,
      likesLastWeek: 12,
      avgPostsPerMonth: 2.5,
      engagementRate: 8.7,
      responseRate: 65,
      likesPerPost: 4.2,
      commentsPerPost: 2.1,
      postsPerWeek: 1.5
    }
  } catch (error) {
    console.error('Error fetching user activity data:', error)
    return {
      postsLastWeek: 0,
      commentsLastWeek: 0,
      likesLastWeek: 0,
      avgPostsPerMonth: 0,
      engagementRate: 0,
      responseRate: 0,
      likesPerPost: 0,
      commentsPerPost: 0,
      postsPerWeek: 0
    }
  }
}

export async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
  try {
    // In a real implementation, this would call an API endpoint
    // const res = await axiosServer.get(`/user/${userId}/badges`)
    // return res.data

    // Mock data for demonstration
    return [
      {
        label: 'Új Felhasználó',
        color: 'info',
        description: 'Az elmúlt 30 napban regisztrált',
        icon: '🔰'
      },
      {
        label: 'Aktív Kommentelő',
        color: 'success',
        description: '10+ komment az elmúlt hónapban',
        icon: '💬'
      },
      {
        label: 'Minőségi Tartalom',
        color: 'primary',
        description: 'Legalább 5 poszt 10+ like-kal',
        icon: '🌟'
      }
    ]
  } catch (error) {
    console.error('Error fetching user badges:', error)
    return []
  }
}

export async function fetchUserInteractions(userId: string): Promise<UserInteractionData> {
  try {
    // In a real implementation, this would call an API endpoint
    // const res = await axiosServer.get(`/user/${userId}/interactions`)
    // return res.data

    // Mock data for demonstration
    return {
      topFollowers: [
        {
          id: '1',
          displayName: 'János Kovács',
          avatar: 'https://picsum.photos/id/64/200/200',
          interactionType: 'follower',
          count: 8
        },
        {
          id: '2',
          displayName: 'Éva Nagy',
          avatar: 'https://picsum.photos/id/65/200/200',
          interactionType: 'follower',
          count: 5
        }
      ],
      topFollowing: [
        {
          id: '3',
          displayName: 'Péter Szabó',
          avatar: 'https://picsum.photos/id/66/200/200',
          interactionType: 'following',
          count: 12
        },
        {
          id: '4',
          displayName: 'Anna Kiss',
          avatar: 'https://picsum.photos/id/67/200/200',
          interactionType: 'following',
          count: 7
        }
      ],
      topCommenters: [
        {
          id: '5',
          displayName: 'Gábor Tóth',
          avatar: 'https://picsum.photos/id/68/200/200',
          interactionType: 'commenter',
          count: 15
        },
        {
          id: '6',
          displayName: 'Katalin Varga',
          avatar: 'https://picsum.photos/id/69/200/200',
          interactionType: 'commenter',
          count: 9
        }
      ],
      topLikers: [
        {
          id: '7',
          displayName: 'Zsolt Molnár',
          avatar: 'https://picsum.photos/id/70/200/200',
          interactionType: 'liker',
          count: 20
        },
        {
          id: '8',
          displayName: 'Eszter Fekete',
          avatar: 'https://picsum.photos/id/71/200/200',
          interactionType: 'liker',
          count: 14
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching user interactions:', error)
    return {
      topFollowers: [],
      topFollowing: [],
      topCommenters: [],
      topLikers: []
    }
  }
}

// This function could be implemented in the future to calculate realistic user metrics
// based on their posts, comments, and likes history
export function calculateUserMetrics(posts: any[], comments: any[], likes: any[]) {
  // Example implementation:
  const totalPosts = posts.length
  const totalComments = comments.length
  const totalLikes = likes.length

  // Calculate likes per post
  const likesPerPost = totalPosts > 0 ? totalLikes / totalPosts : 0

  // Calculate comments per post
  const commentsPerPost = totalPosts > 0 ? totalComments / totalPosts : 0

  // Calculate average posts per month
  // This would require posts to have timestamps to group by month

  // Calculate engagement rate
  // Typically (likes + comments) / followers * 100

  return {
    likesPerPost,
    commentsPerPost
    // Other metrics
  }
}
