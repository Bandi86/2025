import axiosClient from '@/lib/axios/axios-config-client'

export async function fetchFollowers(userId: string) {
  const response = await axiosClient.get(`/users/${userId}/followers`)
  return response.data
}

export async function fetchFollowing(userId: string) {
  const response = await axiosClient.get(`/users/${userId}/following`)
  return response.data
}

export async function toggleFollow(userId: string) {
  const response = await axiosClient.post(`/users/${userId}/follow`)
  return response.data
}

export async function checkFollowStatus(userId: string) {
  const response = await axiosClient.get(`/users/${userId}/follow-status`)
  return response.data
}
