/**
 * Browser Management Module
 * 
 * This module provides comprehensive browser management capabilities including:
 * - Enhanced browser lifecycle management with auto-restart
 * - Page pool for concurrent scraping operations
 * - Browser configuration with user agent rotation
 * - Resource cleanup and memory management
 * - Health monitoring and automatic recovery
 */

// Core browser management
export { BrowserManager } from './browser-manager.js';
export { PagePool } from './page-pool.js';
export { BrowserConfig } from './browser-config.js';
export { ResourceManager } from './resource-manager.js';
export { BrowserHealthMonitor } from './health-monitor.js';

// Re-export types for convenience
export type {
  IBrowserManager,
  IPagePool,
  BrowserHealth,
  BrowserMetrics,
  BrowserEvent,
  BrowserEventType,
  IBrowserEventListener,
  PageInfo,
  PageOptions,
  BrowserContextOptions,
  PagePoolOptions
} from '../../types/browser.js';

export type {
  BrowserOptions,
  ScrapingOptions
} from '../../types/core.js';

// Configuration types
export type {
  BrowserConfigOptions,
  ProxyConfig,
  PerformanceConfig
} from './browser-config.js';

// Resource management types
export type {
  ResourceMetrics,
  ResourceLimits,
  ResourceCleanupOptions
} from './resource-manager.js';

// Health monitoring types
export type {
  HealthCheckConfig,
  HealthStatus,
  HealthIssue,
  RecoveryAction
} from './health-monitor.js';