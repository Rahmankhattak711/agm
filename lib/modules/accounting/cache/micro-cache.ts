/**
 * In-Memory Micro-Cache for CQRS Query Handlers
 * Provides sub-5ms cached responses for financial reports (P&L, General Ledger)
 * with automatic TTL expiration and tag-based invalidation.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MicroCacheService {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Retrieve cached item if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store item with TTL in seconds (default: 45s)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 45): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Invalidate all keys matching a prefix (e.g., 'gl:', 'pnl:')
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global Singleton for Next.js runtime
const globalForCache = globalThis as unknown as {
  microCache: MicroCacheService | undefined;
};

export const microCache = globalForCache.microCache ?? new MicroCacheService();

if (process.env.NODE_ENV !== "production") {
  globalForCache.microCache = microCache;
}
