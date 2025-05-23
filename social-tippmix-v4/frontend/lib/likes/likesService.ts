import axiosClient from '@/lib/axios/axios-config-client'

export async function fetchLikes(targetId: string, targetType: 'post' | 'comment') {
  const response = await axiosClient.get(`/likes/${targetType}/${targetId}`)
  return response.data
}

export async function toggleLike(targetId: string, targetType: 'post' | 'comment') {
  const response = await axiosClient.post(`/likes/${targetType}/${targetId}`)
  return response.data
}

export async function getUserLikes(userId: string) {
  const response = await axiosClient.get(`/users/${userId}/likes`)
  return response.data
}
