'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Languages, Globe, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  waTranslateCaseStudy,
  waGetSupportedLanguages,
  waDetectCaseStudyLanguage,
} from '@/lib/actions/waTranslationActions';

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

interface TranslationPanelProps {
  caseStudyId: string;
  originalLanguage?: string;
  translationAvailable?: boolean;
  translatedText?: string | null;
  onTranslationComplete?: () => void;
}

export default function TranslationPanel({
  caseStudyId,
  originalLanguage = 'en',
  translationAvailable = false,
  translatedText,
  onTranslationComplete,
}: TranslationPanelProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState(originalLanguage);
  const [currentTranslation, setCurrentTranslation] = useState<{
    language?: string;
    translatedAt?: string;
  } | null>(null);

  // Parse existing translation if available
  useState(() => {
    if (translatedText) {
      try {
        const parsed = JSON.parse(translatedText);
        setCurrentTranslation({
          language: parsed.language,
          translatedAt: parsed.translatedAt,
        });
      } catch {
        // Ignore parse errors
      }
    }
  });

  const handleDetectLanguage = async () => {
    setIsDetecting(true);
    try {
      const result = await waDetectCaseStudyLanguage(caseStudyId);
      if (result.success && result.detectedLanguage) {
        setDetectedLanguage(result.detectedLanguage);
        toast.success(`Detected language: ${LANGUAGE_NAMES[result.detectedLanguage] || result.detectedLanguage}`);
      } else {
        toast.error(result.error || 'Failed to detect language');
      }
    } catch (error) {
      console.error('[TranslationPanel] Detection error:', error);
      toast.error('Failed to detect language');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error('Please select a target language');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await waTranslateCaseStudy(caseStudyId, targetLanguage as any);
      if (result.success) {
        toast.success(`Successfully translated to ${result.targetLanguage}`);
        setCurrentTranslation({
          language: targetLanguage,
          translatedAt: new Date().toISOString(),
        });
        onTranslationComplete?.();
      } else {
        toast.error(result.error || 'Failed to translate');
      }
    } catch (error) {
      console.error('[TranslationPanel] Translation error:', error);
      toast.error('Failed to translate case study');
    } finally {
      setIsTranslating(false);
    }
  };

  const originalLangName = LANGUAGE_NAMES[detectedLanguage] || detectedLanguage;
  const translatedLangName = currentTranslation?.language
    ? LANGUAGE_NAMES[currentTranslation.language] || currentTranslation.language
    : null;

  return (
    <Card className="dark:bg-card dark:border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base dark:text-foreground">
          <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Translation
        </CardTitle>
        <CardDescription className="dark:text-muted-foreground">
          Translate case study content to other languages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            <span className="text-sm text-gray-600 dark:text-muted-foreground">Original Language:</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="dark:border-border">
              {originalLangName}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDetectLanguage}
              disabled={isDetecting}
              className="h-7 px-2"
            >
              {isDetecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="text-xs">Detect</span>
              )}
            </Button>
          </div>
        </div>

        {/* Current Translation Status */}
        {translationAvailable && translatedLangName && (
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Translated to {translatedLangName}
            </span>
            {currentTranslation?.translatedAt && (
              <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                {new Date(currentTranslation.translatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Non-English Warning */}
        {detectedLanguage !== 'en' && !translationAvailable && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This case study was originally written in {originalLangName}.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Translate to English to make it accessible to all users.
              </p>
            </div>
          </div>
        )}

        {/* Translation Controls */}
        <div className="flex items-center gap-2">
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="flex-1 dark:bg-input dark:border-border dark:text-foreground">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="dark:bg-popover dark:border-border">
              {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                <SelectItem key={code} value={code} disabled={code === detectedLanguage}>
                  {name}
                  {code === detectedLanguage && ' (Original)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || targetLanguage === detectedLanguage}
            className="gap-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Translate
              </>
            )}
          </Button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          Translation uses AI to convert case study text fields. Original content is preserved.
        </p>
      </CardContent>
    </Card>
  );
}
