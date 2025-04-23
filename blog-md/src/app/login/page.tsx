"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    if (res?.error) setError(res.error)
    else router.push("/")
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs p-8 bg-white rounded shadow">
        <h2 className="mb-4 text-xl font-bold">Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2 w-full p-2 border rounded"
          required
        />
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded">
          Login
        </button>
      </form>
    </main>
  )
}
