/**
 * Tests for configuration management
 * Tests loading, validation, and environment variable integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadConfig,
  validateConfig,
  getConfig,
  createTestConfig,
  ConfigurationError,
  validateStartupConfig,
} from "../config";
import { ConverterConfig, LogLevel, DEFAULT_CONFIG } from "../types";

describe("Configuration Management", () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe("loadConfig", () => {
    it("should load default configuration when no environment variables are set", () => {
      // Clear relevant environment variables
      delete process.env.OLLAMA_HOST;
      delete process.env.OLLAMA_MODEL;
      delete process.env.OLLAMA_TIMEOUT;

      const config = loadConfig();

      expect(config.ollama.host).toBe(DEFAULT_CONFIG.ollama.host);
      expect(config.ollama.model).toBe(DEFAULT_CONFIG.ollama.model);
      expect(config.ollama.timeout).toBe(DEFAULT_CONFIG.ollama.timeout);
      expect(config.paths.sourceDir).toBe(DEFAULT_CONFIG.paths.sourceDir);
      expect(config.paths.outputDir).toBe(DEFAULT_CONFIG.paths.outputDir);
    });

    it("should override defaults with environment variables", () => {
      process.env.OLLAMA_HOST = "http://custom-host:11434";
      process.env.OLLAMA_MODEL = "custom-model";
      process.env.OLLAMA_TIMEOUT = "60000";
      process.env.SOURCE_DIR = "/custom/source";
      process.env.OUTPUT_DIR = "/custom/output";
      process.env.MAX_TEXT_LENGTH = "100000";
      process.env.LOG_LEVEL = "debug";

      const config = loadConfig();

      expect(config.ollama.host).toBe("http://custom-host:11434");
      expect(config.ollama.model).toBe("custom-model");
      expect(config.ollama.timeout).toBe(60000);
      expect(config.paths.sourceDir).toBe("/custom/source");
      expect(config.paths.outputDir).toBe("/custom/output");
      expect(config.processing.maxTextLength).toBe(100000);
      expect(config.logging.level).toBe(LogLevel.DEBUG);
    });

    it("should handle numeric environment variables correctly", () => {
      process.env.OLLAMA_TIMEOUT = "45000";
      process.env.OLLAMA_RETRY_ATTEMPTS = "5";
      process.env.OLLAMA_RETRY_DELAY = "2000";
      process.env.MAX_TEXT_LENGTH = "75000";
      process.env.CHUNK_SIZE = "5000";
      process.env.MAX_CONCURRENT_FILES = "10";

      const config = loadConfig();

      expect(config.ollama.timeout).toBe(45000);
      expect(config.ollama.retryAttempts).toBe(5);
      expect(config.ollama.retryDelay).toBe(2000);
      expect(config.processing.maxTextLength).toBe(75000);
      expect(config.processing.chunkSize).toBe(5000);
      expect(config.processing.maxConcurrentFiles).toBe(10);
    });

    it("should handle boolean environment variables correctly", () => {
      process.env.ENABLE_BATCH_PROCESSING = "false";
      process.env.ENABLE_FILE_LOGGING = "true";
      process.env.LOG_DIR = "/test/logs"; // Required when file logging is enabled

      const config = loadConfig();

      expect(config.processing.enableBatchProcessing).toBe(false);
      expect(config.logging.enableFileLogging).toBe(true);
      expect(config.logging.logDir).toBe("/test/logs");
    });

    it("should use defaults for invalid numeric environment variables", () => {
      process.env.OLLAMA_TIMEOUT = "invalid";
      process.env.MAX_TEXT_LENGTH = "not-a-number";

      const config = loadConfig();

      expect(config.ollama.timeout).toBe(DEFAULT_CONFIG.ollama.timeout);
      expect(config.processing.maxTextLength).toBe(
        DEFAULT_CONFIG.processing.maxTextLength
      );
    });
  });

  describe("validateConfig", () => {
    it("should validate a correct configuration without throwing", () => {
      const config = createTestConfig();
      expect(() => validateConfig(config)).not.toThrow();
    });

    it("should throw error for missing Ollama host", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, host: "" },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow("Ollama host is required");
    });

    it("should throw error for missing Ollama model", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, model: "" },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow("Ollama model is required");
    });

    it("should throw error for invalid timeout", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, timeout: 0 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Ollama timeout must be positive"
      );
    });

    it("should throw error for negative retry attempts", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, retryAttempts: -1 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Retry attempts cannot be negative"
      );
    });

    it("should throw error for negative retry delay", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, retryDelay: -1 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Retry delay cannot be negative"
      );
    });

    it("should throw error for missing source directory", () => {
      const config = createTestConfig({
        paths: { ...DEFAULT_CONFIG.paths, sourceDir: "" },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Source directory is required"
      );
    });

    it("should throw error for missing output directory", () => {
      const config = createTestConfig({
        paths: { ...DEFAULT_CONFIG.paths, outputDir: "" },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Output directory is required"
      );
    });

    it("should throw error for invalid max text length", () => {
      const config = createTestConfig({
        processing: { ...DEFAULT_CONFIG.processing, maxTextLength: 0 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Max text length must be positive"
      );
    });

    it("should throw error for invalid chunk size", () => {
      const config = createTestConfig({
        processing: { ...DEFAULT_CONFIG.processing, chunkSize: 0 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Chunk size must be positive"
      );
    });

    it("should throw error when chunk size is larger than max text length", () => {
      const config = createTestConfig({
        processing: {
          ...DEFAULT_CONFIG.processing,
          maxTextLength: 1000,
          chunkSize: 2000,
        },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Chunk size cannot be larger than max text length"
      );
    });

    it("should throw error for invalid max concurrent files", () => {
      const config = createTestConfig({
        processing: { ...DEFAULT_CONFIG.processing, maxConcurrentFiles: 0 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Max concurrent files must be positive"
      );
    });

    it("should throw error for invalid log level", () => {
      const config = createTestConfig({
        logging: { ...DEFAULT_CONFIG.logging, level: "invalid" as LogLevel },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Invalid log level: invalid"
      );
    });

    it("should throw error for invalid Ollama host URL", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, host: "invalid-url" },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Invalid Ollama host URL format"
      );
    });

    it("should throw error for invalid model name format", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, model: "invalid model name!" },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow("Invalid model name format");
    });

    it("should throw error when source and output directories are the same", () => {
      const config = createTestConfig({
        paths: {
          sourceDir: "/same/path",
          outputDir: "/same/path",
        },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Source and output directories must be different"
      );
    });

    it("should throw error when temp directory is same as source directory", () => {
      const config = createTestConfig({
        paths: {
          sourceDir: "/source",
          outputDir: "/output",
          tempDir: "/source",
        },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Temp directory cannot be the same as source directory"
      );
    });

    it("should throw error when temp directory is same as output directory", () => {
      const config = createTestConfig({
        paths: {
          sourceDir: "/source",
          outputDir: "/output",
          tempDir: "/output",
        },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Temp directory cannot be the same as output directory"
      );
    });

    it("should throw error for excessive max concurrent files", () => {
      const config = createTestConfig({
        processing: { ...DEFAULT_CONFIG.processing, maxConcurrentFiles: 100 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Max concurrent files cannot exceed 50"
      );
    });

    it("should throw error for excessive max text length", () => {
      const config = createTestConfig({
        processing: { ...DEFAULT_CONFIG.processing, maxTextLength: 20000000 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Max text length cannot exceed 10MB"
      );
    });

    it("should throw error for excessive timeout", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, timeout: 400000 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Ollama timeout cannot exceed 5 minutes"
      );
    });

    it("should throw error for excessive retry attempts", () => {
      const config = createTestConfig({
        ollama: { ...DEFAULT_CONFIG.ollama, retryAttempts: 15 },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Retry attempts cannot exceed 10"
      );
    });

    it("should throw error when file logging is enabled but no log directory is provided", () => {
      const config = createTestConfig({
        logging: {
          ...DEFAULT_CONFIG.logging,
          enableFileLogging: true,
          logDir: undefined,
        },
      });

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow(
        "Log directory is required when file logging is enabled"
      );
    });
  });

  describe("getConfig", () => {
    it("should return valid configuration", () => {
      const config = getConfig();
      expect(config).toBeDefined();
      expect(config.ollama).toBeDefined();
      expect(config.paths).toBeDefined();
      expect(config.processing).toBeDefined();
      expect(config.logging).toBeDefined();
    });

    it("should throw ConfigurationError for invalid configuration", () => {
      // Create a scenario where validation will fail by setting an invalid timeout
      process.env.OLLAMA_TIMEOUT = "-1";

      expect(() => getConfig()).toThrow(ConfigurationError);
    });
  });

  describe("createTestConfig", () => {
    it("should create default test configuration", () => {
      const config = createTestConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it("should merge overrides with defaults", () => {
      const overrides = {
        ollama: { host: "http://test-host:11434" },
        paths: { sourceDir: "/test/source" },
      };

      const config = createTestConfig(overrides);

      expect(config.ollama.host).toBe("http://test-host:11434");
      expect(config.ollama.model).toBe(DEFAULT_CONFIG.ollama.model); // Should keep default
      expect(config.paths.sourceDir).toBe("/test/source");
      expect(config.paths.outputDir).toBe(DEFAULT_CONFIG.paths.outputDir); // Should keep default
    });

    it("should handle nested overrides correctly", () => {
      const overrides = {
        ollama: { timeout: 60000 },
        processing: { maxTextLength: 100000 },
      };

      const config = createTestConfig(overrides);

      expect(config.ollama.timeout).toBe(60000);
      expect(config.ollama.host).toBe(DEFAULT_CONFIG.ollama.host); // Should keep default
      expect(config.processing.maxTextLength).toBe(100000);
      expect(config.processing.chunkSize).toBe(
        DEFAULT_CONFIG.processing.chunkSize
      ); // Should keep default
    });
  });

  describe("validateStartupConfig", () => {
    it("should return valid configuration and log success", () => {
      // Mock console.log to capture output
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config = validateStartupConfig();

      expect(config).toBeDefined();
      expect(config.ollama).toBeDefined();
      expect(config.paths).toBeDefined();
      expect(config.processing).toBeDefined();
      expect(config.logging).toBeDefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        "✓ Configuration loaded successfully"
      );
      expect(consoleSpy).toHaveBeenCalledWith("Configuration summary:");

      consoleSpy.mockRestore();
    });

    it("should throw ConfigurationError and log detailed error information", () => {
      // Mock console.error to capture output
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Set invalid configuration
      process.env.OLLAMA_TIMEOUT = "-1";

      expect(() => validateStartupConfig()).toThrow(ConfigurationError);

      // Check that the first call contains the error message
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(
        1,
        "❌ Configuration Error:",
        "Ollama timeout must be positive"
      );

      // Check that subsequent calls contain help information
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Please check your environment variables")
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Available environment variables:"
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("ConfigurationError", () => {
    it("should create error with message and default code", () => {
      const error = new ConfigurationError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("ConfigurationError");
      expect(error.code).toBe("CONFIGURATION_ERROR");
    });

    it("should create error with custom code", () => {
      const error = new ConfigurationError("Test error", "CUSTOM_ERROR" as any);
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("CUSTOM_ERROR");
    });
  });
});
