'use client';

import { useState, useEffect } from 'react';

export type MasterListItem = {
  id: string;
  value: string;
  sortOrder: number;
};

type UseMasterListReturn = {
  items: MasterListItem[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook to fetch master list items by key name
 * @param keyName - The list key name (e.g., 'Industry', 'WearType')
 * @param fallback - Optional fallback data if fetch fails
 */
export function useMasterList(
  keyName: string,
  fallback: MasterListItem[] = []
): UseMasterListReturn {
  const [items, setItems] = useState<MasterListItem[]>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchItems() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/master-list?keyName=${encodeURIComponent(keyName)}`);

        if (!response.ok) {
          throw new Error('Failed to fetch master list');
        }

        const data = await response.json();

        if (mounted) {
          setItems(data.length > 0 ? data : fallback);
        }
      } catch (err) {
        console.error(`[useMasterList] Error fetching ${keyName}:`, err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          // Use fallback on error
          setItems(fallback);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchItems();

    return () => {
      mounted = false;
    };
  }, [keyName]);

  return { items, isLoading, error };
}

/**
 * Hook to fetch all master list keys with their items
 */
export function useAllMasterLists() {
  const [data, setData] = useState<Record<string, MasterListItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchAll() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/master-list');

        if (!response.ok) {
          throw new Error('Failed to fetch master lists');
        }

        const listKeys = await response.json();

        if (mounted) {
          const mapped: Record<string, MasterListItem[]> = {};
          for (const key of listKeys) {
            mapped[key.keyName] = key.masterListItems;
          }
          setData(mapped);
        }
      } catch (err) {
        console.error('[useAllMasterLists] Error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAll();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, isLoading, error };
}
