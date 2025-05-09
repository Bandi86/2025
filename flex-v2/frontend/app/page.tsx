'use client'
import WelcomeBox from '@/components/home/WelcomeBox'
import { useUser } from '@/app/UserContext'

export default function Home() {
  const { user } = useUser()

  if (user) {
    return <h1>Üdvözlünk a Flex-ben! {user.username}</h1>
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <WelcomeBox />
    </div>
  )
}
