'use client'
import { useEffect, useState } from 'react'

interface Book {
  id: string
  title: string
  author: string
}

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  

  useEffect(() => {
    fetch('/api/books')
      .then((res) => res.json())
      .then((data) => setBooks(data))
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Könyvek</h1>
      <ul className="mt-4">
        {books.map((book) => (
          <li key={book.id} className="border p-2 my-2 rounded">
            <h2 className="text-xl font-semibold">{book.title}</h2>
            <p className="text-gray-700">{book.author}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

