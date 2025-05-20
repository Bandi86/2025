'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import axiosServer from '@/lib/axios/axios-config-server' // Import axiosServer

export interface AuthResponse {
  success: boolean
  message?: string
  user?: {
    id: string
    username: string
    role: string
  }
  errors?: Array<{ field: string; message: string } | string> // For field-specific or general errors
}

export async function loginUser(prevState: any, formData: FormData): Promise<AuthResponse> {
  const username = formData.get('username') as string // Changed from emailOrUsername to username
  const password = formData.get('password') as string

  try {
    const response = await axiosServer.post('/user/login', {
      username: username, // Ensure this matches the backend expectation
      password
    })

    const backendSetCookieHeader = response.headers['set-cookie']
    if (backendSetCookieHeader && Array.isArray(backendSetCookieHeader)) {
      const sessionCookieString = backendSetCookieHeader.find((cookie) =>
        cookie.startsWith('session_token=')
      )
      if (sessionCookieString) {
        const parts = sessionCookieString.split(';')
        const tokenPart = parts[0] // e.g., "session_token=THE_ACTUAL_JWT_VALUE"
        const tokenValue = tokenPart.split('=')[1]

        if (tokenValue) {
          const cookieStore = await cookies()
          cookieStore.set('session_token', tokenValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 1 day in seconds
            path: '/'
          })
        } else {
          // console.error('Next.js: Could not extract token value from backend Set-Cookie header.') // Keep for debugging if needed
        }
      } else {
        // console.log('Next.js: No session_token string found in backend Set-Cookie header array.') // Keep for debugging if needed
      }
    } else {
      // console.log('No Set-Cookie header or not an array received from backend.') // Keep for debugging if needed
    }

    revalidatePath('/', 'layout')
  } catch (error: any) {
    // console.error(
    //   'Login action error:',
    //   error.response
    //     ? {
    //         status: error.response.status,
    //         // headers: error.response.headers, // Can be verbose
    //         data: error.response.data
    //       }
    //     : error.message
    // ) // Keep for debugging if needed
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred during login.'
    return { success: false, message: errorMessage }
  }
  redirect('/')
}

export async function registerUser(prevState: any, formData: FormData): Promise<AuthResponse> {
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' }
  }

  try {
    const response = await axiosServer.post('/user/register', {
      username,
      email,
      password
    })

    const responseData = response.data

    return {
      success: true,
      message: responseData.message || 'Registration successful! Please log in.',
      errors: responseData.errors
    }
  } catch (error: any) {
    // console.error('Register action error:', error) // Keep for debugging if needed
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred during registration.'
    const errors = error.response?.data?.errors || (errorMessage ? [errorMessage] : [])
    return { success: false, message: errorMessage, errors }
  }
}

export async function logoutUser() {
  // The backend /user/logout should clear its session and potentially the JWT cookie if it manages it.
  // Our frontend session_token cookie is managed by the browser based on expiry.
  // To effectively "logout" from the frontend's perspective regarding the JWT,
  // we need to clear the 'session_token' cookie.

  // Call the backend logout endpoint to ensure server-side session is terminated
  try {
    await axiosServer.post('/user/logout', {}, { withCredentials: true })
  } catch (error) {
    // console.error('Error calling backend logout:', error) // Keep for debugging if needed
    // Proceed with frontend logout regardless of backend call success for now
  }

  const cookieStore = await cookies()
  cookieStore.delete('session_token')
  revalidatePath('/', 'layout') // Revalidate all layouts
  redirect('/login') // Redirect to login page
}
