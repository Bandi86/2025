/**
 * Core interfaces and types for PDF to JSON converter
 * This file defines all the interfaces, types, and configurations
 * used throughout the PDF conversion pipeline.
 */

// ============================================================================
// CORE COMPONENT INTERFACES
// ============================================================================

/**
 * Interface for PDF reading and text extraction
 */
export interface PDFReader {
  extractText(filePath: string): Promise<string>;
  validatePDF(filePath: string): Promise<boolean>;
}

/**
 * Interface for Gemma AI client operations
 */
export interface GemmaClient {
  analyzeText(text: string): Promise<AnalysisResult>;
  formatPrompt(text: string): string;
  testConnection(): Promise<boolean>;
}

/**
 * Interface for JSON generation and validation
 */
export interface JSONGenerator {
  generateOutput(originalText: string, analysis: any): Promise<ConversionResult>;
  validateOutput(data: any): boolean;
}

/**
 * Interface for the main converter service
 */
export interface ConverterService {
  convertPDF(filePath: string): Promise<ConversionResult>;
  processBatch(directoryPath: string): Promise<ConversionResult[]>;
}

// ============================================================================
// DATA MODELS
// ============================================================================

/**
 * Main result structure for PDF conversion
 */
export interface ProcessedDocument {
  metadata: DocumentMetadata;
  content: DocumentContent;
  status: ProcessingStatus;
}

/**
 * Metadata about the processed document
 */
export interface DocumentMetadata {
  originalFile: string;
  processedAt: string;
  textLength: number;
  processingTimeMs: number;
}

/**
 * Content structure containing original text and analysis
 */
export interface DocumentContent {
  originalText: string;
  analysis: FootballMatchData | GenericAnalysis;
}

/**
 * Processing status enumeration
 */
export type ProcessingStatus = "success" | "partial" | "failed";

/**
 * Football match data structure
 */
export interface FootballMatchData {
  matches: FootballMatch[];
  totalMatches: number;
}

/**
 * Individual football match information
 */
export interface FootballMatch {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  country: string;
  league: string;
  round: number;
  odds: MatchOdds[];
  markets: Market[];
}

/**
 * Match odds structure
 */
export interface MatchOdds {
  id: string;
  homeWin: number;
  draw: number;
  awayWin: number;
}

/**
 * Market information for betting
 */
export interface Market {
  id: string;
  name: string;
  odds: number[];
}

/**
 * Generic analysis result for non-football content
 */
export interface GenericAnalysis {
  type: string;
  summary: string;
  extractedData: Record<string, any>;
}

// ============================================================================
// RESULT AND ERROR TYPES
// ============================================================================

/**
 * Standard result structure for operations
 */
export interface ConversionResult {
  success: boolean;
  data?: ProcessedDocument;
  error?: ErrorDetails;
}

/**
 * Analysis result from AI processing
 */
export interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTimeMs?: number;
}

/**
 * Detailed error information
 */
export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
  step: ProcessingStep;
  timestamp: string;
}

/**
 * Error codes for different failure types
 */
export enum ErrorCode {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  INVALID_PDF = "INVALID_PDF",
  PDF_EXTRACTION_FAILED = "PDF_EXTRACTION_FAILED",
  AI_SERVICE_UNAVAILABLE = "AI_SERVICE_UNAVAILABLE",
  AI_ANALYSIS_FAILED = "AI_ANALYSIS_FAILED",
  JSON_GENERATION_FAILED = "JSON_GENERATION_FAILED",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

/**
 * Processing steps for error tracking
 */
export enum ProcessingStep {
  PDF_VALIDATION = "pdf-validation",
  PDF_EXTRACTION = "pdf-extraction", 
  AI_ANALYSIS = "ai-analysis",
  JSON_GENERATION = "json-generation",
  OUTPUT_VALIDATION = "output-validation"
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Main configuration interface
 */
export interface ConverterConfig {
  ollama: OllamaConfig;
  paths: PathConfig;
  processing: ProcessingConfig;
  logging: LoggingConfig;
}

/**
 * Ollama service configuration
 */
export interface OllamaConfig {
  host: string;
  model: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * File path configuration
 */
export interface PathConfig {
  sourceDir: string;
  outputDir: string;
  tempDir?: string;
}

/**
 * Processing behavior configuration
 */
export interface ProcessingConfig {
  maxTextLength: number;
  chunkSize: number;
  enableBatchProcessing: boolean;
  maxConcurrentFiles: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: LogLevel;
  enableFileLogging: boolean;
  logDir?: string;
}

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = "error",
  WARN = "warn", 
  INFO = "info",
  DEBUG = "debug"
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ConverterConfig = {
  ollama: {
    host: "http://127.0.0.1:11434",
    model: "gemma2:2b",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  paths: {
    sourceDir: "./source",
    outputDir: "./output"
  },
  processing: {
    maxTextLength: 50000,
    chunkSize: 4000,
    enableBatchProcessing: true,
    maxConcurrentFiles: 3
  },
  logging: {
    level: LogLevel.INFO,
    enableFileLogging: false
  }
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Batch processing result
 */
export interface BatchResult {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  results: ConversionResult[];
  processingTimeMs: number;
}

/**
 * Health check result for services
 */
export interface HealthCheckResult {
  service: string;
  healthy: boolean;
  responseTimeMs?: number;
  error?: string;
}

/**
 * Processing metrics
 */
export interface ProcessingMetrics {
  totalProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  errorCounts: Record<ErrorCode, number>;
}