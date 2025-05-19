'use client'
import AuthForm from '@/components/auth/AuthForm'
import { useSearchParams } from 'next/navigation'
import React from 'react'

const page = () => {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') as 'login' | 'register'
  return (
    <div>
      <h1>Authentication</h1>
      <AuthForm mode={mode} />
    </div>
  )
}

export default page
