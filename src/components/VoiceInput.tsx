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
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined') {
      const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(supported);
    }
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

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setValidationMessage(null);
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);

      // Parse and save immediately (no confirmation)
      await parseAndSave(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
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
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, logged_by: identity }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse');
      }

      const result = await response.json();

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
        setValidationMessage(`✓ Logged: "${text}"`);
      }

      // Success - notify parent to refresh
      onLogCreated();
    } catch (error) {
      console.error('Parse error:', error);
      setError('Failed to save. Try again.');
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
        className={`w-full h-24 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
          isListening
            ? 'bg-red-500 animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        style={{ minHeight: '48px' }}
      >
        <div className="text-center">
          <div className="text-6xl mb-2">🎤</div>
          <div className="text-white font-semibold text-lg">
            {isListening ? 'Tap to stop' : 'Tap to speak'}
          </div>
        </div>
      </button>

      {/* Validation Message */}
      {validationMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-semibold">{validationMessage}</p>
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
