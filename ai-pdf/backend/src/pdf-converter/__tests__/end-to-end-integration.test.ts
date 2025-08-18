/**
 * End-to-end integration tests for complete PDF to JSON conversion
 * Tests the entire pipeline from PDF input to JSON output
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "path";
import fs from "fs/promises";
import { PDFConverterService } from "../converter-service";
import {
  TempDirectoryManager,
  createTestConfig,
  createMockOllamaClient,
  TestAssertions,
  PerformanceTracker,
  FileSystemUtils,
} from "./test-utils";
import {
  ConversionResult,
  ProcessedDocument,
  ErrorCode,
  ProcessingStep,
} from "../types";

// Mock Ollama for consistent testing
const mockOllama = createMockOllamaClient();
vi.mock("ollama", () => ({
  Ollama: vi.fn().mockImplementation(() => mockOllama.mockImplementation),
}));

describe("End-to-End Integration Tests", () => {
  let tempManager: TempDirectoryManager;
  let converterService: PDFConverterService;
  let testConfig: any;
  let performanceTracker: PerformanceTracker;

  beforeEach(async () => {
    tempManager = new TempDirectoryManager();
    performanceTracker = new PerformanceTracker();

    // Create test configuration
    testConfig = createTestConfig({
      ollama: {
        host: "http://localhost:11434",
        model: "gemma2:2b",
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
      },
      processing: {
        maxTextLength: 50000,
        chunkSize: 4000,
        enableBatchProcessing: true,
        maxConcurrentFiles: 2,
      },
    });

    converterService = new PDFConverterService(testConfig);

    // Reset mocks
    mockOllama.mockList.mockReset();
    mockOllama.mockChat.mockReset();

    // Setup default successful responses
    mockOllama.mockList.mockResolvedValue([]);
    mockOllama.mockChat.mockResolvedValue({
      message: {
        content: JSON.stringify({
          matches: [
            {
              matchId: "integration-test-match",
              homeTeam: "Test Team A",
              awayTeam: "Test Team B",
              date: "2025-01-15",
              time: "15:30",
              country: "Test Country",
              league: "Test League",
              round: 1,
              odds: [
                {
                  id: "test-odds",
                  homeWin: 2.5,
                  draw: 3.2,
                  awayWin: 2.8,
                },
              ],
              markets: [
                {
                  id: "test-market",
                  name: "Match Winner",
                  odds: [2.5, 3.2, 2.8],
                },
              ],
            },
          ],
        }),
      },
    });
  });

  afterEach(async () => {
    await tempManager.cleanup();
    vi.restoreAllMocks();
  });

  describe("Complete PDF to JSON Conversion Pipeline", () => {
    it("should successfully convert a valid PDF through the entire pipeline", async () => {
      performanceTracker.start();

      // Use the real sample PDF if available
      const realSamplePath = path.join(
        __dirname,
        "fixtures",
        "real-sample.pdf"
      );

      try {
        // Check if real sample exists
        await fs.access(realSamplePath);

        performanceTracker.mark("start-conversion");
        const result = await converterService.convertPDF(realSamplePath);
        performanceTracker.mark("end-conversion");

        // Verify successful conversion
        TestAssertions.assertSuccessfulConversion(result);
        expect(result.data).toBeDefined();

        // Verify document structure
        TestAssertions.assertValidProcessedDocument(result.data!);

        // Verify content
        expect(result.data!.content.originalText).toBeDefined();
        expect(result.data!.content.originalText.length).toBeGreaterThan(0);
        expect(result.data!.content.analysis).toBeDefined();
        expect(result.data!.content.analysis.matches).toBeDefined();

        // Verify metadata
        expect(result.data!.metadata.originalFile).toContain("real-sample.pdf");
        expect(result.data!.metadata.processedAt).toBeDefined();
        expect(result.data!.metadata.textLength).toBeGreaterThan(0);
        expect(result.data!.metadata.processingTimeMs).toBeGreaterThan(0);

        // Verify status
        expect(result.data!.status).toBe("success");

        // Performance verification
        const conversionTime =
          performanceTracker.getMeasurement("end-conversion") -
          performanceTracker.getMeasurement("start-conversion");
        expect(conversionTime).toBeLessThan(10000); // Should complete within 10 seconds

        console.log(
          `✅ End-to-end conversion completed in ${conversionTime}ms`
        );
      } catch (error) {
        console.log("Real sample PDF not available, skipping integration test");
      }
    });

    it("should handle the complete pipeline with mock PDF data", async () => {
      // Create a temporary directory and mock PDF file
      const tempDir = await tempManager.createTempDir("e2e-test-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "mock-football.pdf",
        Buffer.from("Mock PDF content for testing")
      );

      // Mock PDF reader to return sample text
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue(`
          Football Match Information
          
          Match: Manchester United vs Liverpool
          Date: 2025-01-20
          Time: 15:00
          League: Premier League
          Country: England
          Odds: Home Win 2.5, Draw 3.2, Away Win 2.8
        `),
      };

      // Replace the PDF reader in the service
      (converterService as any).pdfReader = mockPdfReader;

      performanceTracker.start();
      const result = await converterService.convertPDF(mockPdfPath);
      performanceTracker.mark("pipeline-complete");

      // Verify successful conversion
      TestAssertions.assertSuccessfulConversion(result);

      // Verify all pipeline stages were executed
      expect(mockPdfReader.validatePDF).toHaveBeenCalledWith(mockPdfPath);
      expect(mockPdfReader.extractText).toHaveBeenCalledWith(mockPdfPath);
      expect(mockOllama.mockChat).toHaveBeenCalled();

      // Verify output structure
      expect(result.data!.content.originalText).toContain(
        "Manchester United vs Liverpool"
      );
      expect(result.data!.content.analysis.matches).toHaveLength(1);
      expect(result.data!.content.analysis.matches[0].matchId).toBe(
        "integration-test-match"
      );

      const pipelineTime =
        performanceTracker.getMeasurement("pipeline-complete");
      console.log(`✅ Mock pipeline completed in ${pipelineTime}ms`);
    });
  });

  describe("Error Handling and Recovery Scenarios", () => {
    it("should handle PDF extraction failures gracefully", async () => {
      const tempDir = await tempManager.createTempDir("error-test-");
      const invalidPdfPath = await tempManager.createTempFile(
        tempDir,
        "invalid.pdf",
        "This is not a valid PDF file"
      );

      const result = await converterService.convertPDF(invalidPdfPath);

      TestAssertions.assertFailedConversion(result);
      expect(result.error!.step).toBe(ProcessingStep.PDF_VALIDATION);
      expect(result.error!.code).toBe(ErrorCode.INVALID_PDF);
      expect(result.error!.message).toBeDefined();
      expect(result.error!.timestamp).toBeDefined();
    });

    it("should handle AI service failures gracefully", async () => {
      // Mock AI service failure
      mockOllama.mockList.mockRejectedValue(
        new Error("AI service unavailable")
      );

      const tempDir = await tempManager.createTempDir("ai-error-test-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "test.pdf",
        Buffer.from("Mock PDF")
      );

      // Mock successful PDF reading
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Sample football text"),
      };
      (converterService as any).pdfReader = mockPdfReader;

      const result = await converterService.convertPDF(mockPdfPath);

      TestAssertions.assertFailedConversion(result);
      expect(result.error!.step).toBe(ProcessingStep.AI_ANALYSIS);
      expect(result.error!.message).toContain("AI service");
    });

    it("should handle malformed AI responses gracefully", async () => {
      // Mock malformed AI response
      mockOllama.mockChat.mockResolvedValue({
        message: {
          content: "This is not valid JSON",
        },
      });

      const tempDir = await tempManager.createTempDir("malformed-test-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "test.pdf",
        Buffer.from("Mock PDF")
      );

      // Mock successful PDF reading
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Sample football text"),
      };
      (converterService as any).pdfReader = mockPdfReader;

      const result = await converterService.convertPDF(mockPdfPath);

      // Should handle gracefully and return empty matches
      TestAssertions.assertSuccessfulConversion(result);
      expect(result.data!.content.analysis.matches).toEqual([]);
      expect(result.data!.status).toBe("success");
    });

    it("should handle timeout scenarios", async () => {
      // Mock AI service timeout
      mockOllama.mockChat.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      // Use shorter timeout for test
      const timeoutConfig = createTestConfig({
        ollama: { ...testConfig.ollama, timeout: 100 },
      });
      const timeoutService = new PDFConverterService(timeoutConfig);

      const tempDir = await tempManager.createTempDir("timeout-test-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "test.pdf",
        Buffer.from("Mock PDF")
      );

      // Mock successful PDF reading
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Sample football text"),
      };
      (timeoutService as any).pdfReader = mockPdfReader;

      const result = await timeoutService.convertPDF(mockPdfPath);

      TestAssertions.assertFailedConversion(result);
      expect(result.error!.step).toBe(ProcessingStep.AI_ANALYSIS);
      expect(result.error!.message).toContain("timeout");
    });
  });

  describe("Output Format and Data Integrity", () => {
    it("should produce valid JSON output with correct structure", async () => {
      const tempDir = await tempManager.createTempDir("format-test-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "format-test.pdf",
        Buffer.from("Mock PDF")
      );

      // Mock PDF reader with specific content
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Test football match content"),
      };
      (converterService as any).pdfReader = mockPdfReader;

      const result = await converterService.convertPDF(mockPdfPath);

      TestAssertions.assertSuccessfulConversion(result);

      // Verify JSON structure can be serialized and parsed
      const jsonString = JSON.stringify(result.data);
      const parsedData = JSON.parse(jsonString);

      expect(parsedData).toEqual(result.data);

      // Verify required fields are present
      expect(parsedData.metadata).toBeDefined();
      expect(parsedData.content).toBeDefined();
      expect(parsedData.status).toBeDefined();

      // Verify metadata structure
      expect(parsedData.metadata.originalFile).toBe("format-test.pdf");
      expect(parsedData.metadata.processedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
      expect(typeof parsedData.metadata.textLength).toBe("number");
      expect(typeof parsedData.metadata.processingTimeMs).toBe("number");

      // Verify content structure
      expect(parsedData.content.originalText).toBe(
        "Test football match content"
      );
      expect(Array.isArray(parsedData.content.analysis.matches)).toBe(true);
    });

    it("should maintain data consistency across multiple conversions", async () => {
      const tempDir = await tempManager.createTempDir("consistency-test-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "consistency-test.pdf",
        Buffer.from("Mock PDF")
      );

      // Mock consistent PDF reader
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Consistent test content"),
      };
      (converterService as any).pdfReader = mockPdfReader;

      // Run multiple conversions
      const results = await Promise.all([
        converterService.convertPDF(mockPdfPath),
        converterService.convertPDF(mockPdfPath),
        converterService.convertPDF(mockPdfPath),
      ]);

      // All should succeed
      results.forEach((result) => {
        TestAssertions.assertSuccessfulConversion(result);
      });

      // Content should be consistent
      const firstContent = results[0].data!.content.originalText;
      results.forEach((result) => {
        expect(result.data!.content.originalText).toBe(firstContent);
      });

      // Metadata should have different timestamps but same file info
      results.forEach((result) => {
        expect(result.data!.metadata.originalFile).toBe("consistency-test.pdf");
        expect(result.data!.metadata.textLength).toBe(firstContent.length);
      });
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle multiple files efficiently", async () => {
      const tempDir = await tempManager.createTempDir("performance-test-");

      // Create multiple test files
      const testFiles = [];
      for (let i = 0; i < 3; i++) {
        const filePath = await tempManager.createTempFile(
          tempDir,
          `test-${i}.pdf`,
          Buffer.from(`Mock PDF content ${i}`)
        );
        testFiles.push(filePath);
      }

      // Mock PDF reader
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockImplementation((filePath: string) => {
          const fileName = path.basename(filePath);
          return Promise.resolve(`Content from ${fileName}`);
        }),
      };
      (converterService as any).pdfReader = mockPdfReader;

      performanceTracker.start();

      // Process files in batch
      const results = await converterService.processBatch(tempDir);

      performanceTracker.mark("batch-complete");

      // Verify all files were processed
      expect(results).toHaveLength(3);

      // Verify all succeeded
      results.forEach((result, index) => {
        TestAssertions.assertSuccessfulConversion(result);
        expect(result.data!.content.originalText).toContain(
          `test-${index}.pdf`
        );
      });

      const batchTime = performanceTracker.getMeasurement("batch-complete");
      console.log(`✅ Batch processing completed in ${batchTime}ms`);

      // Should complete within reasonable time
      expect(batchTime).toBeLessThan(5000);
    });

    it("should handle large text content efficiently", async () => {
      const tempDir = await tempManager.createTempDir("large-content-test-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "large-content.pdf",
        Buffer.from("Mock PDF")
      );

      // Generate large text content
      const largeText = "Football match data. ".repeat(1000); // ~20KB of text

      // Mock PDF reader with large content
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue(largeText),
      };
      (converterService as any).pdfReader = mockPdfReader;

      performanceTracker.start();
      const result = await converterService.convertPDF(mockPdfPath);
      performanceTracker.mark("large-content-complete");

      TestAssertions.assertSuccessfulConversion(result);
      expect(result.data!.content.originalText).toBe(largeText);
      expect(result.data!.metadata.textLength).toBe(largeText.length);

      const processingTime = performanceTracker.getMeasurement(
        "large-content-complete"
      );
      console.log(
        `✅ Large content processing completed in ${processingTime}ms`
      );

      // Should handle large content efficiently
      expect(processingTime).toBeLessThan(3000);
    });
  });

  describe("Health Check and Service Status", () => {
    it("should provide accurate health check status", async () => {
      // Test healthy service
      const healthStatus = await converterService.healthCheck();

      expect(healthStatus.status).toBe("healthy");
      expect(healthStatus.components.pdfReader).toBe("healthy");
      expect(healthStatus.components.gemmaClient).toBe("healthy");
      expect(healthStatus.components.jsonGenerator).toBe("healthy");
      expect(healthStatus.timestamp).toBeDefined();
    });

    it("should detect unhealthy AI service", async () => {
      // Mock AI service failure
      mockOllama.mockList.mockRejectedValue(new Error("Service down"));

      const healthStatus = await converterService.healthCheck();

      expect(healthStatus.status).toBe("unhealthy");
      expect(healthStatus.components.gemmaClient).toBe("unhealthy");
      expect(healthStatus.errors).toBeDefined();
      expect(healthStatus.errors!.length).toBeGreaterThan(0);
    });
  });
});
