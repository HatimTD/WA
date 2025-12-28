'use client';

import { Badge } from '@/components/ui/badge';
import { Globe, Languages, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Language names mapping
const LANGUAGE_NAMES: Record<string, string> = {
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
};

interface LanguageIndicatorProps {
  originalLanguage?: string;
  translationAvailable?: boolean;
  translatedText?: string | null;
  caseStudyId?: string;
  variant?: 'inline' | 'banner' | 'badge';
  showLink?: boolean;
  isViewingOriginal?: boolean; // Whether currently viewing original content
}

export default function LanguageIndicator({
  originalLanguage = 'en',
  translationAvailable = false,
  translatedText,
  caseStudyId,
  variant = 'inline',
  showLink = false,
  isViewingOriginal = false,
}: LanguageIndicatorProps) {
  // Don't show anything for English-only content without translation
  if (originalLanguage === 'en' && !translationAvailable) {
    return null;
  }

  const originalLangName = LANGUAGE_NAMES[originalLanguage] || originalLanguage;

  // Parse translation info
  let translatedToLanguage: string | null = null;
  if (translationAvailable && translatedText) {
    try {
      const parsed = JSON.parse(translatedText);
      translatedToLanguage = parsed.language;
    } catch {
      // Ignore parse errors
    }
  }

  const translatedLangName = translatedToLanguage
    ? LANGUAGE_NAMES[translatedToLanguage] || translatedToLanguage
    : null;

  // Badge variant - compact inline badge
  if (variant === 'badge') {
    return (
      <div className="flex items-center gap-2">
        {originalLanguage !== 'en' && (
          <Badge variant="outline" className="text-xs gap-1 dark:border-border">
            <Globe className="h-3 w-3" />
            {originalLangName}
          </Badge>
        )}
        {translationAvailable && translatedLangName && (
          <Badge className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <Languages className="h-3 w-3" />
            → {translatedLangName}
          </Badge>
        )}
        {showLink && caseStudyId && translationAvailable && (
          <Link
            href={isViewingOriginal
              ? `/dashboard/cases/${caseStudyId}`
              : `/dashboard/cases/${caseStudyId}?showOriginal=true`}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            {isViewingOriginal ? 'View translated' : 'View original'} <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    );
  }

  // Inline variant - simple text
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>
          Originally written in <strong className="text-gray-700 dark:text-foreground">{originalLangName}</strong>
        </span>
        {translationAvailable && translatedLangName && (
          <>
            <span className="mx-1">|</span>
            <Languages className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-600 dark:text-blue-400">
              Translated to {translatedLangName}
            </span>
          </>
        )}
        {showLink && caseStudyId && translationAvailable && (
          <Link
            href={isViewingOriginal
              ? `/dashboard/cases/${caseStudyId}`
              : `/dashboard/cases/${caseStudyId}?showOriginal=true`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            {isViewingOriginal ? 'View translated' : 'View original'} <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    );
  }

  // Banner variant - full width info banner
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
      <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          This case study was originally written in <strong>{originalLangName}</strong>
          {translationAvailable && translatedLangName && (
            <> and has been translated to <strong>{translatedLangName}</strong></>
          )}
        </p>
        {!translationAvailable && originalLanguage !== 'en' && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Content is shown in the original language. Translation can be requested.
          </p>
        )}
      </div>
      {showLink && caseStudyId && translationAvailable && (
        <Link
          href={isViewingOriginal
            ? `/dashboard/cases/${caseStudyId}`
            : `/dashboard/cases/${caseStudyId}?showOriginal=true`}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 flex-shrink-0"
        >
          {isViewingOriginal ? 'View translated' : 'View original'} <ExternalLink className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
