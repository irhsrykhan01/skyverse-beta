import { checkPermission } from '../utils/permissions.js';
import { checkCooldown, setCooldown } from '../utils/cooldown.js';

export async function runCommand(ctx) {
  const { commandName, commands, aliases, sender, sock, jid, msg, db, logger, config } = ctx;

  const resolvedName = commands.has(commandName) ? commandName : aliases.get(commandName);
  if (!resolvedName) return;

  const command = commands.get(resolvedName);
  if (!command) return;

  const allowed = await checkPermission(command.permission || 'all', ctx);
  if (!allowed) {
    await sock.sendMessage(
      jid,
      { text: '⛔ You do not have permission to use this command.' },
      { quoted: msg },
    );
    return;
  }

  const cooldownSeconds = command.cooldown ?? config.defaultCooldown;
  const cooldown = checkCooldown(sender, resolvedName, cooldownSeconds);
  if (cooldown.onCooldown) {
    await sock.sendMessage(
      jid,
      { text: `⏳ Please wait ${cooldown.remaining}s before using *${resolvedName}* again.` },
      { quoted: msg },
    );
    return;
  }

  try {
    await command.execute(ctx);
    setCooldown(sender, resolvedName, cooldownSeconds);
    await db.incrementCommandStat(resolvedName);
  } catch (err) {
    logger.error(`Command "${resolvedName}" failed: ${err.stack || err.message}`);
    await sock.sendMessage(
      jid,
      { text: `⚠️ An error occurred while running *${resolvedName}*.` },
      { quoted: msg },
    );
  }
}
