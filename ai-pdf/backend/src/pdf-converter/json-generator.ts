/**
 * JSON Generator Component
 * Handles mapping AI analysis results to structured data and JSON output generation
 */

import {
  JSONGenerator,
  ConversionResult,
  ProcessedDocument,
  FootballMatchData,
  FootballMatch,
  MatchOdds,
  Market,
  DocumentMetadata,
  DocumentContent,
  ErrorCode,
  ProcessingStep,
  ErrorDetails,
  GenericAnalysis,
} from "./types";
import { jsonGeneratorLogger } from "./logger";

/**
 * JSON Generator implementation
 */
export class JSONGeneratorService implements JSONGenerator {
  /**
   * Generate final JSON output with metadata
   */
  async generateOutput(
    originalText: string,
    analysis: any
  ): Promise<ConversionResult> {
    const startTime = Date.now();

    jsonGeneratorLogger.info("Starting JSON output generation", {
      operation: "generateOutput",
      metadata: {
        textLength: originalText.length,
        analysisType: this.getAnalysisType(analysis),
      },
    });

    try {
      // Validate input parameters
      if (!originalText || typeof originalText !== "string") {
        const duration = Date.now() - startTime;
        jsonGeneratorLogger.warn(
          "JSON generation failed: invalid original text",
          {
            operation: "generateOutput",
            duration,
          }
        );

        return this.createErrorResult(
          ErrorCode.VALIDATION_FAILED,
          "Original text is required and must be a string",
          ProcessingStep.JSON_GENERATION
        );
      }

      if (!analysis) {
        const duration = Date.now() - startTime;
        jsonGeneratorLogger.warn(
          "JSON generation failed: missing analysis data",
          {
            operation: "generateOutput",
            duration,
          }
        );

        return this.createErrorResult(
          ErrorCode.VALIDATION_FAILED,
          "Analysis data is required",
          ProcessingStep.JSON_GENERATION
        );
      }

      jsonGeneratorLogger.debug("Mapping analysis data to structured format", {
        operation: "generateOutput",
        metadata: { analysisType: this.getAnalysisType(analysis) },
      });

      // Map analysis results to structured data
      const mappedData = this.mapAnalysisToStructuredData(analysis);

      // Create metadata
      const metadata: DocumentMetadata = {
        originalFile: "", // Will be set by the caller
        processedAt: new Date().toISOString(),
        textLength: originalText.length,
        processingTimeMs: Date.now() - startTime,
      };

      // Create document content
      const content: DocumentContent = {
        originalText,
        analysis: mappedData,
      };

      // Create processed document
      const processedDocument: ProcessedDocument = {
        metadata,
        content,
        status: "success",
      };

      jsonGeneratorLogger.debug("Validating generated output", {
        operation: "generateOutput",
      });

      // Validate the output
      const isValid = this.validateOutput(processedDocument);
      if (!isValid) {
        const duration = Date.now() - startTime;
        jsonGeneratorLogger.error(
          "JSON generation failed: output validation failed",
          undefined,
          {
            operation: "generateOutput",
            duration,
          }
        );

        return this.createErrorResult(
          ErrorCode.VALIDATION_FAILED,
          "Generated output failed validation",
          ProcessingStep.OUTPUT_VALIDATION
        );
      }

      const duration = Date.now() - startTime;
      jsonGeneratorLogger.info(
        "JSON output generation completed successfully",
        {
          operation: "generateOutput",
          duration,
          metadata: {
            outputSize: JSON.stringify(processedDocument).length,
            analysisType: this.getAnalysisType(mappedData),
          },
        }
      );

      return {
        success: true,
        data: processedDocument,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      jsonGeneratorLogger.error(
        "JSON generation failed with exception",
        error as Error,
        {
          operation: "generateOutput",
          duration,
        }
      );

      return this.createErrorResult(
        ErrorCode.JSON_GENERATION_FAILED,
        `JSON generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.JSON_GENERATION
      );
    }
  }

  /**
   * Map AI analysis results to FootballMatch structure
   */
  private mapAnalysisToStructuredData(
    analysis: any
  ): FootballMatchData | GenericAnalysis {
    try {
      // Check if analysis contains football match data
      if (this.isFootballMatchData(analysis)) {
        return this.mapToFootballMatchData(analysis);
      } else {
        // Handle as generic analysis
        return this.mapToGenericAnalysis(analysis);
      }
    } catch (error) {
      console.warn("Failed to map analysis data, using generic format:", error);
      return this.mapToGenericAnalysis(analysis);
    }
  }

  /**
   * Check if analysis data contains football match information
   */
  private isFootballMatchData(analysis: any): boolean {
    return (
      analysis &&
      typeof analysis === "object" &&
      Array.isArray(analysis.matches)
    );
  }

  /**
   * Map analysis to FootballMatchData structure
   */
  private mapToFootballMatchData(analysis: any): FootballMatchData {
    const matches: FootballMatch[] = [];

    if (Array.isArray(analysis.matches)) {
      for (const matchData of analysis.matches) {
        const mappedMatch = this.mapToFootballMatch(matchData);
        if (mappedMatch) {
          matches.push(mappedMatch);
        }
      }
    }

    return {
      matches,
      totalMatches: matches.length,
    };
  }

  /**
   * Map individual match data to FootballMatch structure
   */
  private mapToFootballMatch(matchData: any): FootballMatch | null {
    try {
      // Validate required fields
      if (!this.hasRequiredMatchFields(matchData)) {
        console.warn("Match data missing required fields:", matchData);
        return null;
      }

      // Map odds data
      const odds: MatchOdds[] = this.mapMatchOdds(matchData.odds || []);

      // Map markets data
      const markets: Market[] = this.mapMarkets(matchData.markets || []);

      // Create FootballMatch object with data validation
      const footballMatch: FootballMatch = {
        matchId: this.sanitizeString(
          matchData.matchId || matchData.matchid || this.generateMatchId()
        ),
        homeTeam: this.sanitizeString(
          matchData.homeTeam || matchData.home_team || ""
        ),
        awayTeam: this.sanitizeString(
          matchData.awayTeam || matchData.away_team || ""
        ),
        date: this.sanitizeString(matchData.date || ""),
        time: this.sanitizeString(matchData.time || ""),
        country: this.sanitizeString(matchData.country || ""),
        league: this.sanitizeString(matchData.league || ""),
        round: this.sanitizeNumber(matchData.round, 0),
        odds,
        markets,
      };

      return footballMatch;
    } catch (error) {
      console.warn("Failed to map match data:", error, matchData);
      return null;
    }
  }

  /**
   * Check if match data has required fields
   */
  private hasRequiredMatchFields(matchData: any): boolean {
    const requiredFields = ["homeTeam", "awayTeam"];
    const alternativeFields = ["home_team", "away_team"];

    // Check if at least home and away team are present
    const hasHomeTeam =
      requiredFields[0] in matchData || alternativeFields[0] in matchData;
    const hasAwayTeam =
      requiredFields[1] in matchData || alternativeFields[1] in matchData;

    return hasHomeTeam && hasAwayTeam;
  }

  /**
   * Map odds data to MatchOdds structure
   */
  private mapMatchOdds(oddsData: any[]): MatchOdds[] {
    if (!Array.isArray(oddsData)) {
      return [];
    }

    return oddsData
      .map((odds) => {
        try {
          return {
            id: this.sanitizeString(odds.id || this.generateId()),
            homeWin: this.sanitizeNumber(odds.homeWin || odds.home_win_odds, 0),
            draw: this.sanitizeNumber(odds.draw || odds.draw_odds, 0),
            awayWin: this.sanitizeNumber(odds.awayWin || odds.away_win_odds, 0),
          };
        } catch (error) {
          console.warn("Failed to map odds data:", error, odds);
          return null;
        }
      })
      .filter((odds): odds is MatchOdds => odds !== null);
  }

  /**
   * Map markets data to Market structure
   */
  private mapMarkets(marketsData: any[]): Market[] {
    if (!Array.isArray(marketsData)) {
      return [];
    }

    return marketsData
      .map((market) => {
        try {
          return {
            id: this.sanitizeString(market.id || this.generateId()),
            name: this.sanitizeString(market.name || ""),
            odds: Array.isArray(market.odds)
              ? market.odds.map((odd: any) => this.sanitizeNumber(odd, 0))
              : [],
          };
        } catch (error) {
          console.warn("Failed to map market data:", error, market);
          return null;
        }
      })
      .filter((market): market is Market => market !== null);
  }

  /**
   * Map analysis to generic analysis structure
   */
  private mapToGenericAnalysis(analysis: any): GenericAnalysis {
    return {
      type: "generic",
      summary: "Non-football content analysis",
      extractedData: analysis || {},
    };
  }

  /**
   * Validate JSON output structure
   */
  validateOutput(data: any): boolean {
    try {
      // Check if data is an object
      if (!data || typeof data !== "object") {
        return false;
      }

      // Validate ProcessedDocument structure
      if (!this.isValidProcessedDocument(data)) {
        return false;
      }

      // Additional schema validation for analysis content
      if (this.isFootballMatchData(data.content.analysis)) {
        return this.validateFootballMatchSchema(
          data.content.analysis as FootballMatchData
        );
      }

      if (this.isGenericAnalysis(data.content.analysis)) {
        return this.validateGenericAnalysisSchema(
          data.content.analysis as GenericAnalysis
        );
      }

      return true;
    } catch (error) {
      console.error("Output validation failed:", error);
      return false;
    }
  }

  /**
   * Validate ProcessedDocument structure
   */
  private isValidProcessedDocument(data: any): boolean {
    // Check required top-level properties
    if (!data.metadata || !data.content || !data.status) {
      return false;
    }

    // Validate metadata
    if (!this.isValidMetadata(data.metadata)) {
      return false;
    }

    // Validate content
    if (!this.isValidContent(data.content)) {
      return false;
    }

    // Validate status
    if (!["success", "partial", "failed"].includes(data.status)) {
      return false;
    }

    return true;
  }

  /**
   * Validate metadata structure
   */
  private isValidMetadata(metadata: any): boolean {
    return (
      metadata &&
      typeof metadata === "object" &&
      typeof metadata.processedAt === "string" &&
      typeof metadata.textLength === "number" &&
      typeof metadata.processingTimeMs === "number"
    );
  }

  /**
   * Validate content structure
   */
  private isValidContent(content: any): boolean {
    return (
      content &&
      typeof content === "object" &&
      typeof content.originalText === "string" &&
      content.analysis !== undefined
    );
  }

  /**
   * Utility methods for data sanitization
   */
  private sanitizeString(value: any): string {
    if (typeof value === "string") {
      return value.trim();
    }
    return String(value || "").trim();
  }

  private sanitizeNumber(value: any, defaultValue: number = 0): number {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Generate unique IDs
   */
  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate JSON output with metadata and validation
   */
  async generateJSONOutput(
    originalText: string,
    analysis: any,
    originalFile?: string
  ): Promise<ConversionResult> {
    try {
      const result = await this.generateOutput(originalText, analysis);

      if (!result.success || !result.data) {
        return result;
      }

      // Set original file if provided
      if (originalFile) {
        result.data.metadata.originalFile = originalFile;
      }

      // Validate JSON structure against schema
      const isValidJSON = this.validateJSONStructure(result.data);
      if (!isValidJSON) {
        return this.createErrorResult(
          ErrorCode.VALIDATION_FAILED,
          "Generated JSON does not conform to expected schema",
          ProcessingStep.OUTPUT_VALIDATION
        );
      }

      return result;
    } catch (error) {
      return this.createErrorResult(
        ErrorCode.JSON_GENERATION_FAILED,
        `JSON output generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.JSON_GENERATION
      );
    }
  }

  /**
   * Validate JSON structure against defined schema
   */
  private validateJSONStructure(data: ProcessedDocument): boolean {
    try {
      // Validate basic ProcessedDocument structure
      if (!this.isValidProcessedDocument(data)) {
        return false;
      }

      // Additional schema validation for football match data
      if (this.isFootballMatchData(data.content.analysis)) {
        return this.validateFootballMatchSchema(
          data.content.analysis as FootballMatchData
        );
      }

      // Validate generic analysis schema
      if (this.isGenericAnalysis(data.content.analysis)) {
        return this.validateGenericAnalysisSchema(
          data.content.analysis as GenericAnalysis
        );
      }

      return true;
    } catch (error) {
      console.error("JSON schema validation failed:", error);
      return false;
    }
  }

  /**
   * Validate football match data schema
   */
  private validateFootballMatchSchema(data: FootballMatchData): boolean {
    // Check required properties
    if (!Array.isArray(data.matches) || typeof data.totalMatches !== "number") {
      return false;
    }

    // Validate each match
    for (const match of data.matches) {
      if (!this.validateFootballMatchStructure(match)) {
        return false;
      }
    }

    // Validate totalMatches consistency
    if (data.totalMatches !== data.matches.length) {
      return false;
    }

    return true;
  }

  /**
   * Validate individual football match structure
   */
  private validateFootballMatchStructure(match: FootballMatch): boolean {
    const requiredStringFields = [
      "matchId",
      "homeTeam",
      "awayTeam",
      "date",
      "time",
      "country",
      "league",
    ];

    // Check required string fields
    for (const field of requiredStringFields) {
      if (typeof match[field as keyof FootballMatch] !== "string") {
        return false;
      }
    }

    // Check that homeTeam and awayTeam are not empty (required fields)
    if (!match.homeTeam || !match.awayTeam) {
      return false;
    }

    // Check round is a number
    if (typeof match.round !== "number") {
      return false;
    }

    // Check odds array
    if (!Array.isArray(match.odds)) {
      return false;
    }

    // Validate each odds entry
    for (const odds of match.odds) {
      if (!this.validateMatchOddsStructure(odds)) {
        return false;
      }
    }

    // Check markets array
    if (!Array.isArray(match.markets)) {
      return false;
    }

    // Validate each market entry
    for (const market of match.markets) {
      if (!this.validateMarketStructure(market)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate match odds structure
   */
  private validateMatchOddsStructure(odds: MatchOdds): boolean {
    return (
      typeof odds.id === "string" &&
      typeof odds.homeWin === "number" &&
      typeof odds.draw === "number" &&
      typeof odds.awayWin === "number"
    );
  }

  /**
   * Validate market structure
   */
  private validateMarketStructure(market: Market): boolean {
    return (
      typeof market.id === "string" &&
      typeof market.name === "string" &&
      Array.isArray(market.odds) &&
      market.odds.every((odd) => typeof odd === "number")
    );
  }

  /**
   * Validate generic analysis schema
   */
  private validateGenericAnalysisSchema(data: GenericAnalysis): boolean {
    return (
      typeof data.type === "string" &&
      typeof data.summary === "string" &&
      typeof data.extractedData === "object" &&
      data.extractedData !== null
    );
  }

  /**
   * Check if data is generic analysis
   */
  private isGenericAnalysis(data: any): boolean {
    return (
      data &&
      typeof data === "object" &&
      data.type === "generic" &&
      typeof data.summary === "string"
    );
  }

  /**
   * Generate formatted JSON string with proper indentation
   */
  generateFormattedJSON(data: ProcessedDocument): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to generate formatted JSON: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Generate compact JSON string (no formatting)
   */
  generateCompactJSON(data: ProcessedDocument): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      throw new Error(
        `Failed to generate compact JSON: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create metadata with additional processing information
   */
  createEnhancedMetadata(
    originalFile: string,
    textLength: number,
    processingTimeMs: number,
    additionalInfo?: Record<string, any>
  ): DocumentMetadata {
    const metadata: DocumentMetadata = {
      originalFile,
      processedAt: new Date().toISOString(),
      textLength,
      processingTimeMs,
    };

    // Add any additional metadata if provided
    if (additionalInfo) {
      Object.assign(metadata, additionalInfo);
    }

    return metadata;
  }

  /**
   * Handle malformed AI responses gracefully
   */
  handleMalformedResponse(
    response: any,
    originalText: string
  ): ConversionResult {
    try {
      console.warn("Handling malformed AI response:", response);

      // Try to extract any usable data from malformed response
      let extractedData: any = {};

      if (typeof response === "string") {
        // Try to parse as JSON
        try {
          extractedData = JSON.parse(response);
        } catch {
          // If not JSON, treat as plain text
          extractedData = { rawText: response };
        }
      } else if (response && typeof response === "object") {
        extractedData = response;
      }

      // Create a generic analysis from the malformed response
      const genericAnalysis: GenericAnalysis = {
        type: "malformed_response",
        summary: "AI response was malformed but partially processed",
        extractedData,
      };

      // Create metadata
      const metadata: DocumentMetadata = {
        originalFile: "",
        processedAt: new Date().toISOString(),
        textLength: originalText.length,
        processingTimeMs: 0,
      };

      // Create document content
      const content: DocumentContent = {
        originalText,
        analysis: genericAnalysis,
      };

      // Create processed document with partial status
      const processedDocument: ProcessedDocument = {
        metadata,
        content,
        status: "partial",
      };

      return {
        success: true,
        data: processedDocument,
      };
    } catch (error) {
      return this.createErrorResult(
        ErrorCode.JSON_GENERATION_FAILED,
        `Failed to handle malformed response: ${error instanceof Error ? error.message : "Unknown error"}`,
        ProcessingStep.JSON_GENERATION
      );
    }
  }

  /**
   * Validate and sanitize AI response before processing
   */
  validateAIResponse(response: any): {
    isValid: boolean;
    sanitized?: any;
    error?: string;
  } {
    try {
      // Check if response is null or undefined
      if (response === null || response === undefined) {
        return {
          isValid: false,
          error: "AI response is null or undefined",
        };
      }

      // Handle string responses
      if (typeof response === "string") {
        try {
          const parsed = JSON.parse(response);
          return {
            isValid: true,
            sanitized: parsed,
          };
        } catch {
          return {
            isValid: false,
            error: "AI response is not valid JSON",
          };
        }
      }

      // Handle object responses
      if (typeof response === "object") {
        return {
          isValid: true,
          sanitized: response,
        };
      }

      return {
        isValid: false,
        error: "AI response is not a valid format",
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Response validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Create structured error response for failures
   */
  createStructuredErrorResponse(
    code: ErrorCode,
    message: string,
    step: ProcessingStep,
    originalText?: string,
    additionalDetails?: any
  ): ConversionResult {
    const errorDetails: ErrorDetails = {
      code,
      message,
      step,
      timestamp: new Date().toISOString(),
      details: additionalDetails,
    };

    // If we have original text, create a partial document with error info
    if (originalText) {
      const metadata: DocumentMetadata = {
        originalFile: "",
        processedAt: new Date().toISOString(),
        textLength: originalText.length,
        processingTimeMs: 0,
      };

      const errorAnalysis: GenericAnalysis = {
        type: "error",
        summary: `Processing failed at ${step}: ${message}`,
        extractedData: {
          error: errorDetails,
          originalText: originalText.substring(0, 500) + "...", // Include snippet
        },
      };

      const content: DocumentContent = {
        originalText,
        analysis: errorAnalysis,
      };

      const processedDocument: ProcessedDocument = {
        metadata,
        content,
        status: "failed",
      };

      return {
        success: false,
        data: processedDocument,
        error: errorDetails,
      };
    }

    return {
      success: false,
      error: errorDetails,
    };
  }

  /**
   * Validate JSON schema with detailed error reporting
   */
  validateJSONSchema(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Basic structure validation
      if (!data || typeof data !== "object") {
        errors.push("Data must be an object");
        return { isValid: false, errors };
      }

      // Validate ProcessedDocument structure
      if (!data.metadata) {
        errors.push("Missing metadata property");
      } else {
        if (typeof data.metadata.processedAt !== "string") {
          errors.push("metadata.processedAt must be a string");
        }
        if (typeof data.metadata.textLength !== "number") {
          errors.push("metadata.textLength must be a number");
        }
        if (typeof data.metadata.processingTimeMs !== "number") {
          errors.push("metadata.processingTimeMs must be a number");
        }
      }

      if (!data.content) {
        errors.push("Missing content property");
      } else {
        if (typeof data.content.originalText !== "string") {
          errors.push("content.originalText must be a string");
        }
        if (!data.content.analysis) {
          errors.push("content.analysis is required");
        }
      }

      if (!["success", "partial", "failed"].includes(data.status)) {
        errors.push("status must be 'success', 'partial', or 'failed'");
      }

      // Validate analysis content if present
      if (data.content && data.content.analysis) {
        const analysisErrors = this.validateAnalysisSchema(
          data.content.analysis
        );
        errors.push(...analysisErrors);
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(
        `Schema validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return { isValid: false, errors };
    }
  }

  /**
   * Validate analysis schema with detailed error reporting
   */
  private validateAnalysisSchema(analysis: any): string[] {
    const errors: string[] = [];

    if (this.isFootballMatchData(analysis)) {
      const footballErrors = this.validateFootballMatchSchemaDetailed(analysis);
      errors.push(...footballErrors);
    } else if (this.isGenericAnalysis(analysis)) {
      const genericErrors =
        this.validateGenericAnalysisSchemaDetailed(analysis);
      errors.push(...genericErrors);
    } else {
      errors.push("Analysis data does not match any known schema");
    }

    return errors;
  }

  /**
   * Validate football match schema with detailed error reporting
   */
  private validateFootballMatchSchemaDetailed(
    data: FootballMatchData
  ): string[] {
    const errors: string[] = [];

    if (!Array.isArray(data.matches)) {
      errors.push("matches must be an array");
      return errors;
    }

    if (typeof data.totalMatches !== "number") {
      errors.push("totalMatches must be a number");
    }

    if (data.totalMatches !== data.matches.length) {
      errors.push(
        `totalMatches (${data.totalMatches}) does not match matches array length (${data.matches.length})`
      );
    }

    // Validate each match
    data.matches.forEach((match, index) => {
      const matchErrors = this.validateFootballMatchStructureDetailed(
        match,
        index
      );
      errors.push(...matchErrors);
    });

    return errors;
  }

  /**
   * Validate individual football match structure with detailed error reporting
   */
  private validateFootballMatchStructureDetailed(
    match: FootballMatch,
    index: number
  ): string[] {
    const errors: string[] = [];
    const prefix = `matches[${index}]`;

    const requiredStringFields = [
      "matchId",
      "homeTeam",
      "awayTeam",
      "date",
      "time",
      "country",
      "league",
    ];

    // Check required string fields
    for (const field of requiredStringFields) {
      const value = match[field as keyof FootballMatch];
      if (typeof value !== "string") {
        errors.push(`${prefix}.${field} must be a string`);
      }
    }

    // Check that homeTeam and awayTeam are not empty
    if (!match.homeTeam) {
      errors.push(`${prefix}.homeTeam cannot be empty`);
    }
    if (!match.awayTeam) {
      errors.push(`${prefix}.awayTeam cannot be empty`);
    }

    // Check round is a number
    if (typeof match.round !== "number") {
      errors.push(`${prefix}.round must be a number`);
    }

    // Check odds array
    if (!Array.isArray(match.odds)) {
      errors.push(`${prefix}.odds must be an array`);
    } else {
      match.odds.forEach((odds, oddsIndex) => {
        const oddsErrors = this.validateMatchOddsStructureDetailed(
          odds,
          `${prefix}.odds[${oddsIndex}]`
        );
        errors.push(...oddsErrors);
      });
    }

    // Check markets array
    if (!Array.isArray(match.markets)) {
      errors.push(`${prefix}.markets must be an array`);
    } else {
      match.markets.forEach((market, marketIndex) => {
        const marketErrors = this.validateMarketStructureDetailed(
          market,
          `${prefix}.markets[${marketIndex}]`
        );
        errors.push(...marketErrors);
      });
    }

    return errors;
  }

  /**
   * Validate match odds structure with detailed error reporting
   */
  private validateMatchOddsStructureDetailed(
    odds: MatchOdds,
    prefix: string
  ): string[] {
    const errors: string[] = [];

    if (typeof odds.id !== "string") {
      errors.push(`${prefix}.id must be a string`);
    }
    if (typeof odds.homeWin !== "number") {
      errors.push(`${prefix}.homeWin must be a number`);
    }
    if (typeof odds.draw !== "number") {
      errors.push(`${prefix}.draw must be a number`);
    }
    if (typeof odds.awayWin !== "number") {
      errors.push(`${prefix}.awayWin must be a number`);
    }

    return errors;
  }

  /**
   * Validate market structure with detailed error reporting
   */
  private validateMarketStructureDetailed(
    market: Market,
    prefix: string
  ): string[] {
    const errors: string[] = [];

    if (typeof market.id !== "string") {
      errors.push(`${prefix}.id must be a string`);
    }
    if (typeof market.name !== "string") {
      errors.push(`${prefix}.name must be a string`);
    }
    if (!Array.isArray(market.odds)) {
      errors.push(`${prefix}.odds must be an array`);
    } else {
      market.odds.forEach((odd, oddIndex) => {
        if (typeof odd !== "number") {
          errors.push(`${prefix}.odds[${oddIndex}] must be a number`);
        }
      });
    }

    return errors;
  }

  /**
   * Validate generic analysis schema with detailed error reporting
   */
  private validateGenericAnalysisSchemaDetailed(
    data: GenericAnalysis
  ): string[] {
    const errors: string[] = [];

    if (typeof data.type !== "string") {
      errors.push("analysis.type must be a string");
    }
    if (typeof data.summary !== "string") {
      errors.push("analysis.summary must be a string");
    }
    if (typeof data.extractedData !== "object" || data.extractedData === null) {
      errors.push("analysis.extractedData must be an object");
    }

    return errors;
  }

  /**
   * Get analysis type for logging
   */
  private getAnalysisType(analysis: any): string {
    if (this.isFootballMatchData(analysis)) {
      return "football_match";
    } else if (this.isGenericAnalysis(analysis)) {
      return analysis.type || "generic";
    } else {
      return "unknown";
    }
  }

  /**
   * Create error result
   */
  private createErrorResult(
    code: ErrorCode,
    message: string,
    step: ProcessingStep
  ): ConversionResult {
    const errorDetails: ErrorDetails = {
      code,
      message,
      step,
      timestamp: new Date().toISOString(),
    };

    return {
      success: false,
      error: errorDetails,
    };
  }
}
