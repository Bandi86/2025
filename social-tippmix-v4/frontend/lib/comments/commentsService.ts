import axiosClient from '@/lib/axios/axios-config-client'

export async function fetchComments(postId: string, page = 1) {
  const response = await axiosClient.get(`/comments/${postId}`, { params: { page } })
  return response.data
}

export async function createComment(postId: string, content: string) {
  const response = await axiosClient.post(`/comments`, { postId, content })
  return response.data
}

export async function updateComment(commentId: string, content: string) {
  const response = await axiosClient.put(`/comments/${commentId}`, { content })
  return response.data
}

export async function deleteComment(commentId: string) {
  await axiosClient.delete(`/comments/${commentId}`)
}

export async function likeComment(commentId: string) {
  const response = await axiosClient.post(`/comments/${commentId}/like`)
  return response.data
}
