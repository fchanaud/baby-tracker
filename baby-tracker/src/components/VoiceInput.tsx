'use client';

import { useState, useEffect, useRef } from 'react';
import { Identity } from '@/hooks/useIdentity';

interface VoiceInputProps {
  identity: Identity;
  onLogCreated: () => void;
}

export default function VoiceInput({ identity, onLogCreated }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined') {
      const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(supported);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!isSupported) {
      setError('Voice input not supported. Please use Chrome on mobile or desktop.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false; // Stop after one phrase

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setValidationMessage(null);

      // Safety timeout: auto-stop after 15 seconds
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          console.log('Auto-stopping after 15s timeout');
          recognitionRef.current.stop();
        }
      }, 15000);
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);

      // Clear timeout since we got a result
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Parse and save immediately (no confirmation)
      await parseAndSave(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);

      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;

      // Clear timeout when recognition ends
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Clear timeout when manually stopping
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const parseAndSave = async (text: string) => {
    if (!identity) return;

    try {
      // Show processing state
      setIsProcessing(true);
      setError(null);
      setValidationMessage(`🔄 Processing: "${text}"...`);

      console.log('📤 Sending to API:', text);

      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, logged_by: identity }),
      });

      const result = await response.json();

      console.log('📥 API Response:', result);

      // Check for validation errors (400 status)
      if (!response.ok || result.validationError) {
        console.error('❌ VALIDATION ERROR:', result.validationError);
        console.error('Original text:', text);
        console.error('Parsed log:', result.log);

        // Show error to user with specific message from API
        setError(`❌ ${result.validationError || 'Failed to save'}. ${result.message || ''}`);
        setValidationMessage(null);
        setIsProcessing(false);
        return;
      }

      // Check if fallback was used
      if (result.warning) {
        console.error('⚠️ REGEX FALLBACK USED:', result.parseError);
        console.error('Original text:', text);
        console.error('Parsed log:', result.log);

        // Show warning to user
        setValidationMessage(`⚠️ Saved with limited parsing: "${text}"\n(Claude API unavailable - check needs_review)`);
        setError('Warning: AI parsing unavailable. Basic fallback used.');
      } else {
        // Show validation message (stays until next recording)
        console.log('✅ Successfully logged:', result.log);
        setValidationMessage(`✓ Logged: "${text}"`);
      }

      // Success - notify parent to refresh
      onLogCreated();
      setIsProcessing(false);
    } catch (error) {
      console.error('Parse error:', error);
      setError('Failed to save. Try again.');
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <p className="text-red-800 font-semibold mb-2">Voice input not supported</p>
        <p className="text-red-600 text-sm">
          Please use Chrome on iOS, Android, or desktop
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Microphone Button */}
      <button
        onClick={handleMicrophoneClick}
        disabled={isProcessing}
        className={`w-full h-24 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
          isListening
            ? 'bg-red-500 animate-pulse'
            : isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        style={{ minHeight: '48px' }}
      >
        <div className="text-center">
          <div className="text-6xl mb-2">
            {isProcessing ? '⏳' : '🎤'}
          </div>
          <div className="text-white font-semibold text-lg">
            {isProcessing ? 'Processing...' : isListening ? 'Tap to stop' : 'Tap to speak'}
          </div>
        </div>
      </button>

      {/* Validation Message */}
      {validationMessage && (
        <div className={`border rounded-xl p-4 ${
          validationMessage.startsWith('🔄')
            ? 'bg-blue-50 border-blue-200'
            : validationMessage.startsWith('⚠️')
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <p className={`font-semibold whitespace-pre-line ${
            validationMessage.startsWith('🔄')
              ? 'text-blue-800'
              : validationMessage.startsWith('⚠️')
              ? 'text-yellow-800'
              : 'text-green-800'
          }`}>{validationMessage}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
