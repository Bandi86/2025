
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

export const run_shell_command = async (command) => {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    return { stdout, stderr };
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    throw error;
  }
};
