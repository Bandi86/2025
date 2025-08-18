/**
 * Test utilities and helpers for PDF converter tests
 * Provides common mocks, fixtures, and test data generation
 */

import { vi } from "vitest";
import path from "path";
import fs from "fs/promises";
import {
  ConverterConfig,
  DEFAULT_CONFIG,
  ConversionResult,
  ProcessedDocument,
  FootballMatch,
} from "../types";

/**
 * Test configuration factory
 */
export function createTestConfig(
  overrides: Partial<ConverterConfig> = {}
): ConverterConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    ollama: {
      ...DEFAULT_CONFIG.ollama,
      timeout: 1000, // Shorter timeout for tests
      retryAttempts: 2,
      retryDelay: 10,
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
      level: "error", // Reduce noise in tests
      ...overrides.logging,
    },
  };
}

/**
 * Mock Ollama client factory
 */
export function createMockOllamaClient() {
  const mockList = vi.fn();
  const mockChat = vi.fn();

  // Default successful responses
  mockList.mockResolvedValue([]);
  mockChat.mockResolvedValue({
    message: {
      content: JSON.stringify({
        matches: [createMockFootballMatch()],
      }),
    },
  });

  return {
    mockList,
    mockChat,
    mockImplementation: {
      list: mockList,
      chat: mockChat,
    },
  };
}

/**
 * Create mock football match data
 */
export function createMockFootballMatch(
  overrides: Partial<FootballMatch> = {}
): FootballMatch {
  return {
    matchId: "test-match-123",
    homeTeam: "Team A",
    awayTeam: "Team B",
    date: "2025-01-15",
    time: "15:30",
    country: "USA",
    league: "Test League",
    round: 1,
    odds: [
      {
        id: "odds-1",
        homeWin: 2.5,
        draw: 3.2,
        awayWin: 2.8,
      },
    ],
    markets: [
      {
        id: "market-1",
        name: "Match Winner",
        odds: [2.5, 3.2, 2.8],
      },
    ],
    ...overrides,
  };
}

/**
 * Create mock processed document
 */
export function createMockProcessedDocument(
  overrides: Partial<ProcessedDocument> = {}
): ProcessedDocument {
  return {
    metadata: {
      originalFile: "test.pdf",
      processedAt: new Date().toISOString(),
      textLength: 1000,
      processingTimeMs: 500,
      ...overrides.metadata,
    },
    content: {
      originalText: "Sample football match text content",
      analysis: {
        matches: [createMockFootballMatch()],
      },
      ...overrides.content,
    },
    status: "success",
    ...overrides,
  };
}

/**
 * Create mock conversion result
 */
export function createMockConversionResult(
  success: boolean = true,
  overrides: Partial<ConversionResult> = {}
): ConversionResult {
  if (success) {
    return {
      success: true,
      data: createMockProcessedDocument(),
      ...overrides,
    };
  } else {
    return {
      success: false,
      error: {
        code: "TEST_ERROR",
        message: "Test error message",
        step: "pdf-extraction",
        details: "Test error details",
      },
      ...overrides,
    };
  }
}

/**
 * Temporary directory manager for tests
 */
export class TempDirectoryManager {
  private tempDirs: string[] = [];

  async createTempDir(prefix: string = "test-"): Promise<string> {
    const tempDir = path.join(
      __dirname,
      `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
    await fs.mkdir(tempDir, { recursive: true });
    this.tempDirs.push(tempDir);
    return tempDir;
  }

  async createTempFile(
    dir: string,
    filename: string,
    content: string | Buffer
  ): Promise<string> {
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, content);
    return filePath;
  }

  async copyFixture(
    fixtureName: string,
    targetDir: string,
    targetName?: string
  ): Promise<string> {
    const fixturePath = path.join(__dirname, "fixtures", fixtureName);
    const targetPath = path.join(targetDir, targetName || fixtureName);

    try {
      await fs.copyFile(fixturePath, targetPath);
      return targetPath;
    } catch (error) {
      throw new Error(`Failed to copy fixture ${fixtureName}: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    for (const dir of this.tempDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to cleanup temp directory ${dir}:`, error);
      }
    }
    this.tempDirs = [];
  }
}

/**
 * Mock console methods for testing
 */
export function mockConsole() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log = vi.fn().mockImplementation((message: string) => {
    logs.push(message);
    originalLog(message);
  });

  console.error = vi.fn().mockImplementation((message: string) => {
    errors.push(message);
    originalError(message);
  });

  console.warn = vi.fn().mockImplementation((message: string) => {
    warnings.push(message);
    originalWarn(message);
  });

  return {
    logs,
    errors,
    warnings,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}

/**
 * Wait for a specified amount of time (for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a promise that rejects after a timeout
 */
export function createTimeoutPromise<T>(
  ms: number,
  message: string = "Operation timed out"
): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Test data generators
 */
export const TestData = {
  /**
   * Generate sample PDF text content
   */
  generatePDFText(matchCount: number = 1): string {
    const matches = Array.from(
      { length: matchCount },
      (_, i) => `
      Match ${i + 1}: Team A vs Team B
      Date: 2025-01-${15 + i}
      Time: 15:30
      League: Test League
      Country: USA
      Odds: 2.5 / 3.2 / 2.8
    `
    ).join("\n");

    return `Football Match Information\n${matches}`;
  },

  /**
   * Generate malformed JSON response
   */
  generateMalformedJSON(): string {
    return '{"matches": [{"matchId": "incomplete"';
  },

  /**
   * Generate valid but empty response
   */
  generateEmptyResponse(): string {
    return JSON.stringify({ matches: [] });
  },

  /**
   * Generate response with invalid match data
   */
  generateInvalidMatchData(): string {
    return JSON.stringify({
      matches: [
        {
          // Missing required fields
          homeTeam: "Team A",
          awayTeam: "Team B",
        },
      ],
    });
  },
};

/**
 * Assertion helpers
 */
export const TestAssertions = {
  /**
   * Assert that a conversion result is successful
   */
  assertSuccessfulConversion(
    result: ConversionResult
  ): asserts result is ConversionResult & { success: true } {
    if (!result.success) {
      throw new Error(
        `Expected successful conversion but got error: ${result.error?.message}`
      );
    }
  },

  /**
   * Assert that a conversion result failed
   */
  assertFailedConversion(
    result: ConversionResult
  ): asserts result is ConversionResult & { success: false } {
    if (result.success) {
      throw new Error("Expected failed conversion but got success");
    }
  },

  /**
   * Assert that processed document has valid structure
   */
  assertValidProcessedDocument(doc: ProcessedDocument): void {
    if (!doc.metadata) {
      throw new Error("ProcessedDocument missing metadata");
    }
    if (!doc.content) {
      throw new Error("ProcessedDocument missing content");
    }
    if (!doc.status) {
      throw new Error("ProcessedDocument missing status");
    }
    if (!doc.metadata.originalFile) {
      throw new Error("ProcessedDocument metadata missing originalFile");
    }
    if (!doc.metadata.processedAt) {
      throw new Error("ProcessedDocument metadata missing processedAt");
    }
  },
};

/**
 * Performance testing utilities
 */
export class PerformanceTracker {
  private startTime: number = 0;
  private measurements: { [key: string]: number } = {};

  start(): void {
    this.startTime = Date.now();
  }

  mark(label: string): void {
    this.measurements[label] = Date.now() - this.startTime;
  }

  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  getMeasurement(label: string): number {
    return this.measurements[label] || 0;
  }

  getAllMeasurements(): { [key: string]: number } {
    return { ...this.measurements };
  }

  reset(): void {
    this.startTime = 0;
    this.measurements = {};
  }
}

/**
 * File system test utilities
 */
export const FileSystemUtils = {
  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  },

  /**
   * Read JSON file and parse
   */
  async readJSONFile<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  },

  /**
   * Create directory structure
   */
  async createDirectoryStructure(
    basePath: string,
    structure: string[]
  ): Promise<void> {
    for (const dir of structure) {
      await fs.mkdir(path.join(basePath, dir), { recursive: true });
    }
  },
};
