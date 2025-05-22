import axiosServer from '../axios/axios-config-server'

export async function fetchComments(postId: string): Promise<any[]> {
  try {
    const response = await axiosServer.get(`/post/${postId}/comments`)
    return response.data.comments
  } catch (error) {
    console.error('Error fetching comments:', error)
    throw error
  }
}


