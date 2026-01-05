'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle2, XCircle, Eye, Loader2, Search, X, Filter } from 'lucide-react';

interface CaseStudy {
  id: string;
  title: string | null;
  customerName: string;
  waProduct: string;
  componentWorkpiece: string;
  location: string;
  type: string;
  status: string;
  submittedAt: string | null;
  approvedAt: string | null;
  contributor: {
    id: string;
    name: string | null;
    email: string | null;
  };
  approver?: {
    id: string;
    name: string | null;
  } | null;
}

interface ApprovalsClientProps {
  userId: string;
}

export default function ApprovalsClient({ userId }: ApprovalsClientProps) {
  const [loading, setLoading] = useState(true);
  const [pendingCases, setPendingCases] = useState<CaseStudy[]>([]);
  const [recentlyReviewed, setRecentlyReviewed] = useState<CaseStudy[]>([]);
  const [contributors, setContributors] = useState<Array<{ id: string; name: string | null }>>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [contributorFilter, setContributorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    totalPending: 0,
    approvedByMe: 0,
    rejectedByMe: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/approvals');
      const data = await response.json();

      if (response.ok) {
        setPendingCases(data.pendingCases || []);
        setRecentlyReviewed(data.recentlyReviewed || []);
        setContributors(data.contributors || []);
        setStats(data.stats || { pending: 0, totalPending: 0, approvedByMe: 0, rejectedByMe: 0 });
      }
    } catch (error) {
      console.error('Error fetching approvals data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort pending cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = [...pendingCases];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(caseStudy =>
        caseStudy.customerName.toLowerCase().includes(lowerSearch) ||
        caseStudy.waProduct.toLowerCase().includes(lowerSearch) ||
        caseStudy.componentWorkpiece.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(caseStudy => caseStudy.type === typeFilter);
    }

    // Apply contributor filter
    if (contributorFilter !== 'all') {
      filtered = filtered.filter(caseStudy => caseStudy.contributor.id === contributorFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime();
      }
      return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
    });

    return filtered;
  }, [pendingCases, searchTerm, typeFilter, contributorFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setContributorFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || contributorFilter !== 'all' || sortBy !== 'newest';

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return 'bg-wa-green-50 text-wa-green-600 dark:bg-wa-green-900/30 dark:text-wa-green-400';
      case 'TECH':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'STAR':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'; /* Changed from yellow-600 for WCAG AA contrast */
      default:
        return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-wa-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Approval Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Review and approve submitted case studies</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <CardDescription className="dark:text-muted-foreground">Pending Review</CardDescription>
            <CardTitle className="text-3xl text-wa-green-600 dark:text-wa-green-400">
              {filteredAndSortedCases.length}
              {filteredAndSortedCases.length !== stats.totalPending && (
                <span className="text-base text-gray-500 dark:text-gray-400 ml-2">of {stats.totalPending}</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <CardDescription className="dark:text-muted-foreground">Approved by You</CardDescription>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">{stats.approvedByMe}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <CardDescription className="dark:text-muted-foreground">Rejected by You</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">{stats.rejectedByMe}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-card dark:border-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-wa-green-600 dark:text-wa-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Search & Filter</h3>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-wa-green-600 hover:text-wa-green-700 dark:text-wa-green-400 dark:hover:text-wa-green-300"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customer or product..."
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

              {/* Contributor Filter */}
              <Select value={contributorFilter} onValueChange={setContributorFilter}>
                <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                  <SelectValue placeholder="Contributor" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-border">
                  <SelectItem value="all">All Contributors</SelectItem>
                  {contributors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px] dark:bg-input dark:border-border dark:text-foreground">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:border-border">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Cases */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <Clock className="h-5 w-5 text-wa-green-600 dark:text-wa-green-400" />
            Pending Approvals ({filteredAndSortedCases.length})
            {hasActiveFilters && <span className="text-sm text-gray-500 dark:text-gray-400">(Filtered)</span>}
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">Case studies waiting for your review</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedCases.length === 0 && pendingCases.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                All caught up!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no case studies pending approval at the moment.
              </p>
            </div>
          ) : filteredAndSortedCases.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No cases match your filters
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search or filters to see more results
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedCases.map((caseStudy) => (
                <div
                  key={caseStudy.id}
                  className="flex items-center justify-between p-4 border dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getTypeColor(caseStudy.type)}>
                        {caseStudy.type}
                      </Badge>
                      <Badge variant="outline" className="bg-wa-green-100 text-wa-green-700 dark:bg-wa-green-900/30 dark:text-wa-green-400 dark:border-wa-green-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {caseStudy.title || `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {caseStudy.location} • {caseStudy.waProduct}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Submitted by {caseStudy.contributor.name} on{' '}
                      {new Date(caseStudy.submittedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/dashboard/approvals/${caseStudy.id}`}>
                      <Button className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Reviewed */}
      {recentlyReviewed.length > 0 && (
        <Card className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Recently Reviewed by You</CardTitle>
            <CardDescription className="dark:text-muted-foreground">Your recent approval decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentlyReviewed.map((caseStudy) => (
                <div
                  key={caseStudy.id}
                  className="flex items-center justify-between p-4 border dark:border-border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getTypeColor(caseStudy.type)}>
                        {caseStudy.type}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(caseStudy.status)}>
                        {caseStudy.status === 'APPROVED' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {caseStudy.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {caseStudy.title || `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {caseStudy.location} • {caseStudy.waProduct}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Reviewed on {new Date(caseStudy.approvedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/dashboard/cases/${caseStudy.id}`}>
                    <Button variant="outline" size="sm" className="dark:border-border dark:text-foreground dark:hover:bg-accent">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
