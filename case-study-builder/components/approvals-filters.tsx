'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ApprovalsFiltersProps {
  contributors: Array<{ id: string; name: string | null }>;
}

export default function ApprovalsFilters({ contributors }: ApprovalsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [contributor, setContributor] = useState(searchParams.get('contributor') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  // Apply filters by updating URL params
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (search) params.set('search', search);
    if (type !== 'all') params.set('type', type);
    if (contributor !== 'all') params.set('contributor', contributor);
    if (sortBy !== 'newest') params.set('sortBy', sortBy);

    const queryString = params.toString();
    router.push(`/dashboard/approvals${queryString ? `?${queryString}` : ''}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setType('all');
    setContributor('all');
    setSortBy('newest');
    router.push('/dashboard/approvals');
  };

  // Check if any filters are active
  const hasActiveFilters = search || type !== 'all' || contributor !== 'all' || sortBy !== 'newest';

  // Apply filters on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-wa-green-600" />
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-wa-green-600 hover:text-wa-green-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customer or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Case Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="APPLICATION">Application</SelectItem>
            <SelectItem value="TECH">Technical</SelectItem>
            <SelectItem value="STAR">Star Case</SelectItem>
          </SelectContent>
        </Select>

        {/* Contributor Filter */}
        <Select value={contributor} onValueChange={setContributor}>
          <SelectTrigger>
            <SelectValue placeholder="Contributor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contributors</SelectItem>
            {contributors.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name || 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={applyFilters}
        className="w-full md:w-auto"
      >
        <Filter className="h-4 w-4 mr-2" />
        Apply Filters
      </Button>
    </div>
  );
}
