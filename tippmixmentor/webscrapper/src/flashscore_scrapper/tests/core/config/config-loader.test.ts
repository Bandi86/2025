import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { ConfigLoader } from '../../../src/core/config/loader';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('ConfigLoader', () => {
  let tempDir: string;
  let configLoader: ConfigLoader;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-loader-test-'));
    // Set the current working directory to the temp directory for the test
    process.chdir(tempDir);
    configLoader = new ConfigLoader();
  });

  afterEach(async () => {
    // Restore the original working directory
    process.chdir(__dirname);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should load the default configuration correctly', async () => {
    const config = await configLoader.load();
    expect(config).toBeDefined();
    expect(config.environment.NODE_ENV).toBe('development');
    expect(config.scraping.baseUrl).toBe('https://www.flashscore.com');
  });

  it('should override default config with a custom file', async () => {
    const customConfig = {
      scraping: {
        baseUrl: 'https://new-flashscore.com',
        timeout: 50000,
      },
    };

    await fs.mkdir('config', { recursive: true });
    await fs.writeFile(path.join('config', 'test.json'), JSON.stringify(customConfig));

    process.env.NODE_ENV = 'test';
    const config = await configLoader.load();

    expect(config.scraping.baseUrl).toBe('https://new-flashscore.com');
    expect(config.scraping.timeout).toBe(50000);

    // cleanup
    delete process.env.NODE_ENV;
  });

  it('should prioritize environment variables over config files', async () => {
    const customConfig = {
      scraping: {
        baseUrl: 'https://file-flashscore.com',
      },
    };

    await fs.mkdir('config', { recursive: true });
    await fs.writeFile(path.join('config', 'development.json'), JSON.stringify(customConfig));

    process.env.SCRAPING_BASE_URL = 'https://env-flashscore.com';

    const config = await configLoader.load();

    expect(config.scraping.baseUrl).toBe('https://env-flashscore.com');

    // cleanup
    delete process.env.SCRAPING_BASE_URL;
  });
});