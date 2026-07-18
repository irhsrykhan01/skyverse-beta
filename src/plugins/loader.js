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

    // A single broken plugin (syntax error, throwing top-level code, bad import)
    // must never take down the whole bot — isolate the import per file.
    let mod;
    try {
      mod = await import(fileUrl);
    } catch (err) {
      logger.warn(`Failed to load command file "${file}": ${err.message}`);
      continue;
    }

    const command = mod.default;

    if (!command || typeof command.name !== 'string' || !command.name.trim() || typeof command.execute !== 'function') {
      logger.warn(`Skipping invalid command file: ${file}`);
      continue;
    }

    const key = command.name.toLowerCase();

    if (commands.has(key)) {
      logger.warn(`Duplicate command name "${key}" in ${file} — keeping the first one loaded.`);
      continue;
    }

    commands.set(key, command);

    if (Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        if (typeof alias !== 'string' || !alias.trim()) continue;

        const aliasKey = alias.toLowerCase();
        if (aliases.has(aliasKey) || commands.has(aliasKey)) {
          logger.warn(`Duplicate alias "${aliasKey}" in ${file} — skipping this alias.`);
          continue;
        }

        aliases.set(aliasKey, key);
      }
    }
  }

  return { commands, aliases };
}
