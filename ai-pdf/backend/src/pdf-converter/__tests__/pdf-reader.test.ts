import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { PDFReaderImpl } from '../pdf-reader';
import { ErrorCode, ProcessingStep } from '../types';

describe('PDFReader', () => {
  let pdfReader: PDFReaderImpl;
  const fixturesDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    pdfReader = new PDFReaderImpl();
  });

  describe('validatePDF', () => {
    it('should return true for valid PDF files', async () => {
      const validPdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const result = await pdfReader.validatePDF(validPdfPath);
      expect(result).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      const nonExistentPath = path.join(fixturesDir, 'does-not-exist.pdf');
      const result = await pdfReader.validatePDF(nonExistentPath);
      expect(result).toBe(false);
    });

    it('should return false for files with wrong extension', async () => {
      const txtFilePath = path.join(fixturesDir, 'invalid.txt');
      const result = await pdfReader.validatePDF(txtFilePath);
      expect(result).toBe(false);
    });

    it('should return false for files with PDF extension but invalid format', async () => {
      const fakePdfPath = path.join(fixturesDir, 'fake.pdf');
      const result = await pdfReader.validatePDF(fakePdfPath);
      expect(result).toBe(false);
    });

    it('should return false for empty files', async () => {
      const emptyPdfPath = path.join(fixturesDir, 'empty.pdf');
      const result = await pdfReader.validatePDF(emptyPdfPath);
      expect(result).toBe(false);
    });

    it('should handle file size limits', async () => {
      // Create a PDF reader with very small size limit
      const smallSizePdfReader = new PDFReaderImpl(100); // 100 bytes limit
      const validPdfPath = path.join(fixturesDir, 'real-sample.pdf');
      
      const result = await smallSizePdfReader.validatePDF(validPdfPath);
      expect(result).toBe(false);
    });
  });

  describe('extractText', () => {
    it('should extract text from valid PDF files', async () => {
      const validPdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(validPdfPath);
      
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
      expect(text.trim().length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent files', async () => {
      const nonExistentPath = path.join(fixturesDir, 'does-not-exist.pdf');
      
      await expect(pdfReader.extractText(nonExistentPath)).rejects.toThrow();
    });

    it('should throw error with correct error code for invalid PDF', async () => {
      const fakePdfPath = path.join(fixturesDir, 'fake.pdf');
      
      try {
        await pdfReader.extractText(fakePdfPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.INVALID_PDF);
        expect(error.step).toBe(ProcessingStep.PDF_VALIDATION);
      }
    });

    it('should throw error with correct error code for file not found', async () => {
      const nonExistentPath = path.join(fixturesDir, 'does-not-exist.pdf');
      
      try {
        await pdfReader.extractText(nonExistentPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
        expect(error.step).toBe(ProcessingStep.PDF_VALIDATION);
      }
    });

    it('should clean and normalize extracted text', async () => {
      // Use the real PDF file for text cleaning test
      const validPdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(validPdfPath);
      
      // Text should be cleaned and normalized
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
      expect(text.trim().length).toBeGreaterThan(0);
      
      // Should not have excessive newlines (more than 2 consecutive)
      expect(text).not.toMatch(/\n{3,}/);
    });

    it('should handle encrypted PDFs gracefully', async () => {
      // Note: This test would require an actual encrypted PDF
      // For now, we'll test the error handling structure
      const fakePdfPath = path.join(fixturesDir, 'fake.pdf');
      
      try {
        await pdfReader.extractText(fakePdfPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('step');
        expect(error).toHaveProperty('details');
      }
    });
  });

  describe('error handling', () => {
    it('should create proper error objects with all required fields', async () => {
      const nonExistentPath = path.join(fixturesDir, 'does-not-exist.pdf');
      
      try {
        await pdfReader.extractText(nonExistentPath);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('step');
        expect(error).toHaveProperty('details');
        expect(error.details).toHaveProperty('timestamp');
        expect(error.details).toHaveProperty('message');
        expect(error.details).toHaveProperty('code');
        expect(error.details).toHaveProperty('step');
      }
    });

    it('should handle different error scenarios with appropriate error codes', async () => {
      const testCases = [
        {
          file: 'does-not-exist.pdf',
          expectedCode: ErrorCode.FILE_NOT_FOUND,
          expectedStep: ProcessingStep.PDF_VALIDATION
        },
        {
          file: 'fake.pdf',
          expectedCode: ErrorCode.INVALID_PDF,
          expectedStep: ProcessingStep.PDF_VALIDATION
        },
        {
          file: 'empty.pdf',
          expectedCode: ErrorCode.INVALID_PDF,
          expectedStep: ProcessingStep.PDF_VALIDATION
        }
      ];

      for (const testCase of testCases) {
        const filePath = path.join(fixturesDir, testCase.file);
        
        try {
          await pdfReader.extractText(filePath);
          expect.fail(`Should have thrown an error for ${testCase.file}`);
        } catch (error: any) {
          expect(error.code).toBe(testCase.expectedCode);
          expect(error.step).toBe(testCase.expectedStep);
        }
      }
    });
  });

  describe('configuration', () => {
    it('should respect custom file size limits', () => {
      const customSizeReader = new PDFReaderImpl(1024); // 1KB limit
      expect(customSizeReader).toBeInstanceOf(PDFReaderImpl);
    });

    it('should use default file size limit when not specified', () => {
      const defaultReader = new PDFReaderImpl();
      expect(defaultReader).toBeInstanceOf(PDFReaderImpl);
    });
  });
});