import axiosClient from '@/lib/axios/axios-config-client'

export async function fetchSessions() {
  const response = await axiosClient.get('/sessions')
  return response.data
}

export async function fetchCurrentSession() {
  const response = await axiosClient.get('/sessions/current')
  return response.data
}

export async function terminateSession(sessionId: string) {
  await axiosClient.delete(`/sessions/${sessionId}`)
}

export async function terminateAllOtherSessions() {
  await axiosClient.delete('/sessions/others')
}
