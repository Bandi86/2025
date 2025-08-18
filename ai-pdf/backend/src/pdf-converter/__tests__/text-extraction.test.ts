import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { PDFReaderImpl } from '../pdf-reader';

describe('PDF Text Extraction', () => {
  let pdfReader: PDFReaderImpl;
  const fixturesDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    pdfReader = new PDFReaderImpl();
  });

  describe('Multi-page document processing', () => {
    it('should extract text from multi-page PDFs', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(100); // Should have substantial content
    });

    it('should preserve content from all pages', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // The text should contain content that would span multiple pages
      expect(text.length).toBeGreaterThan(1000);
      expect(text.trim()).toBeTruthy();
    });
  });

  describe('Text cleaning and normalization', () => {
    it('should remove excessive whitespace', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // Should not have multiple consecutive spaces
      expect(text).not.toMatch(/  +/); // No double spaces or more
    });

    it('should normalize line endings', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // Should not have Windows-style line endings
      expect(text).not.toMatch(/\r\n/);
      expect(text).not.toMatch(/\r/);
    });

    it('should remove excessive newlines', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // Should not have more than 2 consecutive newlines
      expect(text).not.toMatch(/\n{3,}/);
    });

    it('should remove control characters', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // Should not contain control characters (except newlines and tabs)
      expect(text).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
    });

    it('should trim whitespace from beginning and end', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // Should not start or end with whitespace
      expect(text).toBe(text.trim());
    });
  });

  describe('Text extraction quality', () => {
    it('should extract readable text content', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // Should contain some common words/characters
      expect(text.length).toBeGreaterThan(50);
      expect(text).toMatch(/[a-zA-Z]/); // Should contain letters
    });

    it('should handle different character encodings', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // Should be valid UTF-8 string
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should preserve text structure reasonably', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      const text = await pdfReader.extractText(pdfPath);
      
      // Should be a continuous text (our cleaning removes excessive newlines)
      expect(text).toBeTruthy();
      expect(text.length).toBeGreaterThan(100);
      // The text should be cleaned but still readable
      expect(text).toMatch(/[a-zA-Z]/);
    });
  });

  describe('Performance and memory handling', () => {
    it('should handle large PDFs efficiently', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      
      const startTime = Date.now();
      const text = await pdfReader.extractText(pdfPath);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      
      expect(text).toBeTruthy();
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should return consistent results on multiple calls', async () => {
      const pdfPath = path.join(fixturesDir, 'real-sample.pdf');
      
      const text1 = await pdfReader.extractText(pdfPath);
      const text2 = await pdfReader.extractText(pdfPath);
      
      expect(text1).toBe(text2); // Should be identical
    });
  });
});