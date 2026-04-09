import { useState, useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceOptions {
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
}

export type VoiceStatus = "idle" | "listening" | "error";

export function useVoice({ onResult, onError }: UseVoiceOptions) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs in sync without re-creating the recognition object
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Create recognition ONCE on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage("Your browser does not support voice recognition. Try Chrome or Edge.");
      return;
    }

    let recog: any;
    try {
      recog = new SpeechRecognition();
    } catch {
      setIsSupported(false);
      setErrorMessage("Could not initialize voice recognition.");
      return;
    }

    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "en-US";
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      setStatus("listening");
      setErrorMessage(null);
    };

    recog.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setStatus("idle");
      onResultRef.current(transcript);
    };

    recog.onerror = (event: any) => {
      setStatus("error");

      const errorMap: Record<string, string> = {
        "not-allowed":         "Microphone access denied. Click the mic icon in your browser's address bar to allow access.",
        "service-not-allowed": "Microphone access denied. Allow microphone access in your browser settings.",
        "no-speech":           "No speech detected. Try speaking louder or closer to the mic.",
        "network":             "Network error. Voice recognition needs an internet connection.",
        "audio-capture":       "No microphone found. Please connect a microphone and try again.",
        "aborted":             "Voice recognition was cancelled.",
      };

      const msg = errorMap[event.error] ?? `Voice error: ${event.error}`;
      setErrorMessage(msg);
      onErrorRef.current?.(msg);

      // Reset to idle after a moment so the user can retry
      setTimeout(() => setStatus("idle"), 100);
    };

    recog.onend = () => {
      setStatus(prev => prev === "listening" ? "idle" : prev);
    };

    recognitionRef.current = recog;

    return () => {
      try { recog.abort(); } catch (_) {}
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    const recog = recognitionRef.current;
    if (!recog) return;

    setErrorMessage(null);

    try {
      recog.start();
    } catch (e: any) {
      if (e.name === "InvalidStateError") {
        // Already running — abort and restart
        try { recog.abort(); } catch (_) {}
        setTimeout(() => {
          try {
            recog.start();
          } catch (_) {
            setStatus("idle");
          }
        }, 150);
      } else {
        const msg = "Could not start the microphone. Check that you've allowed mic access.";
        setErrorMessage(msg);
        onErrorRef.current?.(msg);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 100);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    const recog = recognitionRef.current;
    if (!recog) return;
    try { recog.stop(); } catch (_) {}
    setStatus("idle");
  }, []);

  return {
    isListening: status === "listening",
    isSupported,
    errorMessage,
    startListening,
    stopListening,
  };
}
