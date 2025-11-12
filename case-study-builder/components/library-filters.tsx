'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface LibraryFiltersProps {
  industries: { industry: string }[];
  typeCounts: { type: string; _count: number }[];
  initialQuery: string;
  typeFilter: string;
  industryFilter: string;
}

export function LibraryFilters({
  industries,
  typeCounts,
  initialQuery,
  typeFilter,
  industryFilter,
}: LibraryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== initialQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
          params.set('q', query);
        } else {
          params.delete('q');
        }
        params.delete('page'); // Reset to page 1 on search
        router.push(`/dashboard/library?${params.toString()}`);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, initialQuery, searchParams, router]);

  return (
    <>
      {/* Search */}
      <div>
        <label className="text-sm font-medium mb-2 block">Search</label>
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases..."
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        {query && (
          <p className="text-xs text-gray-500 mt-1">
            Filtering in real-time...
          </p>
        )}
      </div>

      {/* Type Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Case Type</label>
        <div className="space-y-2">
          <Link
            href={`/dashboard/library?${new URLSearchParams({
              ...(query && { q: query }),
              ...(industryFilter && { industry: industryFilter }),
            }).toString()}`}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              !typeFilter
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            All Types ({typeCounts.reduce((sum, t) => sum + t._count, 0)})
          </Link>
          {typeCounts.map((typeCount) => (
            <Link
              key={typeCount.type}
              href={`/dashboard/library?${new URLSearchParams({
                type: typeCount.type,
                ...(query && { q: query }),
                ...(industryFilter && { industry: industryFilter }),
              }).toString()}`}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                typeFilter === typeCount.type
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {typeCount.type} ({typeCount._count})
            </Link>
          ))}
        </div>
      </div>

      {/* Industry Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Industry</label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <Link
            href={`/dashboard/library?${new URLSearchParams({
              ...(query && { q: query }),
              ...(typeFilter && { type: typeFilter }),
            }).toString()}`}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              !industryFilter
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            All Industries
          </Link>
          {industries.slice(0, 15).map((ind) => (
            <Link
              key={ind.industry}
              href={`/dashboard/library?${new URLSearchParams({
                industry: ind.industry,
                ...(query && { q: query }),
                ...(typeFilter && { type: typeFilter }),
              }).toString()}`}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                industryFilter === ind.industry
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {ind.industry}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
