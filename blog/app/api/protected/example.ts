import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '../../../utils/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getCurrentUser(req)
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  return res.status(200).json({ 
    message: 'This is a protected route',
    user: {
      id: user.userId,
      email: user.email
    }
  })
}