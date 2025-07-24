// Export service interfaces and types

import { ExportFormat, ExportOptions } from './core.js';
import { ValidationResult } from './validation.js';

// ============================================================================
// EXPORT SERVICE INTERFACES
// ============================================================================

export interface IExportService {
  export(data: any, format: ExportFormat, options: ExportOptions): Promise<string>;
  validate(data: any): ValidationResult;
  getFormat(): ExportFormat;
  getSupportedOptions(): string[];
  getFileExtension(): string;
}

export interface IJsonExportService extends IExportService {
  exportJson(data: any, options: JsonExportOptions): Promise<string>;
  formatJson(data: any, pretty: boolean): string;
  validateJsonStructure(data: any): ValidationResult;
}

export interface ICsvExportService extends IExportService {
  exportCsv(data: any, options: CsvExportOptions): Promise<string>;
  formatCsv(data: any[], headers: string[], delimiter: string): string;
  flattenObject(obj: any, prefix?: string): Record<string, any>;
  validateCsvData(data: any): ValidationResult;
}

export interface IXmlExportService extends IExportService {
  exportXml(data: any, options: XmlExportOptions): Promise<string>;
  formatXml(data: any, rootElement: string, pretty: boolean): string;
  validateXmlStructure(data: any): ValidationResult;
}

export interface IExportFactory {
  createExporter(format: ExportFormat): IExportService;
  getSupportedFormats(): ExportFormat[];
  registerExporter(format: ExportFormat, exporter: IExportService): void;
  unregisterExporter(format: ExportFormat): void;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface JsonExportOptions extends ExportOptions {
  pretty: boolean;
  indent: number;
  sortKeys: boolean;
  includeMetadata: boolean;
  dateFormat: 'iso' | 'timestamp' | 'custom';
  customDateFormat?: string;
}

export interface CsvExportOptions extends ExportOptions {
  delimiter: string;
  quote: string;
  escape: string;
  headers: boolean;
  customHeaders?: string[];
  flattenObjects: boolean;
  maxDepth: number;
  nullValue: string;
  booleanFormat: 'true/false' | '1/0' | 'yes/no';
}

export interface XmlExportOptions extends ExportOptions {
  rootElement: string;
  itemElement: string;
  pretty: boolean;
  indent: number;
  encoding: string;
  includeXmlDeclaration: boolean;
  attributePrefix: string;
  textNodeName: string;
}

// ============================================================================
// EXPORT RESULTS
// ============================================================================

export interface ExportResult {
  success: boolean;
  filePath: string;
  format: ExportFormat;
  size: number;
  recordCount: number;
  duration: number;
  checksum: string;
  errors: ExportError[];
  warnings: ExportWarning[];
  metadata: ExportMetadata;
}

export interface ExportError {
  code: ExportErrorCode;
  message: string;
  field?: string;
  record?: number;
  details?: any;
}

export interface ExportWarning {
  code: ExportWarningCode;
  message: string;
  field?: string;
  record?: number;
  suggestion?: string;
}

export interface ExportMetadata {
  exportedAt: Date;
  exporter: string;
  version: string;
  source: string;
  originalFormat?: string;
  transformations: string[];
  validationResults: ValidationResult;
}

export enum ExportErrorCode {
  INVALID_DATA_FORMAT = 'invalid_data_format',
  SERIALIZATION_FAILED = 'serialization_failed',
  FILE_WRITE_ERROR = 'file_write_error',
  VALIDATION_FAILED = 'validation_failed',
  UNSUPPORTED_FORMAT = 'unsupported_format',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded'
}

export enum ExportWarningCode {
  DATA_TRUNCATED = 'data_truncated',
  FIELD_RENAMED = 'field_renamed',
  TYPE_CONVERTED = 'type_converted',
  NULL_VALUE_REPLACED = 'null_value_replaced',
  SPECIAL_CHARACTERS_ESCAPED = 'special_characters_escaped'
}

// ============================================================================
// STREAMING EXPORT
// ============================================================================

export interface IStreamingExportService extends IExportService {
  startStream(options: ExportOptions): Promise<ExportStream>;
  writeRecord(stream: ExportStream, record: any): Promise<void>;
  endStream(stream: ExportStream): Promise<ExportResult>;
}

export interface ExportStream {
  id: string;
  format: ExportFormat;
  filePath: string;
  isOpen: boolean;
  recordCount: number;
  startTime: Date;
  options: ExportOptions;
}

export interface StreamingOptions {
  bufferSize: number;
  flushInterval: number;
  compression: boolean;
  checksumValidation: boolean;
}

// ============================================================================
// EXPORT VALIDATION
// ============================================================================

export interface IExportValidator {
  validateBeforeExport(data: any, format: ExportFormat): ValidationResult;
  validateAfterExport(filePath: string, originalData: any): ValidationResult;
  validateFileIntegrity(filePath: string, expectedChecksum: string): boolean;
}

export interface ExportValidationRule {
  name: string;
  description: string;
  validate: (data: any, format: ExportFormat) => ValidationResult;
  applicableFormats: ExportFormat[];
}

// ============================================================================
// EXPORT TRANSFORMATION
// ============================================================================

export interface IDataTransformer {
  transform(data: any, targetFormat: ExportFormat): any;
  canTransform(sourceFormat: string, targetFormat: ExportFormat): boolean;
  getTransformationSteps(sourceFormat: string, targetFormat: ExportFormat): TransformationStep[];
}

export interface TransformationStep {
  name: string;
  description: string;
  execute: (data: any) => any;
  validate?: (data: any) => boolean;
}

export interface TransformationConfig {
  flattenArrays: boolean;
  convertDates: boolean;
  handleNullValues: boolean;
  normalizeFieldNames: boolean;
  removeEmptyFields: boolean;
  customTransformers: Record<string, (value: any) => any>;
}

// ============================================================================
// EXPORT EVENTS
// ============================================================================

export interface ExportEvent {
  type: ExportEventType;
  timestamp: Date;
  format: ExportFormat;
  filePath?: string;
  recordCount?: number;
  error?: ExportError;
  data?: any;
}

export enum ExportEventType {
  EXPORT_STARTED = 'export_started',
  EXPORT_COMPLETED = 'export_completed',
  EXPORT_FAILED = 'export_failed',
  RECORD_EXPORTED = 'record_exported',
  VALIDATION_COMPLETED = 'validation_completed',
  TRANSFORMATION_APPLIED = 'transformation_applied',
  FILE_WRITTEN = 'file_written'
}

export interface IExportEventListener {
  onExportEvent(event: ExportEvent): void;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export interface IExportUtils {
  generateFileName(data: any, format: ExportFormat, options: ExportOptions): string;
  calculateChecksum(filePath: string): Promise<string>;
  compressFile(filePath: string, compressionType: CompressionType): Promise<string>;
  validateFileSize(filePath: string, maxSize: number): boolean;
  cleanupTempFiles(pattern: string): Promise<number>;
}

export enum CompressionType {
  GZIP = 'gzip',
  ZIP = 'zip',
  BROTLI = 'brotli'
}

export interface FileMetadata {
  path: string;
  size: number;
  created: Date;
  modified: Date;
  checksum: string;
  format: ExportFormat;
  recordCount: number;
}