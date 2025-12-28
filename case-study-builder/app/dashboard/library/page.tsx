import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, User, CheckCircle2 } from 'lucide-react';
import { LibraryFilters } from '@/components/library-filters';
import { SaveButton } from '@/components/save-button';
import LanguageIndicator from '@/components/language-indicator';

// Fallback wear types if master data not available
const FALLBACK_WEAR_TYPES = ['ABRASION', 'IMPACT', 'CORROSION', 'TEMPERATURE', 'COMBINATION'];

export const metadata = {
  title: 'Case Study Library - Welding Alloys',
  description: 'Browse approved industrial case studies from Welding Alloys',
};

/**
 * BRD Section 5 - Search & Filtering
 * Database must be searchable by: Tags, Industry, Component, OEM, Wear Type,
 * WA Product, Country, Customer, Revenue, and Contributor
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
  contributor?: string;
  minRevenue?: string;
  maxRevenue?: string;
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
  // BRD Required Filters
  const componentFilter = params.component || '';
  // Support multiple wear types (comma-separated in URL)
  const wearTypeFilter = params.wearType || '';
  const wearTypeFilters = wearTypeFilter ? wearTypeFilter.split(',').map(w => w.trim().toUpperCase()) : [];
  const waProductFilter = params.waProduct || '';
  const countryFilter = params.country || '';
  const contributorFilter = params.contributor || '';
  const minRevenue = params.minRevenue ? parseFloat(params.minRevenue) : null;
  const maxRevenue = params.maxRevenue ? parseFloat(params.maxRevenue) : null;
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

  // BRD: Component/Workpiece filter
  if (componentFilter) {
    where.componentWorkpiece = { contains: componentFilter, mode: 'insensitive' };
  }

  // BRD: Wear Type filter (supports multiple selection, case-insensitive)
  if (wearTypeFilters.length > 0) {
    where.wearType = { hasSome: wearTypeFilters };
  }

  // BRD: WA Product filter
  if (waProductFilter) {
    where.waProduct = { contains: waProductFilter, mode: 'insensitive' };
  }

  // BRD: Country filter
  if (countryFilter) {
    where.country = { contains: countryFilter, mode: 'insensitive' };
  }

  // BRD: Contributor filter
  if (contributorFilter) {
    where.contributorId = contributorFilter;
  }

  // BRD: Revenue filter
  if (minRevenue !== null || maxRevenue !== null) {
    where.annualPotentialRevenue = {};
    if (minRevenue !== null) {
      where.annualPotentialRevenue.gte = minRevenue;
    }
    if (maxRevenue !== null) {
      where.annualPotentialRevenue.lte = maxRevenue;
    }
  }

  // Fetch cases with pagination and all filter options (BRD Section 5)
  // Sort by approvedAt descending, with null values last (use createdAt as fallback)
  const [cases, totalCount, industries, oems, typeCounts, components, waProducts, countries, contributors, masterWearTypes] = await Promise.all([
    prisma.waCaseStudy.findMany({
      where,
      select: {
        id: true,
        title: true,
        customerName: true,
        industry: true,
        location: true,
        country: true,
        componentWorkpiece: true,
        type: true,
        waProduct: true,
        wearType: true,
        problemDescription: true,
        approvedAt: true,
        createdAt: true,
        originalLanguage: true,
        translationAvailable: true,
        solutionValueRevenue: true,
        contributor: {
          select: { id: true, name: true },
        },
        approver: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { approvedAt: 'desc' },
        { createdAt: 'desc' },
      ],
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
    // BRD: Contributor options
    prisma.waCaseStudy.findMany({
      where: { status: 'APPROVED' },
      select: {
        contributorId: true,
        contributor: { select: { id: true, name: true } },
      },
      distinct: ['contributorId'],
    }),
    // Fetch wear types from master data (admin-managed)
    prisma.waMasterList.findMany({
      where: {
        isActive: true,
        listKey: { keyName: 'WearType' },
      },
      orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
      select: {
        id: true,
        value: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  // Use master data wear types, fallback to hardcoded if none found
  const wearTypeOptions = masterWearTypes.length > 0
    ? masterWearTypes.map(wt => wt.value)
    : FALLBACK_WEAR_TYPES;

  return (
    <div className="space-y-6">
      {/* Header - Responsive Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-foreground truncate">
            Case Study Library
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-muted-foreground mt-1 sm:mt-2">
            Browse {totalCount.toLocaleString()} approved industrial solutions
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-muted-foreground">
          <span className="hidden sm:inline">
            {totalPages > 1 && `Page ${page} of ${totalPages}`}
          </span>
        </div>
      </div>

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
                // BRD Required Filter Options
                components={components}
                waProducts={waProducts}
                countries={countries}
                wearTypes={wearTypeOptions}
                contributors={contributors}
                // BRD Current Filter Values
                componentFilter={componentFilter}
                waProductFilter={waProductFilter}
                countryFilter={countryFilter}
                wearTypeFilter={wearTypeFilter}
                contributorFilter={contributorFilter}
                minRevenue={minRevenue}
                maxRevenue={maxRevenue}
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
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer dark:bg-card dark:border-border dark:hover:border-primary overflow-hidden"
                >
                  {/* Type Badge Banner */}
                  <div className={`h-1.5 ${
                    caseStudy.type === 'STAR'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      : caseStudy.type === 'TECH'
                      ? 'bg-gradient-to-r from-purple-500 to-violet-600'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`} />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              caseStudy.type === 'STAR'
                                ? 'default'
                                : caseStudy.type === 'TECH'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={`text-xs ${
                              caseStudy.type === 'STAR'
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : ''
                            }`}
                          >
                            {caseStudy.type}
                          </Badge>
                          {/* Approved Date Badge */}
                          {caseStudy.approvedAt && (
                            <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800">
                              <CheckCircle2 className="h-3 w-3" />
                              {new Date(caseStudy.approvedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-semibold line-clamp-2 dark:text-foreground group-hover:text-wa-green-600 dark:group-hover:text-primary transition-colors">
                          {caseStudy.title || `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`}
                        </CardTitle>
                      </div>
                      <SaveButton caseStudyId={caseStudy.id} variant="icon" size="sm" />
                    </div>
                    <CardDescription className="flex items-center gap-1 text-sm dark:text-muted-foreground mt-1">
                      <span className="truncate">{caseStudy.industry}</span>
                      <span>•</span>
                      <span className="truncate">{caseStudy.location}{caseStudy.country ? `, ${caseStudy.country}` : ''}</span>
                    </CardDescription>
                    {/* Language Indicator */}
                    {caseStudy.originalLanguage && caseStudy.originalLanguage !== 'en' && (
                      <div className="mt-2">
                        <LanguageIndicator
                          originalLanguage={caseStudy.originalLanguage}
                          translationAvailable={caseStudy.translationAvailable}
                          caseStudyId={caseStudy.id}
                          variant="badge"
                          showLink={true}
                        />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
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
                      <div className="flex flex-wrap gap-1">
                        {caseStudy.wearType.slice(0, 3).map((wear) => (
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

                    {/* Problem Description Preview */}
                    <p className="text-sm text-gray-600 dark:text-muted-foreground line-clamp-2">
                      {caseStudy.problemDescription}
                    </p>

                    {/* Footer with Contributor & Revenue */}
                    <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{caseStudy.contributor?.name || 'Unknown'}</span>
                      </div>
                      {caseStudy.solutionValueRevenue && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          ${Number(caseStudy.solutionValueRevenue).toLocaleString('en-US')}
                        </Badge>
                      )}
                    </div>

                    <Link href={`/dashboard/library/${caseStudy.id}`} className="block">
                      <Button className="w-full gap-2 bg-wa-green-600 hover:bg-wa-green-700 dark:bg-primary dark:hover:bg-primary/90 transition-all group-hover:shadow-md">
                        View Details
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
