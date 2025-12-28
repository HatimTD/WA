'use server';

import { prisma } from '@/lib/prisma';

export async function waGetSearchSuggestions(query: string) {
  if (!query || query.length < 2) {
    return {
      success: true,
      suggestions: [],
    };
  }

  try {
    // Search approved case studies for autocomplete (including title)
    const results = await prisma.waCaseStudy.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
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
            location: {
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
        ],
      },
      select: {
        id: true,
        title: true,
        customerName: true,
        industry: true,
        location: true,
        componentWorkpiece: true,
        waProduct: true,
        type: true,
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Create unique suggestions (use title if available, otherwise fallback to customer - component)
    const suggestions = results.map((r) => ({
      id: r.id,
      title: r.title || `${r.customerName} - ${r.componentWorkpiece}`,
      industry: r.industry,
      location: r.location,
      product: r.waProduct,
      type: r.type,
    }));

    return {
      success: true,
      suggestions,
    };
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    return {
      success: false,
      suggestions: [],
    };
  }
}
