'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, Check, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { WA_REGIONS } from '@/lib/constants/waRegions';

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
  regionFilter: string; // Geographic region (by case country)
  contributorRegionFilter: string; // Contributor's region (by author)
  wearTypeFilter: string; // Comma-separated values for multi-select
  contributorFilter: string;
  minRevenue: number | null;
  maxRevenue: number | null;
}

// Shared active/inactive option styling for combobox rows.
const optionClass = (active: boolean) =>
  cn(
    'flex items-center px-3 py-1.5 rounded-md text-sm transition-colors',
    active
      ? 'bg-wa-green-50 text-wa-green-700 font-medium dark:bg-accent dark:text-primary'
      : 'hover:bg-gray-100 text-gray-700 dark:text-muted-foreground dark:hover:bg-background'
  );

/**
 * Compact, searchable single-select. Each option is a Next <Link> built from the
 * parent's waGetFilterUrl helper (via buildHref), so the URL-param contract and
 * filter persistence are identical to the old link-lists — only the shell changes.
 */
function SearchableCombobox({
  label,
  helper,
  options,
  currentValue,
  currentLabel,
  allLabel,
  buildHref,
}: {
  label: string;
  helper?: string;
  options: { value: string; label: string }[];
  currentValue: string;
  currentLabel?: string;
  allLabel: string;
  buildHref: (value: string | undefined) => string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;
  const display = currentValue ? currentLabel ?? currentValue : allLabel;

  return (
    <div>
      <label className="text-sm font-medium mb-1 block dark:text-foreground">{label}</label>
      {helper && <p className="text-xs text-gray-500 dark:text-muted-foreground mb-1.5">{helper}</p>}
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'w-full justify-between font-normal',
              currentValue && 'border-wa-green-300 text-wa-green-700 bg-wa-green-50 dark:bg-accent dark:text-primary'
            )}
          >
            <span className="truncate">{display}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <div className="relative border-b dark:border-border">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="border-0 rounded-b-none focus-visible:ring-0 pr-9 dark:bg-input dark:text-foreground"
              autoFocus
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            <Link href={buildHref(undefined)} onClick={() => setOpen(false)} className={optionClass(!currentValue)}>
              {allLabel}
            </Link>
            {filtered.map((o) => (
              <Link
                key={o.value}
                href={buildHref(o.value)}
                onClick={() => setOpen(false)}
                className={optionClass(currentValue === o.value)}
                title={o.label}
              >
                {currentValue === o.value && <Check className="h-3.5 w-3.5 mr-1 shrink-0" />}
                <span className="truncate">{o.label}</span>
              </Link>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">No matches</p>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
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
  regionFilter,
  contributorRegionFilter,
  wearTypeFilter,
  contributorFilter,
  minRevenue,
  maxRevenue,
}: LibraryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [localMinRevenue, setLocalMinRevenue] = useState(minRevenue?.toString() || '');
  const [localMaxRevenue, setLocalMaxRevenue] = useState(maxRevenue?.toString() || '');

  // Check if any advanced filters are active
  const hasAdvancedFilters = componentFilter || waProductFilter || countryFilter || regionFilter || contributorRegionFilter || wearTypeFilter || contributorFilter || minRevenue || maxRevenue;
  const [showAdvanced, setShowAdvanced] = useState(!!hasAdvancedFilters);

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
    if (regionFilter) params.region = regionFilter;
    if (contributorRegionFilter) params.contributorRegion = contributorRegionFilter;
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

  const regionLabel = (v: string) => WA_REGIONS.find((r) => r.value === v)?.label ?? v;
  const contributorName =
    contributors.find((c) => c.contributorId === contributorFilter)?.contributor.name || 'Contributor';

  // Active-filter chips (removable) — the at-a-glance "what's applied" view.
  const chips: { label: string; href: string }[] = [];
  if (initialQuery) chips.push({ label: `Search: ${initialQuery}`, href: waGetFilterUrl({ q: undefined }) });
  if (typeFilter) chips.push({ label: `Type: ${typeFilter}`, href: waGetFilterUrl({ type: undefined }) });
  if (industryFilter) chips.push({ label: `Industry: ${industryFilter}`, href: waGetFilterUrl({ industry: undefined }) });
  if (oemFilter) chips.push({ label: `OEM: ${oemFilter}`, href: waGetFilterUrl({ oem: undefined }) });
  if (componentFilter) chips.push({ label: `Component: ${componentFilter}`, href: waGetFilterUrl({ component: undefined }) });
  if (waProductFilter) chips.push({ label: `Product: ${waProductFilter}`, href: waGetFilterUrl({ waProduct: undefined }) });
  if (countryFilter) chips.push({ label: `Country: ${countryFilter}`, href: waGetFilterUrl({ country: undefined }) });
  if (regionFilter) chips.push({ label: `Region: ${regionLabel(regionFilter)}`, href: waGetFilterUrl({ region: undefined }) });
  if (contributorRegionFilter) chips.push({ label: `Contributor Region: ${regionLabel(contributorRegionFilter)}`, href: waGetFilterUrl({ contributorRegion: undefined }) });
  if (wearTypeFilter) {
    const tokens = wearTypeFilter.split(',').map((t) => t.trim()).filter(Boolean);
    tokens.forEach((tok) => {
      const remaining = tokens.filter((t) => t.toUpperCase() !== tok.toUpperCase());
      chips.push({ label: `Wear: ${tok}`, href: waGetFilterUrl({ wearType: remaining.length ? remaining.join(',') : undefined }) });
    });
  }
  if (contributorFilter) chips.push({ label: `Contributor: ${contributorName}`, href: waGetFilterUrl({ contributor: undefined }) });
  if (minRevenue !== null || maxRevenue !== null) {
    chips.push({ label: `Revenue: ${minRevenue ?? 0}–${maxRevenue ?? '∞'}`, href: waGetFilterUrl({ minRevenue: undefined, maxRevenue: undefined }) });
  }

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

      {/* Active filters (removable chips) */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1 font-normal max-w-full">
              <span className="truncate max-w-[150px]">{chip.label}</span>
              <Link href={chip.href} aria-label={`Remove ${chip.label}`} className="rounded-sm hover:bg-gray-300/60 dark:hover:bg-background">
                <X className="h-3 w-3" />
              </Link>
            </Badge>
          ))}
          <Link href="/dashboard/library" className="text-xs font-medium text-wa-green-700 dark:text-primary hover:underline ml-0.5">
            Clear all
          </Link>
        </div>
      )}

      {/* Type Filter — kept as pills */}
      <div>
        <label className="text-sm font-medium mb-2 block dark:text-foreground">Case Type</label>
        <div className="space-y-1">
          <Link href={waGetFilterUrl({ type: undefined })} className={optionClass(!typeFilter)}>
            All Types ({typeCounts.reduce((sum, t) => sum + t._count, 0)})
          </Link>
          {typeCounts.map((typeCount) => (
            <Link key={typeCount.type} href={waGetFilterUrl({ type: typeCount.type })} className={optionClass(typeFilter === typeCount.type)}>
              {typeCount.type} ({typeCount._count})
            </Link>
          ))}
        </div>
      </div>

      {/* Industry Filter */}
      <SearchableCombobox
        label="Industry"
        allLabel="All Industries"
        options={industries.map((i) => ({ value: i.industry, label: i.industry }))}
        currentValue={industryFilter}
        buildHref={(v) => waGetFilterUrl({ industry: v })}
      />

      {/* OEM Filter */}
      {oems.length > 0 && (
        <SearchableCombobox
          label="OEM / Competitor"
          allLabel="All OEMs"
          options={oems.filter((o) => o.competitorName).map((o) => ({ value: o.competitorName!, label: o.competitorName! }))}
          currentValue={oemFilter}
          buildHref={(v) => waGetFilterUrl({ oem: v })}
        />
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
          <SearchableCombobox
            label="Component"
            allLabel="All Components"
            options={components.map((c) => ({ value: c.componentWorkpiece, label: c.componentWorkpiece }))}
            currentValue={componentFilter}
            buildHref={(v) => waGetFilterUrl({ component: v })}
          />

          {/* WA Product Filter */}
          <SearchableCombobox
            label="WA Product"
            allLabel="All Products"
            options={waProducts.map((p) => ({ value: p.waProduct, label: p.waProduct }))}
            currentValue={waProductFilter}
            buildHref={(v) => waGetFilterUrl({ waProduct: v })}
          />

          {/* Wear Type Filter - Multi-select (kept as toggle badges) */}
          {wearTypes.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">
                Wear Type
                {wearTypeFilter && (
                  <Link href={waGetFilterUrl({ wearType: undefined })} className="ml-2 text-xs text-gray-500 hover:text-red-500">
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
            <SearchableCombobox
              label="Country"
              allLabel="All Countries"
              options={countries.filter((c) => c.country).map((c) => ({ value: c.country!, label: c.country! }))}
              currentValue={countryFilter}
              buildHref={(v) => waGetFilterUrl({ country: v })}
            />
          )}

          {/* Region Filter (GEOGRAPHIC — by the case's country) */}
          <div>
            <label className="text-sm font-medium mb-0.5 block dark:text-foreground">Region</label>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mb-1.5">Where the case is — by country</p>
            <Select value={regionFilter || '__all'} onValueChange={(v) => router.push(waGetFilterUrl({ region: v === '__all' ? undefined : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="All Regions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Regions</SelectItem>
                {WA_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contributor Region Filter (by the AUTHOR's region) */}
          <div>
            <label className="text-sm font-medium mb-0.5 block dark:text-foreground">Contributor Region</label>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mb-1.5">Who submitted it — by author</p>
            <Select value={contributorRegionFilter || '__all'} onValueChange={(v) => router.push(waGetFilterUrl({ contributorRegion: v === '__all' ? undefined : v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="All Contributor Regions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All Contributor Regions</SelectItem>
                {WA_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contributor Filter */}
          {contributors.length > 0 && (
            <SearchableCombobox
              label="Contributor"
              allLabel="All Contributors"
              options={contributors.map((c) => ({ value: c.contributorId, label: c.contributor.name || 'Unknown' }))}
              currentValue={contributorFilter}
              currentLabel={contributorName}
              buildHref={(v) => waGetFilterUrl({ contributor: v })}
            />
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
              <Button size="sm" onClick={waApplyRevenueFilter} className="w-full">
                Apply Revenue Filter
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
