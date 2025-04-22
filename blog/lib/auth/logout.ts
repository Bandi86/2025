import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default async function LogoutHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const cookie = serialize('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1, // Expire immediately
      path: '/',
    })

    res.setHeader('Set-Cookie', cookie)
    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Something went wrong' })
  }
}