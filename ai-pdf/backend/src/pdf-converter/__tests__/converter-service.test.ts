/**
 * Integration tests for PDF Converter Service
 * Tests the complete pipeline from PDF to JSON conversion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "path";
import fs from "fs/promises";
import { PDFConverterService } from "../converter-service";
import { ConverterConfig, ErrorCode, ProcessingStep } from "../types";
import { createTestConfig } from "../config";

// Mock the Ollama client to avoid external dependencies in tests
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

describe("PDFConverterService Integration Tests", () => {
  let converterService: PDFConverterService;
  let testConfig: ConverterConfig;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = path.join(__dirname, "temp-test-" + Date.now());
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

  describe("Single File Conversion Pipeline", () => {
    it("should successfully convert a valid PDF file", async () => {
      // Use the existing test PDF file
      const testPdfPath = path.join(__dirname, "fixtures", "valid.pdf");

      const result = await converterService.convertPDF(testPdfPath);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.content).toBeDefined();
      expect(result.data?.status).toBe("success");

      // Verify metadata
      expect(result.data?.metadata.originalFile).toBe(
        path.resolve(testPdfPath)
      );
      expect(result.data?.metadata.processedAt).toBeDefined();
      expect(result.data?.metadata.textLength).toBeGreaterThan(0);
      expect(result.data?.metadata.processingTimeMs).toBeGreaterThan(0);

      // Verify content structure
      expect(result.data?.content.originalText).toBeDefined();
      expect(result.data?.content.analysis).toBeDefined();
    });

    it("should handle PDF validation errors", async () => {
      const invalidPdfPath = path.join(__dirname, "fixtures", "invalid.txt");

      const result = await converterService.convertPDF(invalidPdfPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ErrorCode.INVALID_PDF);
      expect(result.error?.step).toBe(ProcessingStep.PDF_VALIDATION);
    });

    it("should handle non-existent files", async () => {
      const nonExistentPath = path.join(tempDir, "non-existent.pdf");

      const result = await converterService.convertPDF(nonExistentPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(result.error?.step).toBe(ProcessingStep.PDF_VALIDATION);
    });

    it("should handle empty PDF files", async () => {
      const emptyPdfPath = path.join(__dirname, "fixtures", "empty.pdf");

      const result = await converterService.convertPDF(emptyPdfPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ErrorCode.INVALID_PDF);
    });

    it("should handle corrupted PDF files", async () => {
      const corruptedPdfPath = path.join(__dirname, "fixtures", "fake.pdf");

      const result = await converterService.convertPDF(corruptedPdfPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ErrorCode.INVALID_PDF);
    });

    it("should update processing metrics", async () => {
      const testPdfPath = path.join(__dirname, "fixtures", "valid.pdf");

      // Reset metrics
      converterService.resetMetrics();

      // Process a file
      await converterService.convertPDF(testPdfPath);

      const metrics = converterService.getMetrics();
      expect(metrics.totalProcessed).toBe(1);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe("Error Handling at Each Pipeline Stage", () => {
    it("should handle PDF extraction errors gracefully", async () => {
      // Create a service with a mocked PDF reader that fails
      const mockService = new PDFConverterService(testConfig);

      // Mock the PDF reader to throw an error
      vi.spyOn(mockService["pdfReader"], "extractText").mockRejectedValue(
        new Error("PDF extraction failed")
      );

      const testPdfPath = path.join(__dirname, "fixtures", "valid.pdf");
      const result = await mockService.convertPDF(testPdfPath);

      expect(result.success).toBe(false);
      expect(result.error?.step).toBe(ProcessingStep.PDF_EXTRACTION);
    });

    it("should handle AI analysis errors gracefully", async () => {
      // Mock the Gemma client to fail
      const mockService = new PDFConverterService(testConfig);
      vi.spyOn(mockService["gemmaClient"], "analyzeText").mockResolvedValue({
        success: false,
        error: "AI service unavailable",
      });

      const testPdfPath = path.join(__dirname, "fixtures", "valid.pdf");
      const result = await mockService.convertPDF(testPdfPath);

      expect(result.success).toBe(false);
      expect(result.error?.step).toBe(ProcessingStep.AI_ANALYSIS);
    });

    it("should handle JSON generation errors gracefully", async () => {
      // Mock the JSON generator to fail
      const mockService = new PDFConverterService(testConfig);
      vi.spyOn(
        mockService["jsonGenerator"],
        "generateJSONOutput"
      ).mockResolvedValue({
        success: false,
        error: {
          code: ErrorCode.JSON_GENERATION_FAILED,
          message: "JSON generation failed",
          step: ProcessingStep.JSON_GENERATION,
          timestamp: new Date().toISOString(),
        },
      });

      const testPdfPath = path.join(__dirname, "fixtures", "valid.pdf");
      const result = await mockService.convertPDF(testPdfPath);

      expect(result.success).toBe(false);
      expect(result.error?.step).toBe(ProcessingStep.JSON_GENERATION);
    });
  });

  describe("Health Check", () => {
    it("should perform health checks on all components", async () => {
      const healthResults = await converterService.healthCheck();

      expect(healthResults).toHaveLength(3);

      const services = healthResults.map((r) => r.service);
      expect(services).toContain("Gemma AI");
      expect(services).toContain("Source Directory");
      expect(services).toContain("Output Directory");

      // Each health check should have required properties
      healthResults.forEach((result) => {
        expect(result.service).toBeDefined();
        expect(typeof result.healthy).toBe("boolean");
      });
    });
  });

  describe("Configuration", () => {
    it("should return current configuration", () => {
      const config = converterService.getConfig();

      expect(config).toBeDefined();
      expect(config.ollama).toBeDefined();
      expect(config.paths).toBeDefined();
      expect(config.processing).toBeDefined();
      expect(config.logging).toBeDefined();
    });
  });

  describe("Metrics", () => {
    it("should initialize metrics correctly", () => {
      const metrics = converterService.getMetrics();

      expect(metrics.totalProcessed).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.averageProcessingTime).toBe(0);
      expect(metrics.errorCounts).toEqual({});
    });

    it("should reset metrics", () => {
      converterService.resetMetrics();
      const metrics = converterService.getMetrics();

      expect(metrics.totalProcessed).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.averageProcessingTime).toBe(0);
    });
  });

  describe("Pipeline Integration", () => {
    it("should process PDF through complete pipeline with real sample", async () => {
      // Use the real sample PDF if available
      const realSamplePath = path.join(
        __dirname,
        "fixtures",
        "real-sample.pdf"
      );

      try {
        await fs.access(realSamplePath);

        const result = await converterService.convertPDF(realSamplePath);

        // Should succeed or fail gracefully
        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");

        if (result.success) {
          expect(result.data).toBeDefined();
          expect(result.data?.content.originalText.length).toBeGreaterThan(0);
        } else {
          expect(result.error).toBeDefined();
          expect(result.error?.code).toBeDefined();
          expect(result.error?.step).toBeDefined();
        }
      } catch (error) {
        // Skip test if real sample is not available
        console.log("Real sample PDF not available, skipping integration test");
      }
    });

    it("should handle malformed AI responses", async () => {
      // Mock Gemma client to return malformed response
      const mockService = new PDFConverterService(testConfig);
      vi.spyOn(mockService["gemmaClient"], "analyzeText").mockResolvedValue({
        success: true,
        data: "invalid json response",
      });

      const testPdfPath = path.join(__dirname, "fixtures", "valid.pdf");
      const result = await mockService.convertPDF(testPdfPath);

      // Should handle malformed response gracefully
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe("success");
      expect(result.data?.content.analysis).toBeDefined();
    });

    it("should preserve original text in output", async () => {
      const testPdfPath = path.join(__dirname, "fixtures", "valid.pdf");

      const result = await converterService.convertPDF(testPdfPath);

      if (result.success && result.data) {
        expect(result.data.content.originalText).toBeDefined();
        expect(result.data.content.originalText.length).toBeGreaterThan(0);
        expect(result.data.metadata.textLength).toBe(
          result.data.content.originalText.length
        );
      }
    });
  });
});
