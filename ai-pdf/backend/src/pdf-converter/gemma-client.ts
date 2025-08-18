/**
 * Gemma AI Client Component
 * Handles connection to Ollama service and text analysis using Gemma model
 */

import { Ollama } from "ollama";
import {
  GemmaClient,
  AnalysisResult,
  ConverterConfig,
  ErrorCode,
  ProcessingStep,
} from "./types";
import { gemmaClientLogger } from "./logger";
import { recordAISuccess, recordAIFailure } from "./metrics";

/**
 * Gemma AI client implementation
 */
export class GemmaAIClient implements GemmaClient {
  private ollama: Ollama;
  private config: ConverterConfig;
  private connectionHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  constructor(config: ConverterConfig) {
    this.config = config;
    this.ollama = new Ollama({
      host: config.ollama.host,
    });
  }

  /**
   * Test connection to Ollama service
   */
  async testConnection(): Promise<boolean> {
    const startTime = Date.now();

    try {
      const now = Date.now();

      // Use cached health check if recent
      if (
        this.connectionHealthy &&
        now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL
      ) {
        gemmaClientLogger.debug("Using cached connection health check", {
          operation: "testConnection",
          metadata: { cached: true },
        });
        return true;
      }

      gemmaClientLogger.debug("Performing Ollama connection test", {
        operation: "testConnection",
        metadata: { host: this.config.ollama.host },
      });

      // Perform health check with timeout
      const healthCheckPromise = this.ollama.list();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Health check timeout")),
          this.config.ollama.timeout
        );
      });

      await Promise.race([healthCheckPromise, timeoutPromise]);

      this.connectionHealthy = true;
      this.lastHealthCheck = now;

      const duration = Date.now() - startTime;
      gemmaClientLogger.info("Ollama connection test successful", {
        operation: "testConnection",
        duration,
        metadata: { host: this.config.ollama.host },
      });

      return true;
    } catch (error) {
      this.connectionHealthy = false;
      const duration = Date.now() - startTime;

      gemmaClientLogger.error("Ollama connection test failed", error as Error, {
        operation: "testConnection",
        duration,
        metadata: { host: this.config.ollama.host },
      });

      return false;
    }
  }

  /**
   * Analyze text using Gemma model with retry logic
   */
  async analyzeText(text: string): Promise<AnalysisResult> {
    const startTime = Date.now();

    gemmaClientLogger.info("Starting AI text analysis", {
      operation: "analyzeText",
      metadata: {
        textLength: text.length,
        model: this.config.ollama.model,
      },
    });

    // Validate input
    if (!text || text.trim().length === 0) {
      const duration = Date.now() - startTime;
      gemmaClientLogger.warn("AI analysis failed: empty input text", {
        operation: "analyzeText",
        duration,
      });

      recordAIFailure(duration);
      return {
        success: false,
        error: "Input text is empty or invalid",
        processingTimeMs: duration,
      };
    }

    // Check connection before processing
    const isConnected = await this.testConnection();
    if (!isConnected) {
      const duration = Date.now() - startTime;
      gemmaClientLogger.error(
        "AI analysis failed: service unavailable",
        undefined,
        {
          operation: "analyzeText",
          duration,
          metadata: { host: this.config.ollama.host },
        }
      );

      recordAIFailure(duration, "connection");
      return {
        success: false,
        error: "Ollama service is not available",
        processingTimeMs: duration,
      };
    }

    // Attempt analysis with retry logic
    for (
      let attempt = 1;
      attempt <= this.config.ollama.retryAttempts;
      attempt++
    ) {
      try {
        gemmaClientLogger.debug(`AI analysis attempt ${attempt}`, {
          operation: "analyzeText",
          metadata: {
            attempt,
            maxAttempts: this.config.ollama.retryAttempts,
            model: this.config.ollama.model,
          },
        });

        const result = await this.performAnalysis(text);
        const totalDuration = Date.now() - startTime;
        result.processingTimeMs = totalDuration;

        gemmaClientLogger.info("AI text analysis completed successfully", {
          operation: "analyzeText",
          duration: totalDuration,
          metadata: {
            attempt,
            model: this.config.ollama.model,
            textLength: text.length,
          },
        });

        recordAISuccess(totalDuration);
        return result;
      } catch (error) {
        const attemptDuration = Date.now() - startTime;

        gemmaClientLogger.warn(
          `AI analysis attempt ${attempt} failed`,
          error as Error,
          {
            operation: "analyzeText",
            duration: attemptDuration,
            metadata: {
              attempt,
              maxAttempts: this.config.ollama.retryAttempts,
              model: this.config.ollama.model,
            },
          }
        );

        // If this was the last attempt, return error
        if (attempt === this.config.ollama.retryAttempts) {
          const totalDuration = Date.now() - startTime;

          gemmaClientLogger.error(
            "AI analysis failed after all retry attempts",
            error as Error,
            {
              operation: "analyzeText",
              duration: totalDuration,
              metadata: {
                totalAttempts: attempt,
                model: this.config.ollama.model,
              },
            }
          );

          const errorType = (error as Error).message.includes("timeout")
            ? "timeout"
            : "connection";
          recordAIFailure(totalDuration, errorType);

          return {
            success: false,
            error: `Analysis failed after ${attempt} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
            processingTimeMs: totalDuration,
          };
        }

        // Wait before retry
        if (this.config.ollama.retryDelay > 0) {
          gemmaClientLogger.debug(
            `Waiting ${this.config.ollama.retryDelay}ms before retry`,
            {
              operation: "analyzeText",
              metadata: {
                attempt,
                retryDelay: this.config.ollama.retryDelay,
              },
            }
          );
          await this.delay(this.config.ollama.retryDelay);
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    const totalDuration = Date.now() - startTime;
    recordAIFailure(totalDuration);
    return {
      success: false,
      error: "Unexpected error in retry logic",
      processingTimeMs: totalDuration,
    };
  }

  /**
   * Perform the actual analysis with timeout
   */
  private async performAnalysis(text: string): Promise<AnalysisResult> {
    const prompt = this.formatPrompt(text);

    // Create analysis promise with timeout
    const analysisPromise = this.ollama.chat({
      model: this.config.ollama.model,
      messages: [
        { role: "system", content: this.getSystemPrompt() },
        { role: "user", content: prompt },
      ],
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Analysis timeout")),
        this.config.ollama.timeout
      );
    });

    try {
      const response = await Promise.race([analysisPromise, timeoutPromise]);

      // Parse and validate response
      const parsedData = this.parseResponse(response.message.content);

      return {
        success: true,
        data: parsedData,
      };
    } catch (error) {
      throw new Error(
        `Ollama analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Format prompt for optimal football match data extraction
   */
  formatPrompt(text: string): string {
    // Handle text chunking for large documents
    const maxLength = this.config.processing.chunkSize;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + "...";
    }

    return `Please analyze the following text and extract football (soccer) match information. 
    
Text to analyze:
${text}

Please extract all football matches found in the text and return the information in the specified JSON format.`;
  }

  /**
   * Get system prompt for Gemma model
   */
  private getSystemPrompt(): string {
    return `You are a specialized assistant for extracting football (soccer) match information from text. 
    
Your task is to:
1. Identify all football matches mentioned in the text
2. Extract relevant details for each match
3. Return the information in a structured JSON format

For each match found, extract:
- Match ID (generate a unique identifier)
- Home team and away team names
- Date and time of the match
- Country and league information
- Round number if available
- Betting odds if mentioned
- Market information if available

Return the response as a JSON object with this structure:
{
  "matches": [
    {
      "matchId": "unique_id",
      "homeTeam": "Team Name",
      "awayTeam": "Team Name", 
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "country": "Country",
      "league": "League Name",
      "round": 1,
      "odds": [
        {
          "id": "odds_id",
          "homeWin": 1.9,
          "draw": 3.2,
          "awayWin": 2.8
        }
      ],
      "markets": [
        {
          "id": "market_id",
          "name": "Market Name",
          "odds": [1.5, 2.5]
        }
      ]
    }
  ]
}

If no football matches are found, return: {"matches": []}
Always return valid JSON only, no additional text or explanations.`;
  }

  /**
   * Parse and validate Gemma response
   */
  private parseResponse(content: string): any {
    try {
      // Clean the response content
      const cleanContent = content.trim();

      // Try to extract JSON from the response
      let jsonStr = cleanContent;

      // If response contains markdown code blocks, extract JSON
      const jsonMatch = cleanContent.match(
        /```(?:json)?\s*(\{[\s\S]*\})\s*```/
      );
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // Parse JSON
      const parsed = JSON.parse(jsonStr);

      // Basic validation
      if (typeof parsed === "object" && parsed !== null) {
        // Ensure matches array exists
        if (!parsed.matches) {
          parsed.matches = [];
        }

        return parsed;
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Failed to parse Gemma response:", error);
      console.error("Raw content:", content);

      // Return empty result for parsing failures
      return { matches: [] };
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.connectionHealthy;
  }

  /**
   * Get current configuration
   */
  getConfig(): ConverterConfig {
    return { ...this.config };
  }
}
