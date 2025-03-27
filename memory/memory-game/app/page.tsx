'use client'
import { useState } from 'react'
import Form from '../components/Form'
import MemoryCard from '../components/MemoryCard'
import axios from 'axios'

export default function Home() {
  const [isGameOn, setIsGameOn] = useState(false)

  // Start GAME
  async function startGame(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const response = await axios.get(
        'https://emojihub.yurace.pro/api/all/category/animals-and-nature'
      )
      if (response.status !== 200) {
        throw new Error('Failed to fetch data from the emoji API')
      } else {
        const data = response.data
        console.log('Fetched data:', data)
        setIsGameOn(true)
      }
    } catch (error: any) {
      if (error.response) {
        console.error('Error fetching data:', error.response.data);
      } else console.error('Error:', error.message)
    }
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

