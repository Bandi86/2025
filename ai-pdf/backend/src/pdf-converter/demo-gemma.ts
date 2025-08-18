/**
 * Demo script to test Gemma AI Client functionality
 */

import { GemmaAIClient } from "./gemma-client";
import { getConfig } from "./config";

async function demoGemmaClient() {
  console.log("🚀 Starting Gemma AI Client Demo...\n");

  try {
    // Load configuration
    const config = getConfig();
    console.log("📋 Configuration loaded:");
    console.log(`   Host: ${config.ollama.host}`);
    console.log(`   Model: ${config.ollama.model}`);
    console.log(`   Timeout: ${config.ollama.timeout}ms`);
    console.log(`   Retry attempts: ${config.ollama.retryAttempts}\n`);

    // Create client
    const client = new GemmaAIClient(config);

    // Test connection
    console.log("🔗 Testing connection to Ollama...");
    const isConnected = await client.testConnection();
    console.log(
      `   Connection status: ${isConnected ? "✅ Connected" : "❌ Failed"}\n`
    );

    if (!isConnected) {
      console.log(
        "⚠️  Ollama service is not available. Make sure Ollama is running and the model is available."
      );
      console.log("   You can start Ollama with: ollama serve");
      console.log(
        `   And pull the model with: ollama pull ${config.ollama.model}\n`
      );
    }

    // Test prompt formatting
    console.log("📝 Testing prompt formatting...");
    const sampleText =
      "Manchester United vs Liverpool, Premier League match on 2025-01-20 at 15:00. Home win odds: 2.1, Draw: 3.2, Away win: 2.8";
    const prompt = client.formatPrompt(sampleText);
    console.log("   Sample text:", sampleText);
    console.log("   Formatted prompt length:", prompt.length, "characters\n");

    // Test input validation
    console.log("🔍 Testing input validation...");
    const emptyResult = await client.analyzeText("");
    console.log(
      "   Empty text result:",
      emptyResult.success ? "✅ Success" : "❌ Failed (expected)"
    );
    console.log("   Error message:", emptyResult.error);
    console.log("   Processing time:", emptyResult.processingTimeMs, "ms\n");

    // Test text analysis (if connected)
    if (isConnected) {
      console.log("⚽ Testing text analysis...");
      const analysisResult = await client.analyzeText(sampleText);
      console.log(
        "   Analysis result:",
        analysisResult.success ? "✅ Success" : "❌ Failed"
      );

      if (analysisResult.success) {
        console.log(
          "   Matches found:",
          analysisResult.data?.matches?.length || 0
        );
        console.log(
          "   Processing time:",
          analysisResult.processingTimeMs,
          "ms"
        );

        if (analysisResult.data?.matches?.length > 0) {
          const match = analysisResult.data.matches[0];
          console.log("   First match:", {
            id: match.matchId,
            teams: `${match.homeTeam} vs ${match.awayTeam}`,
            date: match.date,
            time: match.time,
          });
        }
      } else {
        console.log("   Error:", analysisResult.error);
        console.log(
          "   Processing time:",
          analysisResult.processingTimeMs,
          "ms"
        );
      }
    }

    console.log("\n✨ Demo completed successfully!");
  } catch (error) {
    console.error("❌ Demo failed with error:", error);
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demoGemmaClient().catch(console.error);
}

export { demoGemmaClient };
