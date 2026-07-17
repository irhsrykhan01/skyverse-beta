import { formatDuration } from '../../utils/helpers.js';

export default {
  name: 'runtime',
  aliases: ['uptime'],
  category: 'general',
  description: 'Show how long the bot has been running since the last start.',
  usage: 'runtime',
  permission: 'all',
  cooldown: 3,

  async execute(ctx) {
    const uptimeMs = process.uptime() * 1000;
    const text = `⏱️ *Runtime*\n\nThe bot has been running for *${formatDuration(uptimeMs)}*.`;
    await ctx.sock.sendMessage(ctx.jid, { text }, { quoted: ctx.msg });
  },
};
