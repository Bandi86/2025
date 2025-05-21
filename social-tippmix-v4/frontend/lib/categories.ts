import axios from './axios/axios-config-client'

export async function fetchCategories(): Promise<string[]> {
  const res = await axios.get('/post-categories')
  return res.data.postCategories
}
