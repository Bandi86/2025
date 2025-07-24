// Validation interfaces and schemas

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

export interface IValidator<T> {
  validate(data: T): ValidationResult;
  validateField(field: keyof T, value: any): FieldValidationResult;
  getSchema(): ValidationSchema<T>;
}

export interface IValidationRule<T> {
  field: keyof T;
  required: boolean;
  validator: (value: any) => boolean;
  message: string;
  transform?: (value: any) => any;
}

export interface ISchemaValidator {
  addRule<T>(rule: ValidationRule<T>): void;
  removeRule<T>(field: keyof T): void;
  validate<T>(data: T): ValidationResult;
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  transformedData?: any;
}

export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  error?: ValidationError;
  warning?: ValidationWarning;
  transformedValue?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
  value?: any;
  expectedType?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: ValidationWarningCode;
  value?: any;
}

export enum ValidationErrorCode {
  REQUIRED_FIELD_MISSING = 'required_field_missing',
  INVALID_TYPE = 'invalid_type',
  INVALID_FORMAT = 'invalid_format',
  OUT_OF_RANGE = 'out_of_range',
  INVALID_LENGTH = 'invalid_length',
  PATTERN_MISMATCH = 'pattern_mismatch',
  CUSTOM_VALIDATION_FAILED = 'custom_validation_failed'
}

export enum ValidationWarningCode {
  DEPRECATED_FIELD = 'deprecated_field',
  UNUSUAL_VALUE = 'unusual_value',
  MISSING_OPTIONAL_FIELD = 'missing_optional_field',
  FORMAT_SUGGESTION = 'format_suggestion'
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export interface ValidationSchema<T> {
  name: string;
  version: string;
  rules: ValidationRule<T>[];
  customValidators?: CustomValidator<T>[];
}

export interface ValidationRule<T> {
  field: keyof T;
  required: boolean;
  type?: ValidationFieldType;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean;
  message: string;
  transform?: (value: any) => any;
}

export interface CustomValidator<T> {
  name: string;
  validate: (data: T) => ValidationResult;
  description: string;
}

export enum ValidationFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
  EMAIL = 'email',
  URL = 'url',
  UUID = 'uuid'
}

// ============================================================================
// SPECIFIC VALIDATION SCHEMAS
// ============================================================================

export interface MatchDataValidationSchema extends ValidationSchema<any> {
  validateMatchId(id: string): boolean;
  validateTeamName(name: string): boolean;
  validateScore(score: string): boolean;
  validateDate(date: string | Date): boolean;
  validateStatus(status: string): boolean;
}

export interface ScrapingOptionsValidationSchema extends ValidationSchema<any> {
  validateCountry(country: string): boolean;
  validateLeague(league: string): boolean;
  validateSeason(season: string): boolean;
  validateFileType(fileType: string): boolean;
  validateTimeout(timeout: number): boolean;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export interface ValidationUtils {
  isValidEmail(email: string): boolean;
  isValidUrl(url: string): boolean;
  isValidDate(date: string | Date): boolean;
  isValidUuid(uuid: string): boolean;
  sanitizeString(input: string): string;
  normalizeWhitespace(input: string): string;
  validateAndTransform<T>(data: any, schema: ValidationSchema<T>): ValidationResult;
}

// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================

export interface ValidationConfig {
  strictMode: boolean;
  allowUnknownFields: boolean;
  transformData: boolean;
  collectAllErrors: boolean;
  warningsAsErrors: boolean;
  customValidators: Record<string, (value: any) => boolean>;
}

// ============================================================================
// VALIDATION EVENTS
// ============================================================================

export interface ValidationEvent {
  type: ValidationEventType;
  timestamp: Date;
  schema: string;
  result: ValidationResult;
  data?: any;
}

export enum ValidationEventType {
  VALIDATION_STARTED = 'validation_started',
  VALIDATION_COMPLETED = 'validation_completed',
  VALIDATION_FAILED = 'validation_failed',
  FIELD_VALIDATED = 'field_validated',
  CUSTOM_VALIDATOR_EXECUTED = 'custom_validator_executed'
}

export interface IValidationEventListener {
  onValidationEvent(event: ValidationEvent): void;
}