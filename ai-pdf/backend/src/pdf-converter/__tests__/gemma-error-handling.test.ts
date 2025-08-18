/**
 * Error handling tests for Gemma AI Client
 * These tests verify error handling and retry logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GemmaAIClient } from "../gemma-client";
import { ConverterConfig, DEFAULT_CONFIG } from "../types";

// Mock console methods to avoid noise in test output
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("GemmaAIClient Error Handling", () => {
  let client: GemmaAIClient;
  let testConfig: ConverterConfig;

  beforeEach(() => {
    // Clear console mocks
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();

    // Create test configuration with short timeouts for faster tests
    testConfig = {
      ...DEFAULT_CONFIG,
      ollama: {
        ...DEFAULT_CONFIG.ollama,
        host: "http://127.0.0.1:11435", // Different port to force connection errors
        timeout: 1000,
        retryAttempts: 2,
        retryDelay: 50,
      },
    };

    client = new GemmaAIClient(testConfig);
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe("Connection Error Handling", () => {
    it("should handle connection failures gracefully", async () => {
      const result = await client.testConnection();

      expect(result).toBe(false);
      expect(client.isConnected()).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it("should return appropriate error when service is unavailable", async () => {
      const result = await client.analyzeText("Sample text");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe("Retry Logic", () => {
    it("should respect retry configuration", async () => {
      const startTime = Date.now();
      const result = await client.analyzeText("Sample text");
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");

      // Should have taken some time due to connection attempts
      expect(endTime - startTime).toBeGreaterThan(100);
    });

    it("should handle different retry configurations", async () => {
      // Test with no retries
      const noRetryConfig = {
        ...testConfig,
        ollama: {
          ...testConfig.ollama,
          retryAttempts: 0,
        },
      };

      const noRetryClient = new GemmaAIClient(noRetryConfig);
      const result = await noRetryClient.analyzeText("Sample text");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");
    });
  });

  describe("Input Validation Errors", () => {
    it("should handle various invalid inputs", async () => {
      const testCases = ["", "   ", "\n\t\r", null, undefined];

      for (const testCase of testCases) {
        const result = await client.analyzeText(testCase as any);
        expect(result.success).toBe(false);
        expect(result.error).toContain("empty or invalid");
      }
    });

    it("should provide consistent error structure", async () => {
      const result = await client.analyzeText("");

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("error");
      expect(result).toHaveProperty("processingTimeMs");
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
      expect(typeof result.processingTimeMs).toBe("number");
    });
  });

  describe("Timeout Handling", () => {
    it("should handle very short timeouts", async () => {
      const shortTimeoutConfig = {
        ...testConfig,
        ollama: {
          ...testConfig.ollama,
          timeout: 1, // Very short timeout
        },
      };

      const shortTimeoutClient = new GemmaAIClient(shortTimeoutConfig);
      const result = await shortTimeoutClient.analyzeText("Sample text");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Configuration Validation", () => {
    it("should handle invalid host configurations", async () => {
      const invalidConfigs = [
        { ...testConfig, ollama: { ...testConfig.ollama, host: "" } },
        {
          ...testConfig,
          ollama: { ...testConfig.ollama, host: "invalid-url" },
        },
        {
          ...testConfig,
          ollama: { ...testConfig.ollama, host: "http://nonexistent.domain" },
        },
      ];

      for (const config of invalidConfigs) {
        const testClient = new GemmaAIClient(config);
        const result = await testClient.testConnection();
        expect(result).toBe(false);
      }
    });

    it("should handle edge case configurations", async () => {
      const edgeCaseConfig = {
        ...testConfig,
        ollama: {
          ...testConfig.ollama,
          retryAttempts: 0,
          retryDelay: 0,
          timeout: 100,
        },
      };

      const edgeCaseClient = new GemmaAIClient(edgeCaseConfig);
      const result = await edgeCaseClient.analyzeText("Sample text");

      expect(result.success).toBe(false);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Logging", () => {
    it("should log connection errors appropriately", async () => {
      await client.testConnection();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Ollama connection test failed:"),
        expect.any(Error)
      );
    });

    it("should log analysis errors during retry attempts", async () => {
      await client.analyzeText("Sample text");

      // Should have logged warnings for retry attempts
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe("Error Recovery", () => {
    it("should maintain state after errors", async () => {
      // First call should fail
      const result1 = await client.analyzeText("Sample text");
      expect(result1.success).toBe(false);

      // Client should still be usable
      const result2 = await client.analyzeText("Another sample");
      expect(result2.success).toBe(false);

      // Configuration should remain unchanged
      const config = client.getConfig();
      expect(config.ollama.host).toBe(testConfig.ollama.host);
    });

    it("should handle multiple concurrent error scenarios", async () => {
      const promises = [
        client.analyzeText("Text 1"),
        client.analyzeText("Text 2"),
        client.analyzeText("Text 3"),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
