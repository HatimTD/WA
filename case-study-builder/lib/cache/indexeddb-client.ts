/**
 * IndexedDB Cache Client - Browser-side caching using Dexie
 * Provides persistent client-side caching for NetSuite data
 * Works offline and reduces server requests
 */

'use client';

import Dexie, { Table } from 'dexie';

// Cache data structure
interface CachedData {
  id: string; // cache key like 'netsuite:customers:all'
  data: any; // actual data
  timestamp: number; // when cached
  expiresAt: number; // when it expires
}

// Dexie database class
class NetsuiteCacheDB extends Dexie {
  customers!: Table<CachedData>;
  items!: Table<CachedData>;

  constructor() {
    super('NetSuiteCache');

    // Define schema
    this.version(1).stores({
      customers: 'id, timestamp, expiresAt',
      items: 'id, timestamp, expiresAt'
    });
  }
}

// Create database instance
const db = new NetsuiteCacheDB();

/**
 * IndexedDB Cache Client
 * Provides simple get/set interface for browser-side caching
 */
class IndexedDBCache {
  private cacheTTL = 604800000; // 1 week in milliseconds

  /**
   * Get cached data from IndexedDB
   * Returns null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const now = Date.now();

      // Determine which table to use based on key
      const table = key.includes('customers') ? db.customers : db.items;

      // Get from IndexedDB
      const cached = await table.get(key);

      if (!cached) {
        console.log(`[IndexedDB] Cache MISS - ${key}`);
        return null;
      }

      // Check if expired
      if (cached.expiresAt < now) {
        console.log(`[IndexedDB] Cache EXPIRED - ${key}`);
        await table.delete(key); // Clean up expired entry
        return null;
      }

      console.log(`[IndexedDB] Cache HIT - ${key} ⚡⚡⚡`);
      return cached.data as T;

    } catch (error) {
      console.error(`[IndexedDB] Get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data in IndexedDB with TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const now = Date.now();
      const actualTTL = ttl || this.cacheTTL;

      // Determine which table to use based on key
      const table = key.includes('customers') ? db.customers : db.items;

      // Store in IndexedDB
      await table.put({
        id: key,
        data,
        timestamp: now,
        expiresAt: now + actualTTL
      });

      const daysValid = Math.floor(actualTTL / (1000 * 60 * 60 * 24));
      console.log(`[IndexedDB] Cached ${key} for ${daysValid} days ✅`);
      return true;

    } catch (error) {
      console.error(`[IndexedDB] Set error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data from IndexedDB
   */
  async del(key: string): Promise<boolean> {
    try {
      const table = key.includes('customers') ? db.customers : db.items;
      await table.delete(key);
      console.log(`[IndexedDB] Deleted ${key} ✅`);
      return true;
    } catch (error) {
      console.error(`[IndexedDB] Delete error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cached data from IndexedDB
   */
  async clear(): Promise<boolean> {
    try {
      await db.customers.clear();
      await db.items.clear();
      console.log('[IndexedDB] Cleared all cache ✅');
      return true;
    } catch (error) {
      console.error('[IndexedDB] Clear error:', error);
      return false;
    }
  }

  /**
   * Get cache status for monitoring
   */
  async getStatus(): Promise<{
    customersCount: number;
    itemsCount: number;
    totalSize: number;
  }> {
    try {
      const [customersCount, itemsCount] = await Promise.all([
        db.customers.count(),
        db.items.count()
      ]);

      return {
        customersCount,
        itemsCount,
        totalSize: customersCount + itemsCount
      };
    } catch (error) {
      console.error('[IndexedDB] Status error:', error);
      return {
        customersCount: 0,
        itemsCount: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Clean up expired entries (maintenance)
   */
  async cleanup(): Promise<number> {
    try {
      const now = Date.now();
      let deletedCount = 0;

      // Clean up customers
      const expiredCustomers = await db.customers
        .where('expiresAt')
        .below(now)
        .toArray();

      for (const entry of expiredCustomers) {
        await db.customers.delete(entry.id);
        deletedCount++;
      }

      // Clean up items
      const expiredItems = await db.items
        .where('expiresAt')
        .below(now)
        .toArray();

      for (const entry of expiredItems) {
        await db.items.delete(entry.id);
        deletedCount++;
      }

      if (deletedCount > 0) {
        console.log(`[IndexedDB] Cleaned up ${deletedCount} expired entries`);
      }

      return deletedCount;

    } catch (error) {
      console.error('[IndexedDB] Cleanup error:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const indexedDBCache = new IndexedDBCache();

// Export database for advanced usage
export { db as netsuiteDB };
