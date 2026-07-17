import { runCommand } from './commandHandler.js';

function extractMessageContent(message) {
  if (!message) return '';
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ''
  );
}

export async function handleMessages(sock, upsert, ctx) {
  const { messages, type } = upsert;
  if (type !== 'notify') return;

  for (const msg of messages) {
    if (!msg.message) continue;
    await processMessage(sock, msg, ctx);
  }
}

async function processMessage(sock, msg, ctx) {
  const { db, config, logger, commands, aliases } = ctx;

  const jid = msg.key.remoteJid;
  if (!jid) return;

  const isGroup = jid.endsWith('@g.us');
  const sender = isGroup ? msg.key.participant || jid : jid;

  const body = extractMessageContent(msg.message).trim();

  await db.updateUser(sender, { lastSeen: Date.now() });
  if (isGroup) {
    await db.touchGroup(jid);
  }

  logger.debug(`Message from ${sender} in ${jid}: ${body || '<no text>'}`);

  if (!body || !body.startsWith(config.prefix)) return;

  const withoutPrefix = body.slice(config.prefix.length).trim();
  if (!withoutPrefix) return;

  const [rawCommandName, ...args] = withoutPrefix.split(/\s+/);

  const commandCtx = {
    sock,
    msg,
    jid,
    sender,
    isGroup,
    body,
    args,
    commandName: rawCommandName.toLowerCase(),
    prefix: config.prefix,
    db,
    logger,
    config,
    commands,
    aliases,
  };

  await runCommand(commandCtx);
}
