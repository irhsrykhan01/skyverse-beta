import path from 'path';
import fs from 'fs-extra';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

function defaultData() {
  return {
    users: {},
    groups: {},
    settings: {},
    warnings: {},
    commandStats: {},
    bot: {
      startTime: Date.now(),
      messagesProcessed: 0,
    },
  };
}

async function recoverFile(absolutePath) {
  if (!(await fs.pathExists(absolutePath))) {
    await fs.writeJson(absolutePath, defaultData(), { spaces: 2 });
    return;
  }

  const raw = await fs.readFile(absolutePath, 'utf-8');

  if (!raw || !raw.trim()) {
    await fs.writeJson(absolutePath, defaultData(), { spaces: 2 });
    return;
  }

  try {
    JSON.parse(raw);
  } catch {
    const backupPath = `${absolutePath}.corrupt-${Date.now()}.bak`;
    await fs.move(absolutePath, backupPath);
    await fs.writeJson(absolutePath, defaultData(), { spaces: 2 });
  }
}

export class Database {
  constructor(low) {
    this.low = low;
  }

  static async init(filePath) {
    const absolutePath = path.resolve(filePath);
    await fs.ensureDir(path.dirname(absolutePath));
    await recoverFile(absolutePath);

    const adapter = new JSONFile(absolutePath);
    const low = new Low(adapter, defaultData());
    await low.read();

    low.data ||= defaultData();
    const defaults = defaultData();
    for (const key of Object.keys(defaults)) {
      if (!(key in low.data)) low.data[key] = defaults[key];
    }

    await low.write();
    return new Database(low);
  }

  get data() {
    return this.low.data;
  }

  async save() {
    await this.low.write();
  }

  getUser(jid) {
    if (!this.data.users[jid]) {
      this.data.users[jid] = {
        jid,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        messageCount: 0,
        banned: false,
      };
    }
    return this.data.users[jid];
  }

  async updateUser(jid, patch = {}) {
    const user = this.getUser(jid);
    Object.assign(user, patch);
    user.messageCount += 1;
    await this.save();
    return user;
  }

  getGroup(jid) {
    if (!this.data.groups[jid]) {
      this.data.groups[jid] = {
        jid,
        firstSeen: Date.now(),
        lastActivity: Date.now(),
        messageCount: 0,
        settings: {},
      };
    }
    return this.data.groups[jid];
  }

  async touchGroup(jid) {
    const group = this.getGroup(jid);
    group.lastActivity = Date.now();
    group.messageCount += 1;
    await this.save();
    return group;
  }

  getSetting(key, fallback = null) {
    return key in this.data.settings ? this.data.settings[key] : fallback;
  }

  async setSetting(key, value) {
    this.data.settings[key] = value;
    await this.save();
  }

  getWarnings(jid) {
    return this.data.warnings[jid] || [];
  }

  async addWarning(jid, reason) {
    if (!this.data.warnings[jid]) this.data.warnings[jid] = [];
    this.data.warnings[jid].push({ reason, timestamp: Date.now() });
    await this.save();
    return this.data.warnings[jid];
  }

  async clearWarnings(jid) {
    this.data.warnings[jid] = [];
    await this.save();
  }

  getCommandStats() {
    return this.data.commandStats;
  }

  async incrementCommandStat(name) {
    this.data.commandStats[name] = (this.data.commandStats[name] || 0) + 1;
    this.data.bot.messagesProcessed += 1;
    await this.save();
  }

  getBotState() {
    return this.data.bot;
  }

  async updateBotState(patch = {}) {
    Object.assign(this.data.bot, patch);
    await this.save();
  }
}
