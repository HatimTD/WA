'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

/**
 * BRD Section 5 - Search & Filtering
 * Database must be searchable by: Tags, Industry, Component, OEM, Wear Type,
 * WA Product, Country, Customer, Revenue, and Contributor
 */
interface LibraryFiltersProps {
  industries: { industry: string }[];
  oems: { competitorName: string | null }[];
  typeCounts: { type: string; _count: number }[];
  initialQuery: string;
  typeFilter: string;
  industryFilter: string;
  oemFilter: string;
  // BRD Required Filter Options
  components: { componentWorkpiece: string }[];
  waProducts: { waProduct: string }[];
  countries: { country: string | null }[];
  wearTypes: string[];
  contributors: { contributorId: string; contributor: { id: string; name: string | null } }[];
  // BRD Current Filter Values
  componentFilter: string;
  waProductFilter: string;
  countryFilter: string;
  wearTypeFilter: string; // Comma-separated values for multi-select
  contributorFilter: string;
  minRevenue: number | null;
  maxRevenue: number | null;
}

export function LibraryFilters({
  industries,
  oems,
  typeCounts,
  initialQuery,
  typeFilter,
  industryFilter,
  oemFilter,
  // BRD Required Filter Options
  components,
  waProducts,
  countries,
  wearTypes,
  contributors,
  // BRD Current Filter Values
  componentFilter,
  waProductFilter,
  countryFilter,
  wearTypeFilter,
  contributorFilter,
  minRevenue,
  maxRevenue,
}: LibraryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localMinRevenue, setLocalMinRevenue] = useState(minRevenue?.toString() || '');
  const [localMaxRevenue, setLocalMaxRevenue] = useState(maxRevenue?.toString() || '');

  // Check if any advanced filters are active
  const hasAdvancedFilters = componentFilter || waProductFilter || countryFilter || wearTypeFilter || contributorFilter || minRevenue || maxRevenue;

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

  const waGetFilterUrl = (newParams: Record<string, string | undefined>) => {
    const params: Record<string, string> = {};

    // Preserve existing filters
    if (query) params.q = query;
    if (typeFilter) params.type = typeFilter;
    if (industryFilter) params.industry = industryFilter;
    if (oemFilter) params.oem = oemFilter;
    if (componentFilter) params.component = componentFilter;
    if (waProductFilter) params.waProduct = waProductFilter;
    if (countryFilter) params.country = countryFilter;
    if (wearTypeFilter) params.wearType = wearTypeFilter;
    if (contributorFilter) params.contributor = contributorFilter;
    if (minRevenue) params.minRevenue = minRevenue.toString();
    if (maxRevenue) params.maxRevenue = maxRevenue.toString();

    // Apply new params (undefined removes the filter)
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined) {
        delete params[key];
      } else {
        params[key] = value;
      }
    });

    return `/dashboard/library?${new URLSearchParams(params).toString()}`;
  };

  const waApplyRevenueFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (localMinRevenue) {
      params.set('minRevenue', localMinRevenue);
    } else {
      params.delete('minRevenue');
    }
    if (localMaxRevenue) {
      params.set('maxRevenue', localMaxRevenue);
    } else {
      params.delete('maxRevenue');
    }
    params.delete('page');
    router.push(`/dashboard/library?${params.toString()}`);
  };

  return (
    <>
      {/* Search */}
      <div>
        <label className="text-sm font-medium mb-2 block dark:text-foreground">Search</label>
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases..."
            className="pr-10 dark:bg-input dark:border-border dark:text-foreground"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
        </div>
        {query && (
          <p className="text-xs text-gray-500 mt-1 dark:text-muted-foreground">
            Filtering in real-time...
          </p>
        )}
      </div>

      {/* Type Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block dark:text-foreground">Case Type</label>
        <div className="space-y-2">
          <Link
            href={waGetFilterUrl({ type: undefined })}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              !typeFilter
                ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
            }`}
          >
            All Types ({typeCounts.reduce((sum, t) => sum + t._count, 0)})
          </Link>
          {typeCounts.map((typeCount) => (
            <Link
              key={typeCount.type}
              href={waGetFilterUrl({ type: typeCount.type })}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                typeFilter === typeCount.type
                  ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                  : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
              }`}
            >
              {typeCount.type} ({typeCount._count})
            </Link>
          ))}
        </div>
      </div>

      {/* Industry Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block dark:text-foreground">Industry</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <Link
            href={waGetFilterUrl({ industry: undefined })}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              !industryFilter
                ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
            }`}
          >
            All Industries
          </Link>
          {industries.slice(0, 10).map((ind) => (
            <Link
              key={ind.industry}
              href={waGetFilterUrl({ industry: ind.industry })}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                industryFilter === ind.industry
                  ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                  : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
              }`}
            >
              {ind.industry}
            </Link>
          ))}
        </div>
      </div>

      {/* OEM Filter */}
      {oems.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block dark:text-foreground">OEM/Competitor</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <Link
              href={waGetFilterUrl({ oem: undefined })}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                !oemFilter
                  ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                  : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
              }`}
            >
              All OEMs
            </Link>
            {oems.filter(o => o.competitorName).slice(0, 10).map((oemItem) => (
              <Link
                key={oemItem.competitorName}
                href={waGetFilterUrl({ oem: oemItem.competitorName! })}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  oemFilter === oemItem.competitorName
                    ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                    : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                }`}
              >
                {oemItem.competitorName}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters Toggle - BRD Section 5 */}
      <div className="pt-2 border-t border-gray-200 dark:border-border">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-foreground hover:text-wa-green-600 dark:hover:text-primary"
        >
          <span className="flex items-center gap-2">
            Advanced Filters
            {hasAdvancedFilters && (
              <Badge variant="secondary" className="text-xs">Active</Badge>
            )}
          </span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="space-y-4 pt-2">
          {/* Component Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block dark:text-foreground">Component</label>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              <Link
                href={waGetFilterUrl({ component: undefined })}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  !componentFilter
                    ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                    : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                }`}
              >
                All Components
              </Link>
              {components.slice(0, 8).map((comp) => (
                <Link
                  key={comp.componentWorkpiece}
                  href={waGetFilterUrl({ component: comp.componentWorkpiece })}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors truncate ${
                    componentFilter === comp.componentWorkpiece
                      ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                      : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                  }`}
                  title={comp.componentWorkpiece}
                >
                  {comp.componentWorkpiece}
                </Link>
              ))}
            </div>
          </div>

          {/* WA Product Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block dark:text-foreground">WA Product</label>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              <Link
                href={waGetFilterUrl({ waProduct: undefined })}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  !waProductFilter
                    ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                    : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                }`}
              >
                All Products
              </Link>
              {waProducts.slice(0, 8).map((prod) => (
                <Link
                  key={prod.waProduct}
                  href={waGetFilterUrl({ waProduct: prod.waProduct })}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    waProductFilter === prod.waProduct
                      ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                      : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                  }`}
                >
                  {prod.waProduct}
                </Link>
              ))}
            </div>
          </div>

          {/* Wear Type Filter - Multi-select */}
          {wearTypes.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">
                Wear Type
                {wearTypeFilter && (
                  <Link
                    href={waGetFilterUrl({ wearType: undefined })}
                    className="ml-2 text-xs text-gray-500 hover:text-red-500"
                  >
                    (Clear all)
                  </Link>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {wearTypes.map((wt) => {
                  // Check if this wear type is selected (case-insensitive)
                  const selectedTypes = wearTypeFilter ? wearTypeFilter.split(',').map(t => t.trim().toUpperCase()) : [];
                  const isSelected = selectedTypes.includes(wt.toUpperCase());

                  // Toggle this wear type in the selection
                  const newSelection = isSelected
                    ? selectedTypes.filter(t => t !== wt.toUpperCase())
                    : [...selectedTypes, wt.toUpperCase()];

                  const newWearType = newSelection.length > 0 ? newSelection.join(',') : undefined;

                  return (
                    <Link key={wt} href={waGetFilterUrl({ wearType: newWearType })}>
                      <Badge
                        variant={isSelected ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-wa-green-600 hover:bg-wa-green-700 text-white'
                            : 'hover:bg-wa-green-50 dark:hover:bg-primary/10'
                        }`}
                      >
                        {wt}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Country Filter */}
          {countries.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">Country</label>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                <Link
                  href={waGetFilterUrl({ country: undefined })}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    !countryFilter
                      ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                      : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                  }`}
                >
                  All Countries
                </Link>
                {countries.filter(c => c.country).slice(0, 8).map((c) => (
                  <Link
                    key={c.country}
                    href={waGetFilterUrl({ country: c.country! })}
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      countryFilter === c.country
                        ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                        : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                    }`}
                  >
                    {c.country}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Contributor Filter */}
          {contributors.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">Contributor</label>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                <Link
                  href={waGetFilterUrl({ contributor: undefined })}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    !contributorFilter
                      ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                      : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                  }`}
                >
                  All Contributors
                </Link>
                {contributors.slice(0, 8).map((cont) => (
                  <Link
                    key={cont.contributorId}
                    href={waGetFilterUrl({ contributor: cont.contributorId })}
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      contributorFilter === cont.contributorId
                        ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
                        : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
                    }`}
                  >
                    {cont.contributor.name || 'Unknown'}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Revenue Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block dark:text-foreground">Revenue Range ($)</label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min"
                value={localMinRevenue}
                onChange={(e) => setLocalMinRevenue(e.target.value)}
                className="dark:bg-input dark:border-border dark:text-foreground"
              />
              <Input
                type="number"
                placeholder="Max"
                value={localMaxRevenue}
                onChange={(e) => setLocalMaxRevenue(e.target.value)}
                className="dark:bg-input dark:border-border dark:text-foreground"
              />
              <Button
                size="sm"
                onClick={waApplyRevenueFilter}
                className="w-full"
              >
                Apply Revenue Filter
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
