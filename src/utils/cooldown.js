const activeCooldowns = new Map();

export function checkCooldown(userId, commandName, seconds) {
  if (!seconds || seconds <= 0) return { onCooldown: false, remaining: 0 };

  const key = `${userId}:${commandName}`;
  const expiresAt = activeCooldowns.get(key);
  const now = Date.now();

  if (expiresAt && expiresAt > now) {
    return { onCooldown: true, remaining: Math.ceil((expiresAt - now) / 1000) };
  }

  return { onCooldown: false, remaining: 0 };
}

export function setCooldown(userId, commandName, seconds) {
  if (!seconds || seconds <= 0) return;

  const key = `${userId}:${commandName}`;
  activeCooldowns.set(key, Date.now() + seconds * 1000);
}
