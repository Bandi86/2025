'use client'

import { useFormStatus } from 'react-dom'
import { registerUser } from '@/lib/actions'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(registerUser, undefined)

  useEffect(() => {
    if (state?.success) {
      // router.push('/login') // Redirect to login page after successful registration
      window.location.href = '/login' // Force a reload
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
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          className="input input-bordered w-full"
          placeholder="name@company.com"
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
      <div>
        <label
          htmlFor="passwordConfirm"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Confirm Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          id="passwordConfirm"
          placeholder="••••••••"
          className="input input-bordered w-full"
          required
        />
      </div>
      <RegisterButton />
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

function RegisterButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary w-full" aria-disabled={pending}>
      {pending ? 'Registering...' : 'Register'}
    </button>
  )
}
