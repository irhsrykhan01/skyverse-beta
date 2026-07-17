export default {
  name: 'menu',
  aliases: ['commands', 'cmds'],
  category: 'general',
  description: 'Show all available commands.',
  usage: 'menu',
  permission: 'all',
  cooldown: 3,

  async execute(ctx) {
    const { commands, config } = ctx;

    const categories = new Map();
    for (const command of commands.values()) {
      const category = command.category || 'general';
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category).push(command);
    }

    let text = `📜 *${config.botName} — Command Menu*\n`;

    for (const [category, cmds] of categories) {
      text += `\n*${category.toUpperCase()}*\n`;
      for (const cmd of cmds) {
        text += `${config.prefix}${cmd.name} — ${cmd.description}\n`;
      }
    }

    text += `\nUse *${config.prefix}help <command>* for detailed usage.`;

    await ctx.sock.sendMessage(ctx.jid, { text: text.trim() }, { quoted: ctx.msg });
  },
};
