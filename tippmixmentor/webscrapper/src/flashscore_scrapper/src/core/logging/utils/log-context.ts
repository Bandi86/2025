/**
 * Log context management for maintaining request/operation context
 */

import { AsyncLocalStorage } from 'async_hooks';
import { LogMetadata } from '../interfaces.js';

export interface LogContext extends LogMetadata {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  operation?: string;
  startTime?: Date;
}

class LogContextManager {
  private asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  /**
   * Run a function with a specific log context
   */
  run<T>(context: LogContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Run an async function with a specific log context
   */
  async runAsync<T>(context: LogContext, fn: () => Promise<T>): Promise<T> {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Get the current log context
   */
  getContext(): LogContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Update the current context with additional metadata
   */
  updateContext(updates: Partial<LogContext>): void {
    const current = this.getContext();
    if (current) {
      Object.assign(current, updates);
    }
  }

  /**
   * Get context metadata for logging
   */
  getContextMetadata(): LogMetadata {
    const context = this.getContext();
    if (!context) {
      return {};
    }

    const { startTime, ...metadata } = context;
    
    // Add duration if startTime is available
    if (startTime) {
      metadata.duration = Date.now() - startTime.getTime();
    }

    return metadata;
  }

  /**
   * Create a child context with additional metadata
   */
  createChildContext(updates: Partial<LogContext>): LogContext {
    const current = this.getContext() || {};
    return { ...current, ...updates };
  }
}

// Singleton instance
export const logContextManager = new LogContextManager();

/**
 * Decorator for automatically adding operation context to methods
 */
export function withLogContext(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const context = logContextManager.createChildContext({
        operation: `${target.constructor.name}.${propertyKey}`,
        startTime: new Date()
      });

      return logContextManager.run(context, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

/**
 * Async version of the log context decorator
 */
export function withAsyncLogContext(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = logContextManager.createChildContext({
        operation: `${target.constructor.name}.${propertyKey}`,
        startTime: new Date()
      });

      return logContextManager.runAsync(context, async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}