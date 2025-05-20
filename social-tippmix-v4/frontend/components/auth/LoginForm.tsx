'use client'

import { useFormStatus } from 'react-dom'
import { useActionState } from 'react' // Changed import source to 'react'
import { loginUser } from '@/lib/actions'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(loginUser, undefined) // Changed useFormState to useActionState

  useEffect(() => {
    if (state?.success) {
      // router.push('/') // Redirect to home or dashboard
      // For now, we rely on middleware to redirect, or a page refresh
      window.location.href = '/' // Force a reload to ensure middleware and layout re-render
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-4 md:space-y-6">
      <div>
        <label
          htmlFor="username"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Username
        </label>
        <input
          type="text"
          name="username"
          id="username"
          className="input input-bordered w-full"
          placeholder="your_username"
          required
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          className="input input-bordered w-full"
          required
        />
      </div>
      <LoginButton />
      {state?.message && <p className="text-sm font-medium text-red-500">{state.message}</p>}
      {state?.errors && (
        <div className="text-sm text-red-500">
          <ul>
            {Object.entries(state.errors).map(([key, value]) => (
              <li key={key}>{`${key}: ${value}`}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary w-full" aria-disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </button>
  )
}
