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
    // Validate inputs
    if (!description?.trim() || !industry?.trim() || !component?.trim()) {
      return {
        success: false,
        error: 'Missing required fields: problem description, industry, and component are needed to generate tags'
      };
    }

    // Check for minimum content length
    if (description.trim().length < 10) {
      return {
        success: false,
        error: 'Problem description is too short. Please provide more detail to generate relevant tags.'
      };
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning fallback tags');
      // Return fallback tags based on industry and component
      const fallbackTags = [
        industry.toLowerCase(),
        component.toLowerCase().split(' ')[0],
        'welding',
        'hardfacing',
        'wear resistance'
      ].filter(Boolean);
      return { success: true, tags: fallbackTags };
    }

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

    // Try to parse JSON, handle potential formatting issues
    let tags: string[];
    try {
      // Remove potential markdown code blocks
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      tags = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return { success: false, error: 'Failed to parse tag suggestions. Please try again.' };
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return { success: false, error: 'No tags were generated. Please try again.' };
    }

    return { success: true, tags };
  } catch (error) {
    console.error('Tag suggestion failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to generate tags: ${errorMessage}` };
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
