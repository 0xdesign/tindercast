/**
 * Simple in-memory cache utility for server-side caching
 */

interface CacheEntry {
  value: any;
  expiry: number;
}

class MemoryCache {
  private cache: Record<string, CacheEntry> = {};
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache[key];
    
    // Return null if not in cache
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      // Clean up expired entry
      delete this.cache[key];
      return null;
    }
    
    return entry.value as T;
  }
  
  /**
   * Set a value in the cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set(key: string, value: any, ttlSeconds: number): void {
    this.cache[key] = {
      value,
      expiry: Date.now() + (ttlSeconds * 1000),
    };
  }
  
  /**
   * Remove a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    delete this.cache[key];
  }
  
  /**
   * Clear all values from the cache
   */
  clear(): void {
    this.cache = {};
  }
  
  /**
   * Get all keys in the cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Object.keys(this.cache);
  }
  
  /**
   * Delete all keys that match a pattern
   * @param pattern Regex pattern to match keys
   */
  deletePattern(pattern: RegExp): void {
    Object.keys(this.cache).forEach(key => {
      if (pattern.test(key)) {
        delete this.cache[key];
      }
    });
  }
  
  /**
   * Get stats about the cache
   * @returns Cache statistics
   */
  stats(): { size: number; activeEntries: number } {
    const now = Date.now();
    let activeEntries = 0;
    
    Object.values(this.cache).forEach(entry => {
      if (entry.expiry > now) {
        activeEntries++;
      }
    });
    
    return {
      size: Object.keys(this.cache).length,
      activeEntries,
    };
  }
}

// Create and export singleton instance
export const memoryCache = new MemoryCache();

/**
 * Convenience function to cache the result of an async function
 * @param key Cache key
 * @param fn Function to execute and cache
 * @param ttlSeconds Time to live in seconds
 * @returns Result of the function
 */
export async function withCache<T>(
  key: string, 
  fn: () => Promise<T>, 
  ttlSeconds = 300
): Promise<T> {
  // Check cache first
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Execute function
  const result = await fn();
  
  // Cache result
  memoryCache.set(key, result, ttlSeconds);
  
  return result;
} 