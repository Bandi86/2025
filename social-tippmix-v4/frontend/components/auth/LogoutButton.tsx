import axiosServer from '@/lib/axios/axios-config-server'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function logout() {
    try {
      const res = await axiosServer.post('/user/logout')
      if (res.status === 200) {
        // Handle successful logout
        router.push('/')
      }
    } catch (error) {
      // Handle error
    }
  }

  return (
    <button className="btn btn-error btn-sm" onClick={logout} type="button">
      Kijelentkezés
    </button>
  )
}
