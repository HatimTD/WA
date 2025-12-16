'use server';

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function waSuggestTags(
  description: string,
  industry: string,
  component: string
): Promise<{ success: boolean; tags?: string[]; error?: string }> {
  try {
    const prompt = `Based on this welding case study, suggest 5-8 relevant technical tags/keywords.

Industry: ${industry}
Component: ${component}
Description: ${description}

Focus on: welding processes, wear mechanisms, materials, applications, benefits.
Return ONLY a JSON array of strings, no explanation.
Example: ["GMAW", "abrasion resistance", "crusher hammers", "hardfacing"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content || '[]';
    const tags = JSON.parse(content);

    return { success: true, tags };
  } catch (error) {
    console.error('Tag suggestion failed:', error);
    return { success: false, error: 'Failed to generate tags' };
  }
}

export async function waSuggestLocations(customerName: string) {
  try {
    const existing = await prisma.waCaseStudy.findMany({
      where: {
        customerName: { contains: customerName, mode: 'insensitive' },
        status: 'APPROVED',
      },
      select: { location: true, country: true },
      distinct: ['location'],
      take: 5,
    });

    return { success: true, locations: existing };
  } catch (error) {
    console.error('Location suggestion failed:', error);
    return { success: false, locations: [], error: 'Failed to fetch locations' };
  }
}
