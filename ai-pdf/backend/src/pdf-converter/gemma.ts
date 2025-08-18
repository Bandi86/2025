/**
 * Legacy Gemma integration - refactored to use new client component
 * Maintains backward compatibility while using the new architecture
 */

import fs from "fs";
import path from "path";
import { FootballMatches, convertNewToLegacy } from "./data-types";
import { GemmaAIClient } from "./gemma-client";
import { loadConfig } from "./config";

// Legacy configuration - maintained for backward compatibility
const textfilePath = "./output";

// Initialize new client with configuration
const config = loadConfig();
const gemmaClient = new GemmaAIClient(config);

/**
 * Legacy function - refactored to use new client component
 * Maintains the same interface for backward compatibility
 */
async function processFiles() {
  try {
    // Check the txt files in the directory
    const files = fs.readdirSync(textfilePath);
    console.log(`Found ${files.length} files.`);
    console.log(`Files: ${files}`);

    // If 0 files are found, log an error message and exit
    if (files.length === 0) {
      console.error("No text files found. Exiting...");
      process.exit(1);
    }

    // Test connection first
    const isConnected = await gemmaClient.testConnection();
    if (!isConnected) {
      console.error(
        "❌ Gemma AI service is not available. Make sure Ollama is running."
      );
      process.exit(1);
    }

    console.log("✅ Connected to Gemma AI service");

    // Loop through the text files and process each one
    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      console.log(`Processing ${filename}...`);

      const textfilePathWithFilename = path.join(textfilePath, filename);
      const textfileContent = fs.readFileSync(textfilePathWithFilename, "utf8");

      try {
        // Use new client for analysis
        const analysisResult = await gemmaClient.analyzeText(textfileContent);

        if (analysisResult.success && analysisResult.data) {
          // Convert new format to legacy format for backward compatibility
          const legacyFormat = convertNewToLegacy(analysisResult.data);

          // Save as JSON file (legacy format)
          const jsonFilePath = path.join(
            textfilePath,
            "jsons",
            `${filename.split(".")[0]}.json`
          );

          // Ensure jsons directory exists
          const jsonsDir = path.dirname(jsonFilePath);
          if (!fs.existsSync(jsonsDir)) {
            fs.mkdirSync(jsonsDir, { recursive: true });
          }

          fs.writeFileSync(jsonFilePath, JSON.stringify(legacyFormat, null, 2));
          console.log(`✅ JSON file created: ${jsonFilePath}`);
          console.log(
            `   Processing time: ${analysisResult.processingTimeMs}ms`
          );
          console.log(
            `   Matches found: ${analysisResult.data.matches?.length || 0}`
          );
        } else {
          console.error(
            `❌ Failed to analyze ${filename}:`,
            analysisResult.error
          );

          // Create error file for debugging
          const errorFilePath = path.join(
            textfilePath,
            "jsons",
            `${filename.split(".")[0]}_error.json`
          );
          fs.writeFileSync(
            errorFilePath,
            JSON.stringify(
              {
                error: analysisResult.error,
                filename: filename,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            )
          );
        }
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error);
      }
    }

    console.log("✅ All files processed successfully");
  } catch (error) {
    console.error("❌ Error in processFiles:", error);
    process.exit(1);
  }
}

/**
 * New function to process a single text file
 * @param textContent The text content to analyze
 * @returns Promise<FootballMatches> Legacy format result
 */
export async function processTextContent(
  textContent: string
): Promise<FootballMatches> {
  const analysisResult = await gemmaClient.analyzeText(textContent);

  if (analysisResult.success && analysisResult.data) {
    return convertNewToLegacy(analysisResult.data);
  } else {
    throw new Error(`Analysis failed: ${analysisResult.error}`);
  }
}

/**
 * Get the Gemma client instance for advanced usage
 * @returns GemmaAIClient instance
 */
export function getGemmaClient(): GemmaAIClient {
  return gemmaClient;
}

// Export legacy function for backward compatibility
export { processFiles };

// Run processFiles if this file is executed directly (legacy behavior)
if (require.main === module) {
  processFiles().catch(console.error);
}
