import { run_shell_command } from './shell.js';
import fs from 'fs-extra';
import path from 'path';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

const getSelectorFromLLM = async (htmlContent, prompt) => {
  const payload = {
    model: 'qwen:0.5b',
    prompt: `${prompt}\n\nHTML:\n${htmlContent}`,
    stream: false,
  };

  const tempPayloadFile = path.join('/tmp', `ollama_payload_${Date.now()}.json`);
  await fs.writeJson(tempPayloadFile, payload);

  const command = `curl -s -X POST ${OLLAMA_API_URL} -d @${tempPayloadFile}`;

  try {
    const result = await run_shell_command(command);
    const response = JSON.parse(result.stdout);
    const selector = response.response.trim().replace(/[`\n]/g, '');
    return selector;
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    return null;
  } finally {
    await fs.remove(tempPayloadFile);
  }
};

export { getSelectorFromLLM };