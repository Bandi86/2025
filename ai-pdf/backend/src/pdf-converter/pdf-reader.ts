import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";
import { PDFReader, ErrorCode, ProcessingStep, ErrorDetails } from "./types";
import { pdfReaderLogger } from "./logger";

/**
 * PDF Reader implementation for validating and extracting text from PDF files
 */
export class PDFReaderImpl implements PDFReader {
  private readonly maxFileSize: number;
  private readonly supportedExtensions: string[];

  constructor(maxFileSize: number = 50 * 1024 * 1024) {
    // 50MB default
    this.maxFileSize = maxFileSize;
    this.supportedExtensions = [".pdf"];
  }

  /**
   * Validates if a file exists and is a valid PDF
   * @param filePath - Path to the PDF file
   * @returns Promise<boolean> - True if valid PDF, false otherwise
   */
  async validatePDF(filePath: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      pdfReaderLogger.debug("Starting PDF validation", {
        operation: "validatePDF",
        filePath,
      });

      // Check if file exists
      await this.checkFileExists(filePath);

      // Check file extension
      this.validateFileExtension(filePath);

      // Check file size
      await this.validateFileSize(filePath);

      // Check if file is a valid PDF by reading its header
      await this.validatePDFFormat(filePath);

      const duration = Date.now() - startTime;
      pdfReaderLogger.info("PDF validation successful", {
        operation: "validatePDF",
        filePath,
        duration,
      });

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      pdfReaderLogger.error("PDF validation failed", error as Error, {
        operation: "validatePDF",
        filePath,
        duration,
      });
      return false;
    }
  }

  /**
   * Extracts text content from a PDF file
   * @param filePath - Path to the PDF file
   * @returns Promise<string> - Extracted text content
   */
  async extractText(filePath: string): Promise<string> {
    const startTime = Date.now();

    pdfReaderLogger.info("Starting PDF text extraction", {
      operation: "extractText",
      filePath,
    });

    // First validate the PDF - let validation errors bubble up
    try {
      await this.checkFileExists(filePath);
      this.validateFileExtension(filePath);
      await this.validateFileSize(filePath);
      await this.validatePDFFormat(filePath);
    } catch (error) {
      const duration = Date.now() - startTime;
      pdfReaderLogger.error(
        "PDF validation failed during extraction",
        error as Error,
        {
          operation: "extractText",
          filePath,
          duration,
        }
      );
      // Re-throw validation errors as-is
      throw error;
    }

    try {
      // Read the PDF file
      const dataBuffer = await fs.readFile(filePath);

      pdfReaderLogger.debug("PDF file read successfully", {
        operation: "extractText",
        filePath,
        metadata: { fileSize: dataBuffer.length },
      });

      // Extract text using pdf-parse
      const pdfData = await pdf(dataBuffer);

      // Clean and normalize the extracted text
      const cleanedText = this.cleanText(pdfData.text);

      if (!cleanedText || cleanedText.trim().length === 0) {
        throw this.createError(
          ErrorCode.PDF_EXTRACTION_FAILED,
          "No text content found in PDF",
          ProcessingStep.PDF_EXTRACTION
        );
      }

      const duration = Date.now() - startTime;
      pdfReaderLogger.info("PDF text extraction completed successfully", {
        operation: "extractText",
        filePath,
        duration,
        metadata: {
          textLength: cleanedText.length,
          pages: pdfData.numpages,
        },
      });

      return cleanedText;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof Error && "code" in error) {
        // Re-throw our custom errors with logging
        pdfReaderLogger.error("PDF text extraction failed", error, {
          operation: "extractText",
          filePath,
          duration,
        });
        throw error;
      }

      const extractionError = this.createError(
        ErrorCode.PDF_EXTRACTION_FAILED,
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.PDF_EXTRACTION,
        error
      );

      pdfReaderLogger.error("PDF text extraction failed", extractionError, {
        operation: "extractText",
        filePath,
        duration,
      });

      throw extractionError;
    }
  }

  /**
   * Checks if file exists and is accessible
   */
  private async checkFileExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
    } catch (error) {
      throw this.createError(
        ErrorCode.FILE_NOT_FOUND,
        `File not found or not readable: ${filePath}`,
        ProcessingStep.PDF_VALIDATION,
        error
      );
    }
  }

  /**
   * Validates file extension
   */
  private validateFileExtension(filePath: string): void {
    const extension = path.extname(filePath).toLowerCase();
    if (!this.supportedExtensions.includes(extension)) {
      throw this.createError(
        ErrorCode.INVALID_PDF,
        `Unsupported file extension: ${extension}. Supported: ${this.supportedExtensions.join(", ")}`,
        ProcessingStep.PDF_VALIDATION
      );
    }
  }

  /**
   * Validates file size
   */
  private async validateFileSize(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        throw this.createError(
          ErrorCode.INVALID_PDF,
          `File size (${stats.size} bytes) exceeds maximum allowed size (${this.maxFileSize} bytes)`,
          ProcessingStep.PDF_VALIDATION
        );
      }

      if (stats.size === 0) {
        throw this.createError(
          ErrorCode.INVALID_PDF,
          "File is empty",
          ProcessingStep.PDF_VALIDATION
        );
      }
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        throw error; // Re-throw our custom errors
      }

      throw this.createError(
        ErrorCode.INVALID_PDF,
        `Failed to check file size: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.PDF_VALIDATION,
        error
      );
    }
  }

  /**
   * Validates PDF format by checking file header
   */
  private async validatePDFFormat(filePath: string): Promise<void> {
    try {
      const buffer = Buffer.alloc(8);
      const fileHandle = await fs.open(filePath, "r");

      try {
        await fileHandle.read(buffer, 0, 8, 0);

        // Check for PDF header (%PDF-)
        const header = buffer.toString("ascii", 0, 5);
        if (header !== "%PDF-") {
          throw this.createError(
            ErrorCode.INVALID_PDF,
            "File does not have a valid PDF header",
            ProcessingStep.PDF_VALIDATION
          );
        }
      } finally {
        await fileHandle.close();
      }
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        throw error; // Re-throw our custom errors
      }

      throw this.createError(
        ErrorCode.INVALID_PDF,
        `Failed to validate PDF format: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.PDF_VALIDATION,
        error
      );
    }
  }

  /**
   * Cleans and normalizes extracted text
   */
  private cleanText(text: string): string {
    if (!text) return "";

    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove control characters except newlines and tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // Normalize line endings
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // Remove excessive newlines
        .replace(/\n{3,}/g, "\n\n")
        // Trim whitespace
        .trim()
    );
  }

  /**
   * Creates a standardized error object
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
}
