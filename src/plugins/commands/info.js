import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { formatDuration, formatBytes, currentTimestamp } from '../../utils/helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = await fs.readJson(path.resolve(__dirname, '../../../package.json'));

export default {
  name: 'info',
  aliases: ['botinfo'],
  category: 'general',
  description: 'Show information about the bot, host, and database.',
  usage: 'info',
  permission: 'all',
  cooldown: 5,

  async execute(ctx) {
    const { db, config } = ctx;

    const userCount = Object.keys(db.data.users).length;
    const groupCount = Object.keys(db.data.groups).length;
    const memory = formatBytes(process.memoryUsage().rss);
    const uptime = formatDuration(process.uptime() * 1000);
    const now = currentTimestamp(config.timezone);

    const text = [
      `🤖 *${config.botName}*`,
      `Version: ${pkg.version}`,
      `Node.js: ${process.version}`,
      `Platform: ${os.platform()} ${os.arch()}`,
      `Memory: ${memory}`,
      `Uptime: ${uptime}`,
      `Users tracked: ${userCount}`,
      `Groups tracked: ${groupCount}`,
      `Server time: ${now}`,
    ].join('\n');

    await ctx.sock.sendMessage(ctx.jid, { text }, { quoted: ctx.msg });
  },
};
