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
      const { waTranslateText: translateText } = await import('@/lib/actions/waOpenaiActions');

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
    // Simple heuristic based on character ranges and common words
    const sample = text.substring(0, 500).toLowerCase();

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

    // Detect Latin-script languages by common words
    // Count matches for each language and pick the one with most matches

    // Helper to count word matches
    const countMatches = (pattern: RegExp): number => {
      const matches = sample.match(new RegExp(pattern.source, 'gi'));
      return matches ? matches.length : 0;
    };

    // French - common words and patterns (including "bonjour")
    const frenchPattern = /\b(le|la|les|un|une|des|du|de|et|est|sont|pour|dans|avec|sur|par|qui|que|ce|cette|ces|nous|vous|ils|elles|leur|notre|votre|bonjour|bonsoir|merci|aussi|très|plus|moins|bien|être|avoir|faire|aller|voir|tout|tous|comme|mais|donc|car|où|si|quand|comment|pourquoi|parce|jusqu|depuis|pendant|après|avant|entre|sous|chez|sans|problème|solution|client|produit)\b/i;
    const frenchCount = countMatches(frenchPattern);

    // Spanish - common words
    const spanishPattern = /\b(el|los|las|unos|unas|es|son|para|con|por|se|sus|del|al|como|pero|más|está|están|muy|todo|todos|cuando|donde|porque|sin|sobre|entre|hasta|desde|hacia|según|durante|mediante|hola|gracias|problema|solución|cliente|producto)\b/i;
    const spanishCount = countMatches(spanishPattern);

    // German - common words and patterns
    const germanPattern = /\b(der|die|das|den|dem|des|ein|eine|einer|eines|und|ist|sind|für|mit|auf|bei|von|zu|nach|über|unter|zwischen|vor|hinter|neben|durch|gegen|ohne|aus|bis|seit|während|wegen|trotz|ich|du|er|wir|ihr|haben|sein|werden|können|müssen|sollen|wollen|auch|sehr|schon|noch|dann|wenn|weil|dass|damit|obwohl|guten|danke|bitte|problem|lösung|kunde|produkt)\b/i;
    const germanCount = countMatches(germanPattern);

    // Portuguese - common words
    const portuguesePattern = /\b(os|as|uns|umas|são|para|em|seu|sua|seus|suas|do|da|dos|das|ao|aos|como|mas|mais|está|estão|muito|todo|todos|quando|onde|porque|sem|sobre|entre|até|desde|olá|obrigado|obrigada|também|já|ainda|então|problema|solução|cliente|produto)\b/i;
    const portugueseCount = countMatches(portuguesePattern);

    // Italian - common words
    const italianPattern = /\b(il|lo|gli|uno|sono|per|con|su|da|che|si|suo|sua|suoi|sue|del|dello|della|dei|degli|delle|allo|alla|agli|alle|come|ma|più|sta|stanno|molto|tutto|tutti|quando|dove|perché|senza|tra|fra|fino|dopo|prima|ciao|grazie|anche|già|ancora|problema|soluzione|cliente|prodotto)\b/i;
    const italianCount = countMatches(italianPattern);

    // Dutch - common words
    const dutchPattern = /\b(het|een|en|zijn|voor|met|op|van|te|aan|bij|door|naar|over|uit|tot|om|als|maar|meer|nog|dan|wel|ook|zo|hallo|dank|bedankt|alstublieft|probleem|oplossing|klant|product)\b/i;
    const dutchCount = countMatches(dutchPattern);

    // Find the language with most matches (minimum 1 match required)
    const languageCounts = [
      { lang: 'fr', count: frenchCount },
      { lang: 'es', count: spanishCount },
      { lang: 'de', count: germanCount },
      { lang: 'pt', count: portugueseCount },
      { lang: 'it', count: italianCount },
      { lang: 'nl', count: dutchCount },
    ];

    const bestMatch = languageCounts.reduce((a, b) => a.count > b.count ? a : b);

    if (bestMatch.count >= 1) {
      // Calculate confidence based on match count
      const confidence = Math.min(0.9, 0.5 + (bestMatch.count * 0.1));
      return { success: true, detectedLanguage: bestMatch.lang, confidence };
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
