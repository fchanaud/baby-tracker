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
  const [pendingText, setPendingText] = useState<string | null>(null); // Store text waiting for user to process
  const [pendingLog, setPendingLog] = useState<any>(null); // Store partial log
  const [clarificationType, setClarificationType] = useState<'side' | 'nappy_type' | 'poo_consistency' | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clarificationTypeRef = useRef<'side' | 'nappy_type' | 'poo_consistency' | null>(null);
  const pendingLogRef = useRef<any>(null);

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

  // Sync refs with state for use in closures
  useEffect(() => {
    clarificationTypeRef.current = clarificationType;
    pendingLogRef.current = pendingLog;
  }, [clarificationType, pendingLog]);

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
      setPendingText(null);

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

      console.log('🎤 Voice recorded:', text);
      console.log('Current clarificationType:', clarificationTypeRef.current);
      console.log('Current pendingLog:', pendingLogRef.current ? 'exists' : 'null');

      // Clear timeout since we got a result
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Store transcript but don't process yet - wait for user to tap again
      setPendingText(text);

      // Different message based on whether we're in clarification mode
      // Use refs to get current values, not closure values
      if (clarificationTypeRef.current && pendingLogRef.current) {
        console.log('✅ In clarification mode - showing confirm message');
        setValidationMessage(`📝 Recorded: "${text}"\nTap again to confirm`);
      } else {
        console.log('✅ Normal mode - showing process message');
        setValidationMessage(`📝 Recorded: "${text}"\nTap again to process`);
      }
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

  const handleMicrophoneClick = async () => {
    console.log('🔘 Microphone clicked');
    console.log('State:', { isProcessing, isListening, hasPendingText: !!pendingText, clarificationType, hasPendingLog: !!pendingLog });

    // If currently processing, do nothing
    if (isProcessing) {
      console.log('⏸️ Already processing, ignoring click');
      return;
    }

    // If listening, stop recording
    if (isListening) {
      console.log('⏹️ Stopping recording');
      stopListening();
      return;
    }

    // If we're waiting for clarification response, the pending text should be processed as clarification
    if (clarificationType && pendingLog && pendingText) {
      console.log('✅ Processing clarification response:', pendingText);
      await handleClarificationResponse(pendingText);
      return;
    }

    // If we're waiting for clarification but no pending text yet, start listening for the answer
    if (clarificationType && pendingLog && !pendingText) {
      console.log('🎙️ Starting recording for clarification answer');
      startListening();
      return;
    }

    // If we have pending text from initial recording, process it
    if (pendingText && !clarificationType) {
      console.log('📤 Processing initial recording:', pendingText);
      await parseAndSave(pendingText);
      return;
    }

    // Otherwise, start a new recording
    console.log('🎙️ Starting new recording');
    startListening();
  };

  const handleClarificationResponse = async (responseText: string) => {
    if (!clarificationType || !pendingLog) return;

    const lower = responseText.toLowerCase();
    let updatedLog = { ...pendingLog };

    if (clarificationType === 'side') {
      let side: 'left' | 'right' | 'both' | null = null;
      if (lower.includes('left')) side = 'left';
      else if (lower.includes('right')) side = 'right';
      else if (lower.includes('both')) side = 'both';

      if (!side) {
        setError('❌ Please say "left", "right", or "both"');
        setPendingText(null);
        return;
      }
      updatedLog.side = side;
    } else if (clarificationType === 'nappy_type') {
      let nappy_type: 'wet' | 'poo' | 'both' | null = null;
      if (lower.includes('wet') && !lower.includes('poo') && !lower.includes('both')) {
        nappy_type = 'wet';
      } else if ((lower.includes('poo') || lower.includes('dirty')) && !lower.includes('wet') && !lower.includes('both')) {
        nappy_type = 'poo';
        // Ask for consistency
        setPendingLog(updatedLog);
        setClarificationType('poo_consistency');
        setValidationMessage('💩 What consistency? Liquid, normal, or soft?\nTap to answer');
        setError(null);
        setPendingText(null);
        return;
      } else if (lower.includes('both') || (lower.includes('wet') && lower.includes('poo'))) {
        nappy_type = 'both';
        // Ask for consistency
        setPendingLog(updatedLog);
        setClarificationType('poo_consistency');
        setValidationMessage('💩 What consistency? Liquid, normal, or soft?\nTap to answer');
        setError(null);
        setPendingText(null);
        return;
      }

      if (!nappy_type) {
        setError('❌ Please say "wet only", "poo only", or "both"');
        setPendingText(null);
        return;
      }
      updatedLog.nappy_type = nappy_type;
    } else if (clarificationType === 'poo_consistency') {
      let consistency: 'liquid' | 'normal' | 'soft' | null = null;
      if (lower.includes('liquid') || lower.includes('watery')) consistency = 'liquid';
      else if (lower.includes('normal') || lower.includes('regular')) consistency = 'normal';
      else if (lower.includes('soft')) consistency = 'soft';

      if (!consistency) {
        setError('❌ Please say "liquid", "normal", or "soft"');
        setPendingText(null);
        return;
      }
      updatedLog.poo_consistency = consistency;
    }

    // Reset clarification state
    setClarificationType(null);
    setPendingLog(null);
    setPendingText(null);

    // Save with complete info
    await saveLog(updatedLog);
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

      // Check for clarification needed
      if (result.needsClarification) {
        setPendingLog(result.partialLog);
        setClarificationType(result.needsClarification);
        setPendingText(null); // Clear pending text since we're in clarification mode

        if (result.needsClarification === 'side') {
          setValidationMessage('🤱 Which side? Say "left", "right", or "both"\nTap to answer');
        } else if (result.needsClarification === 'nappy_type') {
          setValidationMessage('💩 What type? Say "wet only", "poo only", or "both"\nTap to answer');
        }

        setError(null);
        setIsProcessing(false);
        return;
      }

      // Check for validation errors (400 status)
      if (!response.ok || result.validationError) {
        console.error('❌ VALIDATION ERROR:', result.validationError);
        console.error('Original text:', text);
        console.error('Parsed log:', result.log);

        // Special handling for vague time that needs clarification
        if (result.needsTimeClarity) {
          setError(`⏰ ${result.message}`);
          setValidationMessage(null);
          setIsProcessing(false);
          return;
        }

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

      // Success - clear pending text and notify parent to refresh
      setPendingText(null);
      onLogCreated();
      setIsProcessing(false);
    } catch (error) {
      console.error('Parse error:', error);
      setError('Failed to save. Try again.');
      setIsProcessing(false);
    }
  };

  const saveLog = async (log: any) => {
    if (!identity) return;

    try {
      setIsProcessing(true);
      setError(null);
      setValidationMessage('🔄 Saving...');

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...log,
          logged_by: identity,
          logged_at: log.logged_at || new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(`❌ ${result.error || 'Failed to save'}`);
        setValidationMessage(null);
        setIsProcessing(false);
        return;
      }

      console.log('✅ Successfully logged:', result.log);
      setValidationMessage(`✓ Logged successfully`);

      // Success - clear pending text and notify parent to refresh
      setPendingText(null);
      onLogCreated();
      setIsProcessing(false);
    } catch (error) {
      console.error('Save error:', error);
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
            {isProcessing
              ? 'Processing...'
              : isListening
              ? 'Tap to stop'
              : pendingText
              ? 'Tap to process'
              : clarificationType
              ? 'Tap to answer'
              : 'Tap to speak'}
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
