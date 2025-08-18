/**
 * Configuration management for PDF to JSON converter
 * Handles loading, validation, and environment variable integration
 */

import { ConverterConfig, DEFAULT_CONFIG, LogLevel, ErrorCode } from "./types";

/**
 * Configuration validation error
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.CONFIGURATION_ERROR
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Load configuration from environment variables and defaults
 */
export function loadConfig(): ConverterConfig {
  const config: ConverterConfig = {
    ollama: {
      host: process.env.OLLAMA_HOST || DEFAULT_CONFIG.ollama.host,
      model: process.env.OLLAMA_MODEL || DEFAULT_CONFIG.ollama.model,
      timeout:
        parseInt(process.env.OLLAMA_TIMEOUT || "") ||
        DEFAULT_CONFIG.ollama.timeout,
      retryAttempts:
        parseInt(process.env.OLLAMA_RETRY_ATTEMPTS || "") ||
        DEFAULT_CONFIG.ollama.retryAttempts,
      retryDelay:
        parseInt(process.env.OLLAMA_RETRY_DELAY || "") ||
        DEFAULT_CONFIG.ollama.retryDelay,
    },
    paths: {
      sourceDir: process.env.SOURCE_DIR || DEFAULT_CONFIG.paths.sourceDir,
      outputDir: process.env.OUTPUT_DIR || DEFAULT_CONFIG.paths.outputDir,
      tempDir: process.env.TEMP_DIR || DEFAULT_CONFIG.paths.tempDir,
    },
    processing: {
      maxTextLength:
        parseInt(process.env.MAX_TEXT_LENGTH || "") ||
        DEFAULT_CONFIG.processing.maxTextLength,
      chunkSize:
        parseInt(process.env.CHUNK_SIZE || "") ||
        DEFAULT_CONFIG.processing.chunkSize,
      enableBatchProcessing:
        process.env.ENABLE_BATCH_PROCESSING === "false"
          ? false
          : DEFAULT_CONFIG.processing.enableBatchProcessing,
      maxConcurrentFiles:
        parseInt(process.env.MAX_CONCURRENT_FILES || "") ||
        DEFAULT_CONFIG.processing.maxConcurrentFiles,
    },
    logging: {
      level:
        (process.env.LOG_LEVEL as LogLevel) || DEFAULT_CONFIG.logging.level,
      enableFileLogging:
        process.env.ENABLE_FILE_LOGGING === "true" ||
        DEFAULT_CONFIG.logging.enableFileLogging,
      logDir: process.env.LOG_DIR || DEFAULT_CONFIG.logging.logDir,
    },
  };

  validateConfig(config);
  return config;
}

/**
 * Validate configuration values
 */
export function validateConfig(config: ConverterConfig): void {
  // Validate Ollama configuration
  if (!config.ollama.host) {
    throw new ConfigurationError("Ollama host is required");
  }

  // Validate Ollama host URL format
  try {
    new URL(config.ollama.host);
  } catch {
    throw new ConfigurationError(
      `Invalid Ollama host URL format: ${config.ollama.host}`
    );
  }

  if (!config.ollama.model) {
    throw new ConfigurationError("Ollama model is required");
  }

  // Validate model name format (basic validation)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(config.ollama.model)) {
    throw new ConfigurationError(
      `Invalid model name format: ${config.ollama.model}`
    );
  }

  if (config.ollama.timeout <= 0) {
    throw new ConfigurationError("Ollama timeout must be positive");
  }

  if (config.ollama.retryAttempts < 0) {
    throw new ConfigurationError("Retry attempts cannot be negative");
  }

  if (config.ollama.retryDelay < 0) {
    throw new ConfigurationError("Retry delay cannot be negative");
  }

  // Validate paths
  if (!config.paths.sourceDir) {
    throw new ConfigurationError("Source directory is required");
  }

  if (!config.paths.outputDir) {
    throw new ConfigurationError("Output directory is required");
  }

  // Validate that source and output directories are different
  if (config.paths.sourceDir === config.paths.outputDir) {
    throw new ConfigurationError(
      "Source and output directories must be different"
    );
  }

  // Validate temp directory if provided
  if (config.paths.tempDir && config.paths.tempDir === config.paths.sourceDir) {
    throw new ConfigurationError(
      "Temp directory cannot be the same as source directory"
    );
  }

  if (config.paths.tempDir && config.paths.tempDir === config.paths.outputDir) {
    throw new ConfigurationError(
      "Temp directory cannot be the same as output directory"
    );
  }

  // Validate processing configuration
  if (config.processing.maxTextLength <= 0) {
    throw new ConfigurationError("Max text length must be positive");
  }

  if (config.processing.chunkSize <= 0) {
    throw new ConfigurationError("Chunk size must be positive");
  }

  if (config.processing.chunkSize > config.processing.maxTextLength) {
    throw new ConfigurationError(
      "Chunk size cannot be larger than max text length"
    );
  }

  if (config.processing.maxConcurrentFiles <= 0) {
    throw new ConfigurationError("Max concurrent files must be positive");
  }

  // Validate reasonable limits
  if (config.processing.maxConcurrentFiles > 50) {
    throw new ConfigurationError(
      "Max concurrent files cannot exceed 50 for system stability"
    );
  }

  if (config.processing.maxTextLength > 10000000) {
    // 10MB
    throw new ConfigurationError(
      "Max text length cannot exceed 10MB for memory safety"
    );
  }

  if (config.ollama.timeout > 300000) {
    // 5 minutes
    throw new ConfigurationError("Ollama timeout cannot exceed 5 minutes");
  }

  if (config.ollama.retryAttempts > 10) {
    throw new ConfigurationError("Retry attempts cannot exceed 10");
  }

  // Validate logging configuration
  if (!Object.values(LogLevel).includes(config.logging.level)) {
    throw new ConfigurationError(`Invalid log level: ${config.logging.level}`);
  }

  // Validate log directory if file logging is enabled
  if (config.logging.enableFileLogging && !config.logging.logDir) {
    throw new ConfigurationError(
      "Log directory is required when file logging is enabled"
    );
  }
}

/**
 * Get configuration with environment variable overrides
 */
export function getConfig(): ConverterConfig {
  try {
    return loadConfig();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(
      `Failed to load configuration: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate configuration on startup with detailed error reporting
 */
export function validateStartupConfig(): ConverterConfig {
  try {
    const config = loadConfig();
    console.log("✓ Configuration loaded successfully");

    // Log configuration summary (without sensitive data)
    console.log("Configuration summary:");
    console.log(`  - Ollama host: ${config.ollama.host}`);
    console.log(`  - Ollama model: ${config.ollama.model}`);
    console.log(`  - Source directory: ${config.paths.sourceDir}`);
    console.log(`  - Output directory: ${config.paths.outputDir}`);
    console.log(`  - Log level: ${config.logging.level}`);
    console.log(
      `  - Batch processing: ${config.processing.enableBatchProcessing ? "enabled" : "disabled"}`
    );

    return config;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error("❌ Configuration Error:", error.message);
      console.error(
        "\nPlease check your environment variables or configuration settings."
      );
      console.error("Available environment variables:");
      console.error("  - OLLAMA_HOST (default: http://127.0.0.1:11434)");
      console.error("  - OLLAMA_MODEL (default: gemma2:2b)");
      console.error("  - OLLAMA_TIMEOUT (default: 30000)");
      console.error("  - SOURCE_DIR (default: ./source)");
      console.error("  - OUTPUT_DIR (default: ./output)");
      console.error("  - LOG_LEVEL (default: info)");
      console.error("  - MAX_TEXT_LENGTH (default: 50000)");
      console.error("  - CHUNK_SIZE (default: 4000)");
      console.error("  - ENABLE_BATCH_PROCESSING (default: true)");
      console.error("  - MAX_CONCURRENT_FILES (default: 3)");
      throw error;
    }

    const configError = new ConfigurationError(
      `Unexpected error during configuration loading: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    console.error("❌ Unexpected Configuration Error:", configError.message);
    throw configError;
  }
}

/**
 * Create a partial configuration for testing
 */
export function createTestConfig(
  overrides: Partial<ConverterConfig> = {}
): ConverterConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    ollama: {
      ...DEFAULT_CONFIG.ollama,
      ...overrides.ollama,
    },
    paths: {
      ...DEFAULT_CONFIG.paths,
      ...overrides.paths,
    },
    processing: {
      ...DEFAULT_CONFIG.processing,
      ...overrides.processing,
    },
    logging: {
      ...DEFAULT_CONFIG.logging,
      ...overrides.logging,
    },
  };
}
