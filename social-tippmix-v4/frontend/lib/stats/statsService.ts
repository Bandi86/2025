import axiosServer from '../axios/axios-config-server'

export async function fetchAggregatedStats() {
  try {
    const res = await axiosServer.get('/stat/aggregated')
    // The API returns data in a nested structure: { success: true, data: {...} }
    return res.data.data
  } catch (error) {
    console.error('Error fetching aggregated stats:', error)
    return {
      totalPosts: 0,
      totalUsers: 0,
      totalLikes: 0,
      totalComments: 0,
      totalTags: 0,
      topUsers: [],
      topPosts: [],
      topCommentPosts: []
    }
  }
}
