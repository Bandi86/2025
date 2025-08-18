import chokidar from "chokidar";
import path from "path";
import { startProcessPDF } from "./converter";

const sourceDir = path.resolve(__dirname, "../../../source"); // Path to the directory you want to watch
export let signal = false;

// Creating watcher source folder
const watcher = chokidar.watch(sourceDir, {
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100,
  },
});

watcher.on("add", async (filePath) => {
  signal = true;
  console.log(`New PDF file detected: ${filePath}`);

  // Automatically process the new PDF file using the refactored converter
  try {
    await startProcessPDF();
    signal = false; // Reset signal after processing
  } catch (error) {
    console.error("Error processing new PDF file:", error);
    signal = false; // Reset signal even on error
  }
});
