/**
 * Redis Cache Client - Upstash
 * Provides persistent caching for NetSuite data
 * Falls back to in-memory cache if Redis unavailable
 *
 * Uses lazy connection to ensure env vars are available
 * (fixes issue where singleton was created before env vars loaded)
 */

import { Redis } from '@upstash/redis';

class RedisCache {
  private redis: Redis | null = null;
  private isConnected = false;
  private connectionAttempted = false;
  private cacheTTL = 604800; // 1 week in seconds

  // Fallback in-memory cache if Redis unavailable
  private memoryCache: Map<string, { data: any; expiresAt: number }> = new Map();

  /**
   * Lazy connect to Upstash Redis - only called on first actual use.
   * This ensures process.env vars are loaded before we try to connect.
   */
  private ensureConnected() {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        // Redis credentials not configured, using in-memory fallback
        this.isConnected = false;
        return;
      }

      this.redis = new Redis({
        url,
        token,
      });

      this.isConnected = true;
      // Redis connected successfully
    } catch (error) {
      console.error('[Redis] Connection failed:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get cached data
   * Returns null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    this.ensureConnected();
    try {
      if (this.isConnected && this.redis) {
        const startTime = Date.now();
        const data = await this.redis.get<T>(key);
        const elapsed = Date.now() - startTime;

        return data || null;
      } else {
        const cached = this.memoryCache.get(key);

        if (cached && cached.expiresAt > Date.now()) {
          return cached.data as T;
        } else {
          return null;
        }
      }
    } catch (error) {
      console.error(`[Redis] Get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    this.ensureConnected();
    try {
      const actualTTL = ttl || this.cacheTTL;

      if (this.isConnected && this.redis) {
        await this.redis.set(key, data, { ex: actualTTL });
        return true;
      } else {
        const expiresAt = Date.now() + (actualTTL * 1000);
        this.memoryCache.set(key, { data, expiresAt });
        return true;
      }
    } catch (error) {
      console.error(`[Redis] Set error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<boolean> {
    this.ensureConnected();
    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(key);
        return true;
      } else {
        this.memoryCache.delete(key);
        return true;
      }
    } catch (error) {
      console.error(`[Redis] Delete error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<boolean> {
    this.ensureConnected();
    try {
      if (this.isConnected && this.redis) {
        const keys = ['netsuite:customers:all', 'netsuite:items:all'];
        for (const key of keys) {
          await this.redis.del(key);
        }
        return true;
      } else {
        this.memoryCache.clear();
        return true;
      }
    } catch (error) {
      console.error('[Redis] Clear error:', error);
      return false;
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    this.ensureConnected();
    return this.isConnected;
  }

  /**
   * Set large data by splitting into chunks (for Upstash 10MB limit)
   * Splits data into ~5MB chunks to stay well under the limit
   */
  async setChunked<T>(baseKey: string, data: T[], ttl?: number): Promise<boolean> {
    try {
      const actualTTL = ttl || this.cacheTTL;
      const CHUNK_SIZE = 15000; // ~5MB per chunk with essential fields

      // Split data into chunks
      const chunks: T[][] = [];
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        chunks.push(data.slice(i, i + CHUNK_SIZE));
      }


      // Store metadata with chunk count
      const metaKey = `${baseKey}:meta`;
      await this.set(metaKey, { chunkCount: chunks.length, totalItems: data.length }, actualTTL);

      // Store each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunkKey = `${baseKey}:chunk:${i}`;
        const chunkData = chunks[i];
        const chunkSize = JSON.stringify(chunkData).length;
        const success = await this.set(chunkKey, chunkData, actualTTL);
        if (!success) {
          console.error(`[Redis] Failed to store chunk ${i}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`[Redis] setChunked error:`, error);
      return false;
    }
  }

  /**
   * Get large data from chunks (for Upstash 10MB limit)
   * Retrieves and combines all chunks back into a single array
   */
  async getChunked<T>(baseKey: string): Promise<T[] | null> {
    try {
      // Get metadata first
      const metaKey = `${baseKey}:meta`;
      const meta = await this.get<{ chunkCount: number; totalItems: number }>(metaKey);

      if (!meta) {
        return null;
      }

      // Retrieve all chunks in parallel for speed
      const chunkPromises: Promise<T[] | null>[] = [];
      for (let i = 0; i < meta.chunkCount; i++) {
        const chunkKey = `${baseKey}:chunk:${i}`;
        chunkPromises.push(this.get<T[]>(chunkKey));
      }

      const chunks = await Promise.all(chunkPromises);

      // Combine all chunks
      const combinedData: T[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) {
          console.error(`[Redis] Missing chunk ${i}, cache may be corrupted`);
          return null;
        }
        combinedData.push(...chunk);
      }

      return combinedData;
    } catch (error) {
      console.error(`[Redis] getChunked error:`, error);
      return null;
    }
  }

  /**
   * Delete chunked data
   */
  async delChunked(baseKey: string): Promise<boolean> {
    try {
      const metaKey = `${baseKey}:meta`;
      const meta = await this.get<{ chunkCount: number; totalItems: number }>(metaKey);

      if (!meta) {
        return true; // Nothing to delete
      }

      for (let i = 0; i < meta.chunkCount; i++) {
        const chunkKey = `${baseKey}:chunk:${i}`;
        await this.del(chunkKey);
      }

      await this.del(metaKey);

      return true;
    } catch (error) {
      console.error(`[Redis] delChunked error:`, error);
      return false;
    }
  }

  /**
   * Get cache status
   */
  async getStatus(): Promise<{
    connected: boolean;
    type: 'redis' | 'memory';
    keys?: string[];
    memorySize?: number;
  }> {
    this.ensureConnected();
    if (this.isConnected && this.redis) {
      try {
        await this.redis.ping();
        return {
          connected: true,
          type: 'redis',
        };
      } catch (error) {
        return {
          connected: false,
          type: 'memory',
          memorySize: this.memoryCache.size,
        };
      }
    } else {
      return {
        connected: false,
        type: 'memory',
        memorySize: this.memoryCache.size,
      };
    }
  }
}

// Export singleton instance
// Connection is lazy — won't attempt until first actual use
export const redisCache = new RedisCache();
