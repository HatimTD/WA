'use client';

/**
 * AI Auto-Prompt Component
 *
 * Implements BRD 3.4B - Auto-Prompting
 * "Automatically prompt users for missing details based on selected Tier"
 *
 * Displays contextual prompts to guide users in completing case study fields.
 *
 * @module components/ai-auto-prompt
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-13
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ChevronRight, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  generateAutoPrompts,
  type MissingField,
  type CaseStudyContext,
  type TargetTier,
} from '@/lib/actions/auto-prompt-actions';

type Props = {
  caseStudy: CaseStudyContext;
  targetTier: TargetTier;
  onFieldFocus: (fieldName: string) => void;
  maxPrompts?: number;
  className?: string;
};

export default function AIAutoPrompt({
  caseStudy,
  targetTier,
  onFieldFocus,
  maxPrompts = 3,
  className = '',
}: Props) {
  const [prompts, setPrompts] = useState<MissingField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateAutoPrompts(caseStudy, targetTier);
      // Filter out dismissed prompts and limit to maxPrompts
      const filteredPrompts = result
        .filter((p) => !dismissed.has(p.field))
        .slice(0, maxPrompts);
      setPrompts(filteredPrompts);
    } catch (err) {
      console.error('[AIAutoPrompt] Error fetching prompts:', err);
      setError('Unable to generate prompts');
    } finally {
      setLoading(false);
    }
  }, [caseStudy, targetTier, dismissed, maxPrompts]);

  // Fetch prompts when case study data changes
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleDismiss = (field: string) => {
    setDismissed((prev) => new Set([...prev, field]));
    setPrompts((prev) => prev.filter((p) => p.field !== field));
  };

  const handleFieldClick = (field: string) => {
    onFieldFocus(field);
    handleDismiss(field);
  };

  // Don't render if no prompts or loading initial data
  if (loading && prompts.length === 0) {
    return (
      <Card className={`border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 ${className}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing missing fields...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (prompts.length === 0 && !error) {
    return (
      <Card className={`border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800 ${className}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">
              All required fields for {targetTier} tier are complete!
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail - don't show error UI for auto-prompts
  }

  return (
    <Card className={`border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 ${className}`}>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-200">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Complete Your {targetTier} Case Study
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPrompts}
            disabled={loading}
            className="text-amber-700 hover:text-amber-900 dark:text-amber-300"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="space-y-2">
          {prompts.map((prompt) => (
            <div
              key={prompt.field}
              className="group rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
            >
              <Button
                variant="ghost"
                className="w-full justify-between text-left h-auto py-3 px-4 hover:bg-transparent"
                onClick={() => handleFieldClick(prompt.field)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {prompt.label}
                    </span>
                    <Badge
                      variant={prompt.priority === 'required' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {prompt.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {prompt.section}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 truncate">
                    {prompt.prompt}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ))}
        </div>

        {prompts.length > 0 && (
          <p className="text-xs text-muted-foreground dark:text-gray-500 mt-3 text-center">
            Click a field to jump to it. {prompts.length < maxPrompts ? '' : `Showing top ${maxPrompts} missing fields.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for sidebar/floating display
 */
export function AIAutoPromptCompact({
  caseStudy,
  targetTier,
  onFieldFocus,
}: Omit<Props, 'maxPrompts' | 'className'>) {
  const [nextField, setNextField] = useState<MissingField | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchNext() {
      setLoading(true);
      try {
        const prompts = await generateAutoPrompts(caseStudy, targetTier);
        setNextField(prompts[0] || null);
      } catch {
        setNextField(null);
      } finally {
        setLoading(false);
      }
    }
    fetchNext();
  }, [caseStudy, targetTier]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking...</span>
      </div>
    );
  }

  if (!nextField) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span>All fields complete</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-between border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
      onClick={() => onFieldFocus(nextField.field)}
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4" />
        <span className="truncate">Next: {nextField.label}</span>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0" />
    </Button>
  );
}
