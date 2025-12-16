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
  oem?: string;
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
  const oemFilter = params.oem || '';
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
      { oem: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (typeFilter) {
    where.type = typeFilter;
  }

  if (industryFilter) {
    where.industry = { contains: industryFilter, mode: 'insensitive' };
  }

  if (oemFilter) {
    where.oem = { contains: oemFilter, mode: 'insensitive' };
  }

  // Fetch cases with pagination
  const [cases, totalCount, industries, oems, typeCounts] = await Promise.all([
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
      where: { status: 'APPROVED', oem: { not: null } },
      select: { oem: true },
      distinct: ['oem'],
    }),
    prisma.waCaseStudy.groupBy({
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Case Study Library</h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-2">
          Browse {totalCount.toLocaleString()} approved industrial solutions
        </p>
      </div>

      {/* Dynamic Search Section */}
      <Card role="article" className="border-2 border-wa-green-100 bg-white dark:bg-card dark:border-primary">
        <CardHeader>
          <CardTitle className="text-lg dark:text-foreground">Quick Search</CardTitle>
          <CardDescription className="dark:text-muted-foreground">
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
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="text-lg dark:text-foreground">Filters</CardTitle>
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
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Results Info */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, totalCount)} of{' '}
              {totalCount} cases
            </p>
            {(query || typeFilter || industryFilter || oemFilter) && (
              <Link href="/dashboard/library">
                <Button variant="outline" size="sm" className="dark:border-border dark:text-foreground dark:hover:bg-accent">
                  Clear Filters
                </Button>
              </Link>
            )}
          </div>

          {/* Cases Grid */}
          {cases.length === 0 ? (
            <Card role="article" className="p-12 text-center dark:bg-card dark:border-border">
              <p className="text-gray-500 dark:text-muted-foreground text-lg mb-4">No case studies found</p>
              <p className="text-gray-400 dark:text-muted-foreground text-sm">Try adjusting your filters or search query</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {cases.map((caseStudy) => (
                <Card role="article"
                  key={caseStudy.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-card dark:border-border dark:hover:border-primary"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2 dark:text-foreground">
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
                    <CardDescription className="line-clamp-1 dark:text-muted-foreground">
                      {caseStudy.industry} • {caseStudy.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-muted-foreground">
                        <span className="font-medium dark:text-foreground">Component:</span>{' '}
                        {caseStudy.componentWorkpiece}
                      </p>
                      <p className="text-gray-600 dark:text-muted-foreground">
                        <span className="font-medium dark:text-foreground">Product:</span> {caseStudy.waProduct}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-muted-foreground line-clamp-3">
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
                  ...(oemFilter && { oem: oemFilter }),
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
                        ...(oemFilter && { oem: oemFilter }),
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
                  ...(oemFilter && { oem: oemFilter }),
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
