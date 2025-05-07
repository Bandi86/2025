
import * as jwt from 'jsonwebtoken'

// Extend the Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

// Middleware a felhasználó hitelesítésére
export function authenticate(req, res) {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Hozzáférés megtagadva. Token szükséges.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string)
    req.user = decoded
  } catch (error) {
    return res.status(401).json({ message: 'Érvénytelen vagy lejárt token.' })
  }
}
