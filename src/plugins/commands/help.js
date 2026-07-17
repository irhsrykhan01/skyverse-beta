export default {
  name: 'help',
  aliases: ['h'],
  category: 'general',
  description: 'Get help for a specific command, or an overview of how to browse commands.',
  usage: 'help [command]',
  permission: 'all',
  cooldown: 3,

  async execute(ctx) {
    const { args, commands, aliases, config } = ctx;

    if (!args.length) {
      const text = `ℹ️ Use *${config.prefix}menu* to see all commands, or *${config.prefix}help <command>* for details on a specific one.`;
      await ctx.sock.sendMessage(ctx.jid, { text }, { quoted: ctx.msg });
      return;
    }

    const query = args[0].toLowerCase();
    const resolvedName = commands.has(query) ? query : aliases.get(query);
    const command = resolvedName ? commands.get(resolvedName) : null;

    if (!command) {
      await ctx.sock.sendMessage(
        ctx.jid,
        { text: `❌ No command named *${query}* was found.` },
        { quoted: ctx.msg },
      );
      return;
    }

    const lines = [
      `*${config.prefix}${command.name}*`,
      command.description,
      `Usage: ${config.prefix}${command.usage}`,
      command.aliases?.length ? `Aliases: ${command.aliases.join(', ')}` : null,
      `Cooldown: ${command.cooldown ?? config.defaultCooldown}s`,
      `Permission: ${command.permission || 'all'}`,
    ].filter(Boolean);

    await ctx.sock.sendMessage(ctx.jid, { text: lines.join('\n') }, { quoted: ctx.msg });
  },
};
