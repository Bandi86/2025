/**
 * Unit tests for JSON Generator component
 */

import { JSONGeneratorService } from "../json-generator";
import {
  FootballMatchData,
  GenericAnalysis,
  ProcessedDocument,
  ErrorCode,
  ProcessingStep,
} from "../types";

describe("JSONGeneratorService", () => {
  let jsonGenerator: JSONGeneratorService;

  beforeEach(() => {
    jsonGenerator = new JSONGeneratorService();
  });

  describe("Data Structure Mapping", () => {
    describe("Football Match Data Mapping", () => {
      it("should map valid football match data correctly", async () => {
        const mockAnalysis = {
          matches: [
            {
              matchId: "match_123",
              homeTeam: "Team A",
              awayTeam: "Team B",
              date: "2024-01-15",
              time: "20:00",
              country: "England",
              league: "Premier League",
              round: 1,
              odds: [
                {
                  id: "odds_1",
                  homeWin: 1.9,
                  draw: 3.2,
                  awayWin: 2.8,
                },
              ],
              markets: [
                {
                  id: "market_1",
                  name: "Match Winner",
                  odds: [1.9, 3.2, 2.8],
                },
              ],
            },
          ],
        };

        const result = await jsonGenerator.generateOutput(
          "Sample text",
          mockAnalysis
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.content.analysis).toBeDefined();

        const analysis = result.data!.content.analysis as FootballMatchData;
        expect(analysis.matches).toHaveLength(1);
        expect(analysis.totalMatches).toBe(1);

        const match = analysis.matches[0];
        expect(match.matchId).toBe("match_123");
        expect(match.homeTeam).toBe("Team A");
        expect(match.awayTeam).toBe("Team B");
        expect(match.date).toBe("2024-01-15");
        expect(match.time).toBe("20:00");
        expect(match.country).toBe("England");
        expect(match.league).toBe("Premier League");
        expect(match.round).toBe(1);
        expect(match.odds).toHaveLength(1);
        expect(match.markets).toHaveLength(1);
      });

      it("should handle alternative field names (snake_case)", async () => {
        const mockAnalysis = {
          matches: [
            {
              matchid: "match_456",
              home_team: "Team C",
              away_team: "Team D",
              date: "2024-01-16",
              time: "18:00",
              country: "Spain",
              league: "La Liga",
              round: 2,
              odds: [
                {
                  id: "odds_2",
                  home_win_odds: 2.1,
                  draw_odds: 3.0,
                  away_win_odds: 2.5,
                },
              ],
            },
          ],
        };

        const result = await jsonGenerator.generateOutput(
          "Sample text",
          mockAnalysis
        );

        expect(result.success).toBe(true);
        const analysis = result.data!.content.analysis as FootballMatchData;
        const match = analysis.matches[0];

        expect(match.matchId).toBe("match_456");
        expect(match.homeTeam).toBe("Team C");
        expect(match.awayTeam).toBe("Team D");
        expect(match.odds[0].homeWin).toBe(2.1);
        expect(match.odds[0].draw).toBe(3.0);
        expect(match.odds[0].awayWin).toBe(2.5);
      });

      it("should handle missing or incomplete data gracefully", async () => {
        const mockAnalysis = {
          matches: [
            {
              homeTeam: "Team E",
              awayTeam: "Team F",
              // Missing other fields
            },
            {
              // Missing required fields - should be filtered out
              date: "2024-01-17",
            },
            {
              homeTeam: "Team G",
              awayTeam: "Team H",
              date: "2024-01-18",
              odds: "invalid_odds", // Invalid odds format
              markets: null, // Invalid markets format
            },
          ],
        };

        const result = await jsonGenerator.generateOutput(
          "Sample text",
          mockAnalysis
        );

        expect(result.success).toBe(true);
        const analysis = result.data!.content.analysis as FootballMatchData;

        // Should have 2 valid matches (first and third)
        expect(analysis.matches).toHaveLength(2);
        expect(analysis.totalMatches).toBe(2);

        const firstMatch = analysis.matches[0];
        expect(firstMatch.homeTeam).toBe("Team E");
        expect(firstMatch.awayTeam).toBe("Team F");
        expect(firstMatch.date).toBe(""); // Default empty string
        expect(firstMatch.round).toBe(0); // Default number
        expect(firstMatch.odds).toHaveLength(0); // Empty array for missing odds
        expect(firstMatch.markets).toHaveLength(0); // Empty array for missing markets

        const secondMatch = analysis.matches[1];
        expect(secondMatch.homeTeam).toBe("Team G");
        expect(secondMatch.awayTeam).toBe("Team H");
        expect(secondMatch.odds).toHaveLength(0); // Invalid odds filtered out
        expect(secondMatch.markets).toHaveLength(0); // Invalid markets filtered out
      });

      it("should generate IDs for missing match IDs", async () => {
        const mockAnalysis = {
          matches: [
            {
              homeTeam: "Team I",
              awayTeam: "Team J",
              // No matchId provided
            },
          ],
        };

        const result = await jsonGenerator.generateOutput(
          "Sample text",
          mockAnalysis
        );

        expect(result.success).toBe(true);
        const analysis = result.data!.content.analysis as FootballMatchData;
        const match = analysis.matches[0];

        expect(match.matchId).toMatch(/^match_\d+_[a-z0-9]+$/);
      });

      it("should handle empty matches array", async () => {
        const mockAnalysis = {
          matches: [],
        };

        const result = await jsonGenerator.generateOutput(
          "Sample text",
          mockAnalysis
        );

        expect(result.success).toBe(true);
        const analysis = result.data!.content.analysis as FootballMatchData;
        expect(analysis.matches).toHaveLength(0);
        expect(analysis.totalMatches).toBe(0);
      });
    });

    describe("Generic Analysis Mapping", () => {
      it("should map non-football data to generic analysis", async () => {
        const mockAnalysis = {
          type: "document",
          content: "Some document content",
          metadata: { pages: 5 },
        };

        const result = await jsonGenerator.generateOutput(
          "Sample text",
          mockAnalysis
        );

        expect(result.success).toBe(true);
        const analysis = result.data!.content.analysis as GenericAnalysis;
        expect(analysis.type).toBe("generic");
        expect(analysis.summary).toBe("Non-football content analysis");
        expect(analysis.extractedData).toEqual(mockAnalysis);
      });

      it("should handle null or undefined analysis", async () => {
        const result = await jsonGenerator.generateOutput("Sample text", null);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.message).toContain("Analysis data is required");
      });
    });
  });

  describe("Data Validation", () => {
    it("should validate required fields for match data", async () => {
      const mockAnalysis = {
        matches: [
          {
            homeTeam: "Team A",
            awayTeam: "Team B",
          },
        ],
      };

      const result = await jsonGenerator.generateOutput(
        "Sample text",
        mockAnalysis
      );

      expect(result.success).toBe(true);
      const analysis = result.data!.content.analysis as FootballMatchData;
      expect(analysis.matches).toHaveLength(1);
    });

    it("should filter out matches without required fields", async () => {
      const mockAnalysis = {
        matches: [
          {
            homeTeam: "Team A",
            // Missing awayTeam
          },
          {
            awayTeam: "Team B",
            // Missing homeTeam
          },
          {
            date: "2024-01-15",
            // Missing both teams
          },
        ],
      };

      const result = await jsonGenerator.generateOutput(
        "Sample text",
        mockAnalysis
      );

      expect(result.success).toBe(true);
      const analysis = result.data!.content.analysis as FootballMatchData;
      expect(analysis.matches).toHaveLength(0); // All matches should be filtered out
      expect(analysis.totalMatches).toBe(0);
    });

    it("should sanitize string values", async () => {
      const mockAnalysis = {
        matches: [
          {
            homeTeam: "  Team A  ", // Extra whitespace
            awayTeam: 123, // Non-string value
            date: null, // Null value
          },
        ],
      };

      const result = await jsonGenerator.generateOutput(
        "Sample text",
        mockAnalysis
      );

      expect(result.success).toBe(true);
      const analysis = result.data!.content.analysis as FootballMatchData;
      const match = analysis.matches[0];

      expect(match.homeTeam).toBe("Team A"); // Trimmed
      expect(match.awayTeam).toBe("123"); // Converted to string
      expect(match.date).toBe(""); // Null converted to empty string
    });

    it("should sanitize number values", async () => {
      const mockAnalysis = {
        matches: [
          {
            homeTeam: "Team A",
            awayTeam: "Team B",
            round: "5", // String number
            odds: [
              {
                homeWin: "1.9", // String number
                draw: null, // Null value
                awayWin: "invalid", // Invalid number
              },
            ],
          },
        ],
      };

      const result = await jsonGenerator.generateOutput(
        "Sample text",
        mockAnalysis
      );

      expect(result.success).toBe(true);
      const analysis = result.data!.content.analysis as FootballMatchData;
      const match = analysis.matches[0];

      expect(match.round).toBe(5); // Converted to number
      expect(match.odds[0].homeWin).toBe(1.9); // Converted to number
      expect(match.odds[0].draw).toBe(0); // Null converted to default
      expect(match.odds[0].awayWin).toBe(0); // Invalid converted to default
    });
  });

  describe("Input Validation", () => {
    it("should reject empty or invalid original text", async () => {
      const mockAnalysis = { matches: [] };

      let result = await jsonGenerator.generateOutput("", mockAnalysis);
      expect(result.success).toBe(false);
      expect(result.error!.message).toContain("Original text is required");

      result = await jsonGenerator.generateOutput(null as any, mockAnalysis);
      expect(result.success).toBe(false);
      expect(result.error!.message).toContain("Original text is required");
    });

    it("should reject missing analysis data", async () => {
      const result = await jsonGenerator.generateOutput(
        "Sample text",
        undefined
      );

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain("Analysis data is required");
    });
  });

  describe("JSON Output Generation", () => {
    it("should generate JSON output with metadata", async () => {
      const mockAnalysis = {
        matches: [
          {
            matchId: "match_123",
            homeTeam: "Team A",
            awayTeam: "Team B",
            date: "2024-01-15",
            time: "20:00",
            country: "England",
            league: "Premier League",
            round: 1,
            odds: [],
            markets: [],
          },
        ],
      };

      const originalText = "Sample PDF text content";
      const result = await jsonGenerator.generateJSONOutput(
        originalText,
        mockAnalysis,
        "test.pdf"
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const document = result.data!;
      expect(document.metadata.originalFile).toBe("test.pdf");
      expect(document.metadata.processedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
      expect(document.metadata.textLength).toBe(originalText.length);
      expect(document.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(document.content.originalText).toBe(originalText);
      expect(document.status).toBe("success");
    });

    it("should validate JSON structure against schema", async () => {
      const validAnalysis = {
        matches: [
          {
            matchId: "match_123",
            homeTeam: "Team A",
            awayTeam: "Team B",
            date: "2024-01-15",
            time: "20:00",
            country: "England",
            league: "Premier League",
            round: 1,
            odds: [
              {
                id: "odds_1",
                homeWin: 1.9,
                draw: 3.2,
                awayWin: 2.8,
              },
            ],
            markets: [
              {
                id: "market_1",
                name: "Match Winner",
                odds: [1.9, 3.2, 2.8],
              },
            ],
          },
        ],
      };

      const result = await jsonGenerator.generateJSONOutput(
        "Sample text",
        validAnalysis
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should include original text and processing metadata", async () => {
      const mockAnalysis = { matches: [] };
      const originalText = "This is the original PDF text content";

      const result = await jsonGenerator.generateJSONOutput(
        originalText,
        mockAnalysis
      );

      expect(result.success).toBe(true);
      expect(result.data!.content.originalText).toBe(originalText);
      expect(result.data!.metadata.textLength).toBe(originalText.length);
      expect(result.data!.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("should generate formatted JSON string", async () => {
      const mockDocument: ProcessedDocument = {
        metadata: {
          originalFile: "test.pdf",
          processedAt: "2024-01-15T10:00:00.000Z",
          textLength: 100,
          processingTimeMs: 500,
        },
        content: {
          originalText: "Sample text",
          analysis: {
            matches: [],
            totalMatches: 0,
          },
        },
        status: "success",
      };

      const formattedJSON = jsonGenerator.generateFormattedJSON(mockDocument);

      expect(formattedJSON).toContain("{\n");
      expect(formattedJSON).toContain('  "metadata":');
      expect(formattedJSON).toContain('  "content":');
      expect(formattedJSON).toContain('  "status": "success"');

      // Should be valid JSON
      expect(() => JSON.parse(formattedJSON)).not.toThrow();
    });

    it("should generate compact JSON string", async () => {
      const mockDocument: ProcessedDocument = {
        metadata: {
          originalFile: "test.pdf",
          processedAt: "2024-01-15T10:00:00.000Z",
          textLength: 100,
          processingTimeMs: 500,
        },
        content: {
          originalText: "Sample text",
          analysis: {
            matches: [],
            totalMatches: 0,
          },
        },
        status: "success",
      };

      const compactJSON = jsonGenerator.generateCompactJSON(mockDocument);

      expect(compactJSON).not.toContain("\n");
      expect(compactJSON).not.toContain("  ");
      expect(compactJSON).toContain('{"metadata":');

      // Should be valid JSON
      expect(() => JSON.parse(compactJSON)).not.toThrow();
    });

    it("should create enhanced metadata with additional info", () => {
      const additionalInfo = {
        aiModel: "gemma2:2b",
        confidence: 0.95,
        processingSteps: ["pdf-extraction", "ai-analysis", "json-generation"],
      };

      const metadata = jsonGenerator.createEnhancedMetadata(
        "test.pdf",
        1000,
        2500,
        additionalInfo
      );

      expect(metadata.originalFile).toBe("test.pdf");
      expect(metadata.textLength).toBe(1000);
      expect(metadata.processingTimeMs).toBe(2500);
      expect(metadata.processedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
      expect((metadata as any).aiModel).toBe("gemma2:2b");
      expect((metadata as any).confidence).toBe(0.95);
      expect((metadata as any).processingSteps).toEqual([
        "pdf-extraction",
        "ai-analysis",
        "json-generation",
      ]);
    });
  });

  describe("JSON Schema Validation", () => {
    it("should validate complete football match schema", async () => {
      const validAnalysis = {
        matches: [
          {
            matchId: "match_123",
            homeTeam: "Team A",
            awayTeam: "Team B",
            date: "2024-01-15",
            time: "20:00",
            country: "England",
            league: "Premier League",
            round: 1,
            odds: [
              {
                id: "odds_1",
                homeWin: 1.9,
                draw: 3.2,
                awayWin: 2.8,
              },
            ],
            markets: [
              {
                id: "market_1",
                name: "Match Winner",
                odds: [1.9, 3.2, 2.8],
              },
            ],
          },
        ],
      };

      const result = await jsonGenerator.generateJSONOutput(
        "Sample text",
        validAnalysis
      );

      expect(result.success).toBe(true);
      expect(jsonGenerator.validateOutput(result.data!)).toBe(true);
    });

    it("should validate generic analysis schema", async () => {
      const genericAnalysis = {
        type: "document",
        content: "Some content",
      };

      const result = await jsonGenerator.generateJSONOutput(
        "Sample text",
        genericAnalysis
      );

      expect(result.success).toBe(true);
      expect(jsonGenerator.validateOutput(result.data!)).toBe(true);
    });

    it("should reject invalid match structure", async () => {
      // Create a document with invalid match structure
      const invalidDocument = {
        metadata: {
          originalFile: "test.pdf",
          processedAt: "2024-01-15T10:00:00.000Z",
          textLength: 100,
          processingTimeMs: 500,
        },
        content: {
          originalText: "Sample text",
          analysis: {
            matches: [
              {
                matchId: "match_123",
                homeTeam: "", // Empty required field
                awayTeam: "Team B",
                date: "2024-01-15",
                time: "20:00",
                country: "England",
                league: "Premier League",
                round: 1,
                odds: [],
                markets: [],
              },
            ],
            totalMatches: 1,
          },
        },
        status: "success",
      };

      const isValid = jsonGenerator.validateOutput(invalidDocument);
      expect(isValid).toBe(false);
    });

    it("should reject inconsistent totalMatches count", async () => {
      const invalidAnalysis = {
        matches: [
          {
            matchId: "match_123",
            homeTeam: "Team A",
            awayTeam: "Team B",
            date: "2024-01-15",
            time: "20:00",
            country: "England",
            league: "Premier League",
            round: 1,
            odds: [],
            markets: [],
          },
        ],
      };

      const result = await jsonGenerator.generateOutput(
        "Sample text",
        invalidAnalysis
      );

      // Manually corrupt the totalMatches to test validation
      if (result.success && result.data) {
        const analysis = result.data.content.analysis as FootballMatchData;
        analysis.totalMatches = 999; // Wrong count

        const isValid = jsonGenerator.validateOutput(result.data);
        expect(isValid).toBe(false);
      }
    });
  });

  describe("Error Handling and Validation", () => {
    describe("Malformed AI Response Handling", () => {
      it("should handle malformed JSON responses gracefully", async () => {
        const malformedResponse =
          '{"matches": [{"homeTeam": "Team A", "awayTeam":}'; // Invalid JSON

        const result = jsonGenerator.handleMalformedResponse(
          malformedResponse,
          "Sample text"
        );

        expect(result.success).toBe(true);
        expect(result.data!.status).toBe("partial");
        expect(result.data!.content.analysis.type).toBe("malformed_response");
        expect(result.data!.content.analysis.summary).toContain(
          "malformed but partially processed"
        );
      });

      it("should handle non-JSON string responses", async () => {
        const textResponse = "This is just plain text, not JSON";

        const result = jsonGenerator.handleMalformedResponse(
          textResponse,
          "Sample text"
        );

        expect(result.success).toBe(true);
        expect(result.data!.status).toBe("partial");
        const analysis = result.data!.content.analysis as GenericAnalysis;
        expect(analysis.extractedData.rawText).toBe(textResponse);
      });

      it("should handle null or undefined responses", async () => {
        const result1 = jsonGenerator.handleMalformedResponse(
          null,
          "Sample text"
        );
        const result2 = jsonGenerator.handleMalformedResponse(
          undefined,
          "Sample text"
        );

        expect(result1.success).toBe(true);
        expect(result1.data!.status).toBe("partial");
        expect(result2.success).toBe(true);
        expect(result2.data!.status).toBe("partial");
      });

      it("should handle object responses with unexpected structure", async () => {
        const unexpectedResponse = {
          someField: "value",
          anotherField: 123,
          nested: { data: "test" },
        };

        const result = jsonGenerator.handleMalformedResponse(
          unexpectedResponse,
          "Sample text"
        );

        expect(result.success).toBe(true);
        expect(result.data!.status).toBe("partial");
        const analysis = result.data!.content.analysis as GenericAnalysis;
        expect(analysis.extractedData).toEqual(unexpectedResponse);
      });
    });

    describe("AI Response Validation", () => {
      it("should validate valid JSON string responses", () => {
        const validResponse = '{"matches": []}';
        const result = jsonGenerator.validateAIResponse(validResponse);

        expect(result.isValid).toBe(true);
        expect(result.sanitized).toEqual({ matches: [] });
      });

      it("should reject invalid JSON string responses", () => {
        const invalidResponse = '{"matches": [}'; // Invalid JSON
        const result = jsonGenerator.validateAIResponse(invalidResponse);

        expect(result.isValid).toBe(false);
        expect(result.error).toContain("not valid JSON");
      });

      it("should validate object responses", () => {
        const objectResponse = { matches: [] };
        const result = jsonGenerator.validateAIResponse(objectResponse);

        expect(result.isValid).toBe(true);
        expect(result.sanitized).toEqual(objectResponse);
      });

      it("should reject null or undefined responses", () => {
        const result1 = jsonGenerator.validateAIResponse(null);
        const result2 = jsonGenerator.validateAIResponse(undefined);

        expect(result1.isValid).toBe(false);
        expect(result1.error).toContain("null or undefined");
        expect(result2.isValid).toBe(false);
        expect(result2.error).toContain("null or undefined");
      });

      it("should reject non-object, non-string responses", () => {
        const result1 = jsonGenerator.validateAIResponse(123);
        const result2 = jsonGenerator.validateAIResponse(true);

        expect(result1.isValid).toBe(false);
        expect(result2.isValid).toBe(false);
      });

      it("should handle array responses as objects", () => {
        const result = jsonGenerator.validateAIResponse([]);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toEqual([]);
      });
    });

    describe("Structured Error Responses", () => {
      it("should create structured error response without original text", () => {
        const result = jsonGenerator.createStructuredErrorResponse(
          ErrorCode.AI_ANALYSIS_FAILED,
          "AI service unavailable",
          ProcessingStep.AI_ANALYSIS
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.code).toBe(ErrorCode.AI_ANALYSIS_FAILED);
        expect(result.error!.message).toBe("AI service unavailable");
        expect(result.error!.step).toBe(ProcessingStep.AI_ANALYSIS);
        expect(result.data).toBeUndefined();
      });

      it("should create structured error response with original text", () => {
        const originalText = "Sample PDF text content";
        const result = jsonGenerator.createStructuredErrorResponse(
          ErrorCode.JSON_GENERATION_FAILED,
          "Failed to generate JSON",
          ProcessingStep.JSON_GENERATION,
          originalText
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data!.status).toBe("failed");
        expect(result.data!.content.originalText).toBe(originalText);
        expect(result.data!.content.analysis.type).toBe("error");
      });

      it("should include additional details in error response", () => {
        const additionalDetails = { attemptCount: 3, lastError: "Timeout" };
        const result = jsonGenerator.createStructuredErrorResponse(
          ErrorCode.AI_SERVICE_UNAVAILABLE,
          "Service timeout",
          ProcessingStep.AI_ANALYSIS,
          undefined,
          additionalDetails
        );

        expect(result.success).toBe(false);
        expect(result.error!.details).toEqual(additionalDetails);
      });
    });

    describe("Detailed JSON Schema Validation", () => {
      it("should validate correct schema and return no errors", () => {
        const validDocument: ProcessedDocument = {
          metadata: {
            originalFile: "test.pdf",
            processedAt: "2024-01-15T10:00:00.000Z",
            textLength: 100,
            processingTimeMs: 500,
          },
          content: {
            originalText: "Sample text",
            analysis: {
              matches: [],
              totalMatches: 0,
            },
          },
          status: "success",
        };

        const result = jsonGenerator.validateJSONSchema(validDocument);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should detect missing required properties", () => {
        const invalidDocument = {
          // Missing metadata
          content: {
            originalText: "Sample text",
            analysis: { matches: [], totalMatches: 0 },
          },
          status: "success",
        };

        const result = jsonGenerator.validateJSONSchema(invalidDocument);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Missing metadata property");
      });

      it("should detect invalid property types", () => {
        const invalidDocument = {
          metadata: {
            originalFile: "test.pdf",
            processedAt: 123, // Should be string
            textLength: "100", // Should be number
            processingTimeMs: 500,
          },
          content: {
            originalText: "Sample text",
            analysis: { matches: [], totalMatches: 0 },
          },
          status: "success",
        };

        const result = jsonGenerator.validateJSONSchema(invalidDocument);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "metadata.processedAt must be a string"
        );
        expect(result.errors).toContain("metadata.textLength must be a number");
      });

      it("should detect invalid status values", () => {
        const invalidDocument = {
          metadata: {
            originalFile: "test.pdf",
            processedAt: "2024-01-15T10:00:00.000Z",
            textLength: 100,
            processingTimeMs: 500,
          },
          content: {
            originalText: "Sample text",
            analysis: { matches: [], totalMatches: 0 },
          },
          status: "invalid_status",
        };

        const result = jsonGenerator.validateJSONSchema(invalidDocument);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "status must be 'success', 'partial', or 'failed'"
        );
      });

      it("should detect football match schema errors", () => {
        const invalidDocument = {
          metadata: {
            originalFile: "test.pdf",
            processedAt: "2024-01-15T10:00:00.000Z",
            textLength: 100,
            processingTimeMs: 500,
          },
          content: {
            originalText: "Sample text",
            analysis: {
              matches: [
                {
                  matchId: "match_123",
                  homeTeam: "", // Empty required field
                  awayTeam: "Team B",
                  date: "2024-01-15",
                  time: "20:00",
                  country: "England",
                  league: "Premier League",
                  round: "1", // Should be number
                  odds: [],
                  markets: [],
                },
              ],
              totalMatches: 2, // Inconsistent with array length
            },
          },
          status: "success",
        };

        const result = jsonGenerator.validateJSONSchema(invalidDocument);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("matches[0].homeTeam cannot be empty");
        expect(result.errors).toContain("matches[0].round must be a number");
        expect(result.errors).toContain(
          "totalMatches (2) does not match matches array length (1)"
        );
      });

      it("should detect odds and markets validation errors", () => {
        const invalidDocument = {
          metadata: {
            originalFile: "test.pdf",
            processedAt: "2024-01-15T10:00:00.000Z",
            textLength: 100,
            processingTimeMs: 500,
          },
          content: {
            originalText: "Sample text",
            analysis: {
              matches: [
                {
                  matchId: "match_123",
                  homeTeam: "Team A",
                  awayTeam: "Team B",
                  date: "2024-01-15",
                  time: "20:00",
                  country: "England",
                  league: "Premier League",
                  round: 1,
                  odds: [
                    {
                      id: 123, // Should be string
                      homeWin: "1.9", // Should be number
                      draw: 3.2,
                      awayWin: 2.8,
                    },
                  ],
                  markets: [
                    {
                      id: "market_1",
                      name: "Match Winner",
                      odds: [1.9, "3.2", 2.8], // Mixed types
                    },
                  ],
                },
              ],
              totalMatches: 1,
            },
          },
          status: "success",
        };

        const result = jsonGenerator.validateJSONSchema(invalidDocument);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "matches[0].odds[0].id must be a string"
        );
        expect(result.errors).toContain(
          "matches[0].odds[0].homeWin must be a number"
        );
        expect(result.errors).toContain(
          "matches[0].markets[0].odds[1] must be a number"
        );
      });
    });
  });
});
