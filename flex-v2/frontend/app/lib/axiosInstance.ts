import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000', // Backend API alap URL-je
  withCredentials: true // Cookie-k küldése a kérésekkel (fontos a session kezeléshez)
})

export default apiClient
