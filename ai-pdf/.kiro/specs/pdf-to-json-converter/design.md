# Design Document

## Overview

The PDF to JSON converter is a Node.js/TypeScript application that processes PDF files through a three-stage pipeline:

1. **PDF Extraction**: Convert PDF files to plain text using the `pdf-parse` library
2. **AI Analysis**: Process the extracted text using Gemma AI model via Ollama
3. **JSON Output**: Structure the analysis results into a standardized JSON format

The system builds upon existing code structure but will be refactored for better modularity, error handling, and maintainability.

## Architecture

### High-Level Flow

```
PDF File → PDF Parser → Text Content → Gemma AI → Structured Data → JSON Output
```

### Component Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PDF Reader    │───▶│  Text Processor │───▶│  JSON Generator │
│                 │    │                 │    │                 │
│ - File handling │    │ - Gemma client  │    │ - Data mapping  │
│ - PDF parsing   │    │ - AI prompting  │    │ - Validation    │
│ - Text extract  │    │ - Response parse│    │ - Output format │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. PDF Reader Component

**Purpose**: Handle PDF file input and text extraction
**Location**: `src/pdf-converter/pdf-reader.ts`

```typescript
interface PDFReader {
  extractText(filePath: string): Promise<string>;
  validatePDF(filePath: string): Promise<boolean>;
}
```

**Responsibilities**:

- Validate PDF file existence and format
- Extract text content using pdf-parse library
- Handle multi-page documents
- Provide clean text output

### 2. Gemma AI Client Component

**Purpose**: Interface with Ollama/Gemma for text analysis
**Location**: `src/pdf-converter/gemma-client.ts`

```typescript
interface GemmaClient {
  analyzeText(text: string): Promise<AnalysisResult>;
  formatPrompt(text: string): string;
}

interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
}
```

**Responsibilities**:

- Connect to Ollama service
- Format prompts for optimal Gemma responses
- Handle AI response parsing
- Manage API errors and retries

### 3. JSON Generator Component

**Purpose**: Structure and validate final JSON output
**Location**: `src/pdf-converter/json-generator.ts`

```typescript
interface JSONGenerator {
  generateOutput(
    originalText: string,
    analysis: any
  ): Promise<ConversionResult>;
  validateOutput(data: any): boolean;
}

interface ConversionResult {
  success: boolean;
  data?: ProcessedDocument;
  error?: string;
}
```

### 4. Main Converter Service

**Purpose**: Orchestrate the entire conversion pipeline
**Location**: `src/pdf-converter/converter-service.ts`

```typescript
interface ConverterService {
  convertPDF(filePath: string): Promise<ConversionResult>;
  processBatch(directoryPath: string): Promise<ConversionResult[]>;
}
```

## Data Models

### Core Data Types

```typescript
interface ProcessedDocument {
  metadata: {
    originalFile: string;
    processedAt: string;
    textLength: number;
  };
  content: {
    originalText: string;
    analysis: FootballMatchData | GenericAnalysis;
  };
  status: "success" | "partial" | "failed";
}

interface FootballMatchData {
  matches: FootballMatch[];
}

interface FootballMatch {
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

interface MatchOdds {
  id: string;
  homeWin: number;
  draw: number;
  awayWin: number;
}

interface Market {
  id: string;
  name: string;
  odds: number[];
}
```

### Configuration Types

```typescript
interface ConverterConfig {
  ollama: {
    host: string;
    model: string;
    timeout: number;
  };
  paths: {
    sourceDir: string;
    outputDir: string;
  };
  processing: {
    maxTextLength: number;
    chunkSize: number;
  };
}
```

## Error Handling

### Error Categories

1. **File System Errors**: Missing files, permission issues, corrupted PDFs
2. **PDF Processing Errors**: Unreadable content, encrypted files
3. **AI Service Errors**: Ollama connection issues, model failures
4. **Data Validation Errors**: Invalid JSON structure, missing required fields

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    step: "pdf-extraction" | "ai-analysis" | "json-generation";
  };
}
```

### Error Handling Strategy

- **Graceful Degradation**: Continue processing other files if one fails
- **Detailed Logging**: Log errors with context for debugging
- **Retry Logic**: Implement retries for transient AI service failures
- **Validation**: Validate inputs and outputs at each stage

## Testing Strategy

### Unit Testing

- **PDF Reader**: Test with various PDF formats and edge cases
- **Gemma Client**: Mock Ollama responses for consistent testing
- **JSON Generator**: Validate output structure and data integrity
- **Error Handling**: Test all error scenarios and recovery paths

### Integration Testing

- **End-to-End Pipeline**: Test complete PDF → JSON conversion
- **File System Integration**: Test with real file operations
- **AI Service Integration**: Test with actual Ollama/Gemma service

### Test Data

- Sample PDFs with different content types
- Mock AI responses for consistent testing
- Edge cases: empty PDFs, corrupted files, large documents

### Performance Testing

- **Large File Handling**: Test with multi-page, large PDFs
- **Batch Processing**: Test processing multiple files simultaneously
- **Memory Usage**: Monitor memory consumption during processing

## Implementation Notes

### Existing Code Integration

- Refactor existing `converter.ts` into modular components
- Preserve existing Ollama integration patterns
- Maintain compatibility with current file structure
- Improve error handling and logging

### Configuration Management

- Use environment variables for Ollama host and model settings
- Configurable paths for input/output directories
- Adjustable processing parameters (timeouts, chunk sizes)

### Scalability Considerations

- Design for potential batch processing requirements
- Consider async processing for large files
- Plan for different AI model integrations beyond Gemma
