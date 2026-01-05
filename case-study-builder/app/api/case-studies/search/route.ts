import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [], suggestions: [] });
    }

    // Search case studies - only approved ones
    const cases = await prisma.waCaseStudy.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            customerName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            industry: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            componentWorkpiece: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            waProduct: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            location: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
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
      take: 20,
      orderBy: {
        approvedAt: 'desc',
      },
    });

    // Generate autocomplete suggestions
    const suggestions: string[] = [];

    // Get unique suggestions from matching fields
    const [customerNames, industries, products] = await Promise.all([
      prisma.waCaseStudy.findMany({
        where: {
          status: 'APPROVED',
          customerName: { contains: query, mode: 'insensitive' },
        },
        select: { customerName: true },
        distinct: ['customerName'],
        take: 3,
      }),
      prisma.waCaseStudy.findMany({
        where: {
          status: 'APPROVED',
          industry: { contains: query, mode: 'insensitive' },
        },
        select: { industry: true },
        distinct: ['industry'],
        take: 3,
      }),
      prisma.waCaseStudy.findMany({
        where: {
          status: 'APPROVED',
          waProduct: { contains: query, mode: 'insensitive' },
        },
        select: { waProduct: true },
        distinct: ['waProduct'],
        take: 3,
      }),
    ]);

    suggestions.push(...customerNames.map((c) => c.customerName));
    suggestions.push(...industries.map((i) => i.industry));
    suggestions.push(...products.map((p) => p.waProduct));

    return NextResponse.json({
      results: cases,
      suggestions: [...new Set(suggestions)].slice(0, 5), // Remove duplicates and limit to 5
    });
  } catch (error) {
    console.error('[API] Case study search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', results: [], suggestions: [] },
      { status: 500 }
    );
  }
}
