import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { LibrarySearch } from '@/components/library-search';
import { LibraryFilters } from '@/components/library-filters';
import { SaveButton } from '@/components/save-button';

export const metadata = {
  title: 'Case Study Library - Welding Alloys',
  description: 'Browse approved industrial case studies from Welding Alloys',
};

interface SearchParams {
  q?: string;
  type?: string;
  industry?: string;
  page?: string;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const typeFilter = params.type || '';
  const industryFilter = params.industry || '';
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
    ];
  }

  if (typeFilter) {
    where.type = typeFilter;
  }

  if (industryFilter) {
    where.industry = { contains: industryFilter, mode: 'insensitive' };
  }

  // Fetch cases with pagination
  const [cases, totalCount, industries, typeCounts] = await Promise.all([
    prisma.caseStudy.findMany({
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
    prisma.caseStudy.count({ where }),
    prisma.caseStudy.findMany({
      where: { status: 'APPROVED' },
      select: { industry: true },
      distinct: ['industry'],
    }),
    prisma.caseStudy.groupBy({
      by: ['type'],
      where: { status: 'APPROVED' },
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Case Study Library</h1>
        <p className="text-gray-600 mt-2">
          Browse {totalCount.toLocaleString()} approved industrial solutions
        </p>
      </div>

      {/* Dynamic Search Section */}
      <Card className="border-2 border-blue-100 bg-white">
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

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <LibraryFilters
                industries={industries}
                typeCounts={typeCounts}
                initialQuery={query}
                typeFilter={typeFilter}
                industryFilter={industryFilter}
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
            {(query || typeFilter || industryFilter) && (
              <Link href="/dashboard/library">
                <Button variant="outline" size="sm">
                  Clear Filters
                </Button>
              </Link>
            )}
          </div>

          {/* Cases Grid */}
          {cases.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No case studies found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or search query</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {cases.map((caseStudy) => (
                <Card
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
                    <Link href={`/dashboard/library/${caseStudy.id}`}>
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
                href={`/dashboard/library?${new URLSearchParams({
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
                      href={`/dashboard/library?${new URLSearchParams({
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
                href={`/dashboard/library?${new URLSearchParams({
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
  );
}
