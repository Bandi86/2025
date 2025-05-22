import { Router } from 'express';
import { testErrorHandling } from '../controllers/test/errorTest';
import asyncHandler from '../lib/asyncHandler';

const router = Router();

// Csak development környezetben elérhetőek a teszt végpontok
if (process.env.NODE_ENV !== 'production') {
  // Sikeres válasz
  router.get('/success', asyncHandler(testErrorHandling.testSuccess));

  // Validációs hiba
  router.post('/validation-error', asyncHandler(testErrorHandling.testValidationError));

  // Not Found hiba
  router.get('/not-found-error/:id?', asyncHandler(testErrorHandling.testNotFoundError));

  // Unauthorized hiba
  router.get('/unauthorized-error', asyncHandler(testErrorHandling.testUnauthorizedError));

  // Forbidden hiba
  router.get('/forbidden-error', asyncHandler(testErrorHandling.testForbiddenError));

  // Conflict hiba
  router.get('/conflict-error', asyncHandler(testErrorHandling.testConflictError));

  // Database hiba
  router.get('/database-error', asyncHandler(testErrorHandling.testDatabaseError));

  // Rate Limit hiba
  router.get('/rate-limit-error', asyncHandler(testErrorHandling.testRateLimitError));

  // File Upload hiba
  router.get('/file-upload-error', asyncHandler(testErrorHandling.testFileUploadError));

  // Egyedi API hiba
  router.get('/custom-error', asyncHandler(testErrorHandling.testCustomError));

  // Belső szerver hiba
  router.get('/internal-server-error', asyncHandler(testErrorHandling.testInternalServerError));
}

export default router;
