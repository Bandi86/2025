/**
 * Integration tests for Gemma AI Client
 * These tests verify the actual functionality without complex mocking
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GemmaAIClient } from "../gemma-client";
import { ConverterConfig, DEFAULT_CONFIG } from "../types";

describe("GemmaAIClient Integration", () => {
  let client: GemmaAIClient;
  let testConfig: ConverterConfig;

  beforeEach(() => {
    // Create test configuration
    testConfig = {
      ...DEFAULT_CONFIG,
      ollama: {
        ...DEFAULT_CONFIG.ollama,
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 100,
      },
    };

    client = new GemmaAIClient(testConfig);
  });

  describe("Configuration", () => {
    it("should return current configuration", () => {
      const config = client.getConfig();

      expect(config).toEqual(testConfig);
      expect(config).not.toBe(testConfig); // Should be a copy
    });

    it("should track connection status initially as false", () => {
      expect(client.isConnected()).toBe(false);
    });
  });

  describe("Prompt Formatting", () => {
    it("should format prompt correctly", () => {
      const text = "Sample football match text";
      const prompt = client.formatPrompt(text);

      expect(prompt).toContain("analyze the following text");
      expect(prompt).toContain(text);
      expect(prompt).toContain("JSON format");
    });

    it("should truncate long text", () => {
      const longText = "a".repeat(10000);
      const prompt = client.formatPrompt(longText);

      expect(prompt.length).toBeLessThan(longText.length + 1000);
      expect(prompt).toContain("...");
    });

    it("should handle text within chunk size", () => {
      const normalText = "Sample football match text";
      const prompt = client.formatPrompt(normalText);

      expect(prompt).toContain(normalText);
      expect(prompt).not.toContain("...");
    });
  });

  describe("Input Validation", () => {
    it("should handle empty text input", async () => {
      const result = await client.analyzeText("");

      expect(result.success).toBe(false);
      expect(result.error).toContain("empty or invalid");
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("should handle null or undefined text", async () => {
      const result1 = await client.analyzeText(null as any);
      const result2 = await client.analyzeText(undefined as any);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it("should handle whitespace-only text", async () => {
      const result = await client.analyzeText("   \n\t   ");

      expect(result.success).toBe(false);
      expect(result.error).toContain("empty or invalid");
    });
  });

  describe("Text Chunking", () => {
    it("should handle text longer than chunk size", () => {
      const longText = "a".repeat(testConfig.processing.chunkSize + 1000);
      const prompt = client.formatPrompt(longText);

      // Should be truncated
      expect(prompt).toContain("...");
      expect(prompt.length).toBeLessThan(longText.length);
    });

    it("should preserve text shorter than chunk size", () => {
      const shortText = "Short football match text";
      const prompt = client.formatPrompt(shortText);

      expect(prompt).toContain(shortText);
      expect(prompt).not.toContain("...");
    });
  });

  describe("Error Handling", () => {
    it("should return error for connection failure when Ollama is not available", async () => {
      // This test assumes Ollama is not running
      const result = await client.analyzeText("Sample text");

      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it("should handle connection test gracefully", async () => {
      // Test connection (may succeed or fail depending on Ollama availability)
      const isConnected = await client.testConnection();

      expect(typeof isConnected).toBe("boolean");
      expect(client.isConnected()).toBe(isConnected);
    });
  });
});
