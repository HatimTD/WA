'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bookmark, BookmarkX, ExternalLink, Loader2, Search, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import LanguageIndicator from '@/components/language-indicator';

interface SavedCase {
  id: string;
  createdAt: string;
  caseStudy: {
    id: string;
    title?: string | null;
    customerName: string;
    industry: string;
    location: string;
    componentWorkpiece: string;
    type: string;
    waProduct: string;
    problemDescription: string;
    status: string;
    approvedAt: string;
    originalLanguage?: string;
    translationAvailable?: boolean;
    contributor?: { id: string; name: string | null } | null;
    approver?: { id: string; name: string | null } | null;
  };
}

export default function SavedCasesPage() {
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-newest');

  useEffect(() => {
    fetchSavedCases();
  }, []);

  const fetchSavedCases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-cases');
      const data = await response.json();

      if (response.ok) {
        setSavedCases(data.savedCases);
      } else {
        toast.error(data.error || 'Failed to load saved cases');
      }
    } catch (error) {
      console.error('Error fetching saved cases:', error);
      toast.error('Failed to load saved cases');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSave = async (caseStudyId: string) => {
    try {
      setRemovingId(caseStudyId);
      const response = await fetch(`/api/saved-cases?caseStudyId=${caseStudyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedCases((prev) => prev.filter((saved) => saved.caseStudy.id !== caseStudyId));
        toast.success('Case study removed from saved');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove save');
      }
    } catch (error) {
      console.error('Error removing save:', error);
      toast.error('Failed to remove save');
    } finally {
      setRemovingId(null);
    }
  };

  // Filter and sort saved cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = [...savedCases];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(saved =>
        saved.caseStudy.customerName.toLowerCase().includes(lowerSearch) ||
        saved.caseStudy.waProduct.toLowerCase().includes(lowerSearch) ||
        saved.caseStudy.componentWorkpiece.toLowerCase().includes(lowerSearch) ||
        saved.caseStudy.location.toLowerCase().includes(lowerSearch) ||
        saved.caseStudy.industry.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(saved => saved.caseStudy.type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'customer-az':
          return a.caseStudy.customerName.localeCompare(b.caseStudy.customerName);
        case 'customer-za':
          return b.caseStudy.customerName.localeCompare(a.caseStudy.customerName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [savedCases, searchTerm, typeFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setSortBy('date-newest');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || sortBy !== 'date-newest';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-wa-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
          <Bookmark className="h-8 w-8 text-wa-green-600 dark:text-primary" />
          Saved Cases
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-2">
          Access your saved case studies for quick reference
        </p>
      </div>

      {/* Search and Filters */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-wa-green-600 dark:text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-foreground">Search & Filter</h3>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-wa-green-600 hover:text-wa-green-700 dark:text-primary dark:hover:text-primary/80"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                <Input
                  placeholder="Search by customer, product, component, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                  <SelectValue placeholder="Case Type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="APPLICATION">Application</SelectItem>
                  <SelectItem value="TECH">Technical</SelectItem>
                  <SelectItem value="STAR">Star Case</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <div className="md:col-span-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-popover dark:border-border">
                    <SelectItem value="date-newest">Newest First</SelectItem>
                    <SelectItem value="date-oldest">Oldest First</SelectItem>
                    <SelectItem value="customer-az">Customer A-Z</SelectItem>
                    <SelectItem value="customer-za">Customer Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Cases Count */}
      <Card role="article" className="border-wa-green-100 bg-wa-green-50 dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-wa-green-900 dark:text-foreground">
            {filteredAndSortedCases.length} of {savedCases.length} Saved {savedCases.length === 1 ? 'Case' : 'Cases'}
            {hasActiveFilters && ' (Filtered)'}
          </CardTitle>
          <CardDescription className="text-wa-green-700 dark:text-muted-foreground">
            Case studies you've bookmarked for later
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Saved Cases Grid */}
      {filteredAndSortedCases.length === 0 && savedCases.length === 0 ? (
        <Card role="article" className="p-12 text-center dark:bg-card dark:border-border">
          <Bookmark className="h-16 w-16 mx-auto text-gray-300 dark:text-muted-foreground mb-4" />
          <p className="text-gray-500 dark:text-muted-foreground text-lg mb-4">No saved cases yet</p>
          <p className="text-gray-400 dark:text-muted-foreground text-sm mb-6">
            Start exploring case studies and save the ones you find interesting
          </p>
          <Link href="/dashboard/search">
            <Button className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Browse Case Studies
            </Button>
          </Link>
        </Card>
      ) : filteredAndSortedCases.length === 0 ? (
        <Card role="article" className="p-12 text-center dark:bg-card dark:border-border">
          <Search className="h-16 w-16 mx-auto text-gray-300 dark:text-muted-foreground mb-4" />
          <p className="text-gray-500 dark:text-muted-foreground text-lg mb-4">No cases match your filters</p>
          <p className="text-gray-400 dark:text-muted-foreground text-sm mb-6">
            Try adjusting your search or filters to see more results
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedCases.map((saved) => (
            <Card role="article"
              key={saved.id}
              className="hover:shadow-lg transition-shadow dark:bg-card dark:border-border dark:hover:border-primary"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2 dark:text-foreground">
                    {saved.caseStudy.title || `${saved.caseStudy.customerName} - ${saved.caseStudy.componentWorkpiece}`}
                  </CardTitle>
                  <Badge
                    variant={
                      saved.caseStudy.type === 'STAR'
                        ? 'default'
                        : saved.caseStudy.type === 'TECH'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="shrink-0"
                  >
                    {saved.caseStudy.type}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-1 dark:text-muted-foreground">
                  {saved.caseStudy.industry} • {saved.caseStudy.location}
                </CardDescription>
                {/* Language Indicator - BRD: Show original language */}
                {(saved.caseStudy.originalLanguage && saved.caseStudy.originalLanguage !== 'en') && (
                  <LanguageIndicator
                    originalLanguage={saved.caseStudy.originalLanguage}
                    translationAvailable={saved.caseStudy.translationAvailable}
                    caseStudyId={saved.caseStudy.id}
                    variant="badge"
                    showLink={true}
                  />
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-muted-foreground">
                    <span className="font-medium">Component:</span>{' '}
                    {saved.caseStudy.componentWorkpiece}
                  </p>
                  <p className="text-gray-600 dark:text-muted-foreground">
                    <span className="font-medium">Product:</span> {saved.caseStudy.waProduct}
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-foreground line-clamp-3">
                  {saved.caseStudy.problemDescription}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  {saved.caseStudy.contributor?.name && (
                    <>Created by {saved.caseStudy.contributor.name}</>
                  )}
                  {saved.caseStudy.approver?.name && (
                    <> • Approved by {saved.caseStudy.approver.name}</>
                  )}
                </p>
                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/cases/${saved.caseStudy.id}`} className="flex-1">
                    <Button className="w-full gap-2" size="sm">
                      <ExternalLink className="h-3 w-3" />
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSave(saved.caseStudy.id)}
                    disabled={removingId === saved.caseStudy.id}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingId === saved.caseStudy.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <BookmarkX className="h-3 w-3" />
                    )}
                    Remove
                  </Button>
                </div>
                <p className="text-xs text-gray-400 dark:text-muted-foreground text-center pt-2 border-t dark:border-border">
                  Saved {new Date(saved.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
