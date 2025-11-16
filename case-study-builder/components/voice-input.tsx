'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = {
  onTranscript: (text: string) => void;
  currentValue?: string;
  language?: string;
};

export default function VoiceInput({ onTranscript, currentValue = '', language = 'en-US' }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef('');
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const currentValueRef = useRef(currentValue);

  // Keep refs in sync with props
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    currentValueRef.current = currentValue;
  }, [onTranscript, currentValue]);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      // Check if we're in a secure context (HTTPS or localhost)
      const isSecure = window.isSecureContext ||
                       window.location.protocol === 'https:' ||
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

      if (!isSecure) {
        console.warn('[VoiceInput] Not in secure context. Speech API may not work properly.');
        console.warn('[VoiceInput] Current URL:', window.location.href);
        console.warn('[VoiceInput] Use localhost or HTTPS for voice input to work.');
        setIsSecureContext(false);
      }

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('[VoiceInput] Speech recognition started');
        setIsListening(true);
        // Don't set interimTranscriptRef here - it will be set in toggleListening
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          // Append final transcript to existing content
          const newText = interimTranscriptRef.current
            ? `${interimTranscriptRef.current} ${finalTranscript.trim()}`
            : finalTranscript.trim();

          interimTranscriptRef.current = newText;
          onTranscriptRef.current(newText); // Use ref instead of prop
          console.log('[VoiceInput] Final transcript:', finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[VoiceInput] Speech recognition error:', event.error);
        console.error('[VoiceInput] Error details:', event);

        if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.');
          setIsListening(false);
        } else if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable microphone permissions in your browser.');
          setIsListening(false);
        } else if (event.error === 'network') {
          console.error('[VoiceInput] Network error - Google Speech API is blocked');
          console.error('[VoiceInput] Possible causes:');
          console.error('1. Windows Firewall is blocking Chrome/Edge network access');
          console.error('2. Antivirus software blocking Google servers');
          console.error('3. VPN interfering with Speech API');
          console.error('4. Browser extensions (ad blockers, privacy tools) blocking the API');
          console.error('5. Brave Browser Shields blocking Google services');
          console.error('[VoiceInput] Current location:', {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            href: window.location.href,
            isSecureContext: window.isSecureContext
          });

          // Show detailed error with fixes
          toast.error(
            'Google Speech API is blocked by firewall/VPN/antivirus. Visit Diagnostics page for fix instructions.',
            { duration: 10000 }
          );

          setIsListening(false);
        } else if (event.error === 'aborted') {
          // Aborted errors are usually fine, just user stopping
          console.log('[VoiceInput] Recognition aborted');
          setIsListening(false);
        } else if (event.error === 'audio-capture') {
          toast.error('Microphone error. Check that your microphone is connected and working.');
          setIsListening(false);
        } else if (event.error === 'service-not-allowed') {
          toast.error('Speech service not allowed. Please use localhost or HTTPS.');
          setIsListening(false);
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        console.log('[VoiceInput] Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
    };
  }, [language]); // Only reinitialize when language changes, not on every currentValue update

  const toggleListening = async () => {
    if (!recognitionRef.current) return;

    // Warn if not in secure context
    if (!isSecureContext) {
      toast.error(
        'Voice input requires localhost or HTTPS. Please use http://localhost:3010',
        { duration: 6000 }
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      toast.success('Voice input stopped');
    } else {
      try {
        // Request microphone permission first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately - we only needed it to trigger permission request
            stream.getTracks().forEach(track => track.stop());
            console.log('[VoiceInput] Microphone permission granted');
          } catch (permError: any) {
            console.error('[VoiceInput] Microphone permission denied:', permError);
            toast.error('Please allow microphone access to use voice input', { duration: 5000 });
            return;
          }
        }

        interimTranscriptRef.current = currentValueRef.current; // Use ref instead of prop
        recognitionRef.current.start();
        toast.success('Voice input started - speak now');
      } catch (error) {
        console.error('[VoiceInput] Error starting recognition:', error);
        toast.error('Failed to start voice input. Try refreshing the page.');
      }
    }
  };

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled
              className="gap-2"
            >
              <MicOff className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice input not supported in this browser</p>
            <p className="text-xs text-gray-500">Try Chrome or Edge</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={isListening ? "destructive" : !isSecureContext ? "outline" : "outline"}
            onClick={toggleListening}
            className={`gap-2 ${isListening ? 'animate-pulse' : ''} ${!isSecureContext ? 'border-orange-400 text-orange-600' : ''}`}
          >
            {!isSecureContext ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                Voice Input
              </>
            ) : isListening ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Voice Input
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!isSecureContext ? (
            <>
              <p className="font-semibold text-orange-600">⚠️ Requires localhost or HTTPS</p>
              <p className="text-xs text-gray-500 mt-1">Access app at: http://localhost:3010</p>
              <p className="text-xs text-gray-500">Current URL not supported for voice input</p>
            </>
          ) : (
            <>
              <p>{isListening ? 'Click to stop recording' : 'Click to start voice input'}</p>
              <p className="text-xs text-gray-500">Spoken text will be added to the field</p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
