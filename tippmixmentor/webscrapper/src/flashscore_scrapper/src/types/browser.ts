// Browser management interfaces

import { Browser, Page, BrowserContext } from 'playwright';
import { BrowserOptions } from './core.js';

// ============================================================================
// BROWSER MANAGEMENT INTERFACES
// ============================================================================

export interface IBrowserManager {
  launch(options?: BrowserOptions): Promise<Browser>;
  createPage(browser: Browser): Promise<Page>;
  createContext(browser: Browser, options?: BrowserContextOptions): Promise<BrowserContext>;
  closePage(page: Page): Promise<void>;
  closeContext(context: BrowserContext): Promise<void>;
  closeBrowser(browser: Browser): Promise<void>;
  restart(): Promise<Browser>;
  isHealthy(browser: Browser): Promise<boolean>;
  getCurrentBrowser(): Browser | null;
}

export interface IPagePool {
  acquire(): Promise<Page>;
  release(page: Page): Promise<void>;
  size(): number;
  availableCount(): number;
  destroy(): Promise<void>;
}

export interface BrowserContextOptions {
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  locale?: string;
  timezone?: string;
  permissions?: string[];
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface PagePoolOptions {
  minPages: number;
  maxPages: number;
  idleTimeout: number;
  createTimeout: number;
}

export interface BrowserHealth {
  isResponsive: boolean;
  memoryUsage: number;
  pageCount: number;
  uptime: number;
  lastActivity: Date;
}

export interface BrowserMetrics {
  pagesCreated: number;
  pagesDestroyed: number;
  requestsHandled: number;
  errorsEncountered: number;
  averageResponseTime: number;
  memoryPeakUsage: number;
}

// ============================================================================
// BROWSER LIFECYCLE EVENTS
// ============================================================================

export interface BrowserEvent {
  type: BrowserEventType;
  timestamp: Date;
  data?: any;
}

export enum BrowserEventType {
  LAUNCHED = 'launched',
  CLOSED = 'closed',
  PAGE_CREATED = 'page_created',
  PAGE_CLOSED = 'page_closed',
  ERROR = 'error',
  RESTART = 'restart',
  HEALTH_CHECK = 'health_check'
}

export interface IBrowserEventListener {
  onBrowserEvent(event: BrowserEvent): void;
}

// ============================================================================
// PAGE MANAGEMENT
// ============================================================================

export interface PageInfo {
  id: string;
  url: string;
  title: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface PageOptions {
  timeout: number;
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle';
  userAgent?: string;
  extraHeaders?: Record<string, string>;
}