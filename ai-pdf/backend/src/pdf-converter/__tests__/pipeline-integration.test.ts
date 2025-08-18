/**
 * Pipeline integration tests focusing on component interactions
 * Tests how different components work together in the conversion pipeline
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import path from "path";
import { PDFConverterService } from "../converter-service";
import { PDFReaderImpl } from "../pdf-reader";
import { GemmaAIClient } from "../gemma-client";
import { JSONGeneratorImpl } from "../json-generator";
import {
  TempDirectoryManager,
  createTestConfig,
  createMockOllamaClient,
  TestData,
  TestAssertions,
} from "./test-utils";
import { ConversionResult, ProcessingStep, ErrorCode } from "../types";

// Mock Ollama
const mockOllama = createMockOllamaClient();
vi.mock("ollama", () => ({
  Ollama: vi.fn().mockImplementation(() => mockOllama.mockImplementation),
}));

describe("Pipeline Integration Tests", () => {
  let tempManager: TempDirectoryManager;
  let testConfig: any;
  let converterService: PDFConverterService;

  beforeEach(async () => {
    tempManager = new TempDirectoryManager();
    testConfig = createTestConfig();
    converterService = new PDFConverterService(testConfig);

    // Reset mocks
    mockOllama.mockList.mockReset();
    mockOllama.mockChat.mockReset();

    // Default successful responses
    mockOllama.mockList.mockResolvedValue([]);
    mockOllama.mockChat.mockResolvedValue({
      message: {
        content: JSON.stringify({
          matches: [
            {
              matchId: "pipeline-test",
              homeTeam: "Team A",
              awayTeam: "Team B",
              date: "2025-01-15",
              time: "15:30",
              country: "Test",
              league: "Test League",
              round: 1,
              odds: [],
              markets: [],
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

  describe("Component Integration Flow", () => {
    it("should pass data correctly between PDF Reader and AI Client", async () => {
      const tempDir = await tempManager.createTempDir("component-flow-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "flow-test.pdf",
        Buffer.from("Mock PDF")
      );

      // Mock PDF reader with specific text
      const testText = TestData.generatePDFText(1);
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue(testText),
      };
      (converterService as any).pdfReader = mockPdfReader;

      // Spy on AI client to verify it receives the correct text
      const aiAnalyzeSpy = vi.spyOn(
        converterService["gemmaClient"],
        "analyzeText"
      );

      const result = await converterService.convertPDF(mockPdfPath);

      TestAssertions.assertSuccessfulConversion(result);

      // Verify PDF reader was called
      expect(mockPdfReader.extractText).toHaveBeenCalledWith(mockPdfPath);

      // Verify AI client received the extracted text
      expect(aiAnalyzeSpy).toHaveBeenCalledWith(testText);

      // Verify the text made it to the final output
      expect(result.data!.content.originalText).toBe(testText);
    });

    it("should pass AI analysis results correctly to JSON Generator", async () => {
      const tempDir = await tempManager.createTempDir("ai-json-flow-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "ai-json-test.pdf",
        Buffer.from("Mock PDF")
      );

      const testText = "Sample football match text";
      const mockAnalysisResult = {
        matches: [
          {
            matchId: "flow-test-match",
            homeTeam: "Flow Team A",
            awayTeam: "Flow Team B",
            date: "2025-01-16",
            time: "16:00",
            country: "Flow Country",
            league: "Flow League",
            round: 2,
            odds: [
              {
                id: "flow-odds",
                homeWin: 1.8,
                draw: 3.5,
                awayWin: 4.2,
              },
            ],
            markets: [],
          },
        ],
      };

      // Mock components
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue(testText),
      };
      (converterService as any).pdfReader = mockPdfReader;

      // Mock AI client to return specific analysis
      mockOllama.mockChat.mockResolvedValue({
        message: {
          content: JSON.stringify(mockAnalysisResult),
        },
      });

      // Spy on JSON generator
      const jsonGenerateSpy = vi.spyOn(
        converterService["jsonGenerator"],
        "generateJSONOutput"
      );

      const result = await converterService.convertPDF(mockPdfPath);

      TestAssertions.assertSuccessfulConversion(result);

      // Verify JSON generator was called with correct parameters
      expect(jsonGenerateSpy).toHaveBeenCalledWith(
        testText,
        expect.objectContaining({
          success: true,
          data: mockAnalysisResult,
        }),
        expect.stringContaining("ai-json-test.pdf")
      );

      // Verify the analysis results made it to the final output
      expect(result.data!.content.analysis.matches).toHaveLength(1);
      expect(result.data!.content.analysis.matches[0].matchId).toBe(
        "flow-test-match"
      );
      expect(result.data!.content.analysis.matches[0].homeTeam).toBe(
        "Flow Team A"
      );
    });

    it("should handle component failures at each stage", async () => {
      const tempDir = await tempManager.createTempDir("failure-stages-");

      // Test PDF Reader failure
      const invalidPdfPath = await tempManager.createTempFile(
        tempDir,
        "invalid.pdf",
        "Not a PDF"
      );

      let result = await converterService.convertPDF(invalidPdfPath);
      TestAssertions.assertFailedConversion(result);
      expect(result.error!.step).toBe(ProcessingStep.PDF_VALIDATION);

      // Test AI Client failure
      const validPdfPath = await tempManager.createTempFile(
        tempDir,
        "valid.pdf",
        Buffer.from("Mock PDF")
      );

      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Test text"),
      };
      (converterService as any).pdfReader = mockPdfReader;

      // Mock AI failure
      mockOllama.mockList.mockRejectedValue(new Error("AI service down"));

      result = await converterService.convertPDF(validPdfPath);
      TestAssertions.assertFailedConversion(result);
      expect(result.error!.step).toBe(ProcessingStep.AI_ANALYSIS);
    });
  });

  describe("Data Transformation Pipeline", () => {
    it("should correctly transform data through each pipeline stage", async () => {
      const tempDir = await tempManager.createTempDir("transformation-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "transform-test.pdf",
        Buffer.from("Mock PDF")
      );

      // Stage 1: PDF extraction
      const originalText = TestData.generatePDFText(2);
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue(originalText),
      };
      (converterService as any).pdfReader = mockPdfReader;

      // Stage 2: AI analysis
      const aiAnalysis = {
        matches: [
          {
            matchId: "transform-match-1",
            homeTeam: "Transform Team A",
            awayTeam: "Transform Team B",
            date: "2025-01-17",
            time: "17:00",
            country: "Transform Country",
            league: "Transform League",
            round: 1,
            odds: [],
            markets: [],
          },
          {
            matchId: "transform-match-2",
            homeTeam: "Transform Team C",
            awayTeam: "Transform Team D",
            date: "2025-01-18",
            time: "18:00",
            country: "Transform Country",
            league: "Transform League",
            round: 1,
            odds: [],
            markets: [],
          },
        ],
      };

      mockOllama.mockChat.mockResolvedValue({
        message: {
          content: JSON.stringify(aiAnalysis),
        },
      });

      const result = await converterService.convertPDF(mockPdfPath);

      TestAssertions.assertSuccessfulConversion(result);

      // Verify data transformation at each stage

      // Stage 1 output: Original text preserved
      expect(result.data!.content.originalText).toBe(originalText);

      // Stage 2 output: AI analysis integrated
      expect(result.data!.content.analysis).toEqual(aiAnalysis);

      // Stage 3 output: Final JSON structure
      expect(result.data!.metadata).toBeDefined();
      expect(result.data!.metadata.originalFile).toBe("transform-test.pdf");
      expect(result.data!.metadata.textLength).toBe(originalText.length);
      expect(result.data!.status).toBe("success");

      // Verify both matches are present
      expect(result.data!.content.analysis.matches).toHaveLength(2);
      expect(result.data!.content.analysis.matches[0].matchId).toBe(
        "transform-match-1"
      );
      expect(result.data!.content.analysis.matches[1].matchId).toBe(
        "transform-match-2"
      );
    });

    it("should handle partial data transformation gracefully", async () => {
      const tempDir = await tempManager.createTempDir("partial-transform-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "partial-test.pdf",
        Buffer.from("Mock PDF")
      );

      const originalText = "Partial test content";
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue(originalText),
      };
      (converterService as any).pdfReader = mockPdfReader;

      // Mock AI returning empty matches
      mockOllama.mockChat.mockResolvedValue({
        message: {
          content: JSON.stringify({ matches: [] }),
        },
      });

      const result = await converterService.convertPDF(mockPdfPath);

      TestAssertions.assertSuccessfulConversion(result);

      // Should still succeed with empty matches
      expect(result.data!.content.originalText).toBe(originalText);
      expect(result.data!.content.analysis.matches).toEqual([]);
      expect(result.data!.status).toBe("success");
    });
  });

  describe("Error Propagation and Recovery", () => {
    it("should propagate errors correctly through the pipeline", async () => {
      const tempDir = await tempManager.createTempDir("error-propagation-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "error-test.pdf",
        Buffer.from("Mock PDF")
      );

      // Mock PDF reader to succeed but AI to fail
      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Test content"),
      };
      (converterService as any).pdfReader = mockPdfReader;

      // Mock specific AI error
      const aiError = new Error("Specific AI analysis error");
      mockOllama.mockList.mockResolvedValue([]);
      mockOllama.mockChat.mockRejectedValue(aiError);

      const result = await converterService.convertPDF(mockPdfPath);

      TestAssertions.assertFailedConversion(result);

      // Verify error details are propagated
      expect(result.error!.step).toBe(ProcessingStep.AI_ANALYSIS);
      expect(result.error!.message).toContain("AI analysis failed");
      expect(result.error!.details).toBeDefined();
    });

    it("should attempt recovery strategies for transient failures", async () => {
      const tempDir = await tempManager.createTempDir("recovery-test-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "recovery-test.pdf",
        Buffer.from("Mock PDF")
      );

      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Recovery test content"),
      };
      (converterService as any).pdfReader = mockPdfReader;

      // Mock AI to fail first time, succeed second time
      mockOllama.mockList.mockResolvedValue([]);
      mockOllama.mockChat
        .mockRejectedValueOnce(new Error("Transient failure"))
        .mockResolvedValue({
          message: {
            content: JSON.stringify({
              matches: [
                {
                  matchId: "recovery-match",
                  homeTeam: "Recovery Team A",
                  awayTeam: "Recovery Team B",
                  date: "2025-01-19",
                  time: "19:00",
                  country: "Recovery Country",
                  league: "Recovery League",
                  round: 1,
                  odds: [],
                  markets: [],
                },
              ],
            }),
          },
        });

      const result = await converterService.convertPDF(mockPdfPath);

      TestAssertions.assertSuccessfulConversion(result);

      // Verify retry was attempted and succeeded
      expect(mockOllama.mockChat).toHaveBeenCalledTimes(2);
      expect(result.data!.content.analysis.matches[0].matchId).toBe(
        "recovery-match"
      );
    });
  });

  describe("Configuration Impact on Pipeline", () => {
    it("should respect timeout configurations in pipeline execution", async () => {
      // Create service with very short timeout
      const shortTimeoutConfig = createTestConfig({
        ollama: { ...testConfig.ollama, timeout: 50 },
      });
      const timeoutService = new PDFConverterService(shortTimeoutConfig);

      const tempDir = await tempManager.createTempDir("timeout-config-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "timeout-test.pdf",
        Buffer.from("Mock PDF")
      );

      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Timeout test content"),
      };
      (timeoutService as any).pdfReader = mockPdfReader;

      // Mock AI to take longer than timeout
      mockOllama.mockList.mockResolvedValue([]);
      mockOllama.mockChat.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const result = await timeoutService.convertPDF(mockPdfPath);

      TestAssertions.assertFailedConversion(result);
      expect(result.error!.step).toBe(ProcessingStep.AI_ANALYSIS);
      expect(result.error!.message).toContain("timeout");
    });

    it("should respect retry configurations in pipeline execution", async () => {
      // Create service with specific retry configuration
      const retryConfig = createTestConfig({
        ollama: {
          ...testConfig.ollama,
          retryAttempts: 3,
          retryDelay: 10,
        },
      });
      const retryService = new PDFConverterService(retryConfig);

      const tempDir = await tempManager.createTempDir("retry-config-");
      const mockPdfPath = await tempManager.createTempFile(
        tempDir,
        "retry-test.pdf",
        Buffer.from("Mock PDF")
      );

      const mockPdfReader = {
        validatePDF: vi.fn().mockResolvedValue(true),
        extractText: vi.fn().mockResolvedValue("Retry test content"),
      };
      (retryService as any).pdfReader = mockPdfReader;

      // Mock AI to always fail
      mockOllama.mockList.mockResolvedValue([]);
      mockOllama.mockChat.mockRejectedValue(new Error("Persistent failure"));

      const result = await retryService.convertPDF(mockPdfPath);

      TestAssertions.assertFailedConversion(result);

      // Verify retry attempts were made (3 attempts + 1 initial = 4 total)
      expect(mockOllama.mockChat).toHaveBeenCalledTimes(3);
    });
  });
});
