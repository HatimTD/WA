import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, LogIn } from 'lucide-react';
import { LibrarySearch } from '@/components/library-search';
import { LibraryFilters } from '@/components/library-filters';
import { SaveButton } from '@/components/save-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public Case Study Library',
  description: 'Browse approved industrial welding case studies. Explore solutions for maintenance challenges, cost reduction strategies, and productivity improvements across various industries.',
  openGraph: {
    title: 'Case Study Library - Welding Alloys',
    description: 'Discover industrial welding solutions and case studies',
    type: 'website',
  },
  keywords: ['welding case studies', 'industrial solutions', 'maintenance', 'welding alloys library'],
};

/**
 * BRD Section 5 - Search & Filtering (Public Library)
 * Simplified filters for public access
 */
interface SearchParams {
  q?: string;
  type?: string;
  industry?: string;
  oem?: string;
  component?: string;
  wearType?: string;
  waProduct?: string;
  country?: string;
  page?: string;
}

export default async function PublicLibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const typeFilter = params.type || '';
  const industryFilter = params.industry || '';
  const oemFilter = params.oem || '';
  // BRD Required Filters
  const componentFilter = params.component || '';
  const wearTypeFilter = params.wearType || '';
  const waProductFilter = params.waProduct || '';
  const countryFilter = params.country || '';
  const page = parseInt(params.page || '1');
  const perPage = 12;

  // Build where clause for approved cases only
  const where: any = {
    status: 'APPROVED',
  };

  if (query) {
    where.OR = [
      { customerName: { contains: query, mode: 'insensitive' } },
      { industry: { contains: query, mode: 'insensitive' } },
      { componentWorkpiece: { contains: query, mode: 'insensitive' } },
      { waProduct: { contains: query, mode: 'insensitive' } },
      { location: { contains: query, mode: 'insensitive' } },
      { competitorName: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (typeFilter) {
    where.type = typeFilter;
  }

  if (industryFilter) {
    where.industry = { contains: industryFilter, mode: 'insensitive' };
  }

  if (oemFilter) {
    where.competitorName = { contains: oemFilter, mode: 'insensitive' };
  }

  // BRD: Component filter
  if (componentFilter) {
    where.componentWorkpiece = { contains: componentFilter, mode: 'insensitive' };
  }

  // BRD: Wear Type filter
  if (wearTypeFilter) {
    where.wearType = { has: wearTypeFilter };
  }

  // BRD: WA Product filter
  if (waProductFilter) {
    where.waProduct = { contains: waProductFilter, mode: 'insensitive' };
  }

  // BRD: Country filter
  if (countryFilter) {
    where.country = { contains: countryFilter, mode: 'insensitive' };
  }

  // Fetch cases with pagination and filter options (BRD Section 5)
  const [cases, totalCount, industries, oems, typeCounts, components, waProducts, countries, wearTypes] = await Promise.all([
    prisma.waCaseStudy.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        industry: true,
        location: true,
        componentWorkpiece: true,
        type: true,
        waProduct: true,
        problemDescription: true,
        approvedAt: true,
      },
      orderBy: { approvedAt: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.waCaseStudy.count({ where }),
    prisma.waCaseStudy.findMany({
      where: { status: 'APPROVED' },
      select: { industry: true },
      distinct: ['industry'],
    }),
    prisma.waCaseStudy.findMany({
      where: { status: 'APPROVED', competitorName: { not: null } },
      select: { competitorName: true },
      distinct: ['competitorName'],
    }),
    prisma.waCaseStudy.groupBy({
      by: ['type'],
      where: { status: 'APPROVED' },
      _count: true,
    }),
    // BRD: Component options
    prisma.waCaseStudy.findMany({
      where: { status: 'APPROVED' },
      select: { componentWorkpiece: true },
      distinct: ['componentWorkpiece'],
    }),
    // BRD: WA Product options
    prisma.waCaseStudy.findMany({
      where: { status: 'APPROVED' },
      select: { waProduct: true },
      distinct: ['waProduct'],
    }),
    // BRD: Country options
    prisma.waCaseStudy.findMany({
      where: { status: 'APPROVED', country: { not: null } },
      select: { country: true },
      distinct: ['country'],
    }),
    // BRD: Wear Type options
    prisma.waCaseStudy.findMany({
      where: { status: 'APPROVED' },
      select: { wearType: true },
    }),
  ]);

  // Extract unique wear types from arrays
  const uniqueWearTypes = [...new Set(wearTypes.flatMap(wt => wt.wearType))].sort();

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-wa-green-600 to-purple-600 bg-clip-text text-transparent">
                Case Study Library
              </h1>
              <p className="text-gray-600 mt-2">
                Browse {totalCount.toLocaleString()} approved industrial solutions from Welding Alloys
              </p>
            </div>
            <Link href="/login">
              <Button size="lg" className="gap-2">
                <LogIn className="h-5 w-5" />
                Sign In to Contribute
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Card role="article" className="border-2 border-wa-green-100 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Quick Search</CardTitle>
            <CardDescription>
              Start typing to search and filter cases in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LibrarySearch />
          </CardContent>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card role="article">
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <LibraryFilters
                  industries={industries}
                  oems={oems}
                  typeCounts={typeCounts}
                  initialQuery={query}
                  typeFilter={typeFilter}
                  industryFilter={industryFilter}
                  oemFilter={oemFilter}
                  // BRD Required Filter Options
                  components={components}
                  waProducts={waProducts}
                  countries={countries}
                  wearTypes={uniqueWearTypes}
                  contributors={[]} // No contributor filter on public page
                  // BRD Current Filter Values
                  componentFilter={componentFilter}
                  waProductFilter={waProductFilter}
                  countryFilter={countryFilter}
                  wearTypeFilter={wearTypeFilter}
                  contributorFilter=""
                  minRevenue={null}
                  maxRevenue={null}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Info */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, totalCount)} of{' '}
                {totalCount} cases
              </p>
              {(query || typeFilter || industryFilter || oemFilter) && (
                <Link href="/library">
                  <Button variant="outline" size="sm">
                    Clear Filters
                  </Button>
                </Link>
              )}
            </div>

            {/* Cases Grid */}
            {cases.length === 0 ? (
              <Card role="article" className="p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No case studies found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or search query</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cases.map((caseStudy) => (
                  <Card role="article"
                    key={caseStudy.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">
                          {caseStudy.customerName}
                        </CardTitle>
                        <div className="flex items-center gap-2 shrink-0">
                          <SaveButton caseStudyId={caseStudy.id} variant="icon" size="sm" />
                          <Badge
                            variant={
                              caseStudy.type === 'STAR'
                                ? 'default'
                                : caseStudy.type === 'TECH'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {caseStudy.type}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-1">
                        {caseStudy.industry} • {caseStudy.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Component:</span>{' '}
                          {caseStudy.componentWorkpiece}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Product:</span> {caseStudy.waProduct}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {caseStudy.problemDescription}
                      </p>
                      <Link href={`/library/${caseStudy.id}`}>
                        <Button className="w-full gap-2 mt-4">
                          View Full Case Study
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Link
                  href={`/library?${new URLSearchParams({
                    page: String(Math.max(1, page - 1)),
                    ...(query && { q: query }),
                    ...(typeFilter && { type: typeFilter }),
                    ...(industryFilter && { industry: industryFilter }),
                  }).toString()}`}
                >
                  <Button variant="outline" disabled={page === 1}>
                    Previous
                  </Button>
                </Link>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Link
                        key={pageNum}
                        href={`/library?${new URLSearchParams({
                          page: String(pageNum),
                          ...(query && { q: query }),
                          ...(typeFilter && { type: typeFilter }),
                          ...(industryFilter && { industry: industryFilter }),
                        }).toString()}`}
                      >
                        <Button
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    );
                  })}
                </div>

                <Link
                  href={`/library?${new URLSearchParams({
                    page: String(Math.min(totalPages, page + 1)),
                    ...(query && { q: query }),
                    ...(typeFilter && { type: typeFilter }),
                    ...(industryFilter && { industry: industryFilter }),
                  }).toString()}`}
                >
                  <Button variant="outline" disabled={page === totalPages}>
                    Next
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-wa-green-600 to-purple-600 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Have a success story to share?
          </h2>
          <p className="text-wa-green-100 text-lg mb-6 max-w-2xl mx-auto">
            Join our community of contributors and help others solve similar industrial challenges
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="gap-2">
              <LogIn className="h-5 w-5" />
              Sign In to Contribute
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
