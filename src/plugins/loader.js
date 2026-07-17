import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.join(__dirname, 'commands');

export async function loadCommands(logger) {
  const commands = new Map();
  const aliases = new Map();

  const entries = await fs.readdir(commandsDir);
  const files = entries.filter((file) => file.endsWith('.js'));

  for (const file of files) {
    const fileUrl = pathToFileURL(path.join(commandsDir, file)).href;
    const mod = await import(fileUrl);
    const command = mod.default;

    if (!command || typeof command.name !== 'string' || typeof command.execute !== 'function') {
      logger.warn(`Skipping invalid command file: ${file}`);
      continue;
    }

    commands.set(command.name, command);

    if (Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        aliases.set(alias, command.name);
      }
    }
  }

  return { commands, aliases };
}
