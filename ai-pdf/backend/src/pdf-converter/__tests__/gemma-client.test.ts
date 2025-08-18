/**
 * Unit tests for Gemma AI Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GemmaAIClient } from '../gemma-client';
import { ConverterConfig, DEFAULT_CONFIG } from '../types';

// Create mock functions
const mockList = vi.fn();
const mockChat = vi.fn();

// Mock the ollama module
vi.mock('ollama', () => ({
  Ollama: vi.fn().mockImplementation(() => ({
    list: mockList,
    chat: mockChat
  }))
}));

describe('GemmaAIClient', () => {
  let client: GemmaAIClient;
  let testConfig: ConverterConfig;

  beforeEach(() => {
    // Reset all mocks
    mockList.mockReset();
    mockChat.mockReset();
    
    // Create test configuration
    testConfig = {
      ...DEFAULT_CONFIG,
      ollama: {
        ...DEFAULT_CONFIG.ollama,
        timeout: 1000, // Shorter timeout for tests
        retryAttempts: 2,
        retryDelay: 10 // Shorter delay for tests
      }
    };

    // Create client instance after mocks are set up
    client = new GemmaAIClient(testConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Testing', () => {
    it('should return true when connection is successful', async () => {
      // Mock successful connection
      mockList.mockResolvedValue([]);

      const result = await client.testConnection();
      
      expect(result).toBe(true);
      expect(mockList).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      // Mock connection failure
      mockList.mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();
      
      expect(result).toBe(false);
    });

    it('should return false when connection times out', async () => {
      // Mock timeout - return a promise that takes longer than our test timeout
      mockList.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );

      const result = await client.testConnection();
      
      expect(result).toBe(false);
    });

    it('should cache successful health checks', async () => {
      // Mock successful connection
      mockList.mockResolvedValue([]);

      // First call
      const result1 = await client.testConnection();
      // Second call (should use cache)
      const result2 = await client.testConnection();
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      // Should only call once due to caching
      expect(mockList).toHaveBeenCalledTimes(1);
    });
  });

  describe('Text Analysis', () => {
    it('should successfully analyze text and return parsed result', async () => {
      // Mock successful connection and analysis
      mockList.mockResolvedValue([]);
      mockChat.mockResolvedValue({
        message: {
          content: JSON.stringify({
            matches: [{
              matchId: 'test-123',
              homeTeam: 'Team A',
              awayTeam: 'Team B',
              date: '2025-01-15',
              time: '15:30',
              country: 'USA',
              league: 'MLS',
              round: 1,
              odds: [],
              markets: []
            }]
          })
        }
      });

      const result = await client.analyzeText('Sample football match text');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.matches).toHaveLength(1);
      expect(result.data.matches[0].matchId).toBe('test-123');
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should handle empty text input', async () => {
      const result = await client.analyzeText('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty or invalid');
      expect(mockChat).not.toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      // Mock connection failure
      mockList.mockRejectedValue(new Error('Connection failed'));

      const result = await client.analyzeText('Sample text');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should retry on analysis failure', async () => {
      // Mock successful connection
      mockList.mockResolvedValue([]);
      
      // Mock analysis failure then success
      mockChat
        .mockRejectedValueOnce(new Error('Analysis failed'))
        .mockResolvedValue({
          message: {
            content: JSON.stringify({ matches: [] })
          }
        });

      const result = await client.analyzeText('Sample text');
      
      expect(result.success).toBe(true);
      expect(mockChat).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retry attempts', async () => {
      // Mock successful connection
      mockList.mockResolvedValue([]);
      
      // Mock analysis failure
      mockChat.mockRejectedValue(new Error('Analysis failed'));

      const result = await client.analyzeText('Sample text');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('failed after 2 attempts');
      expect(mockChat).toHaveBeenCalledTimes(2);
    });

    it('should handle analysis timeout', async () => {
      // Mock successful connection
      mockList.mockResolvedValue([]);
      
      // Mock analysis timeout
      mockChat.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const result = await client.analyzeText('Sample text');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should handle malformed JSON response', async () => {
      // Mock successful connection
      mockList.mockResolvedValue([]);
      
      // Mock malformed JSON response
      mockChat.mockResolvedValue({
        message: {
          content: 'This is not valid JSON'
        }
      });

      const result = await client.analyzeText('Sample text');
      
      expect(result.success).toBe(true);
      expect(result.data.matches).toEqual([]);
    });

    it('should extract JSON from markdown code blocks', async () => {
      // Mock successful connection
      mockList.mockResolvedValue([]);
      
      // Mock response with markdown code block
      mockChat.mockResolvedValue({
        message: {
          content: '```json\n{"matches": [{"matchId": "test"}]}\n```'
        }
      });

      const result = await client.analyzeText('Sample text');
      
      expect(result.success).toBe(true);
      expect(result.data.matches).toHaveLength(1);
      expect(result.data.matches[0].matchId).toBe('test');
    });
  });

  describe('Prompt Formatting', () => {
    it('should format prompt correctly', () => {
      const text = 'Sample football match text';
      const prompt = client.formatPrompt(text);
      
      expect(prompt).toContain('analyze the following text');
      expect(prompt).toContain(text);
      expect(prompt).toContain('JSON format');
    });

    it('should truncate long text', () => {
      const longText = 'a'.repeat(10000);
      const prompt = client.formatPrompt(longText);
      
      expect(prompt.length).toBeLessThan(longText.length + 1000);
      expect(prompt).toContain('...');
    });

    it('should handle text within chunk size', () => {
      const normalText = 'Sample football match text';
      const prompt = client.formatPrompt(normalText);
      
      expect(prompt).toContain(normalText);
      expect(prompt).not.toContain('...');
    });
  });

  describe('Configuration and Status', () => {
    it('should return current configuration', () => {
      const config = client.getConfig();
      
      expect(config).toEqual(testConfig);
      expect(config).not.toBe(testConfig); // Should be a copy
    });

    it('should track connection status', async () => {
      // Initially not connected
      expect(client.isConnected()).toBe(false);
      
      // Mock successful connection
      mockList.mockResolvedValue([]);
      await client.testConnection();
      
      expect(client.isConnected()).toBe(true);
      
      // Mock failed connection
      mockList.mockRejectedValue(new Error('Connection failed'));
      await client.testConnection();
      
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined text', async () => {
      const result1 = await client.analyzeText(null as any);
      const result2 = await client.analyzeText(undefined as any);
      
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it('should handle whitespace-only text', async () => {
      const result = await client.analyzeText('   \n\t   ');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty or invalid');
    });

    it('should handle response without matches property', async () => {
      // Mock successful connection
      mockList.mockResolvedValue([]);
      
      // Mock response without matches
      mockChat.mockResolvedValue({
        message: {
          content: JSON.stringify({ someOtherProperty: 'value' })
        }
      });

      const result = await client.analyzeText('Sample text');
      
      expect(result.success).toBe(true);
      expect(result.data.matches).toEqual([]);
    });
  });
});