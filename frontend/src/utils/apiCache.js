/**
 * Simple API response cache with TTL (Time To Live)
 * Reduces server load by caching frequent API calls
 */

class APICache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data if valid, otherwise return null
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in milliseconds (default: 30 seconds)
   */
  get(key, ttl = 30000) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    console.log(`📦 Cache HIT: ${key}`);
    return cached.data;
  }

  /**
   * Set cache data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cache SET: ${key}`);
  }

  /**
   * Clear specific cache entry
   * @param {string} key - Cache key
   */
  invalidate(key) {
    this.cache.delete(key);
    console.log(`🗑️ Cache INVALIDATED: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    console.log(`🗑️ Cache CLEARED`);
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {RegExp} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        console.log(`🗑️ Cache INVALIDATED (pattern): ${key}`);
      }
    }
  }
}

// Singleton instance
const apiCache = new APICache();

export default apiCache;

/**
 * Higher-order function to wrap API calls with caching
 * @param {Function} apiCall - API function to wrap
 * @param {string} cacheKey - Cache key
 * @param {number} ttl - Cache TTL in milliseconds
 */
export const withCache = async (apiCall, cacheKey, ttl = 30000) => {
  // Check cache first
  const cached = apiCache.get(cacheKey, ttl);
  if (cached) return cached;

  // Call API if cache miss
  const result = await apiCall();
  apiCache.set(cacheKey, result);
  return result;
};
