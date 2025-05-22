import axiosServer from '../axios/axios-config-server'

// fetch likes on post
export async function fetchLikes(postId: string): Promise<any[]> {
  try {
    const response = await axiosServer.get(`/post/${postId}/likes`)
    return response.data.likes
  } catch (error) {
    console.error('Error fetching likes:', error)
    throw error
  }
}

// fetch like on comment
export async function fetchCommentLikes(commentId: string): Promise<any[]> {
  try {
    const response = await axiosServer.get(`/comment/${commentId}/likes`)
    return response.data.likes
  } catch (error) {
    console.error('Error fetching comment likes:', error)
    throw error
  }
}
