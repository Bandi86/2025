/**
 * PDF to JSON Converter - Main exports
 * This file provides a centralized export point for all types, interfaces,
 * and utilities used in the PDF conversion system.
 */

// Core types and interfaces
export * from "./types";

// Configuration management
export * from "./config";

// Error handling
export * from "./errors";

// Utility functions
export * from "./utils";

// Component implementations
export * from "./json-generator";

// Re-export commonly used types for convenience
export type {
  PDFReader,
  GemmaClient,
  JSONGenerator,
  ConverterService,
  ProcessedDocument,
  ConversionResult,
  FootballMatch,
  ConverterConfig,
} from "./types";
