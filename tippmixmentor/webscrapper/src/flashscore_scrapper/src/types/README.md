# TypeScript Interfaces and Types

This directory contains comprehensive TypeScript interfaces and types for the Flashscore scraper project. The interfaces are organized by functionality and provide strong type safety throughout the application.

## File Structure

### Core Types (`core.ts`)
- **Data Models**: Enhanced versions of existing types with proper type safety
- **Configuration Interfaces**: Application, scraping, browser, and cache configuration
- **Enums**: Status types, export formats, log levels, and error types

### Browser Management (`browser.ts`)
- **IBrowserManager**: Interface for browser lifecycle management
- **IPagePool**: Interface for managing page instances
- **Browser Events**: Event system for browser lifecycle tracking
- **Page Management**: Interfaces for page creation and management

### Caching System (`cache.ts`)
- **ICacheService**: Basic cache operations interface
- **ICacheManager**: Advanced cache management with statistics
- **Cache Data Structures**: Entry metadata, statistics, and configuration
- **Cache Events**: Event system for cache operations

### Error Handling (`errors.ts`)
- **IErrorHandler**: Centralized error handling interface
- **Custom Error Classes**: Specialized error types for different scenarios
- **Retry Mechanisms**: Configurable retry strategies and circuit breakers
- **Error Recovery**: Automated recovery actions for different error types

### Validation System (`validation.ts`)
- **IValidator**: Generic validation interface
- **Validation Schemas**: Configurable validation rules and schemas
- **Validation Results**: Detailed validation feedback with errors and warnings
- **Field Validation**: Individual field validation capabilities

### Scraping Services (`scraping.ts`)
- **IScrapingService**: Base interface for all scraping services
- **Specialized Services**: Match, country, league, and season scraping interfaces
- **Scraping Configuration**: Service configuration and selector management
- **Rate Limiting**: Request throttling and rate limiting interfaces

### Export System (`export.ts`)
- **IExportService**: Base export service interface
- **Format-Specific Services**: JSON, CSV, and XML export interfaces
- **Streaming Export**: Memory-efficient export for large datasets
- **Export Validation**: Data validation before and after export

### Logging System (`logging.ts`)
- **ILogger**: Structured logging interface
- **Log Transports**: Multiple output destinations for logs
- **Performance Logging**: Operation timing and system metrics
- **Security Logging**: Security event tracking and audit trails

## Key Features

### Type Safety
- All interfaces use strict TypeScript typing
- Proper generic type support where applicable
- Comprehensive error type definitions
- Backward compatibility with existing code

### Extensibility
- Plugin-based architecture support
- Event-driven design patterns
- Configurable validation rules
- Modular service interfaces

### Error Handling
- Hierarchical error classification
- Automatic retry mechanisms
- Circuit breaker patterns
- Graceful degradation support

### Performance
- Streaming data processing
- Memory usage monitoring
- Concurrent operation support
- Resource cleanup interfaces

### Monitoring
- Comprehensive logging interfaces
- Performance metrics collection
- Event-driven monitoring
- Security audit capabilities

## Usage Examples

### Basic Scraping Service Implementation
```typescript
import { IMatchScrapingService, MatchData, ValidationResult } from './types';

class MatchScraper implements IMatchScrapingService {
  async scrape(url: string): Promise<MatchData> {
    // Implementation
  }
  
  validate(data: MatchData): boolean {
    // Validation logic
  }
  
  transform(data: any): MatchData {
    // Data transformation
  }
}
```

### Cache Service Implementation
```typescript
import { ICacheService } from './types';

class FileSystemCache implements ICacheService {
  async get<T>(key: string): Promise<T | null> {
    // Cache retrieval logic
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Cache storage logic
  }
}
```

### Error Handling
```typescript
import { IErrorHandler, NetworkError, ErrorContext } from './types';

class ErrorHandler implements IErrorHandler {
  async handle(error: Error, context: ErrorContext): Promise<void> {
    if (error instanceof NetworkError) {
      // Handle network-specific errors
    }
  }
}
```

## Migration Guide

### From Legacy Types
The new type system maintains backward compatibility while adding enhanced features:

1. **ScrapingOptions**: Now supports additional configuration options
2. **MatchData**: Enhanced with metadata and improved type safety
3. **Error Handling**: Replaced generic errors with specific error classes
4. **Export System**: Added support for multiple formats and streaming

### Breaking Changes
- Some previously optional fields are now required for better type safety
- Error types have been restructured into a hierarchy
- Export format is now an enum instead of string literals

### Recommended Migration Steps
1. Update import statements to use new interface names
2. Add required fields to existing data structures
3. Replace generic error handling with specific error types
4. Update export format references to use enum values

## Best Practices

### Interface Design
- Use composition over inheritance
- Prefer small, focused interfaces
- Include proper JSDoc documentation
- Use generic types for reusable components

### Error Handling
- Always use specific error types
- Include contextual information in errors
- Implement proper retry mechanisms
- Log errors with appropriate detail levels

### Validation
- Validate data at service boundaries
- Use schema-based validation for complex objects
- Provide meaningful error messages
- Support both strict and lenient validation modes

### Performance
- Use streaming for large datasets
- Implement proper resource cleanup
- Monitor memory usage in long-running operations
- Use caching for frequently accessed data

## Future Enhancements

### Planned Features
- GraphQL schema integration
- Real-time data streaming
- Advanced analytics interfaces
- Machine learning model integration

### Extension Points
- Custom validation rules
- Plugin-based scrapers
- Custom export formats
- Advanced caching strategies

## Contributing

When adding new interfaces:
1. Follow existing naming conventions
2. Include comprehensive JSDoc comments
3. Add validation schemas where appropriate
4. Update this README with new features
5. Ensure backward compatibility when possible