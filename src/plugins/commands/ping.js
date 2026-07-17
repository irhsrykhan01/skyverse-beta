export default {
  name: 'ping',
  aliases: ['p'],
  category: 'general',
  description: 'Check if the bot is responsive and measure latency.',
  usage: 'ping',
  permission: 'all',
  cooldown: 3,

  async execute(ctx) {
    const start = Date.now();
    await ctx.sock.sendMessage(ctx.jid, { text: '🏓 Pinging...' }, { quoted: ctx.msg });
    const latency = Date.now() - start;

    await ctx.sock.sendMessage(ctx.jid, { text: `🏓 Pong! ${latency}ms` }, { quoted: ctx.msg });
  },
};
