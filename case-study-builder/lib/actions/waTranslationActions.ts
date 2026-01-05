'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  translationService,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/lib/integrations/translation';

export interface TranslateCaseStudyResult {
  success: boolean;
  translatedFields?: {
    problemDescription?: string;
    previousSolution?: string;
    technicalAdvantages?: string;
    waSolution?: string;
  };
  targetLanguage: string;
  provider: string;
  error?: string;
}

/**
 * Translate a case study to a target language
 */
export async function waTranslateCaseStudy(
  caseStudyId: string,
  targetLanguage: LanguageCode
): Promise<TranslateCaseStudyResult> {
  try {
    // Fetch the case study
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        id: true,
        problemDescription: true,
        previousSolution: true,
        technicalAdvantages: true,
        waSolution: true,
        originalLanguage: true,
      },
    });

    if (!caseStudy) {
      return {
        success: false,
        targetLanguage,
        provider: translationService.getProvider(),
        error: 'Case study not found',
      };
    }

    const languageName = SUPPORTED_LANGUAGES[targetLanguage];

    // Collect fields to translate
    const fieldsToTranslate: Record<string, string> = {};

    if (caseStudy.problemDescription) {
      fieldsToTranslate.problemDescription = caseStudy.problemDescription;
    }
    if (caseStudy.previousSolution) {
      fieldsToTranslate.previousSolution = caseStudy.previousSolution;
    }
    if (caseStudy.technicalAdvantages) {
      fieldsToTranslate.technicalAdvantages = caseStudy.technicalAdvantages;
    }
    if (caseStudy.waSolution) {
      fieldsToTranslate.waSolution = caseStudy.waSolution;
    }

    // Translate each field
    const translatedFields: Record<string, string> = {};
    let lastProvider = 'openai';

    for (const [field, text] of Object.entries(fieldsToTranslate)) {
      const result = await translationService.translate(
        text,
        targetLanguage,
        caseStudy.originalLanguage as LanguageCode
      );

      if (result.success && result.translatedText) {
        translatedFields[field] = result.translatedText;
        lastProvider = result.provider;
      }
    }

    // Store translated text in JSON format
    const translatedJson = JSON.stringify({
      language: targetLanguage,
      translatedAt: new Date().toISOString(),
      provider: lastProvider,
      fields: translatedFields,
    });

    // Update case study with translation
    await prisma.waCaseStudy.update({
      where: { id: caseStudyId },
      data: {
        translatedText: translatedJson,
        translationAvailable: true,
      },
    });

    return {
      success: true,
      translatedFields: {
        problemDescription: translatedFields.problemDescription,
        previousSolution: translatedFields.previousSolution,
        technicalAdvantages: translatedFields.technicalAdvantages,
        waSolution: translatedFields.waSolution,
      },
      targetLanguage: languageName,
      provider: lastProvider,
    };
  } catch (error) {
    console.error('[Translation Actions] Error:', error);
    return {
      success: false,
      targetLanguage,
      provider: translationService.getProvider(),
      error: 'Failed to translate case study',
    };
  }
}

/**
 * Get available translations for a case study
 */
export async function waGetCaseStudyTranslation(caseStudyId: string): Promise<{
  success: boolean;
  hasTranslation: boolean;
  translation?: {
    language: string;
    translatedAt: string;
    provider: string;
    fields: Record<string, string>;
  };
  error?: string;
}> {
  try {
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        translatedText: true,
        translationAvailable: true,
      },
    });

    if (!caseStudy) {
      return { success: false, hasTranslation: false, error: 'Case study not found' };
    }

    if (!caseStudy.translationAvailable || !caseStudy.translatedText) {
      return { success: true, hasTranslation: false };
    }

    try {
      const translation = JSON.parse(caseStudy.translatedText);
      return {
        success: true,
        hasTranslation: true,
        translation,
      };
    } catch {
      return { success: true, hasTranslation: false };
    }
  } catch (error) {
    console.error('[Translation Actions] Error:', error);
    return { success: false, hasTranslation: false, error: 'Failed to get translation' };
  }
}

/**
 * Batch translate multiple case studies
 */
export async function waBatchTranslateCaseStudies(
  caseStudyIds: string[],
  targetLanguage: LanguageCode
): Promise<{
  success: boolean;
  translated: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let translated = 0;
  let failed = 0;

  for (const id of caseStudyIds) {
    const result = await waTranslateCaseStudy(id, targetLanguage);
    if (result.success) {
      translated++;
    } else {
      failed++;
      errors.push(`${id}: ${result.error}`);
    }
  }

  return {
    success: failed === 0,
    translated,
    failed,
    errors,
  };
}

/**
 * Get supported languages
 */
export async function waGetSupportedLanguages(): Promise<{
  success: boolean;
  languages: Array<{ code: string; name: string }>;
}> {
  const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code,
    name: name as string,
  }));

  return {
    success: true,
    languages,
  };
}

/**
 * Detect the language of case study content
 */
export async function waDetectCaseStudyLanguage(caseStudyId: string): Promise<{
  success: boolean;
  detectedLanguage?: string;
  confidence?: number;
  error?: string;
}> {
  try {
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        problemDescription: true,
      },
    });

    if (!caseStudy || !caseStudy.problemDescription) {
      return { success: false, error: 'No text to analyze' };
    }

    const result = await translationService.detectLanguage(caseStudy.problemDescription);

    if (result.success) {
      // Update the case study with detected language
      await prisma.waCaseStudy.update({
        where: { id: caseStudyId },
        data: { originalLanguage: result.detectedLanguage },
      });
    }

    return result;
  } catch (error) {
    console.error('[Translation Actions] Detection error:', error);
    return { success: false, error: 'Failed to detect language' };
  }
}

/**
 * Auto-detect language and translate to English if needed
 * Called automatically when a case study is submitted
 * BRD: "System automatically translates content into Corporate English"
 */
export async function waAutoTranslateOnSubmit(caseStudyId: string): Promise<{
  success: boolean;
  originalLanguage: string;
  wasTranslated: boolean;
  error?: string;
}> {
  try {
    // Fetch case study
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        id: true,
        problemDescription: true,
        previousSolution: true,
        technicalAdvantages: true,
        waSolution: true,
        originalLanguage: true,
        translationAvailable: true,
      },
    });

    if (!caseStudy) {
      return { success: false, originalLanguage: 'en', wasTranslated: false, error: 'Case study not found' };
    }

    // Skip if already translated
    if (caseStudy.translationAvailable) {
      return {
        success: true,
        originalLanguage: caseStudy.originalLanguage || 'en',
        wasTranslated: false,
      };
    }

    // Detect language from problem description (main content field)
    const detectResult = await translationService.detectLanguage(caseStudy.problemDescription);
    const detectedLanguage: string = detectResult.success && detectResult.detectedLanguage ? detectResult.detectedLanguage : 'en';

    // Update original language
    await prisma.waCaseStudy.update({
      where: { id: caseStudyId },
      data: { originalLanguage: detectedLanguage },
    });

    // If already in English, no translation needed
    if (detectedLanguage === 'en') {
      console.log(`[Auto-Translation] Case ${caseStudyId} is already in English, no translation needed`);
      return { success: true, originalLanguage: 'en', wasTranslated: false };
    }

    console.log(`[Auto-Translation] Case ${caseStudyId} detected as ${detectedLanguage}, translating to English...`);

    // Translate to English
    const translateResult = await waTranslateCaseStudy(caseStudyId, 'en');

    if (translateResult.success) {
      console.log(`[Auto-Translation] Case ${caseStudyId} successfully translated to English`);
      revalidatePath(`/dashboard/cases/${caseStudyId}`);
      return {
        success: true,
        originalLanguage: detectedLanguage,
        wasTranslated: true,
      };
    } else {
      console.error(`[Auto-Translation] Failed to translate case ${caseStudyId}:`, translateResult.error);
      return {
        success: false,
        originalLanguage: detectedLanguage,
        wasTranslated: false,
        error: translateResult.error,
      };
    }
  } catch (error) {
    console.error('[Auto-Translation] Error:', error);
    return {
      success: false,
      originalLanguage: 'en',
      wasTranslated: false,
      error: 'Auto-translation failed',
    };
  }
}

/**
 * Get the display content for a case study (translated if available, original otherwise)
 * Returns English content when translation is available
 */
export async function waGetDisplayContent(caseStudyId: string): Promise<{
  success: boolean;
  content: {
    problemDescription: string;
    previousSolution?: string;
    technicalAdvantages?: string;
    waSolution: string;
  };
  isTranslated: boolean;
  originalLanguage: string;
  error?: string;
}> {
  try {
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        problemDescription: true,
        previousSolution: true,
        technicalAdvantages: true,
        waSolution: true,
        originalLanguage: true,
        translationAvailable: true,
        translatedText: true,
      },
    });

    if (!caseStudy) {
      return {
        success: false,
        content: { problemDescription: '', waSolution: '' },
        isTranslated: false,
        originalLanguage: 'en',
        error: 'Case study not found',
      };
    }

    const originalLanguage = caseStudy.originalLanguage || 'en';

    // If translation is available, use translated content
    if (caseStudy.translationAvailable && caseStudy.translatedText) {
      try {
        const translation = JSON.parse(caseStudy.translatedText);
        const fields = translation.fields || {};

        return {
          success: true,
          content: {
            problemDescription: fields.problemDescription || caseStudy.problemDescription,
            previousSolution: fields.previousSolution || caseStudy.previousSolution || undefined,
            technicalAdvantages: fields.technicalAdvantages || caseStudy.technicalAdvantages || undefined,
            waSolution: fields.waSolution || caseStudy.waSolution,
          },
          isTranslated: true,
          originalLanguage,
        };
      } catch {
        // If parsing fails, return original content
      }
    }

    // Return original content
    return {
      success: true,
      content: {
        problemDescription: caseStudy.problemDescription,
        previousSolution: caseStudy.previousSolution || undefined,
        technicalAdvantages: caseStudy.technicalAdvantages || undefined,
        waSolution: caseStudy.waSolution,
      },
      isTranslated: false,
      originalLanguage,
    };
  } catch (error) {
    console.error('[Translation Actions] Get display content error:', error);
    return {
      success: false,
      content: { problemDescription: '', waSolution: '' },
      isTranslated: false,
      originalLanguage: 'en',
      error: 'Failed to get content',
    };
  }
}
