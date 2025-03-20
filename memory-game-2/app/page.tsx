'use client'
import { User } from "@/types/user"
import axios from "axios"
import { useEffect, useState } from "react";

export default function Home() {

  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/user')
        console.log(response.data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchUsers()
  }, [])


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      test api call
      {users.map((user) => (
        <div key={user.id}>
          <h2>{user.username}</h2>
          <p>{user.email}</p>
        </div>
      ))}
    </main>
  );
}
