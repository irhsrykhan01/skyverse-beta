import pino from 'pino';
import chalk from 'chalk';
import { config } from '../config/config.js';

// Baileys requires a pino-compatible logger instance (trace/debug/info/warn/error/fatal + child()).
export const baileysLogger = pino({ level: config.baileysLogLevel });

// Lightweight, colorized console logger for the bot's own runtime output.
export const logger = {
  info(message) {
    console.log(chalk.cyan('[INFO]'), message);
  },
  success(message) {
    console.log(chalk.green('[OK]'), message);
  },
  warn(message) {
    console.log(chalk.yellow('[WARN]'), message);
  },
  error(message) {
    console.log(chalk.red('[ERROR]'), message);
  },
  debug(message) {
    if (config.debug) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  },
};
