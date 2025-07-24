/**
 * Configuration loader for the Flashscore scraper application
 * Handles loading configuration from multiple sources with proper validation
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadDotenv } from 'dotenv';

import type {
  AppConfig,
  ConfigSource,
  FileConfigSource,
  EnvironmentConfigSource,
  ConfigValidationResult
} from './interfaces.js';
import { DEFAULT_CONFIG, DEVELOPMENT_OVERRIDES, PRODUCTION_OVERRIDES, TEST_OVERRIDES } from './defaults.js';
import { validateConfig, validateEnvironmentVariables } from './validation.js';

// ============================================================================
// CONFIGURATION LOADER CLASS
// ============================================================================

export class ConfigLoader {
  private sources: ConfigSource[] = [];
  private loadedConfig: AppConfig | null = null;
  private validationResult: ConfigValidationResult | null = null;

  constructor() {
    this.registerDefaultSources();
  }

  /**
   * Registers default configuration sources in priority order
   */
  private registerDefaultSources(): void {
    // 1. Environment variables (highest priority)
    this.addSource(new EnvironmentVariableSource());
    
    // 2. Local configuration file
    this.addSource(new JsonFileSource('./config/local.json', 90));
    
    // 3. Environment-specific configuration file
    const env = process.env.NODE_ENV || 'development';
    this.addSource(new JsonFileSource(`./config/${env}.json`, 80));
    
    // 4. Default configuration file
    this.addSource(new JsonFileSource('./config/default.json', 70));
    
    // 5. .env file
    this.addSource(new DotenvFileSource('./.env', 60));
  }

  /**
   * Adds a configuration source
   */
  public addSource(source: ConfigSource): void {
    this.sources.push(source);
    this.sources.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Loads and validates configuration from all sources
   */
  public async load(): Promise<AppConfig> {
    if (this.loadedConfig) {
      return this.loadedConfig;
    }

    let config = { ...DEFAULT_CONFIG };

    // Apply environment-specific overrides
    const env = process.env.NODE_ENV || 'development';
    switch (env) {
      case 'development':
        config = this.mergeConfigs(config, DEVELOPMENT_OVERRIDES);
        break;
      case 'production':
        config = this.mergeConfigs(config, PRODUCTION_OVERRIDES);
        break;
      case 'test':
        config = this.mergeConfigs(config, TEST_OVERRIDES);
        break;
    }

    // Load from all sources in priority order
    for (const source of this.sources) {
      try {
        const sourceConfig = await source.load();
        if (sourceConfig && Object.keys(sourceConfig).length > 0) {
          config = this.mergeConfigs(config, sourceConfig);
          console.debug(`Loaded configuration from source: ${source.name}`);
        }
      } catch (error) {
        console.warn(`Failed to load configuration from source '${source.name}':`, error);
      }
    }

    // Validate the final configuration
    this.validationResult = validateConfig(config);
    
    if (!this.validationResult.isValid) {
      const errorMessages = this.validationResult.errors.map(err => 
        `${err.field}: ${err.message}`
      ).join('\n');
      
      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }

    // Log warnings if any
    if (this.validationResult.warnings.length > 0) {
      console.warn('Configuration warnings:');
      this.validationResult.warnings.forEach(warning => {
        console.warn(`  ${warning.field}: ${warning.message}`);
      });
    }

    this.loadedConfig = config;
    return config;
  }

  /**
   * Gets the current loaded configuration
   */
  public getConfig(): AppConfig | null {
    return this.loadedConfig;
  }

  /**
   * Gets the validation result
   */
  public getValidationResult(): ConfigValidationResult | null {
    return this.validationResult;
  }

  /**
   * Reloads configuration from all sources
   */
  public async reload(): Promise<AppConfig> {
    this.loadedConfig = null;
    this.validationResult = null;
    return this.load();
  }

  /**
   * Merges two configuration objects deeply
   */
  private mergeConfigs(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeConfigs(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

// ============================================================================
// CONFIGURATION SOURCES
// ============================================================================

/**
 * Environment variable configuration source
 */
class EnvironmentVariableSource implements EnvironmentConfigSource {
  public readonly name = 'environment-variables';
  public readonly priority = 100;
  public readonly prefix = '';

  async load(): Promise<Partial<AppConfig>> {
    const envValidation = validateEnvironmentVariables(process.env);
    
    if (!envValidation.isValid) {
      console.warn('Environment variable validation warnings:', envValidation.errors);
    }

    return envValidation.parsed;
  }
}

/**
 * JSON file configuration source
 */
class JsonFileSource implements FileConfigSource {
  public readonly name: string;
  public readonly priority: number;
  public readonly filePath: string;
  public readonly format = 'json' as const;

  constructor(filePath: string, priority: number = 50) {
    this.filePath = resolve(filePath);
    this.name = `json-file:${filePath}`;
    this.priority = priority;
  }

  async load(): Promise<Partial<AppConfig>> {
    if (!existsSync(this.filePath)) {
      return {};
    }

    try {
      const content = await readFile(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON configuration file '${this.filePath}': ${error}`);
    }
  }
}

/**
 * .env file configuration source
 */
class DotenvFileSource implements FileConfigSource {
  public readonly name: string;
  public readonly priority: number;
  public readonly filePath: string;
  public readonly format = 'env' as const;

  constructor(filePath: string, priority: number = 50) {
    this.filePath = resolve(filePath);
    this.name = `dotenv-file:${filePath}`;
    this.priority = priority;
  }

  async load(): Promise<Partial<AppConfig>> {
    if (!existsSync(this.filePath)) {
      return {};
    }

    try {
      // Load .env file
      const result = loadDotenv({ path: this.filePath });
      
      if (result.error) {
        throw result.error;
      }

      // Parse environment variables from the loaded .env
      const envValidation = validateEnvironmentVariables(result.parsed || {});
      
      if (!envValidation.isValid) {
        console.warn(`Dotenv file validation warnings for '${this.filePath}':`, envValidation.errors);
      }

      return envValidation.parsed;
    } catch (error) {
      throw new Error(`Failed to load .env configuration file '${this.filePath}': ${error}`);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a singleton configuration loader instance
 */
let configLoaderInstance: ConfigLoader | null = null;

export function getConfigLoader(): ConfigLoader {
  if (!configLoaderInstance) {
    configLoaderInstance = new ConfigLoader();
  }
  return configLoaderInstance;
}

/**
 * Loads configuration using the singleton loader
 */
export async function loadConfig(): Promise<AppConfig> {
  const loader = getConfigLoader();
  return loader.load();
}

/**
 * Gets the current configuration without reloading
 */
export function getCurrentConfig(): AppConfig | null {
  return configLoaderInstance?.getConfig() || null;
}

/**
 * Reloads configuration
 */
export async function reloadConfig(): Promise<AppConfig> {
  const loader = getConfigLoader();
  return loader.reload();
}

/**
 * Validates a configuration object
 */
export function validateConfiguration(config: AppConfig): ConfigValidationResult {
  return validateConfig(config);
}

/**
 * Creates a configuration object from environment variables only
 */
export async function createConfigFromEnvironment(): Promise<AppConfig> {
  const envSource = new EnvironmentVariableSource();
  const envConfig = await envSource.load();
  
  let config = { ...DEFAULT_CONFIG };
  
  // Apply environment-specific overrides
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'development':
      config = mergeDeep(config, DEVELOPMENT_OVERRIDES);
      break;
    case 'production':
      config = mergeDeep(config, PRODUCTION_OVERRIDES);
      break;
    case 'test':
      config = mergeDeep(config, TEST_OVERRIDES);
      break;
  }
  
  // Apply environment variables
  config = mergeDeep(config, envConfig);
  
  // Validate
  const validation = validateConfig(config);
  if (!validation.isValid) {
    const errorMessages = validation.errors.map(err => 
      `${err.field}: ${err.message}`
    ).join('\n');
    
    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  }
  
  return config;
}

/**
 * Deep merge utility function
 */
function mergeDeep(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}