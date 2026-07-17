import dotenv from 'dotenv';

dotenv.config();

function toBool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const config = {
  botName: process.env.BOT_NAME || 'SkyVerse',
  prefix: process.env.PREFIX || '.',
  ownerNumbers: toList(process.env.OWNER_NUMBERS),

  usePairingCode: toBool(process.env.USE_PAIRING_CODE, false),
  pairingNumber: process.env.PAIRING_NUMBER || '',

  sessionDir: process.env.SESSION_DIR || './session',
  databasePath: process.env.DATABASE_PATH || './data/database.json',

  timezone: process.env.TIMEZONE || 'UTC',
  reconnectDelay: toNumber(process.env.RECONNECT_DELAY_MS, 5000),
  baileysLogLevel: process.env.BAILEYS_LOG_LEVEL || 'silent',
  debug: toBool(process.env.DEBUG, false),
  defaultCooldown: toNumber(process.env.DEFAULT_COOLDOWN_SECONDS, 3),
};
