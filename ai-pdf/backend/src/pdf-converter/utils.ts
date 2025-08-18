/**
 * Utility functions for PDF to JSON converter
 * Common helper functions used across the application
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ProcessingMetrics, ErrorCode, ConversionResult } from './types';

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file is a PDF based on extension
 */
export function isPDFFile(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.pdf';
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Get all PDF files in a directory
 */
export async function getPDFFiles(directoryPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(directoryPath);
    return files
      .filter(file => isPDFFile(file))
      .map(file => path.join(directoryPath, file));
  } catch (error) {
    throw new Error(`Failed to read directory ${directoryPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a unique ID for matches or operations
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Format timestamp for filenames (YYYY-MM-DD_HH-mm-ss)
 */
export function formatTimestampForFilename(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-')
    .substring(0, 19);
}

/**
 * Chunk text into smaller pieces for processing
 */
export function chunkText(text: string, chunkSize: number, overlap: number = 200): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);
    chunks.push(chunk);
    
    // Move start position, accounting for overlap
    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Clean and normalize text content
 */
export function cleanText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim();
}

/**
 * Validate JSON string
 */
export function isValidJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJSONParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Calculate processing metrics from results
 */
export function calculateMetrics(results: ConversionResult[]): ProcessingMetrics {
  const totalProcessed = results.length;
  const successCount = results.filter(r => r.success).length;
  const successRate = totalProcessed > 0 ? (successCount / totalProcessed) * 100 : 0;

  // Count errors by type
  const errorCounts: Record<ErrorCode, number> = {} as Record<ErrorCode, number>;
  
  results.forEach(result => {
    if (!result.success && result.error) {
      const code = result.error.code;
      errorCounts[code] = (errorCounts[code] || 0) + 1;
    }
  });

  // Calculate average processing time (if available in metadata)
  const processingTimes = results
    .filter(r => r.success && r.data?.metadata.processingTimeMs)
    .map(r => r.data!.metadata.processingTimeMs);
  
  const averageProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
    : 0;

  return {
    totalProcessed,
    successRate,
    averageProcessingTime,
    errorCounts
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const startTime = Date.now();
  const result = await operation();
  const timeMs = Date.now() - startTime;
  
  return { result, timeMs };
}

/**
 * Create a timeout promise that rejects after specified time
 */
export function createTimeout(ms: number, message: string = 'Operation timed out'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Race a promise against a timeout
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    createTimeout(timeoutMs)
  ]);
}

/**
 * Sanitize filename for safe file system operations
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}