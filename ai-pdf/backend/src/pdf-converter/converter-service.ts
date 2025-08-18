/**
 * Main Converter Service
 * Orchestrates the complete PDF to JSON conversion pipeline
 */

import path from "path";
import fs from "fs/promises";
import {
  ConverterService,
  ConversionResult,
  ProcessedDocument,
  ConverterConfig,
  ErrorCode,
  ProcessingStep,
  ErrorDetails,
  BatchResult,
  ProcessingMetrics,
  HealthCheckResult,
} from "./types";
import { PDFReaderImpl } from "./pdf-reader";
import { GemmaAIClient } from "./gemma-client";
import { JSONGeneratorService } from "./json-generator";
import { loadConfig } from "./config";
import { converterServiceLogger } from "./logger";
import {
  metricsCollector,
  recordConversionSuccess,
  recordConversionFailure,
  recordStepTiming,
  recordError,
} from "./metrics";

/**
 * Main converter service implementation
 */
export class PDFConverterService implements ConverterService {
  private pdfReader: PDFReaderImpl;
  private gemmaClient: GemmaAIClient;
  private jsonGenerator: JSONGeneratorService;
  private config: ConverterConfig;
  private metrics: ProcessingMetrics;

  constructor(config?: ConverterConfig) {
    this.config = config || loadConfig();
    this.pdfReader = new PDFReaderImpl();
    this.gemmaClient = new GemmaAIClient(this.config);
    this.jsonGenerator = new JSONGeneratorService();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Convert a single PDF file to JSON
   * Main conversion pipeline that orchestrates all components
   */
  async convertPDF(filePath: string): Promise<ConversionResult> {
    const startTime = Date.now();
    const absolutePath = path.resolve(filePath);
    const operationId = `convert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Start operation tracking
    converterServiceLogger.startOperation(operationId, "convertPDF", {
      filePath: absolutePath,
    });

    try {
      converterServiceLogger.info("Starting PDF conversion", {
        operation: "convertPDF",
        filePath: absolutePath,
      });

      // Step 1: PDF Validation and Text Extraction
      converterServiceLogger.info("Starting PDF text extraction", {
        operation: "convertPDF",
        processingStep: ProcessingStep.PDF_EXTRACTION,
        filePath: absolutePath,
      });

      const extractionStartTime = Date.now();
      const extractedText = await this.extractTextFromPDF(absolutePath);
      const extractionTime = Date.now() - extractionStartTime;

      recordStepTiming(ProcessingStep.PDF_EXTRACTION, extractionTime);
      converterServiceLogger.info("PDF text extraction completed", {
        operation: "convertPDF",
        processingStep: ProcessingStep.PDF_EXTRACTION,
        filePath: absolutePath,
        duration: extractionTime,
        metadata: { textLength: extractedText.length },
      });

      // Step 2: AI Analysis
      converterServiceLogger.info("Starting AI analysis", {
        operation: "convertPDF",
        processingStep: ProcessingStep.AI_ANALYSIS,
        filePath: absolutePath,
        metadata: { textLength: extractedText.length },
      });

      const analysisStartTime = Date.now();
      const analysisResult = await this.analyzeTextWithAI(extractedText);
      const analysisTime = Date.now() - analysisStartTime;

      recordStepTiming(ProcessingStep.AI_ANALYSIS, analysisTime);
      converterServiceLogger.info("AI analysis completed", {
        operation: "convertPDF",
        processingStep: ProcessingStep.AI_ANALYSIS,
        filePath: absolutePath,
        duration: analysisTime,
      });

      // Step 3: JSON Generation
      converterServiceLogger.info("Starting JSON generation", {
        operation: "convertPDF",
        processingStep: ProcessingStep.JSON_GENERATION,
        filePath: absolutePath,
      });

      const jsonStartTime = Date.now();
      const jsonResult = await this.generateJSONOutput(
        extractedText,
        analysisResult,
        absolutePath
      );
      const jsonTime = Date.now() - jsonStartTime;

      recordStepTiming(ProcessingStep.JSON_GENERATION, jsonTime);

      if (!jsonResult.success || !jsonResult.data) {
        converterServiceLogger.error("JSON generation failed", undefined, {
          operation: "convertPDF",
          processingStep: ProcessingStep.JSON_GENERATION,
          filePath: absolutePath,
          duration: jsonTime,
        });

        const processingTime = Date.now() - startTime;
        recordConversionFailure(processingTime);
        converterServiceLogger.endOperation(
          operationId,
          false,
          this.getErrorCode(jsonResult.error)
        );

        return jsonResult;
      }

      // Update processing time
      const processingTime = Date.now() - startTime;
      jsonResult.data.metadata.processingTimeMs = processingTime;

      // Record successful conversion
      recordConversionSuccess(processingTime);
      this.updateMetrics(true, processingTime);

      converterServiceLogger.info("PDF conversion completed successfully", {
        operation: "convertPDF",
        filePath: absolutePath,
        duration: processingTime,
        metadata: {
          textLength: extractedText.length,
          extractionTime,
          analysisTime,
          jsonTime,
        },
      });

      converterServiceLogger.endOperation(operationId, true);
      return jsonResult;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorCode = this.getErrorCode(error);
      const processingStep = this.getProcessingStep(error);

      // Record failed conversion and error
      recordConversionFailure(processingTime);
      recordError(errorCode, processingStep);
      this.updateMetrics(false, processingTime, errorCode);

      converterServiceLogger.error("PDF conversion failed", error as Error, {
        operation: "convertPDF",
        filePath: absolutePath,
        duration: processingTime,
        errorCode,
        processingStep,
      });

      converterServiceLogger.endOperation(operationId, false, errorCode);

      return this.createErrorResult(
        errorCode,
        `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        processingStep,
        error
      );
    }
  }

  /**
   * Process multiple PDF files in a directory
   */
  async processBatch(directoryPath: string): Promise<ConversionResult[]> {
    const startTime = Date.now();
    const absoluteDir = path.resolve(directoryPath);
    const operationId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Start batch operation tracking
    converterServiceLogger.startOperation(operationId, "processBatch", {
      filePath: absoluteDir,
    });

    try {
      converterServiceLogger.info("Starting batch processing", {
        operation: "processBatch",
        filePath: absoluteDir,
      });

      // Get all PDF files in directory
      const pdfFiles = await this.getPDFFiles(absoluteDir);

      if (pdfFiles.length === 0) {
        converterServiceLogger.warn("No PDF files found in directory", {
          operation: "processBatch",
          filePath: absoluteDir,
        });
        converterServiceLogger.endOperation(operationId, true);
        return [];
      }

      converterServiceLogger.info("Found PDF files for batch processing", {
        operation: "processBatch",
        filePath: absoluteDir,
        metadata: { fileCount: pdfFiles.length },
      });

      // Process files with concurrency control
      const results = await this.processFilesWithConcurrency(pdfFiles);

      const processingTime = Date.now() - startTime;
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      // Record batch processing metrics
      metricsCollector.recordBatchProcessing(
        pdfFiles.length,
        processingTime,
        successCount
      );

      converterServiceLogger.info("Batch processing completed", {
        operation: "processBatch",
        filePath: absoluteDir,
        duration: processingTime,
        metadata: {
          totalFiles: results.length,
          successCount,
          failureCount,
          successRate: (successCount / results.length) * 100,
        },
      });

      converterServiceLogger.endOperation(operationId, true);
      return results;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      converterServiceLogger.error("Batch processing failed", error as Error, {
        operation: "processBatch",
        filePath: absoluteDir,
        duration: processingTime,
      });

      converterServiceLogger.endOperation(
        operationId,
        false,
        ErrorCode.UNKNOWN_ERROR
      );

      const errorResult = this.createErrorResult(
        ErrorCode.UNKNOWN_ERROR,
        `Batch processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.PDF_VALIDATION,
        error
      );

      return [errorResult];
    }
  }

  /**
   * Extract text from PDF using PDF Reader component
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      // Validate PDF first
      const isValid = await this.pdfReader.validatePDF(filePath);
      if (!isValid) {
        throw this.createError(
          ErrorCode.INVALID_PDF,
          `PDF validation failed for: ${filePath}`,
          ProcessingStep.PDF_VALIDATION
        );
      }

      // Extract text
      const text = await this.pdfReader.extractText(filePath);

      if (!text || text.trim().length === 0) {
        throw this.createError(
          ErrorCode.PDF_EXTRACTION_FAILED,
          "No text content extracted from PDF",
          ProcessingStep.PDF_EXTRACTION
        );
      }

      console.log(`   Extracted ${text.length} characters of text`);
      return text;
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        throw error; // Re-throw our custom errors
      }

      throw this.createError(
        ErrorCode.PDF_EXTRACTION_FAILED,
        `PDF text extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.PDF_EXTRACTION,
        error
      );
    }
  }

  /**
   * Analyze text using Gemma AI client
   */
  private async analyzeTextWithAI(text: string): Promise<any> {
    try {
      // Test connection first
      const isConnected = await this.gemmaClient.testConnection();
      if (!isConnected) {
        throw this.createError(
          ErrorCode.AI_SERVICE_UNAVAILABLE,
          "Gemma AI service is not available",
          ProcessingStep.AI_ANALYSIS
        );
      }

      // Perform analysis
      const result = await this.gemmaClient.analyzeText(text);

      if (!result.success) {
        throw this.createError(
          ErrorCode.AI_ANALYSIS_FAILED,
          result.error || "AI analysis failed",
          ProcessingStep.AI_ANALYSIS
        );
      }

      console.log(
        `   AI analysis completed in ${result.processingTimeMs || 0}ms`
      );
      return result.data;
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        throw error; // Re-throw our custom errors
      }

      throw this.createError(
        ErrorCode.AI_ANALYSIS_FAILED,
        `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.AI_ANALYSIS,
        error
      );
    }
  }

  /**
   * Generate JSON output using JSON Generator component
   */
  private async generateJSONOutput(
    originalText: string,
    analysis: any,
    originalFile: string
  ): Promise<ConversionResult> {
    try {
      const result = await this.jsonGenerator.generateJSONOutput(
        originalText,
        analysis,
        originalFile
      );

      if (!result.success) {
        throw this.createError(
          ErrorCode.JSON_GENERATION_FAILED,
          result.error?.message || "JSON generation failed",
          ProcessingStep.JSON_GENERATION
        );
      }

      console.log(`   JSON output generated successfully`);
      return result;
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        throw error; // Re-throw our custom errors
      }

      throw this.createError(
        ErrorCode.JSON_GENERATION_FAILED,
        `JSON generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.JSON_GENERATION,
        error
      );
    }
  }

  /**
   * Get all PDF files from a directory
   */
  private async getPDFFiles(directoryPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(directoryPath);
      const pdfFiles = files
        .filter((file) => file.toLowerCase().endsWith(".pdf"))
        .map((file) => path.join(directoryPath, file));

      return pdfFiles;
    } catch (error) {
      throw new Error(
        `Failed to read directory ${directoryPath}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Process files with concurrency control
   */
  private async processFilesWithConcurrency(
    filePaths: string[]
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    const maxConcurrent = this.config.processing.maxConcurrentFiles;

    // Process files in batches
    for (let i = 0; i < filePaths.length; i += maxConcurrent) {
      const batch = filePaths.slice(i, i + maxConcurrent);

      console.log(
        `Processing batch ${Math.floor(i / maxConcurrent) + 1} (${batch.length} files)...`
      );

      // Process batch concurrently
      const batchPromises = batch.map(async (filePath) => {
        try {
          return await this.convertPDF(filePath);
        } catch (error) {
          // Handle individual file failures without stopping batch
          console.error(`Failed to process ${filePath}:`, error);
          return this.createErrorResult(
            ErrorCode.UNKNOWN_ERROR,
            `File processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            ProcessingStep.PDF_VALIDATION,
            error
          );
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Log batch progress
      const batchSuccessCount = batchResults.filter((r) => r.success).length;
      console.log(
        `   Batch completed: ${batchSuccessCount}/${batch.length} successful`
      );
    }

    return results;
  }

  /**
   * Health check for all components
   */
  async healthCheck(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Check Gemma AI service
    try {
      const startTime = Date.now();
      const isConnected = await this.gemmaClient.testConnection();
      const responseTime = Date.now() - startTime;

      results.push({
        service: "Gemma AI",
        healthy: isConnected,
        responseTimeMs: responseTime,
        error: isConnected ? undefined : "Connection failed",
      });
    } catch (error) {
      results.push({
        service: "Gemma AI",
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Check file system access
    try {
      await fs.access(this.config.paths.sourceDir);
      results.push({
        service: "Source Directory",
        healthy: true,
      });
    } catch (error) {
      results.push({
        service: "Source Directory",
        healthy: false,
        error: `Cannot access source directory: ${this.config.paths.sourceDir}`,
      });
    }

    try {
      await fs.mkdir(this.config.paths.outputDir, { recursive: true });
      results.push({
        service: "Output Directory",
        healthy: true,
      });
    } catch (error) {
      results.push({
        service: "Output Directory",
        healthy: false,
        error: `Cannot create output directory: ${this.config.paths.outputDir}`,
      });
    }

    return results;
  }

  /**
   * Get processing metrics
   */
  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset processing metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Get current configuration
   */
  getConfig(): ConverterConfig {
    return { ...this.config };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): ProcessingMetrics {
    return {
      totalProcessed: 0,
      successRate: 0,
      averageProcessingTime: 0,
      errorCounts: {} as Record<ErrorCode, number>,
    };
  }

  /**
   * Update processing metrics
   */
  private updateMetrics(
    success: boolean,
    processingTime: number,
    errorCode?: ErrorCode
  ): void {
    this.metrics.totalProcessed++;

    // Update success rate
    const successCount = Math.round(
      (this.metrics.successRate * (this.metrics.totalProcessed - 1)) / 100
    );
    const newSuccessCount = success ? successCount + 1 : successCount;
    this.metrics.successRate =
      (newSuccessCount / this.metrics.totalProcessed) * 100;

    // Update average processing time
    const totalTime =
      this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1);
    this.metrics.averageProcessingTime =
      (totalTime + processingTime) / this.metrics.totalProcessed;

    // Update error counts
    if (errorCode) {
      this.metrics.errorCounts[errorCode] =
        (this.metrics.errorCounts[errorCode] || 0) + 1;
    }
  }

  /**
   * Create standardized error
   */
  private createError(
    code: ErrorCode,
    message: string,
    step: ProcessingStep,
    originalError?: any
  ): Error {
    const errorDetails: ErrorDetails = {
      code,
      message,
      step,
      timestamp: new Date().toISOString(),
      details: originalError,
    };

    const error = new Error(message);
    (error as any).code = code;
    (error as any).step = step;
    (error as any).details = errorDetails;

    return error;
  }

  /**
   * Create error result
   */
  private createErrorResult(
    code: ErrorCode,
    message: string,
    step: ProcessingStep,
    originalError?: any
  ): ConversionResult {
    const errorDetails: ErrorDetails = {
      code,
      message,
      step,
      timestamp: new Date().toISOString(),
      details: originalError,
    };

    return {
      success: false,
      error: errorDetails,
    };
  }

  /**
   * Extract error code from error object
   */
  private getErrorCode(error: any): ErrorCode {
    if (error && typeof error === "object" && "code" in error) {
      return error.code as ErrorCode;
    }
    return ErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Extract processing step from error object
   */
  private getProcessingStep(error: any): ProcessingStep {
    if (error && typeof error === "object" && "step" in error) {
      return error.step as ProcessingStep;
    }
    return ProcessingStep.PDF_VALIDATION;
  }
}
