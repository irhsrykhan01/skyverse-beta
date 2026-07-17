import path from 'path';
import readline from 'readline';
import fs from 'fs-extra';
import qrcode from 'qrcode-terminal';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@whiskeysockets/baileys';

import { config } from '../config/config.js';
import { logger, baileysLogger } from '../utils/logger.js';
import { handleMessages } from '../handlers/messageHandler.js';

let sock = null;

export async function startSocket({ db, commands, aliases }) {
  const sessionDir = path.resolve(config.sessionDir);
  await fs.ensureDir(sessionDir);

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  logger.info(`Using Baileys v${version.join('.')} (latest: ${isLatest})`);

  sock = makeWASocket({
    version,
    logger: baileysLogger,
    auth: state,
    browser: [config.botName, 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    handleConnectionUpdate(update, { db, commands, aliases });
  });

  sock.ev.on('messages.upsert', async (upsert) => {
    try {
      await handleMessages(sock, upsert, { db, commands, aliases, config, logger });
    } catch (err) {
      logger.error(`Error handling message: ${err.stack || err.message}`);
    }
  });

  if (config.usePairingCode && !sock.authState.creds.registered) {
    await requestPairingCode(sock);
  }

  return sock;
}

async function requestPairingCode(activeSocket) {
  let phoneNumber = config.pairingNumber;

  if (!phoneNumber) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (text) => new Promise((resolve) => rl.question(text, resolve));
    phoneNumber = await question('Enter your WhatsApp number (with country code, no +): ');
    rl.close();
  }

  phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

  if (!phoneNumber) {
    logger.error('No valid phone number provided for pairing code login.');
    return;
  }

  const code = await activeSocket.requestPairingCode(phoneNumber);
  logger.success(`Pairing code: ${code}`);
}

async function handleConnectionUpdate(update, ctx) {
  const { connection, lastDisconnect, qr } = update;

  if (qr && !config.usePairingCode) {
    qrcode.generate(qr, { small: true });
    logger.info('Scan the QR code above with WhatsApp to log in.');
  }

  if (connection === 'close') {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

    logger.warn(`Connection closed (code: ${statusCode ?? 'unknown'}). Reconnecting: ${shouldReconnect}`);

    if (shouldReconnect) {
      setTimeout(() => {
        startSocket(ctx).catch((err) => {
          logger.error(`Reconnect attempt failed: ${err.stack || err.message}`);
        });
      }, config.reconnectDelay);
    } else {
      logger.error('Session logged out. Delete the session folder and restart to log in again.');
      process.exit(1);
    }
  } else if (connection === 'open') {
    logger.success(`Connected to WhatsApp as ${sock?.user?.id ?? 'unknown'}`);
  }
}
