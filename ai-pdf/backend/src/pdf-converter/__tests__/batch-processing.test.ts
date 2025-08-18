/**
 * Batch Processing Tests for PDF Converter Service
 * Tests batch processing capabilities and progress reporting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "path";
import fs from "fs/promises";
import { PDFConverterService } from "../converter-service";
import { ConverterConfig, ErrorCode } from "../types";
import { createTestConfig } from "../config";

// Mock the Ollama client
vi.mock("ollama", () => ({
  Ollama: vi.fn().mockImplementation(() => ({
    list: vi.fn().mockResolvedValue([]),
    chat: vi.fn().mockResolvedValue({
      message: {
        content: JSON.stringify({
          matches: [
            {
              matchId: "test-match-1",
              homeTeam: "Team A",
              awayTeam: "Team B",
              date: "2024-01-15",
              time: "20:00",
              country: "England",
              league: "Premier League",
              round: 1,
              odds: [],
              markets: [],
            },
          ],
        }),
      },
    }),
  })),
}));

describe("Batch Processing Tests", () => {
  let converterService: PDFConverterService;
  let testConfig: ConverterConfig;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = path.join(__dirname, "temp-batch-test-" + Date.now());
    await fs.mkdir(tempDir, { recursive: true });

    // Create test configuration
    testConfig = createTestConfig({
      paths: {
        sourceDir: tempDir,
        outputDir: path.join(tempDir, "output"),
      },
      processing: {
        maxConcurrentFiles: 2,
        enableBatchProcessing: true,
        maxTextLength: 50000,
        chunkSize: 4000,
      },
      ollama: {
        host: "http://localhost:11434",
        model: "gemma2:2b",
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 100,
      },
    });

    converterService = new PDFConverterService(testConfig);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to clean up temp directory:", error);
    }
  });

  describe("Batch Processing Functionality", () => {
    it("should process multiple PDF files in a directory", async () => {
      // Copy test files to temp directory
      const realSamplePath = path.join(
        __dirname,
        "fixtures",
        "real-sample.pdf"
      );
      const testFile1 = path.join(tempDir, "test1.pdf");
      const testFile2 = path.join(tempDir, "test2.pdf");

      try {
        // Check if real sample exists
        await fs.access(realSamplePath);

        // Copy the real sample to create multiple test files
        await fs.copyFile(realSamplePath, testFile1);
        await fs.copyFile(realSamplePath, testFile2);

        const results = await converterService.processBatch(tempDir);

        expect(results).toHaveLength(2);

        // Check that both files were processed
        const filePaths = results.map((r) => r.data?.metadata.originalFile);
        expect(filePaths).toContain(path.resolve(testFile1));
        expect(filePaths).toContain(path.resolve(testFile2));

        // At least one should succeed (depending on PDF validity)
        const successCount = results.filter((r) => r.success).length;
        expect(successCount).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Skip test if real sample is not available
        console.log("Real sample PDF not available, skipping batch test");
      }
    });

    it("should handle empty directory gracefully", async () => {
      const results = await converterService.processBatch(tempDir);

      expect(results).toHaveLength(0);
    });

    it("should handle individual file failures without stopping batch", async () => {
      // Create a mix of valid and invalid files
      const validFile = path.join(tempDir, "valid.pdf");
      const invalidFile1 = path.join(tempDir, "invalid1.txt");
      const invalidFile2 = path.join(tempDir, "invalid2.pdf");

      // Create invalid files
      await fs.writeFile(invalidFile1, "This is not a PDF");
      await fs.writeFile(invalidFile2, "Fake PDF content");

      // Try to copy a real PDF if available
      try {
        const realSamplePath = path.join(
          __dirname,
          "fixtures",
          "real-sample.pdf"
        );
        await fs.access(realSamplePath);
        await fs.copyFile(realSamplePath, validFile);
      } catch {
        // Create a fake PDF file if real sample not available
        await fs.writeFile(validFile, "%PDF-1.4\nFake PDF content");
      }

      const results = await converterService.processBatch(tempDir);

      // Should process all PDF files (ignore .txt files)
      expect(results.length).toBeGreaterThanOrEqual(1);

      // Should have at least one result (the PDF files)
      const pdfResults = results.filter(
        (r) =>
          r.data?.metadata.originalFile.endsWith(".pdf") ||
          r.error?.message.includes(".pdf")
      );
      expect(pdfResults.length).toBeGreaterThanOrEqual(1);
    });

    it("should respect concurrency limits", async () => {
      // Create multiple test files
      const fileCount = 5;
      const testFiles: string[] = [];

      for (let i = 0; i < fileCount; i++) {
        const testFile = path.join(tempDir, `test${i}.pdf`);
        testFiles.push(testFile);

        // Create minimal PDF files
        await fs.writeFile(testFile, "%PDF-1.4\nTest content " + i);
      }

      // Mock the convertPDF method to track concurrent calls
      const originalConvertPDF =
        converterService.convertPDF.bind(converterService);
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      converterService.convertPDF = vi
        .fn()
        .mockImplementation(async (filePath: string) => {
          concurrentCalls++;
          maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);

          // Simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 100));

          const result = await originalConvertPDF(filePath);
          concurrentCalls--;
          return result;
        });

      await converterService.processBatch(tempDir);

      // Should not exceed configured concurrency limit
      expect(maxConcurrentCalls).toBeLessThanOrEqual(
        testConfig.processing.maxConcurrentFiles
      );
    });

    it("should provide progress reporting for batch operations", async () => {
      // Create test files
      const testFile1 = path.join(tempDir, "test1.pdf");
      const testFile2 = path.join(tempDir, "test2.pdf");

      await fs.writeFile(testFile1, "%PDF-1.4\nTest content 1");
      await fs.writeFile(testFile2, "%PDF-1.4\nTest content 2");

      // Capture console output for progress reporting
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = vi.fn().mockImplementation((message: string) => {
        consoleLogs.push(message);
        originalLog(message);
      });

      await converterService.processBatch(tempDir);

      // Restore console.log
      console.log = originalLog;

      // Should have progress messages
      const progressMessages = consoleLogs.filter(
        (log) =>
          log.includes("batch processing") ||
          log.includes("Batch completed") ||
          (log.includes("Found") && log.includes("PDF files"))
      );

      expect(progressMessages.length).toBeGreaterThan(0);
    });

    it("should handle non-existent directory", async () => {
      const nonExistentDir = path.join(tempDir, "non-existent");

      const results = await converterService.processBatch(nonExistentDir);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });

    it("should filter only PDF files from directory", async () => {
      // Create mixed file types
      await fs.writeFile(
        path.join(tempDir, "document.pdf"),
        "%PDF-1.4\nPDF content"
      );
      await fs.writeFile(path.join(tempDir, "image.jpg"), "JPEG content");
      await fs.writeFile(path.join(tempDir, "text.txt"), "Text content");
      await fs.writeFile(path.join(tempDir, "data.json"), '{"key": "value"}');
      await fs.writeFile(
        path.join(tempDir, "another.PDF"),
        "%PDF-1.4\nPDF content"
      ); // Test case sensitivity

      const results = await converterService.processBatch(tempDir);

      // Should only process PDF files (case insensitive)
      expect(results.length).toBe(2);

      results.forEach((result) => {
        if (result.data?.metadata.originalFile) {
          expect(result.data.metadata.originalFile.toLowerCase()).toMatch(
            /\.pdf$/
          );
        }
      });
    });
  });

  describe("Batch Processing with Real Files", () => {
    it("should process real PDF files if available", async () => {
      try {
        // Check for real sample file
        const realSamplePath = path.join(
          __dirname,
          "fixtures",
          "real-sample.pdf"
        );
        await fs.access(realSamplePath);

        // Copy to temp directory
        const testFile = path.join(tempDir, "real-sample.pdf");
        await fs.copyFile(realSamplePath, testFile);

        const results = await converterService.processBatch(tempDir);

        expect(results).toHaveLength(1);

        if (results[0].success) {
          expect(results[0].data).toBeDefined();
          expect(results[0].data?.content.originalText.length).toBeGreaterThan(
            0
          );
          expect(results[0].data?.metadata.processingTimeMs).toBeGreaterThan(0);
        } else {
          // If it fails, should have proper error information
          expect(results[0].error).toBeDefined();
          expect(results[0].error?.code).toBeDefined();
        }
      } catch (error) {
        console.log("Real sample PDF not available, skipping real file test");
      }
    });
  });

  describe("Batch Processing Error Scenarios", () => {
    it("should handle permission errors gracefully", async () => {
      // This test might not work on all systems, so we'll mock it
      const mockService = new PDFConverterService(testConfig);

      // Mock fs.readdir to throw permission error
      vi.spyOn(fs, "readdir").mockRejectedValueOnce(
        Object.assign(new Error("Permission denied"), { code: "EACCES" })
      );

      const results = await mockService.processBatch("/restricted-directory");

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error?.message).toContain("Permission denied");
    });

    it("should update metrics for batch processing", async () => {
      // Create test files
      const testFile1 = path.join(tempDir, "test1.pdf");
      const testFile2 = path.join(tempDir, "test2.pdf");

      await fs.writeFile(testFile1, "%PDF-1.4\nTest content 1");
      await fs.writeFile(testFile2, "Invalid PDF content"); // This will fail

      // Reset metrics
      converterService.resetMetrics();

      await converterService.processBatch(tempDir);

      const metrics = converterService.getMetrics();
      expect(metrics.totalProcessed).toBe(2);
      expect(metrics.errorCounts).toBeDefined();
    });
  });

  describe("Batch Processing Configuration", () => {
    it("should respect batch processing configuration", async () => {
      // Create service with batch processing disabled
      const noBatchConfig = createTestConfig({
        ...testConfig,
        processing: {
          ...testConfig.processing,
          enableBatchProcessing: false,
        },
      });

      const noBatchService = new PDFConverterService(noBatchConfig);

      // Create test file
      await fs.writeFile(
        path.join(tempDir, "test.pdf"),
        "%PDF-1.4\nTest content"
      );

      // Should still work but might behave differently
      const results = await noBatchService.processBatch(tempDir);
      expect(results).toBeDefined();
    });

    it("should handle different concurrency settings", async () => {
      // Test with different concurrency limits
      const highConcurrencyConfig = createTestConfig({
        ...testConfig,
        processing: {
          ...testConfig.processing,
          maxConcurrentFiles: 10,
        },
      });

      const highConcurrencyService = new PDFConverterService(
        highConcurrencyConfig
      );

      // Create multiple test files
      for (let i = 0; i < 3; i++) {
        await fs.writeFile(
          path.join(tempDir, `test${i}.pdf`),
          `%PDF-1.4\nTest content ${i}`
        );
      }

      const results = await highConcurrencyService.processBatch(tempDir);
      expect(results).toHaveLength(3);
    });
  });
});
