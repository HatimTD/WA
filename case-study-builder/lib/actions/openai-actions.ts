'use server';

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SummarizeResult {
  success: boolean;
  summary?: string;
  error?: string;
}

export interface TranslateResult {
  success: boolean;
  translatedText?: string;
  detectedLanguage?: string;
  error?: string;
}

export interface ImproveTextResult {
  success: boolean;
  improvedText?: string;
  error?: string;
}

/**
 * Summarize text using OpenAI
 * @param text - The text to summarize
 * @param maxLength - Maximum length of summary in words (default: 100)
 * @returns SummarizeResult with summary or error
 */
export async function summarizeText(text: string, maxLength: number = 100): Promise<SummarizeResult> {
  try {
    console.log('[OpenAI] Starting text summarization');

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided to summarize',
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[OpenAI] API key not configured');
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a technical writing assistant. Summarize the following text concisely in approximately ${maxLength} words. Focus on the key technical details, problems, and solutions. Maintain a professional tone suitable for industrial case studies.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      return {
        success: false,
        error: 'Failed to generate summary',
      };
    }

    console.log('[OpenAI] Summary generated successfully');
    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error('[OpenAI] Error summarizing text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to summarize text',
    };
  }
}

/**
 * Translate text to a target language using OpenAI
 * @param text - The text to translate
 * @param targetLanguage - The target language (e.g., 'Spanish', 'French', 'German')
 * @returns TranslateResult with translated text or error
 */
export async function translateText(text: string, targetLanguage: string): Promise<TranslateResult> {
  try {
    console.log('[OpenAI] Starting text translation to', targetLanguage);

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided to translate',
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[OpenAI] API key not configured');
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in technical and industrial documentation. Translate the following text to ${targetLanguage}. Maintain technical accuracy and professional tone. Preserve formatting and structure.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      return {
        success: false,
        error: 'Failed to generate translation',
      };
    }

    console.log('[OpenAI] Translation completed successfully');
    return {
      success: true,
      translatedText,
      detectedLanguage: 'English', // OpenAI auto-detects, but we assume English source
    };
  } catch (error) {
    console.error('[OpenAI] Error translating text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to translate text',
    };
  }
}

/**
 * Improve text quality and professionalism using OpenAI
 * @param text - The text to improve
 * @param context - Context about what kind of text this is (e.g., 'problem description', 'solution')
 * @returns ImproveTextResult with improved text or error
 */
export async function improveText(text: string, context?: string): Promise<ImproveTextResult> {
  try {
    console.log('[OpenAI] Starting text improvement');

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided to improve',
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[OpenAI] API key not configured');
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    const contextPrompt = context
      ? `This is a ${context} for an industrial case study.`
      : 'This is part of an industrial case study.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional technical writer. ${contextPrompt} Improve the following text to be more professional, clear, and concise. Fix grammar and spelling errors. Enhance technical descriptions while maintaining accuracy. Keep the same general length and structure.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const improvedText = completion.choices[0]?.message?.content?.trim();

    if (!improvedText) {
      return {
        success: false,
        error: 'Failed to generate improved text',
      };
    }

    console.log('[OpenAI] Text improvement completed successfully');
    return {
      success: true,
      improvedText,
    };
  } catch (error) {
    console.error('[OpenAI] Error improving text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to improve text',
    };
  }
}

/**
 * Generate a professional case study title based on content
 * @param customerName - Customer name
 * @param component - Component or workpiece
 * @param problemDescription - Brief problem description
 * @returns Suggested title
 */
export async function generateTitle(
  customerName: string,
  component: string,
  problemDescription: string
): Promise<{ success: boolean; title?: string; error?: string }> {
  try {
    console.log('[OpenAI] Generating case study title');

    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional technical writer. Generate a concise, professional case study title (max 10 words) based on the provided information. The title should be clear and descriptive.',
        },
        {
          role: 'user',
          content: `Customer: ${customerName}\nComponent: ${component}\nProblem: ${problemDescription}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const title = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');

    if (!title) {
      return {
        success: false,
        error: 'Failed to generate title',
      };
    }

    console.log('[OpenAI] Title generated successfully');
    return {
      success: true,
      title,
    };
  } catch (error) {
    console.error('[OpenAI] Error generating title:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate title',
    };
  }
}
