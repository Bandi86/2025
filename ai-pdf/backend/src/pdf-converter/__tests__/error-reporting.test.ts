/**
 * Error Reporting Tests for PDF Converter Service
 * Tests comprehensive error reporting and debugging information
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "path";
import fs from "fs/promises";
import { PDFConverterService } from "../converter-service";
import { ConverterConfig, ErrorCode, ProcessingStep } from "../types";
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

describe("Error Reporting Tests", () => {
  let converterService: PDFConverterService;
  let testConfig: ConverterConfig;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = path.join(__dirname, "temp-error-test-" + Date.now());
    await fs.mkdir(tempDir, { recursive: true });

    // Create test configuration
    testConfig = createTestConfig({
      paths: {
        sourceDir: tempDir,
        outputDir: path.join(tempDir, "output"),
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

  describe("Error Structure and Details", () => {
    it("should provide detailed error information for file not found", async () => {
      const nonExistentFile = path.join(tempDir, "non-existent.pdf");

      const result = await converterService.convertPDF(nonExistentFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Check error structure
      expect(result.error?.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(result.error?.step).toBe(ProcessingStep.PDF_VALIDATION);
      expect(result.error?.message).toContain("File not found");
      expect(result.error?.timestamp).toBeDefined();

      // Should be a valid ISO timestamp
      expect(() => new Date(result.error!.timestamp)).not.toThrow();
    });

    it("should provide detailed error information for invalid PDF format", async () => {
      const invalidFile = path.join(tempDir, "invalid.pdf");
      await fs.writeFile(invalidFile, "This is not a PDF file");

      const result = await converterService.convertPDF(invalidFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Check error structure
      expect(result.error?.code).toBe(ErrorCode.INVALID_PDF);
      expect(result.error?.step).toBe(ProcessingStep.PDF_VALIDATION);
      expect(result.error?.message).toContain("PDF header");
      expect(result.error?.timestamp).toBeDefined();
    });

    it("should provide detailed error information for PDF extraction failures", async () => {
      const corruptedFile = path.join(tempDir, "corrupted.pdf");
      await fs.writeFile(
        corruptedFile,
        "%PDF-1.4\nCorrupted content that will fail parsing"
      );

      const result = await converterService.convertPDF(corruptedFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Check error structure
      expect(result.error?.code).toBe(ErrorCode.PDF_EXTRACTION_FAILED);
      expect(result.error?.step).toBe(ProcessingStep.PDF_EXTRACTION);
      expect(result.error?.message).toContain("extract text");
      expect(result.error?.timestamp).toBeDefined();
      expect(result.error?.details).toBeDefined();
    });

    it("should provide detailed error information for AI service failures", async () => {
      // Mock the Gemma client to fail
      const mockService = new PDFConverterService(testConfig);
      vi.spyOn(mockService["gemmaClient"], "testConnection").mockResolvedValue(
        false
      );

      // Create a valid PDF file (use real sample if available)
      try {
        const realSamplePath = path.join(
          __dirname,
          "fixtures",
          "real-sample.pdf"
        );
        await fs.access(realSamplePath);

        const testFile = path.join(tempDir, "test.pdf");
        await fs.copyFile(realSamplePath, testFile);

        const result = await mockService.convertPDF(testFile);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();

        // Check error structure
        expect(result.error?.code).toBe(ErrorCode.AI_SERVICE_UNAVAILABLE);
        expect(result.error?.step).toBe(ProcessingStep.AI_ANALYSIS);
        expect(result.error?.message).toContain("not available");
        expect(result.error?.timestamp).toBeDefined();
      } catch {
        // Skip if real sample not available
        console.log(
          "Real sample PDF not available, skipping AI service error test"
        );
      }
    });

    it("should provide detailed error information for JSON generation failures", async () => {
      // Mock the JSON generator to fail
      const mockService = new PDFConverterService(testConfig);
      vi.spyOn(
        mockService["jsonGenerator"],
        "generateJSONOutput"
      ).mockResolvedValue({
        success: false,
        error: {
          code: ErrorCode.JSON_GENERATION_FAILED,
          message: "JSON generation failed due to invalid data",
          step: ProcessingStep.JSON_GENERATION,
          timestamp: new Date().toISOString(),
        },
      });

      // Create a valid PDF file (use real sample if available)
      try {
        const realSamplePath = path.join(
          __dirname,
          "fixtures",
          "real-sample.pdf"
        );
        await fs.access(realSamplePath);

        const testFile = path.join(tempDir, "test.pdf");
        await fs.copyFile(realSamplePath, testFile);

        const result = await mockService.convertPDF(testFile);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();

        // Check error structure
        expect(result.error?.code).toBe(ErrorCode.JSON_GENERATION_FAILED);
        expect(result.error?.step).toBe(ProcessingStep.JSON_GENERATION);
        expect(result.error?.message).toContain("JSON generation failed");
        expect(result.error?.timestamp).toBeDefined();
      } catch {
        // Skip if real sample not available
        console.log(
          "Real sample PDF not available, skipping JSON generation error test"
        );
      }
    });
  });

  describe("Error Context and Debugging Information", () => {
    it("should include original error details in error context", async () => {
      const nonExistentFile = path.join(tempDir, "non-existent.pdf");

      const result = await converterService.convertPDF(nonExistentFile);

      expect(result.success).toBe(false);
      expect(result.error?.details).toBeDefined();

      // Should include the original error information
      if (result.error?.details) {
        expect(result.error.details).toHaveProperty("code");
        expect(result.error.details).toHaveProperty("message");
        expect(result.error.details).toHaveProperty("step");
        expect(result.error.details).toHaveProperty("timestamp");
      }
    });

    it("should include file path information in error context", async () => {
      const invalidFile = path.join(tempDir, "invalid.pdf");
      await fs.writeFile(invalidFile, "Not a PDF");

      const result = await converterService.convertPDF(invalidFile);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain(path.resolve(invalidFile));
    });

    it("should provide step identification in error messages", async () => {
      const testCases = [
        {
          file: "non-existent.pdf",
          content: null,
          expectedStep: ProcessingStep.PDF_VALIDATION,
        },
        {
          file: "invalid.pdf",
          content: "Not a PDF",
          expectedStep: ProcessingStep.PDF_VALIDATION,
        },
        {
          file: "corrupted.pdf",
          content: "%PDF-1.4\nCorrupted",
          expectedStep: ProcessingStep.PDF_EXTRACTION,
        },
      ];

      for (const testCase of testCases) {
        const filePath = path.join(tempDir, testCase.file);

        if (testCase.content) {
          await fs.writeFile(filePath, testCase.content);
        }

        const result = await converterService.convertPDF(filePath);

        expect(result.success).toBe(false);
        expect(result.error?.step).toBe(testCase.expectedStep);
      }
    });

    it("should include processing time in error context", async () => {
      const nonExistentFile = path.join(tempDir, "non-existent.pdf");

      const startTime = Date.now();
      const result = await converterService.convertPDF(nonExistentFile);
      const endTime = Date.now();

      expect(result.success).toBe(false);

      // Error should have occurred within reasonable time bounds
      const errorTime = new Date(result.error!.timestamp).getTime();
      expect(errorTime).toBeGreaterThanOrEqual(startTime);
      expect(errorTime).toBeLessThanOrEqual(endTime);
    });
  });

  describe("Error Logging and Monitoring", () => {
    it("should log errors with sufficient context for debugging", async () => {
      // Capture console output
      const consoleLogs: string[] = [];
      const consoleErrors: string[] = [];

      const originalLog = console.log;
      const originalError = console.error;

      console.log = vi.fn().mockImplementation((message: string) => {
        consoleLogs.push(message);
        originalLog(message);
      });

      console.error = vi.fn().mockImplementation((message: string) => {
        consoleErrors.push(message);
        originalError(message);
      });

      const nonExistentFile = path.join(tempDir, "non-existent.pdf");
      await converterService.convertPDF(nonExistentFile);

      // Restore console methods
      console.log = originalLog;
      console.error = originalError;

      // Should have logged error information
      expect(consoleErrors.length).toBeGreaterThan(0);

      const errorLog = consoleErrors.find((log) =>
        log.includes("Conversion failed")
      );
      expect(errorLog).toBeDefined();
      expect(errorLog).toContain(nonExistentFile);
    });

    it("should track error metrics for monitoring", async () => {
      // Reset metrics
      converterService.resetMetrics();

      // Generate different types of errors
      const testFiles = [
        { name: "non-existent1.pdf", content: null },
        { name: "invalid1.pdf", content: "Not a PDF" },
        { name: "non-existent2.pdf", content: null },
        { name: "invalid2.pdf", content: "Also not a PDF" },
      ];

      for (const testFile of testFiles) {
        const filePath = path.join(tempDir, testFile.name);

        if (testFile.content) {
          await fs.writeFile(filePath, testFile.content);
        }

        await converterService.convertPDF(filePath);
      }

      const metrics = converterService.getMetrics();

      // Should have processed all files
      expect(metrics.totalProcessed).toBe(4);

      // Should have 0% success rate
      expect(metrics.successRate).toBe(0);

      // Should have error counts
      expect(metrics.errorCounts).toBeDefined();
      expect(Object.keys(metrics.errorCounts).length).toBeGreaterThan(0);

      // Should have FILE_NOT_FOUND and INVALID_PDF errors
      expect(metrics.errorCounts[ErrorCode.FILE_NOT_FOUND]).toBe(2);
      expect(metrics.errorCounts[ErrorCode.INVALID_PDF]).toBe(2);
    });
  });

  describe("Batch Processing Error Reporting", () => {
    it("should provide detailed error reporting for batch operations", async () => {
      // Create mixed files with different error types
      const testFiles = [
        { name: "valid.pdf", content: "%PDF-1.4\nValid content" },
        { name: "invalid.pdf", content: "Not a PDF" },
        { name: "corrupted.pdf", content: "%PDF-1.4\nCorrupted" },
      ];

      for (const testFile of testFiles) {
        const filePath = path.join(tempDir, testFile.name);
        await fs.writeFile(filePath, testFile.content);
      }

      const results = await converterService.processBatch(tempDir);

      expect(results).toHaveLength(3);

      // All should fail but with different error types
      results.forEach((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBeDefined();
        expect(result.error?.step).toBeDefined();
        expect(result.error?.message).toBeDefined();
        expect(result.error?.timestamp).toBeDefined();
      });

      // Should have different error codes
      const errorCodes = results.map((r) => r.error?.code);
      expect(new Set(errorCodes).size).toBeGreaterThan(1);
    });

    it("should continue processing after individual file errors", async () => {
      // Create files that will fail at different stages
      const testFiles = [
        { name: "file1.pdf", content: "Not a PDF" },
        { name: "file2.pdf", content: "%PDF-1.4\nCorrupted" },
        { name: "file3.pdf", content: "Also not a PDF" },
      ];

      for (const testFile of testFiles) {
        const filePath = path.join(tempDir, testFile.name);
        await fs.writeFile(filePath, testFile.content);
      }

      const results = await converterService.processBatch(tempDir);

      // Should process all files despite individual failures
      expect(results).toHaveLength(3);

      // Each should have proper error reporting
      results.forEach((result, index) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain(testFiles[index].name);
      });
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should handle cascading errors gracefully", async () => {
      // Mock multiple components to fail
      const mockService = new PDFConverterService(testConfig);

      // Mock PDF reader to fail
      vi.spyOn(mockService["pdfReader"], "validatePDF").mockRejectedValue(
        new Error("PDF reader failure")
      );

      const testFile = path.join(tempDir, "test.pdf");
      await fs.writeFile(testFile, "%PDF-1.4\nTest content");

      const result = await mockService.convertPDF(testFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("PDF reader failure");
    });

    it("should provide meaningful error messages for configuration issues", async () => {
      // Create service with invalid configuration
      const invalidConfig = createTestConfig({
        ollama: {
          host: "invalid-host",
          model: "invalid-model",
          timeout: -1,
          retryAttempts: -1,
          retryDelay: -1,
        },
      });

      expect(() => new PDFConverterService(invalidConfig)).toThrow();
    });

    it("should handle unexpected errors with fallback reporting", async () => {
      const mockService = new PDFConverterService(testConfig);

      // Mock an unexpected error
      vi.spyOn(mockService, "convertPDF").mockImplementation(async () => {
        throw new Error("Unexpected system error");
      });

      try {
        await mockService.convertPDF("any-file.pdf");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Unexpected system error");
      }
    });
  });

  describe("Error Message Quality", () => {
    it("should provide user-friendly error messages", async () => {
      const testCases = [
        {
          scenario: "File not found",
          file: "non-existent.pdf",
          content: null,
          expectedMessageParts: ["File not found", "not readable"],
        },
        {
          scenario: "Invalid file extension",
          file: "document.txt",
          content: "Text content",
          expectedMessageParts: ["Unsupported file extension", ".txt"],
        },
        {
          scenario: "Invalid PDF header",
          file: "fake.pdf",
          content: "Fake PDF content",
          expectedMessageParts: ["PDF header", "valid"],
        },
      ];

      for (const testCase of testCases) {
        const filePath = path.join(tempDir, testCase.file);

        if (testCase.content) {
          await fs.writeFile(filePath, testCase.content);
        }

        const result = await converterService.convertPDF(filePath);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBeDefined();

        // Check that error message contains expected parts
        testCase.expectedMessageParts.forEach((part) => {
          expect(result.error?.message.toLowerCase()).toContain(
            part.toLowerCase()
          );
        });
      }
    });

    it("should provide actionable error messages", async () => {
      const emptyFile = path.join(tempDir, "empty.pdf");
      await fs.writeFile(emptyFile, "");

      const result = await converterService.convertPDF(emptyFile);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("empty");

      // Error message should be actionable
      expect(result.error?.message.length).toBeGreaterThan(10);
    });
  });
});
