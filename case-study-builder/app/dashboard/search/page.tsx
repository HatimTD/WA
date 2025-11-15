'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { searchCaseStudies } from '@/lib/actions/search-actions';
import { getSearchSuggestions } from '@/lib/actions/autocomplete-actions';
import Link from 'next/link';
import { SaveButton } from '@/components/save-button';

type SearchFilters = {
  query: string;
  type?: string;
  industry?: string;
  location?: string;
  status?: string;
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
  });

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
          const result = await getSearchSuggestions(filters.query);
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
      const result = await searchCaseStudies(filters);
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
    });
    setResults([]);
    setHasSearched(false);
    setSuggestions([]);
    setShowSuggestions(false);
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

          {/* Filters Row */}
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
              <Input
                placeholder="e.g., Mining, Manufacturing"
                value={filters.industry || ''}
                onChange={(e) => setFilters({ ...filters, industry: e.target.value || undefined })}
                className="dark:bg-input dark:border-border dark:text-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block dark:text-foreground">Location</label>
              <Input
                placeholder="e.g., USA, Australia"
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
                className="dark:bg-input dark:border-border dark:text-foreground"
              />
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
              <div className="space-y-4">
                {results.map((caseStudy) => (
                  <Link
                    key={caseStudy.id}
                    href={`/dashboard/cases/${caseStudy.id}`}
                    className="block"
                  >
                    <Card role="article" className="hover:shadow-md dark:bg-card dark:border-border dark:hover:border-primary transition-all cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTypeColor(caseStudy.type)}>
                                {caseStudy.type}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(caseStudy.status)}>
                                {caseStudy.status}
                              </Badge>
                              {caseStudy.status === 'APPROVED' && (
                                <div onClick={(e) => e.preventDefault()}>
                                  <SaveButton caseStudyId={caseStudy.id} variant="icon" size="sm" />
                                </div>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold mb-1 dark:text-foreground">{caseStudy.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2 line-clamp-2">
                              {caseStudy.problemDescription}
                            </p>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-muted-foreground">
                              <span>📍 {caseStudy.location}</span>
                              <span>🏭 {caseStudy.industry}</span>
                              <span>⚙️ {caseStudy.componentWorkpiece}</span>
                              {caseStudy.productName && <span>🔧 {caseStudy.productName}</span>}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500 dark:text-muted-foreground">
                            <p className="font-medium">{caseStudy.contributor?.name}</p>
                            <p className="text-xs">
                              {new Date(caseStudy.createdAt).toLocaleDateString()}
                            </p>
                          </div>
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
