'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, ChevronDown, ChevronUp, CheckCircle2, User, Calendar } from 'lucide-react';
import { waSearchCaseStudies, waGetSearchFilterOptions } from '@/lib/actions/waSearchActions';
import { waGetSearchSuggestions } from '@/lib/actions/waAutocompleteActions';
import Link from 'next/link';
import { SaveButton } from '@/components/save-button';
import LanguageIndicator from '@/components/language-indicator';
import { WA_REGIONS } from '@/lib/constants/waRegions';

/**
 * BRD Section 5 - Search & Filtering
 * Database must be searchable by: Tags, Industry, Component, OEM, Wear Type,
 * WA Product, Country, Customer, Revenue, and Contributor
 */
type SearchFilters = {
  query: string;
  type?: string;
  industry?: string;
  location?: string;
  status?: string;
  // BRD Required Filters
  componentWorkpiece?: string;
  wearType?: string[];
  oem?: string;
  waProduct?: string;
  country?: string;
  region?: string; // Contributor's region filter
  contributorId?: string;
  minRevenue?: number;
  maxRevenue?: number;
};

type FilterOptions = {
  industries: string[];
  locations: string[];
  components: string[];
  wearTypes: string[];
  oems: string[];
  waProducts: string[];
  countries: string[];
  contributors: { id: string; name: string }[];
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    type: searchParams.get('type') || undefined,
    industry: searchParams.get('industry') || undefined,
    location: searchParams.get('location') || undefined,
    status: searchParams.get('status') || 'APPROVED',
    // BRD Required Filters
    componentWorkpiece: searchParams.get('component') || undefined,
    wearType: searchParams.get('wearType')?.split(',') || undefined,
    oem: searchParams.get('oem') || undefined,
    waProduct: searchParams.get('waProduct') || undefined,
    country: searchParams.get('country') || undefined,
    region: searchParams.get('region') || undefined,
    contributorId: searchParams.get('contributor') || undefined,
    minRevenue: searchParams.get('minRevenue') ? Number(searchParams.get('minRevenue')) : undefined,
    maxRevenue: searchParams.get('maxRevenue') ? Number(searchParams.get('maxRevenue')) : undefined,
  });

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    industries: [],
    locations: [],
    components: [],
    wearTypes: [],
    oems: [],
    waProducts: [],
    countries: [],
    contributors: [],
  });

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load filter options on mount
  useEffect(() => {
    waLoadFilterOptions();
  }, []);

  const waLoadFilterOptions = async () => {
    const result = await waGetSearchFilterOptions();
    if (result.success) {
      setFilterOptions({
        industries: result.industries || [],
        locations: result.locations || [],
        components: result.components || [],
        wearTypes: result.wearTypes || [],
        oems: result.oems || [],
        waProducts: result.waProducts || [],
        countries: result.countries || [],
        contributors: result.contributors || [],
      });
    }
  };

  useEffect(() => {
    // Perform search if there are query params
    if (searchParams.toString()) {
      handleSearch();
    }
  }, []);

  // Fetch autocomplete suggestions with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (filters.query.length >= 2) {
      setIsLoadingSuggestions(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const result = await waGetSearchSuggestions(filters.query);
          if (result.success) {
            setSuggestions(result.suggestions || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters.query]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await waSearchCaseStudies(filters);
      if (result.success && result.caseStudies) {
        setResults(result.caseStudies);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      type: undefined,
      industry: undefined,
      location: undefined,
      status: 'APPROVED',
      // BRD Required Filters
      componentWorkpiece: undefined,
      wearType: undefined,
      oem: undefined,
      waProduct: undefined,
      country: undefined,
      region: undefined,
      contributorId: undefined,
      minRevenue: undefined,
      maxRevenue: undefined,
    });
    setResults([]);
    setHasSearched(false);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const waHandleWearTypeToggle = (wearType: string) => {
    const currentTypes = filters.wearType || [];
    const newTypes = currentTypes.includes(wearType)
      ? currentTypes.filter((t) => t !== wearType)
      : [...currentTypes, wearType];
    setFilters({ ...filters, wearType: newTypes.length > 0 ? newTypes : undefined });
  };

  const waGetActiveFilterCount = () => {
    let count = 0;
    if (filters.componentWorkpiece) count++;
    if (filters.wearType && filters.wearType.length > 0) count++;
    if (filters.oem) count++;
    if (filters.waProduct) count++;
    if (filters.country) count++;
    if (filters.region) count++;
    if (filters.contributorId) count++;
    if (filters.minRevenue !== undefined || filters.maxRevenue !== undefined) count++;
    return count;
  };

  const handleSuggestionClick = (suggestion: any) => {
    setShowSuggestions(false);
    router.push(`/dashboard/cases/${suggestion.id}`);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return 'bg-wa-green-100 text-wa-green-700';
      case 'TECH':
        return 'bg-purple-100 text-purple-700';
      case 'STAR':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'SUBMITTED':
        return 'bg-wa-green-100 text-wa-green-700';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-foreground">Search Case Studies</h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-1">Search and filter through the case study database</p>
        </div>
        <Search className="h-12 w-12 text-wa-green-500 dark:text-primary" />
      </div>

      {/* Search Filters */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Filter className="h-5 w-5 dark:text-primary" />
            Search Filters
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">Refine your search with filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Query with Autocomplete */}
          <div ref={searchInputRef} className="relative">
            <label className="text-sm font-medium mb-2 block dark:text-foreground">Search Query</label>
            <Input
              placeholder="Search by title, description, product name..."
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="dark:bg-input dark:border-border dark:text-foreground"
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="p-4 text-center text-gray-500 dark:text-muted-foreground text-sm">
                    Loading suggestions...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-wa-green-50 dark:hover:bg-primary/10 border-b border-gray-100 dark:border-border last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-foreground text-sm">
                              {suggestion.title}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600 dark:text-muted-foreground">
                              <span>🏭 {suggestion.industry}</span>
                              <span>📍 {suggestion.location}</span>
                              {suggestion.product && <span>🔧 {suggestion.product}</span>}
                            </div>
                          </div>
                          <Badge className={getTypeColor(suggestion.type)} variant="secondary">
                            {suggestion.type}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-muted-foreground text-sm">
                    No suggestions found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="APPLICATION">Application</SelectItem>
                  <SelectItem value="TECH">Tech</SelectItem>
                  <SelectItem value="STAR">Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">Industry</label>
              <Select
                value={filters.industry || 'all'}
                onValueChange={(value) => setFilters({ ...filters, industry: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-border max-h-60">
                  <SelectItem value="all">All Industries</SelectItem>
                  {filterOptions.industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">Location</label>
              <Select
                value={filters.location || 'all'}
                onValueChange={(value) => setFilters({ ...filters, location: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-border max-h-60">
                  <SelectItem value="all">All Locations</SelectItem>
                  {filterOptions.locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-border">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Toggle - BRD Section 5 */}
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
              {waGetActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">{waGetActiveFilterCount()}</Badge>
              )}
            </span>
            {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Advanced Filters Section - BRD Required */}
          {showAdvancedFilters && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-background dark:border-border">
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                Additional Search Filters
              </p>

              {/* Row 1: Component, WA Product, OEM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-foreground">Component/Workpiece</label>
                  <Select
                    value={filters.componentWorkpiece || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, componentWorkpiece: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                      <SelectValue placeholder="All Components" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-popover dark:border-border max-h-60">
                      <SelectItem value="all">All Components</SelectItem>
                      {filterOptions.components.map((comp) => (
                        <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-foreground">WA Product</label>
                  <Select
                    value={filters.waProduct || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, waProduct: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-popover dark:border-border max-h-60">
                      <SelectItem value="all">All Products</SelectItem>
                      {filterOptions.waProducts.map((prod) => (
                        <SelectItem key={prod} value={prod}>{prod}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-foreground">OEM/Competitor</label>
                  <Select
                    value={filters.oem || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, oem: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                      <SelectValue placeholder="All OEMs" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-popover dark:border-border max-h-60">
                      <SelectItem value="all">All OEMs</SelectItem>
                      {filterOptions.oems.map((oem) => (
                        <SelectItem key={oem} value={oem}>{oem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Country, Region, Contributor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-foreground">Country</label>
                  <Select
                    value={filters.country || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, country: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-popover dark:border-border max-h-60">
                      <SelectItem value="all">All Countries</SelectItem>
                      {filterOptions.countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-foreground">Region</label>
                  <Select
                    value={filters.region || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, region: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                      <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-popover dark:border-border">
                      <SelectItem value="all">All Regions</SelectItem>
                      {WA_REGIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-foreground">Contributor</label>
                  <Select
                    value={filters.contributorId || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, contributorId: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                      <SelectValue placeholder="All Contributors" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-popover dark:border-border max-h-60">
                      <SelectItem value="all">All Contributors</SelectItem>
                      {filterOptions.contributors.map((cont) => (
                        <SelectItem key={cont.id} value={cont.id}>{cont.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Wear Type (Multi-select) */}
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-foreground">Wear Type</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.wearTypes.map((wt) => (
                    <Badge
                      key={wt}
                      variant={filters.wearType?.includes(wt) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${
                        filters.wearType?.includes(wt)
                          ? 'bg-wa-green-600 hover:bg-wa-green-700 text-white'
                          : 'hover:bg-wa-green-50 dark:hover:bg-primary/10'
                      }`}
                      onClick={() => waHandleWearTypeToggle(wt)}
                    >
                      {wt}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Row 4: Revenue Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-foreground">Min Revenue ($)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 10000"
                    value={filters.minRevenue || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      minRevenue: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="dark:bg-input dark:border-border dark:text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-foreground">Max Revenue ($)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 1000000"
                    value={filters.maxRevenue || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      maxRevenue: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="dark:bg-input dark:border-border dark:text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">
              Search Results
              <span className="text-base font-normal text-gray-500 dark:text-muted-foreground ml-2">
                ({results.length} {results.length === 1 ? 'result' : 'results'} found)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No case studies found</p>
                <p className="text-sm mt-1">Try adjusting your search filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((caseStudy) => (
                  <Link
                    key={caseStudy.id}
                    href={`/dashboard/cases/${caseStudy.id}`}
                    className="block"
                  >
                    <Card role="article" className="group hover:shadow-xl dark:bg-card dark:border-border dark:hover:border-primary transition-all duration-300 cursor-pointer overflow-hidden h-full">
                      {/* Type Badge Banner */}
                      <div className={`h-1.5 ${
                        caseStudy.type === 'STAR'
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                          : caseStudy.type === 'TECH'
                          ? 'bg-gradient-to-r from-purple-500 to-violet-600'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`} />

                      <CardContent className="p-4">
                        {/* Header with badges */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={getTypeColor(caseStudy.type)}>
                            {caseStudy.type}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(caseStudy.status)}>
                            {caseStudy.status}
                          </Badge>
                          {/* Approved Date Badge */}
                          {caseStudy.status === 'APPROVED' && caseStudy.approvedAt && (
                            <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800">
                              <CheckCircle2 className="h-3 w-3" />
                              {new Date(caseStudy.approvedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Badge>
                          )}
                          {/* Language Indicator - badge only, no link (link is on detail page) */}
                          {caseStudy.originalLanguage && caseStudy.originalLanguage !== 'en' && (
                            <LanguageIndicator
                              originalLanguage={caseStudy.originalLanguage}
                              translationAvailable={caseStudy.translationAvailable}
                              caseStudyId={caseStudy.id}
                              variant="badge"
                              showLink={false}
                            />
                          )}
                          {caseStudy.status === 'APPROVED' && (
                            <div onClick={(e) => e.preventDefault()} className="ml-auto">
                              <SaveButton caseStudyId={caseStudy.id} variant="icon" size="sm" />
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold mb-2 dark:text-foreground group-hover:text-wa-green-600 dark:group-hover:text-primary transition-colors line-clamp-2">
                          {caseStudy.title || `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`}
                        </h3>

                        {/* Key Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2">
                            <p className="text-gray-500 dark:text-gray-400 mb-0.5">Component</p>
                            <p className="font-medium text-gray-900 dark:text-foreground truncate">{caseStudy.componentWorkpiece}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2">
                            <p className="text-gray-500 dark:text-gray-400 mb-0.5">WA Product</p>
                            <p className="font-medium text-gray-900 dark:text-foreground truncate">{caseStudy.waProduct}</p>
                          </div>
                        </div>

                        {/* Wear Types */}
                        {caseStudy.wearType && caseStudy.wearType.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {caseStudy.wearType.slice(0, 3).map((wear: string) => (
                              <Badge key={wear} variant="outline" className="text-xs py-0 px-1.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                                {wear}
                              </Badge>
                            ))}
                            {caseStudy.wearType.length > 3 && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5">
                                +{caseStudy.wearType.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Problem Description */}
                        <p className="text-sm text-gray-600 dark:text-muted-foreground mb-3 line-clamp-2">
                          {caseStudy.problemDescription}
                        </p>

                        {/* Location & Industry */}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">📍 {caseStudy.location}{caseStudy.country ? `, ${caseStudy.country}` : ''}</span>
                          <span className="flex items-center gap-1">🏭 {caseStudy.industry}</span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{caseStudy.contributor?.name || 'Unknown'}</span>
                          </div>
                          {caseStudy.solutionValueRevenue && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              ${Number(caseStudy.solutionValueRevenue).toLocaleString('en-US')}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
