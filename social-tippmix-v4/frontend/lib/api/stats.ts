import axiosServer from '../axios/axios-config-server'

export async function fetchAggregatedStats() {
  const res = await axiosServer.get('/stat/aggregated')
  return res.data
}
