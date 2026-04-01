import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { translationService } from '@/lib/integrations/translation';

/**
 * POST /api/admin/fix-translations
 * Re-detects language on all case studies and clears corrupted translations.
 * Requires ADMIN role.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - ADMIN role required' }, { status: 403 });
    }

    const allCases = await prisma.waCaseStudy.findMany({
      where: { status: { in: ['APPROVED', 'PUBLISHED', 'SUBMITTED', 'DRAFT'] } },
      select: {
        id: true,
        originalLanguage: true,
        translationAvailable: true,
        translatedText: true,
        problemDescription: true,
        waSolution: true,
        generalDescription: true,
      },
    });

    let fixed = 0;
    let cleared = 0;
    let alreadyCorrect = 0;

    for (const cs of allCases) {
      const allText = [cs.generalDescription, cs.problemDescription, cs.waSolution].filter(Boolean).join(' ');
      if (!allText.trim()) continue;

      const result = await translationService.detectLanguage(allText);
      if (!result.success || !result.detectedLanguage) continue;

      const updateData: Record<string, any> = {};
      let needsUpdate = false;

      // Fix wrong language
      if (result.detectedLanguage !== cs.originalLanguage) {
        updateData.originalLanguage = result.detectedLanguage;
        needsUpdate = true;
        fixed++;
      }

      // Clear corrupted translations
      if (cs.translationAvailable && cs.translatedText) {
        try {
          const parsed = JSON.parse(cs.translatedText);
          if (
            parsed.language === result.detectedLanguage || // same-language (pointless)
            (result.detectedLanguage === 'en' && parsed.language !== 'en') // English wrongly translated
          ) {
            updateData.translationAvailable = false;
            updateData.translatedText = null;
            needsUpdate = true;
            cleared++;
          }
        } catch {}
      }

      if (needsUpdate) {
        await prisma.waCaseStudy.update({ where: { id: cs.id }, data: updateData });
      } else {
        alreadyCorrect++;
      }
    }

    return NextResponse.json({
      success: true,
      total: allCases.length,
      fixed,
      cleared,
      alreadyCorrect,
    });
  } catch (error) {
    console.error('[Fix Translations] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fix translations',
    }, { status: 500 });
  }
}
