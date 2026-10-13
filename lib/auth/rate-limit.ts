import "server-only";

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 600000);
    if (record.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  }
}, 600000).unref();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = memoryStore.get(key) || { timestamps: [] };

  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetMs = oldest ? oldest + windowMs - now : windowMs;
    return { success: false, remaining: 0, resetMs };
  }

  record.timestamps.push(now);
  memoryStore.set(key, record);

  return {
    success: true,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}
