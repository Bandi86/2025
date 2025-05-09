import { Request, Response, NextFunction } from 'express' // Import Request, Response, NextFunction
import { scanPaths, ScanResult } from '../lib/scan/scanPath'

// Define a custom request type that includes the user property
interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string; email?: string; [key: string]: any } // Adjusted user type to match the middleware definition
}

export const scanHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { paths } = req.body as { paths: string[] } // Type assertion for req.body
  const userId = req.user?.id

  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' })
    return
  }

  if (!Array.isArray(paths) || paths.length === 0) {
    res.status(400).json({ error: 'Kérlek adj meg legalább egy elérési utat a "paths" mezőben.' })
    return
  }

  try {
    console.log(`User ${userId} initiated scan for paths:`, paths)
    const results: ScanResult[] = await scanPaths(paths, userId)
    console.log('Scan complete. Results:', results)
    res.status(200).json({ message: 'Scan completed.', results })
  } catch (error: any) {
    console.error('Error during scan process in controller:', error)
    // Pass error to Express error handling middleware if you have one, or send generic response
    // next(error); // Option 1: Pass to error handler
    res
      .status(500)
      .json({ error: 'An unexpected error occurred during the scan.', details: error.message }) // Option 2: Send generic response
  }
}
