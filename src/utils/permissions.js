import { config } from '../config/config.js';

function isOwner(jid) {
  if (!jid) return false;
  const number = jid.split('@')[0];
  return config.ownerNumbers.includes(number);
}

async function isGroupAdmin(ctx) {
  if (!ctx.isGroup) return false;

  try {
    const metadata = await ctx.sock.groupMetadata(ctx.jid);
    const participant = metadata.participants.find((p) => p.id === ctx.sender);
    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
  } catch {
    return false;
  }
}

export async function checkPermission(level, ctx) {
  switch (level) {
    case 'owner':
      return isOwner(ctx.sender);
    case 'admin':
      return isOwner(ctx.sender) || (await isGroupAdmin(ctx));
    case 'all':
    default:
      return true;
  }
}
