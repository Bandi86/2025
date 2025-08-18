import path from "path";
import fs from "fs/promises";
import { signal } from "./watcher";
import { PDFConverterService } from "./converter-service";
import { ConversionResult } from "./types";

// Initialize the new converter service
const converterService = new PDFConverterService();

// PATH - maintain backward compatibility
const sourceDir = path.resolve(__dirname, "../../../source");
const outputDirText = path.resolve(__dirname, "./output");
const jsonDir = path.resolve(outputDirText, "./jsons");

// Creating folder structure - maintain backward compatibility
fs.mkdir(jsonDir, { recursive: true });
fs.mkdir(outputDirText, { recursive: true });
console.log("Folders created successfully");

/**
 * Legacy function - refactored to use new converter service
 * Maintains backward compatibility while using new architecture
 */
export async function startProcessPDF() {
  try {
    if (!signal) return; // csak akkor induljon, ha van új jelzés

    const files = await fs.readdir(sourceDir);
    const pdfFiles = files.filter((file) => file.endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      console.log("No PDF files found.");
      return;
    }

    // Use new converter service for processing
    for (const pdfFile of pdfFiles) {
      const filePath = path.resolve(sourceDir, pdfFile);

      try {
        // Use new converter service for full PDF to JSON conversion
        const result: ConversionResult =
          await converterService.convertPDF(filePath);

        if (result.success && result.data) {
          // Save JSON output to maintain compatibility with existing structure
          const jsonOutputPath = path.resolve(
            jsonDir,
            pdfFile.replace(".pdf", ".json")
          );
          await fs.writeFile(
            jsonOutputPath,
            JSON.stringify(result.data, null, 2),
            "utf8"
          );

          // Also save text output for backward compatibility
          const txtOutputPath = path.resolve(
            outputDirText,
            pdfFile.replace(".pdf", ".txt")
          );
          await fs.writeFile(
            txtOutputPath,
            result.data.content.originalText,
            "utf8"
          );

          console.log(`✅ Converted ${pdfFile} to JSON and text`);
        } else {
          console.error(
            `❌ Failed to convert ${pdfFile}:`,
            result.error?.message
          );
        }
      } catch (error) {
        console.error(`❌ Error processing ${pdfFile}:`, error);
      }
    }
  } catch (err) {
    console.error("Error processing PDFs:", err);
  }
}

/**
 * New function to process a single PDF file using the new service
 * @param filePath Path to the PDF file to process
 * @returns ConversionResult with processing outcome
 */
export async function processSinglePDF(
  filePath: string
): Promise<ConversionResult> {
  return await converterService.convertPDF(filePath);
}

/**
 * New function to process multiple PDF files using the new service
 * @param directoryPath Path to directory containing PDF files
 * @returns Array of ConversionResult for each file
 */
export async function processBatchPDF(
  directoryPath: string
): Promise<ConversionResult[]> {
  return await converterService.processBatch(directoryPath);
}

/**
 * Get the converter service instance for advanced usage
 * @returns PDFConverterService instance
 */
export function getConverterService(): PDFConverterService {
  return converterService;
}
