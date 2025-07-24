/**
 * Recovery Strategies - Implements graceful degradation mechanisms
 */

import { 
  BaseScrapingError, 
  RecoveryAction, 
  RecoveryActionType, 
  ErrorRecoveryStrategy,
  NetworkError,
  ScrapingError,
  SystemError
} from '../../types/errors.js';
import { ErrorType } from '../../types/core.js';

export class ErrorRecoveryManager implements ErrorRecoveryStrategy {
  private recoveryActions: Map<ErrorType, RecoveryAction[]> = new Map();
  private fallbackSelectors: Map<string, string[]> = new Map();
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];

  constructor() {
    this.initializeRecoveryActions();
    this.initializeFallbackSelectors();
  }

  /**
   * Check if an error can be recovered from
   */
  canRecover(error: BaseScrapingError): boolean {
    return this.recoveryActions.has(error.type) && error.retryable;
  }

  /**
   * Get available recovery actions for an error
   */
  getRecoveryActions(error: BaseScrapingError): RecoveryAction[] {
    return this.recoveryActions.get(error.type) || [];
  }

  /**
   * Execute recovery actions for an error
   */
  async executeRecovery(error: BaseScrapingError): Promise<boolean> {
    const actions = this.getRecoveryActions(error);
    
    if (actions.length === 0) {
      return false;
    }

    try {
      for (const action of actions) {
        await action.execute();
      }
      return true;
    } catch (recoveryError) {
      console.error('Recovery action failed:', recoveryError);
      return false;
    }
  }

  /**
   * Add a fallback selector for a given primary selector
   */
  addFallbackSelector(primarySelector: string, fallbackSelectors: string[]): void {
    this.fallbackSelectors.set(primarySelector, fallbackSelectors);
  }

  /**
   * Get fallback selectors for a primary selector
   */
  getFallbackSelectors(primarySelector: string): string[] {
    return this.fallbackSelectors.get(primarySelector) || [];
  }

  /**
   * Create a partial data recovery action
   */
  createPartialDataRecovery<T>(
    partialData: Partial<T>,
    requiredFields: (keyof T)[]
  ): RecoveryAction {
    return {
      type: RecoveryActionType.SKIP_OPERATION,
      description: 'Save partial data and continue with available information',
      execute: async () => {
        // Validate that we have at least the required fields
        const hasRequiredFields = requiredFields.every(field => 
          partialData[field] !== undefined && partialData[field] !== null
        );

        if (!hasRequiredFields) {
          throw new Error('Insufficient data for partial recovery');
        }

        // Log the partial recovery
        console.warn('Partial data recovery executed', {
          availableFields: Object.keys(partialData),
          requiredFields,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Private initialization methods

  private initializeRecoveryActions(): void {
    // Network error recovery actions
    this.recoveryActions.set(ErrorType.NETWORK, [
      {
        type: RecoveryActionType.WAIT_AND_RETRY,
        description: 'Wait for network connectivity to restore',
        execute: async () => {
          await this.sleep(5000); // Wait 5 seconds
        }
      },
      {
        type: RecoveryActionType.CHANGE_USER_AGENT,
        description: 'Rotate user agent to avoid detection',
        execute: async () => {
          // This would integrate with browser manager when available
          console.log('User agent rotation would be executed');
        }
      }
    ]);

    // Scraping error recovery actions
    this.recoveryActions.set(ErrorType.SCRAPING, [
      {
        type: RecoveryActionType.FALLBACK_SELECTOR,
        description: 'Try alternative CSS selectors',
        execute: async () => {
          console.log('Fallback selector strategy would be executed');
        }
      },
      {
        type: RecoveryActionType.RESTART_BROWSER,
        description: 'Restart browser instance',
        execute: async () => {
          console.log('Browser restart would be executed');
        }
      }
    ]);

    // System error recovery actions
    this.recoveryActions.set(ErrorType.SYSTEM, [
      {
        type: RecoveryActionType.CLEAR_CACHE,
        description: 'Clear cache to free up resources',
        execute: async () => {
          console.log('Cache clearing would be executed');
        }
      },
      {
        type: RecoveryActionType.RESTART_BROWSER,
        description: 'Restart browser to recover from system issues',
        execute: async () => {
          console.log('System recovery browser restart would be executed');
        }
      }
    ]);
  }

  private initializeFallbackSelectors(): void {
    // Common fallback selectors for Flashscore
    this.fallbackSelectors.set('.event__match', [
      '[data-testid="match"]',
      '.match-row',
      '.event-row'
    ]);

    this.fallbackSelectors.set('.event__participant', [
      '.participant',
      '.team-name',
      '[data-testid="team"]'
    ]);

    this.fallbackSelectors.set('.event__score', [
      '.score',
      '[data-testid="score"]',
      '.match-score'
    ]);

    this.fallbackSelectors.set('.event__time', [
      '.time',
      '[data-testid="time"]',
      '.match-time'
    ]);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Graceful degradation utility functions
 */
export class GracefulDegradation {
  /**
   * Execute an operation with graceful degradation
   */
  static async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<Partial<T>>,
    requiredFields: (keyof T)[]
  ): Promise<T | Partial<T>> {
    try {
      return await primaryOperation();
    } catch (error) {
      console.warn('Primary operation failed, attempting fallback', error);
      
      try {
        const partialResult = await fallbackOperation();
        
        // Validate that we have required fields
        const hasRequiredFields = requiredFields.every(field => 
          partialResult[field] !== undefined && partialResult[field] !== null
        );

        if (hasRequiredFields) {
          return partialResult;
        } else {
          throw new Error('Fallback operation did not provide required fields');
        }
      } catch (fallbackError) {
        console.error('Fallback operation also failed', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  /**
   * Collect partial results from multiple operations
   */
  static async collectPartialResults<T>(
    operations: Array<() => Promise<T>>,
    minimumSuccessCount: number = 1
  ): Promise<{
    successful: T[];
    failed: Error[];
    successRate: number;
  }> {
    const results: T[] = [];
    const errors: Error[] = [];

    await Promise.allSettled(
      operations.map(async (operation, index) => {
        try {
          const result = await operation();
          results.push(result);
        } catch (error) {
          errors.push(error as Error);
          console.warn(`Operation ${index} failed:`, error);
        }
      })
    );

    const successRate = results.length / operations.length;

    if (results.length < minimumSuccessCount) {
      throw new Error(
        `Insufficient successful operations: ${results.length}/${operations.length} (minimum: ${minimumSuccessCount})`
      );
    }

    return {
      successful: results,
      failed: errors,
      successRate
    };
  }

  /**
   * Create a resilient data collector that continues on partial failures
   */
  static createResilientCollector<T>(
    dataExtractors: Record<string, () => Promise<any>>,
    requiredFields: string[] = []
  ) {
    return async (): Promise<Partial<T>> => {
      const result: any = {};
      const errors: Record<string, Error> = {};

      // Execute all extractors
      await Promise.allSettled(
        Object.entries(dataExtractors).map(async ([field, extractor]) => {
          try {
            result[field] = await extractor();
          } catch (error) {
            errors[field] = error as Error;
            console.warn(`Failed to extract field '${field}':`, error);
          }
        })
      );

      // Check if we have required fields
      const missingRequiredFields = requiredFields.filter(field => 
        result[field] === undefined || result[field] === null
      );

      if (missingRequiredFields.length > 0) {
        throw new Error(
          `Missing required fields: ${missingRequiredFields.join(', ')}`
        );
      }

      // Log partial success
      const extractedFields = Object.keys(result);
      const failedFields = Object.keys(errors);
      
      if (failedFields.length > 0) {
        console.warn('Partial data extraction completed', {
          extracted: extractedFields,
          failed: failedFields,
          successRate: extractedFields.length / Object.keys(dataExtractors).length
        });
      }

      return result as Partial<T>;
    };
  }
}