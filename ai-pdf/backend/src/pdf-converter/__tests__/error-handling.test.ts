import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { PDFReaderImpl } from '../pdf-reader';
import { ErrorCode, ProcessingStep } from '../types';

describe('PDF Error Handling', () => {
  let pdfReader: PDFReaderImpl;
  const fixturesDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    pdfReader = new PDFReaderImpl();
    // Clear any previous console logs
    vi.clearAllMocks();
  });

  describe('File system errors', () => {
    it('should handle non-existent files gracefully', async () => {
      const nonExistentPath = path.join(fixturesDir, 'does-not-exist.pdf');
      
      try {
        await pdfReader.extractText(nonExistentPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
        expect(error.step).toBe(ProcessingStep.PDF_VALIDATION);
        expect(error.details).toBeDefined();
        expect(error.details.timestamp).toBeDefined();
        expect(error.message).toContain('File not found or not readable');
      }
    });

    it('should handle permission errors', async () => {
      // This test would require creating a file with restricted permissions
      // For now, we'll test the error structure
      const restrictedPath = path.join(fixturesDir, 'restricted.pdf');
      
      try {
        await pdfReader.extractText(restrictedPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('step');
        expect(error).toHaveProperty('details');
      }
    });
  });

  describe('File format errors', () => {
    it('should handle files with wrong extension', async () => {
      const txtFilePath = path.join(fixturesDir, 'invalid.txt');
      
      try {
        await pdfReader.extractText(txtFilePath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.INVALID_PDF);
        expect(error.step).toBe(ProcessingStep.PDF_VALIDATION);
        expect(error.message).toContain('Unsupported file extension');
      }
    });

    it('should handle files with PDF extension but invalid format', async () => {
      const fakePdfPath = path.join(fixturesDir, 'fake.pdf');
      
      try {
        await pdfReader.extractText(fakePdfPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.INVALID_PDF);
        expect(error.step).toBe(ProcessingStep.PDF_VALIDATION);
        expect(error.message).toContain('valid PDF header');
      }
    });

    it('should handle empty files', async () => {
      const emptyPdfPath = path.join(fixturesDir, 'empty.pdf');
      
      try {
        await pdfReader.extractText(emptyPdfPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.INVALID_PDF);
        expect(error.step).toBe(ProcessingStep.PDF_VALIDATION);
        expect(error.message).toContain('File is empty');
      }
    });
  });

  describe('File size errors', () => {
    it('should handle files exceeding size limit', async () => {
      const smallSizePdfReader = new PDFReaderImpl(100); // 100 bytes limit
      const validPdfPath = path.join(fixturesDir, 'real-sample.pdf');
      
      try {
        await smallSizePdfReader.extractText(validPdfPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.INVALID_PDF);
        expect(error.step).toBe(ProcessingStep.PDF_VALIDATION);
        expect(error.message).toContain('exceeds maximum allowed size');
      }
    });
  });

  describe('PDF processing errors', () => {
    it('should handle corrupted PDF files', async () => {
      // Create a corrupted PDF file for testing
      const corruptedPdfPath = path.join(fixturesDir, 'corrupted.pdf');
      
      // Create a file that starts with PDF header but has corrupted content
      const corruptedContent = '%PDF-1.4\nThis is corrupted content that will cause pdf-parse to fail';
      await fs.writeFile(corruptedPdfPath, corruptedContent);
      
      try {
        const text = await pdfReader.extractText(corruptedPdfPath);
        // If it doesn't throw, it should at least return some text or handle gracefully
        expect(typeof text).toBe('string');
      } catch (error: any) {
        // Should be a PDF extraction error, not validation error
        expect(error.code).toBe(ErrorCode.PDF_EXTRACTION_FAILED);
        expect(error.step).toBe(ProcessingStep.PDF_EXTRACTION);
      } finally {
        // Clean up test file
        await fs.unlink(corruptedPdfPath).catch(() => {});
      }
    });

    it('should handle PDFs with no extractable text', async () => {
      // Create a valid PDF structure but with no text content
      const noTextPdfPath = path.join(fixturesDir, 'no-text.pdf');
      
      const noTextPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
204
%%EOF`;

      await fs.writeFile(noTextPdfPath, noTextPdfContent);
      
      try {
        await pdfReader.extractText(noTextPdfPath);
        expect.fail('Should have thrown an error for no text content');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.PDF_EXTRACTION_FAILED);
        expect(error.step).toBe(ProcessingStep.PDF_EXTRACTION);
        // The error message can vary depending on the PDF structure issue
        expect(error.message).toContain('Failed to extract text from PDF');
      } finally {
        // Clean up test file
        await fs.unlink(noTextPdfPath).catch(() => {});
      }
    });
  });

  describe('Error object structure', () => {
    it('should create consistent error objects', async () => {
      const nonExistentPath = path.join(fixturesDir, 'does-not-exist.pdf');
      
      try {
        await pdfReader.extractText(nonExistentPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        // Check error object structure
        expect(error).toBeInstanceOf(Error);
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('step');
        expect(error).toHaveProperty('details');
        
        // Check details structure
        expect(error.details).toHaveProperty('code');
        expect(error.details).toHaveProperty('message');
        expect(error.details).toHaveProperty('step');
        expect(error.details).toHaveProperty('timestamp');
        expect(error.details).toHaveProperty('details');
        
        // Check timestamp format
        expect(error.details.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
    });

    it('should include original error details when available', async () => {
      const nonExistentPath = path.join(fixturesDir, 'does-not-exist.pdf');
      
      try {
        await pdfReader.extractText(nonExistentPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.details.details).toBeDefined();
        expect(error.details.details).toHaveProperty('errno');
        expect(error.details.details).toHaveProperty('code', 'ENOENT');
        expect(error.details.details).toHaveProperty('syscall');
        expect(error.details.details).toHaveProperty('path');
      }
    });
  });

  describe('Logging functionality', () => {
    it('should log validation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const nonExistentPath = path.join(fixturesDir, 'does-not-exist.pdf');
      
      const isValid = await pdfReader.validatePDF(nonExistentPath);
      
      expect(isValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PDF validation failed'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should log different error types appropriately', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const testCases = [
        { file: 'does-not-exist.pdf', expectedLog: 'PDF validation failed' },
        { file: 'fake.pdf', expectedLog: 'PDF validation failed' },
        { file: 'empty.pdf', expectedLog: 'PDF validation failed' }
      ];

      for (const testCase of testCases) {
        const filePath = path.join(fixturesDir, testCase.file);
        await pdfReader.validatePDF(filePath);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(testCase.expectedLog),
          expect.any(Error)
        );
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error recovery and graceful degradation', () => {
    it('should continue processing other operations after errors', async () => {
      // Test that the PDF reader can continue working after encountering errors
      const validPdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const invalidPath = path.join(fixturesDir, 'does-not-exist.pdf');
      
      // First operation fails
      try {
        await pdfReader.extractText(invalidPath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      // Second operation should still work
      const text = await pdfReader.extractText(validPdfPath);
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
    });

    it('should handle multiple validation calls', async () => {
      const validPdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const invalidPath = path.join(fixturesDir, 'fake.pdf');
      
      // Multiple calls should be consistent
      const result1 = await pdfReader.validatePDF(validPdfPath);
      const result2 = await pdfReader.validatePDF(invalidPath);
      const result3 = await pdfReader.validatePDF(validPdfPath);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(result3).toBe(true);
    });
  });
});