import { useState, useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceOptions {
  onResult: (transcript: string) => void;
}

export function useVoice({ onResult }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // Store recognition in a ref so it never triggers re-renders
  const recognitionRef = useRef<any>(null);
  // Store onResult in a ref so we can update it without restarting recognition
  const onResultRef = useRef(onResult);

  // Always keep onResultRef up-to-date with latest callback without re-running effect
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Only create the recognition object once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "en-US";

    recog.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResultRef.current(transcript);
      setIsListening(false);
    };

    recog.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setIsSupported(false);
      }
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch (_) {}
    };
  }, []); // empty deps — runs only once

  const startListening = useCallback(() => {
    const recog = recognitionRef.current;
    if (!recog) return;
    try {
      setIsListening(true);
      recog.start();
    } catch (_) {
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    const recog = recognitionRef.current;
    if (!recog) return;
    try {
      recog.stop();
    } catch (_) {}
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
