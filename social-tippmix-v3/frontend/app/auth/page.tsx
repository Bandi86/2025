'use client'
import React from 'react'
import AuthForm from '../../components/user/AuthForm'
import { useSearchParams } from 'next/navigation'

const page = () => {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  return <AuthForm mode={mode} />
}

export default page
