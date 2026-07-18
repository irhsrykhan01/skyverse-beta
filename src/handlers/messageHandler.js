import { runCommand } from './commandHandler.js';

// WhatsApp wraps real content inside extra layers for disappearing messages,
// view-once media, and messages relayed back from the linked phone itself.
// Without unwrapping these, the bot silently "sees" the event but never finds
// the text, so commands typed in those chats would appear to do nothing.
function unwrapMessage(message) {
  if (!message) return message;

  if (message.ephemeralMessage?.message) return unwrapMessage(message.ephemeralMessage.message);
  if (message.viewOnceMessage?.message) return unwrapMessage(message.viewOnceMessage.message);
  if (message.viewOnceMessageV2?.message) return unwrapMessage(message.viewOnceMessageV2.message);
  if (message.viewOnceMessageV2Extension?.message) {
    return unwrapMessage(message.viewOnceMessageV2Extension.message);
  }
  if (message.documentWithCaptionMessage?.message) {
    return unwrapMessage(message.documentWithCaptionMessage.message);
  }
  if (message.deviceSentMessage?.message) return unwrapMessage(message.deviceSentMessage.message);

  return message;
}

function extractMessageContent(message) {
  const unwrapped = unwrapMessage(message);
  if (!unwrapped) return '';

  return (
    unwrapped.conversation ||
    unwrapped.extendedTextMessage?.text ||
    unwrapped.imageMessage?.caption ||
    unwrapped.videoMessage?.caption ||
    ''
  );
}

export async function handleMessages(sock, upsert, ctx) {
  const { messages, type } = upsert;
  if (type !== 'notify') return;

  for (const msg of messages) {
    if (!msg.message) continue;

    // Isolate each message: one malformed/unexpected message must not stop
    // the rest of the batch from being processed.
    try {
      await processMessage(sock, msg, ctx);
    } catch (err) {
      ctx.logger.error(`Failed to process a message: ${err.stack || err.message}`);
    }
  }
}

async function processMessage(sock, msg, ctx) {
  const { db, config, logger, commands, aliases } = ctx;

  const jid = msg.key.remoteJid;
  if (!jid) return;

  // Status updates and newsletter/channel posts aren't real chats — replying
  // to them fails and tracking them as users/groups pollutes the database.
  if (jid === 'status@broadcast' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')) {
    return;
  }

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
