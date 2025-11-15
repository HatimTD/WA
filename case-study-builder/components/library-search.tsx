'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface SearchResult {
  id: string;
  customerName: string;
  industry: string;
  location: string;
  componentWorkpiece: string;
  type: string;
  waProduct: string;
  problemDescription: string;
}

export function LibrarySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/case-studies/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok) {
          setSuggestions(data.suggestions || []);
          setResults(data.results || []);
          setShowResults(true);
        } else {
          console.error('Search failed:', data.error);
          setSuggestions([]);
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setResults([]);
      }

      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setShowSuggestions(false);
    if (searchQuery) {
      router.push(`/dashboard/library?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/dashboard/library');
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setResults([]);
    setShowSuggestions(false);
    setShowResults(false);
    router.push('/dashboard/library');
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative" ref={suggestionsRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search by customer, industry, product, location..."
            className="pl-10 pr-20 dark:bg-input dark:border-border dark:text-foreground"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-card dark:border-border">
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors dark:hover:bg-background dark:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3 text-gray-400 dark:text-muted-foreground" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isSearching && query.length >= 2 && (
        <div className="text-sm text-gray-500 text-center py-2 dark:text-muted-foreground">Searching...</div>
      )}

      {/* Dynamic Search Results */}
      {showResults && !isSearching && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium dark:text-foreground">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            <Button variant="outline" size="sm" onClick={clearSearch}>
              Clear
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/dashboard/library/${result.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-card dark:border-border dark:hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1 dark:text-foreground">{result.customerName}</h3>
                  <Badge
                    variant={
                      result.type === 'STAR' ? 'default' : result.type === 'TECH' ? 'secondary' : 'outline'
                    }
                    className="shrink-0"
                  >
                    {result.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2 dark:text-muted-foreground">
                  {result.industry} • {result.location}
                </p>
                <div className="space-y-1 text-sm mb-2">
                  <p className="text-gray-600 dark:text-muted-foreground">
                    <span className="font-medium dark:text-foreground">Component:</span> {result.componentWorkpiece}
                  </p>
                  <p className="text-gray-600 dark:text-muted-foreground">
                    <span className="font-medium dark:text-foreground">Product:</span> {result.waProduct}
                  </p>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 dark:text-foreground">{result.problemDescription}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && !isSearching && results.length === 0 && query.length >= 2 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2 dark:text-muted-foreground">No results found for "{query}"</p>
          <p className="text-sm text-gray-400 dark:text-muted-foreground">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
}
