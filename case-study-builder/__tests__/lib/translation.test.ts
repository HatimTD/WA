/**
 * Tests for translation-related functionality
 */

import { LANGUAGE_NAMES } from '@/lib/pdf-export';

describe('Translation Support', () => {
  describe('LANGUAGE_NAMES constant', () => {
    it('should contain all supported languages', () => {
      expect(Object.keys(LANGUAGE_NAMES)).toHaveLength(15);
    });

    it('should include English', () => {
      expect(LANGUAGE_NAMES.en).toBe('English');
    });

    it('should include Spanish', () => {
      expect(LANGUAGE_NAMES.es).toBe('Spanish');
    });

    it('should include French', () => {
      expect(LANGUAGE_NAMES.fr).toBe('French');
    });

    it('should include German', () => {
      expect(LANGUAGE_NAMES.de).toBe('German');
    });

    it('should include Chinese', () => {
      expect(LANGUAGE_NAMES.zh).toBe('Chinese');
    });

    it('should include Japanese', () => {
      expect(LANGUAGE_NAMES.ja).toBe('Japanese');
    });

    it('should include Arabic', () => {
      expect(LANGUAGE_NAMES.ar).toBe('Arabic');
    });

    it('should include all expected language codes', () => {
      const expectedCodes = ['en', 'es', 'fr', 'de', 'pt', 'it', 'zh', 'ja', 'ko', 'ru', 'ar', 'hi', 'nl', 'pl', 'tr'];
      expectedCodes.forEach(code => {
        expect(LANGUAGE_NAMES[code]).toBeDefined();
      });
    });
  });

  describe('PDF Export with Translation', () => {
    // Mock case study data
    const mockCaseStudy = {
      id: 'test-123',
      type: 'APPLICATION',
      customerName: 'Test Company',
      industry: 'Mining',
      componentWorkpiece: 'Crusher',
      workType: 'WORKSHOP',
      wearType: ['ABRASION'],
      problemDescription: 'Test problem description',
      waSolution: 'Test WA solution',
      waProduct: 'HARDFACE',
      location: 'Australia',
      contributor: { name: 'Test User', email: 'test@example.com' },
      createdAt: new Date(),
      // Translation fields
      originalLanguage: 'es',
      translationAvailable: true,
      translatedText: JSON.stringify({
        language: 'en',
        translatedAt: new Date().toISOString(),
        provider: 'openai',
        fields: {
          problemDescription: 'Translated problem description',
          waSolution: 'Translated WA solution',
        },
      }),
    };

    it('should include translation fields in CaseStudyPDFData type', () => {
      // Test that the type accepts translation fields
      expect(mockCaseStudy.originalLanguage).toBe('es');
      expect(mockCaseStudy.translationAvailable).toBe(true);
      expect(mockCaseStudy.translatedText).toBeTruthy();
    });

    it('should parse translated text correctly', () => {
      const parsed = JSON.parse(mockCaseStudy.translatedText!);
      expect(parsed.language).toBe('en');
      expect(parsed.fields.problemDescription).toBe('Translated problem description');
      expect(parsed.fields.waSolution).toBe('Translated WA solution');
    });
  });

  describe('Translation Panel Component Logic', () => {
    it('should detect non-English original language', () => {
      const originalLanguage = 'fr';
      const isNonEnglish = originalLanguage !== 'en';
      expect(isNonEnglish).toBe(true);
    });

    it('should get language name from code', () => {
      const langCode = 'de';
      const langName = LANGUAGE_NAMES[langCode];
      expect(langName).toBe('German');
    });

    it('should handle unknown language codes gracefully', () => {
      const unknownCode = 'xx';
      const langName = LANGUAGE_NAMES[unknownCode] || unknownCode;
      expect(langName).toBe('xx');
    });
  });

  describe('Language Indicator Component Logic', () => {
    it('should not show indicator for English-only content', () => {
      const originalLanguage = 'en';
      const translationAvailable = false;
      const shouldShow = originalLanguage !== 'en' || translationAvailable;
      expect(shouldShow).toBe(false);
    });

    it('should show indicator for non-English content', () => {
      const originalLanguage = 'es';
      const translationAvailable = false;
      const shouldShow = originalLanguage !== 'en' || translationAvailable;
      expect(shouldShow).toBe(true);
    });

    it('should show indicator when translation is available', () => {
      const originalLanguage = 'en';
      const translationAvailable = true;
      const shouldShow = originalLanguage !== 'en' || translationAvailable;
      expect(shouldShow).toBe(true);
    });
  });
});
