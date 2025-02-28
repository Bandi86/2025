import { useState } from 'react'
import Form from '../components/Form'
import MemoryCard from '../components/MemoryCard'

export default function Home() {
  const [isGameOn, setIsGameOn] = useState(false)

  function startGame(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsGameOn(true)
  }

  function turnCard() {
    console.log('memory card clicked')
  }

  return (
    <main>
      {!isGameOn && <Form handleSubmit={startGame} />}
      {isGameOn && <MemoryCard handleClick={turnCard} />}
    </main>
  )
}

