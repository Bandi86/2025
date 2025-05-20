import { Request, Response, NextFunction } from 'express'
import prisma from '../../lib/client'

// Define a type for the user object if it's not already globally available
interface AuthenticatedUser {
  id: string
  // Add other properties from your JWT payload if needed, e.g., username, role
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthenticatedUser | undefined

  // Clear the session_token cookie
  res.clearCookie('session_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  if (user && user.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: false }
    })
  }

  // Since we are using JWT and not express-session for the primary auth token,
  // req.logout() and req.session.destroy() might not be relevant for the JWT itself,
  // but if you have express-session also configured for other purposes, it might still be useful.
  // For a pure JWT setup, clearing the cookie is the main action.
  req.logout(function (err) {
    if (err) {
      // Log the error but don't let it block the response
      console.error('Error during req.logout:', err)
    }
    // If you use express-session alongside JWT and want to destroy its session:
    // req.session?.destroy((destroyErr) => {
    //   if (destroyErr) {
    //     console.error('Error destroying session:', destroyErr);
    //   }
    // });
    res.json({ message: 'Logged out successfully' })
  })
}
