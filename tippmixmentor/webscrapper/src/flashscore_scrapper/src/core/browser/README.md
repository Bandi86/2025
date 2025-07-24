# Enhanced Browser Management System

This module provides a comprehensive browser management system for web scraping operations with advanced features including lifecycle management, auto-restart capabilities, page pooling, resource management, and health monitoring.

## Features

### 🚀 Core Components

- **BrowserManager**: Enhanced browser lifecycle management with auto-restart
- **PagePool**: Concurrent page management with intelligent pooling
- **BrowserConfig**: Advanced configuration with user agent rotation and stealth mode
- **ResourceManager**: Memory and resource cleanup utilities
- **BrowserHealthMonitor**: Health monitoring with automatic recovery

### ✨ Key Capabilities

- **Auto-restart**: Automatic browser recovery on failures
- **Page Pooling**: Efficient page reuse for concurrent operations
- **User Agent Rotation**: Built-in user agent rotation for stealth
- **Resource Management**: Intelligent memory and resource cleanup
- **Health Monitoring**: Continuous health checks with auto-recovery
- **Stealth Mode**: Anti-detection features and optimizations
- **Performance Optimization**: Resource blocking and optimization
- **Event-driven**: Comprehensive event system for monitoring

## Quick Start

### Basic Usage

```typescript
import { BrowserManager } from './core/browser/index.js';

const browserManager = new BrowserManager({
  headless: true,
  timeout: 30000
});

// Launch browser
const browser = await browserManager.launch();

// Create page
const page = await browserManager.createPage();

// Navigate and scrape
await page.goto('https://example.com');
const title = await page.title();

// Cleanup
await browserManager.closePage(page);
await browserManager.cleanup();
```

### Page Pool for Concurrent Scraping

```typescript
import { BrowserManager, PagePool } from './core/browser/index.js';

const browserManager = new BrowserManager();
await browserManager.launch();

const pagePool = new PagePool(browserManager, {
  minPages: 2,
  maxPages: 5,
  idleTimeout: 300000
});

// Concurrent scraping
const urls = ['url1', 'url2', 'url3'];
const results = await Promise.all(
  urls.map(async (url) => {
    const page = await pagePool.acquire();
    try {
      await page.goto(url);
      return await page.title();
    } finally {
      await pagePool.release(page);
    }
  })
);

await pagePool.destroy();
```

### Advanced Configuration with Stealth Mode

```typescript
import { BrowserManager, BrowserConfig } from './core/browser/index.js';

const config = new BrowserConfig({
  userAgentRotation: true,
  stealthMode: true,
  resourceOptimization: true,
  performanceSettings: {
    disableImages: true,
    blockAds: true,
    blockTrackers: true
  }
});

const browserManager = new BrowserManager(
  config.getBrowserLaunchOptions()
);

const browser = await browserManager.launch();
const context = await browserManager.createContext(
  browser, 
  config.getBrowserContextOptions()
);

const page = await context.newPage();
await config.applyPerformanceSettings(page);
```

### Resource Management

```typescript
import { BrowserManager, ResourceManager } from './core/browser/index.js';

const resourceManager = new ResourceManager({
  maxMemoryMB: 1024,
  maxPages: 20,
  gcThresholdMB: 512
});

const browserManager = new BrowserManager();
const browser = await browserManager.launch();

// Track resources
resourceManager.trackBrowser(browser);

// Monitor and cleanup
const metrics = resourceManager.getMetrics();
if (resourceManager.shouldTriggerCleanup()) {
  await resourceManager.cleanup({
    forceGC: true,
    closeIdlePages: true
  });
}
```

### Health Monitoring with Auto-Recovery

```typescript
import { BrowserManager, BrowserHealthMonitor } from './core/browser/index.js';

const browserManager = new BrowserManager();
const healthMonitor = new BrowserHealthMonitor({
  interval: 30000,
  enableAutoRestart: true,
  maxFailures: 3
});

const browser = await browserManager.launch();

// Start monitoring with auto-restart
healthMonitor.startMonitoring(browser, async () => {
  return await browserManager.restart();
});

// Listen to health events
healthMonitor.on('healthDegraded', ({ status }) => {
  console.log('Health issues:', status.issues);
});

healthMonitor.on('browserRestarted', ({ action }) => {
  console.log('Browser restarted:', action.reason);
});
```

## API Reference

### BrowserManager

#### Constructor Options
```typescript
interface BrowserOptions {
  headless: boolean;
  timeout: number;
  userAgent?: string;
  viewport?: { width: number; height: number };
  args?: string[];
}
```

#### Methods
- `launch(options?: BrowserOptions): Promise<Browser>` - Launch browser
- `createPage(browser?: Browser): Promise<Page>` - Create new page
- `createContext(browser: Browser, options?: BrowserContextOptions): Promise<BrowserContext>` - Create context
- `closePage(page: Page): Promise<void>` - Close page safely
- `closeBrowser(browser?: Browser): Promise<void>` - Close browser
- `restart(): Promise<Browser>` - Restart browser
- `isHealthy(browser?: Browser): Promise<boolean>` - Check health
- `getCurrentBrowser(): Browser | null` - Get current browser
- `getHealth(): Promise<BrowserHealth>` - Get health metrics
- `getMetrics(): BrowserMetrics` - Get usage metrics
- `cleanup(): Promise<void>` - Clean up resources

### PagePool

#### Constructor Options
```typescript
interface PagePoolOptions {
  minPages: number;
  maxPages: number;
  idleTimeout: number;
  createTimeout: number;
}
```

#### Methods
- `acquire(): Promise<Page>` - Acquire page from pool
- `release(page: Page): Promise<void>` - Release page to pool
- `size(): number` - Get total pool size
- `availableCount(): number` - Get available page count
- `getStats()` - Get pool statistics
- `getPageInfos(): PageInfo[]` - Get page information
- `destroy(): Promise<void>` - Destroy pool

### BrowserConfig

#### Constructor Options
```typescript
interface BrowserConfigOptions {
  userAgentRotation: boolean;
  stealthMode: boolean;
  resourceOptimization: boolean;
  customUserAgents?: string[];
  performanceSettings?: PerformanceConfig;
}
```

#### Methods
- `getBrowserLaunchOptions(baseOptions?: Partial<BrowserOptions>): BrowserOptions`
- `getBrowserContextOptions(baseOptions?: Partial<BrowserContextOptions>): BrowserContextOptions`
- `getNextUserAgent(mobile?: boolean): string`
- `getRandomUserAgent(mobile?: boolean): string`
- `applyPerformanceSettings(page: Page): Promise<void>`
- `getStealthScripts(): string[]`

### ResourceManager

#### Constructor Options
```typescript
interface ResourceLimits {
  maxMemoryMB: number;
  maxPages: number;
  maxContexts: number;
  maxBrowsers: number;
  gcThresholdMB: number;
  cleanupIntervalMs: number;
}
```

#### Methods
- `trackBrowser(browser: Browser): void` - Track browser
- `trackPage(page: Page): void` - Track page
- `trackContext(context: BrowserContext): void` - Track context
- `getMetrics(): ResourceMetrics` - Get resource metrics
- `checkLimits()` - Check resource limits
- `cleanup(options?: ResourceCleanupOptions): Promise<void>` - Perform cleanup
- `shouldTriggerCleanup(): boolean` - Check if cleanup needed
- `getMemoryUsageString(): string` - Get formatted memory usage
- `destroy(): Promise<void>` - Destroy manager

### BrowserHealthMonitor

#### Constructor Options
```typescript
interface HealthCheckConfig {
  interval: number;
  timeout: number;
  maxFailures: number;
  recoveryDelay: number;
  enableAutoRestart: boolean;
  enablePageHealthCheck: boolean;
  enableMemoryMonitoring: boolean;
}
```

#### Methods
- `startMonitoring(browser: Browser, onRestart?: () => Promise<Browser>): void`
- `stopMonitoring(): void`
- `performHealthCheck(): Promise<HealthStatus>`
- `getStatus(): HealthStatus`
- `getRecoveryHistory(): RecoveryAction[]`
- `forceRestart(): Promise<boolean>`
- `destroy(): Promise<void>`

## Events

### BrowserManager Events
- `browserEvent` - All browser lifecycle events

### PagePool Events
- `pageCreated` - New page created
- `pageActivated` - Page activated from pool
- `pageReleased` - Page released to pool
- `pageRemoved` - Page removed from pool
- `idleCleanup` - Idle pages cleaned up
- `destroyed` - Pool destroyed

### ResourceManager Events
- `browserTracked` - Browser added to tracking
- `pageTracked` - Page added to tracking
- `contextTracked` - Context added to tracking
- `cleanupCompleted` - Cleanup completed
- `cleanupError` - Cleanup error
- `gcCompleted` - Garbage collection completed
- `highMemoryUsage` - High memory usage detected
- `processWarning` - Process warning received
- `destroyed` - Manager destroyed

### BrowserHealthMonitor Events
- `monitoringStarted` - Monitoring started
- `monitoringStopped` - Monitoring stopped
- `healthCheck` - Health check performed
- `healthDegraded` - Health degraded
- `healthRestored` - Health restored
- `browserDisconnected` - Browser disconnected
- `browserRestarted` - Browser restarted
- `restartFailed` - Restart failed
- `destroyed` - Monitor destroyed

## Best Practices

### 1. Resource Management
- Always use try/finally blocks to ensure page release
- Monitor memory usage in long-running applications
- Set appropriate pool limits based on system resources
- Enable automatic cleanup for production environments

### 2. Error Handling
- Implement proper error handling for all browser operations
- Use health monitoring for automatic recovery
- Log errors with sufficient context for debugging
- Handle browser disconnections gracefully

### 3. Performance Optimization
- Use page pooling for concurrent operations
- Enable resource optimization for faster loading
- Block unnecessary resources (images, ads) when possible
- Monitor and limit memory usage

### 4. Stealth and Anti-Detection
- Enable user agent rotation
- Use stealth mode for sensitive scraping
- Randomize viewport sizes and timings
- Avoid detectable automation patterns

### 5. Monitoring and Debugging
- Enable comprehensive logging
- Monitor health metrics regularly
- Track resource usage over time
- Use events for real-time monitoring

## Examples

See `example-usage.ts` for comprehensive examples covering:
- Basic browser management
- Page pool usage
- Advanced configuration
- Resource management
- Health monitoring
- Complete integration scenarios

## Testing

Run the test suite:
```bash
npm test src/core/browser/
```

Individual test files:
- `browser-manager.test.ts` - BrowserManager tests
- `page-pool.test.ts` - PagePool tests

## Requirements

- Node.js 16+
- Playwright
- TypeScript 4.5+

## Dependencies

- `playwright` - Browser automation
- `events` - Event emitter
- Custom logging system
- Custom type definitions

## License

This module is part of the Flashscore scraper project.