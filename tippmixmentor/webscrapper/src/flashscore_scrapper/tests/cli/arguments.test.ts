import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { parseArguments } from '../../src/cli/arguments';

describe('CLI Argument Parsing', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should parse country and league arguments correctly', () => {
    process.argv = ['node', 'cli.js', 'country=england', 'league=premier-league'];
    const options = parseArguments();
    expect(options.country).toBe('england');
    expect(options.league).toBe('premier-league');
  });

  it('should parse fileType argument correctly', () => {
    process.argv = ['node', 'cli.js', 'fileType=json'];
    const options = parseArguments();
    expect(options.fileType).toBe('json');

    process.argv = ['node', 'cli.js', 'fileType=csv'];
    const optionsCsv = parseArguments();
    expect(optionsCsv.fileType).toBe('csv');
  });

  it('should set headless to false when "no-headless" is present', () => {
    process.argv = ['node', 'cli.js', 'no-headless'];
    const options = parseArguments();
    expect(options.headless).toBe(false);
  });

  it('should return null for unspecified arguments', () => {
    process.argv = ['node', 'cli.js'];
    const options = parseArguments();
    expect(options.country).toBeNull();
    expect(options.league).toBeNull();
    expect(options.fileType).toBeNull();
    expect(options.headless).toBe('shell');
  });

  it('should ignore invalid fileType values', () => {
    process.argv = ['node', 'cli.js', 'fileType=xml'];
    const options = parseArguments();
    expect(options.fileType).toBeNull();
  });
});