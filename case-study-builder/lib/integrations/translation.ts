/**
 * Translation Service (BRD 5.4 - Multi-Language Support)
 *
 * Supports multiple translation providers:
 * - OpenAI (default, already configured)
 * - Google Cloud Translation API
 * - DeepL API
 *
 * Provider selection is based on environment configuration.
 */

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage: string;
  provider: 'openai' | 'google' | 'deepl';
  error?: string;
}

export interface LanguageDetectionResult {
  success: boolean;
  detectedLanguage?: string;
  confidence?: number;
  error?: string;
}

// Supported languages with codes
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

class TranslationService {
  private provider: 'openai' | 'google' | 'deepl';
  private googleApiKey: string;
  private deeplApiKey: string;

  constructor() {
    this.googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '';
    this.deeplApiKey = process.env.DEEPL_API_KEY || '';

    // Determine which provider to use based on configuration
    if (this.googleApiKey) {
      this.provider = 'google';
    } else if (this.deeplApiKey) {
      this.provider = 'deepl';
    } else {
      this.provider = 'openai'; // Fallback to OpenAI
    }
  }

  /**
   * Get the current translation provider
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Translate text to target language
   */
  async translate(
    text: string,
    targetLanguage: LanguageCode,
    sourceLanguage?: LanguageCode
  ): Promise<TranslationResult> {
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        targetLanguage,
        provider: this.provider,
        error: 'No text provided',
      };
    }

    switch (this.provider) {
      case 'google':
        return this.translateWithGoogle(text, targetLanguage, sourceLanguage);
      case 'deepl':
        return this.translateWithDeepL(text, targetLanguage, sourceLanguage);
      default:
        return this.translateWithOpenAI(text, targetLanguage);
    }
  }

  /**
   * Translate using Google Cloud Translation API
   */
  private async translateWithGoogle(
    text: string,
    targetLanguage: LanguageCode,
    sourceLanguage?: LanguageCode
  ): Promise<TranslationResult> {
    try {
      const url = new URL('https://translation.googleapis.com/language/translate/v2');
      url.searchParams.set('key', this.googleApiKey);

      const body: Record<string, any> = {
        q: text,
        target: targetLanguage,
        format: 'text',
      };

      if (sourceLanguage) {
        body.source = sourceLanguage;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      const translation = data.data?.translations?.[0];

      if (!translation?.translatedText) {
        throw new Error('No translation returned');
      }

      return {
        success: true,
        translatedText: translation.translatedText,
        sourceLanguage: translation.detectedSourceLanguage || sourceLanguage,
        targetLanguage,
        provider: 'google',
      };
    } catch (error) {
      console.error('[Translation] Google API error:', error);
      // Fall back to OpenAI
      return this.translateWithOpenAI(text, targetLanguage);
    }
  }

  /**
   * Translate using DeepL API
   */
  private async translateWithDeepL(
    text: string,
    targetLanguage: LanguageCode,
    sourceLanguage?: LanguageCode
  ): Promise<TranslationResult> {
    try {
      // DeepL uses uppercase language codes
      const targetLang = targetLanguage.toUpperCase();
      const sourceLang = sourceLanguage?.toUpperCase();

      // DeepL API endpoint (free vs pro)
      const baseUrl = this.deeplApiKey.endsWith(':fx')
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

      const params = new URLSearchParams({
        auth_key: this.deeplApiKey,
        text,
        target_lang: targetLang === 'ZH' ? 'ZH' : targetLang,
      });

      if (sourceLang) {
        params.set('source_lang', sourceLang);
      }

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`DeepL API error: ${response.status}`);
      }

      const data = await response.json();
      const translation = data.translations?.[0];

      if (!translation?.text) {
        throw new Error('No translation returned');
      }

      return {
        success: true,
        translatedText: translation.text,
        sourceLanguage: translation.detected_source_language?.toLowerCase(),
        targetLanguage,
        provider: 'deepl',
      };
    } catch (error) {
      console.error('[Translation] DeepL API error:', error);
      // Fall back to OpenAI
      return this.translateWithOpenAI(text, targetLanguage);
    }
  }

  /**
   * Translate using OpenAI (fallback)
   */
  private async translateWithOpenAI(
    text: string,
    targetLanguage: LanguageCode
  ): Promise<TranslationResult> {
    try {
      // Dynamic import to avoid issues if OpenAI is not configured
      const { translateText } = await import('@/lib/actions/openai-actions');

      const languageName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;
      const result = await translateText(text, languageName);

      if (!result.success || !result.translatedText) {
        return {
          success: false,
          targetLanguage,
          provider: 'openai',
          error: result.error || 'Translation failed',
        };
      }

      return {
        success: true,
        translatedText: result.translatedText,
        sourceLanguage: 'en', // OpenAI assumes English source
        targetLanguage,
        provider: 'openai',
      };
    } catch (error) {
      console.error('[Translation] OpenAI error:', error);
      return {
        success: false,
        targetLanguage,
        provider: 'openai',
        error: 'Translation service unavailable',
      };
    }
  }

  /**
   * Detect the language of text
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided',
      };
    }

    if (this.provider === 'google' && this.googleApiKey) {
      return this.detectWithGoogle(text);
    }

    // Fallback: Simple heuristic detection
    return this.detectHeuristic(text);
  }

  private async detectWithGoogle(text: string): Promise<LanguageDetectionResult> {
    try {
      const url = new URL('https://translation.googleapis.com/language/translate/v2/detect');
      url.searchParams.set('key', this.googleApiKey);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: text }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      const detection = data.data?.detections?.[0]?.[0];

      return {
        success: true,
        detectedLanguage: detection?.language,
        confidence: detection?.confidence,
      };
    } catch (error) {
      console.error('[Translation] Language detection error:', error);
      return this.detectHeuristic(text);
    }
  }

  private detectHeuristic(text: string): LanguageDetectionResult {
    // Simple heuristic based on character ranges
    const sample = text.substring(0, 200);

    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(sample)) {
      return { success: true, detectedLanguage: 'zh', confidence: 0.8 };
    }

    // Japanese (Hiragana/Katakana)
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) {
      return { success: true, detectedLanguage: 'ja', confidence: 0.8 };
    }

    // Korean (Hangul)
    if (/[\uac00-\ud7af\u1100-\u11ff]/.test(sample)) {
      return { success: true, detectedLanguage: 'ko', confidence: 0.8 };
    }

    // Arabic
    if (/[\u0600-\u06ff]/.test(sample)) {
      return { success: true, detectedLanguage: 'ar', confidence: 0.8 };
    }

    // Cyrillic (Russian)
    if (/[\u0400-\u04ff]/.test(sample)) {
      return { success: true, detectedLanguage: 'ru', confidence: 0.8 };
    }

    // Default to English
    return { success: true, detectedLanguage: 'en', confidence: 0.5 };
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(
    texts: string[],
    targetLanguage: LanguageCode,
    sourceLanguage?: LanguageCode
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];

    for (const text of texts) {
      const result = await this.translate(text, targetLanguage, sourceLanguage);
      results.push(result);
    }

    return results;
  }
}

export const translationService = new TranslationService();
