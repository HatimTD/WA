'use client';

import { useState } from 'react';
import { Sparkles, Languages, RefreshCw, Loader2, ListTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { summarizeText, translateText, improveText } from '@/lib/actions/openai-actions';
import { waConvertBulletsToProse } from '@/lib/actions/waAutoPromptActions';

type Props = {
  text: string;
  onTextChange: (newText: string) => void;
  fieldType?: 'problem' | 'solution' | 'technical' | 'general';
};

export default function AITextAssistant({ text, onTextChange, fieldType = 'general' }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const contextMap = {
    problem: 'problem description',
    solution: 'solution description',
    technical: 'technical advantages',
    general: 'text',
  };

  const handleSummarize = async () => {
    if (!text || text.trim().length === 0) {
      toast.error('No text to summarize');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await summarizeText(text, 100);
      if (result.success && result.summary) {
        onTextChange(result.summary);
        toast.success('Text summarized successfully');
      } else {
        toast.error(result.error || 'Failed to summarize text');
      }
    } catch (error) {
      console.error('[AITextAssistant] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImprove = async () => {
    if (!text || text.trim().length === 0) {
      toast.error('No text to improve');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await improveText(text, contextMap[fieldType]);
      if (result.success && result.improvedText) {
        onTextChange(result.improvedText);
        toast.success('Text improved successfully');
      } else {
        toast.error(result.error || 'Failed to improve text');
      }
    } catch (error) {
      console.error('[AITextAssistant] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Map component fieldType to server action fieldType
  const bulletFieldTypeMap: Record<string, 'problem' | 'solution' | 'advantages' | 'general'> = {
    problem: 'problem',
    solution: 'solution',
    technical: 'advantages',
    general: 'general',
  };

  const handleBulletsToProse = async () => {
    if (!text || text.trim().length === 0) {
      toast.error('No text to convert');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await waConvertBulletsToProse(
        text,
        bulletFieldTypeMap[fieldType] || 'general'
      );
      if (result.success && result.prose) {
        onTextChange(result.prose);
        toast.success('Converted bullets to professional prose');
      } else {
        toast.error(result.error || 'Failed to convert bullets');
      }
    } catch (error) {
      console.error('[AITextAssistant] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async (language: string) => {
    if (!text || text.trim().length === 0) {
      toast.error('No text to translate');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await translateText(text, language);
      if (result.success && result.translatedText) {
        onTextChange(result.translatedText);
        toast.success(`Translated to ${language} successfully`);
      } else {
        toast.error(result.error || 'Failed to translate text');
      }
    } catch (error) {
      console.error('[AITextAssistant] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-purple-600" />
              AI Assist
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleBulletsToProse}>
          <ListTree className="h-4 w-4 mr-2 text-blue-600" />
          <div>
            <div className="font-medium">Bullets to Prose</div>
            <div className="text-xs text-muted-foreground">Convert notes to professional text</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleImprove}>
          <RefreshCw className="h-4 w-4 mr-2 text-wa-green-600" />
          <div>
            <div className="font-medium">Improve Text</div>
            <div className="text-xs text-muted-foreground">Enhance clarity and professionalism</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleSummarize}>
          <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
          <div>
            <div className="font-medium">Summarize</div>
            <div className="text-xs text-muted-foreground">Create concise summary</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Translate To
        </div>

        <DropdownMenuItem onClick={() => handleTranslate('English')}>
          <Languages className="h-4 w-4 mr-2 text-green-600" />
          English
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleTranslate('Spanish')}>
          <Languages className="h-4 w-4 mr-2 text-green-600" />
          Spanish
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleTranslate('French')}>
          <Languages className="h-4 w-4 mr-2 text-green-600" />
          French
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleTranslate('German')}>
          <Languages className="h-4 w-4 mr-2 text-green-600" />
          German
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleTranslate('Portuguese')}>
          <Languages className="h-4 w-4 mr-2 text-green-600" />
          Portuguese
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleTranslate('Italian')}>
          <Languages className="h-4 w-4 mr-2 text-green-600" />
          Italian
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleTranslate('Chinese')}>
          <Languages className="h-4 w-4 mr-2 text-green-600" />
          Chinese
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleTranslate('Japanese')}>
          <Languages className="h-4 w-4 mr-2 text-green-600" />
          Japanese
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
