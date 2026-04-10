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
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

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
    recog.interimResults = true;   // live word-by-word feedback
    recog.lang = "en-IN";          // better for Indian accents (Mumbai, Pune, AP, etc.)
    recog.maxAlternatives = 3;     // try up to 3 alternatives and pick best

    recog.onstart = () => {
      setStatus("listening");
      setErrorMessage(null);
      setInterimTranscript("");
    };

    recog.onresult = (event: any) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Pick the best alternative (highest confidence)
          let best = result[0].transcript;
          let bestConf = result[0].confidence ?? 0;
          for (let a = 1; a < result.length; a++) {
            if ((result[a].confidence ?? 0) > bestConf) {
              best = result[a].transcript;
              bestConf = result[a].confidence ?? 0;
            }
          }
          finalTranscript += best;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }

      if (finalTranscript) {
        setInterimTranscript("");
        setStatus("idle");
        onResultRef.current(finalTranscript.trim());
      }
    };

    recog.onerror = (event: any) => {
      setStatus("error");
      setInterimTranscript("");

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

      setTimeout(() => setStatus("idle"), 100);
    };

    recog.onend = () => {
      setInterimTranscript("");
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
    setInterimTranscript("");

    try {
      recog.start();
    } catch (e: any) {
      if (e.name === "InvalidStateError") {
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
    setInterimTranscript("");
    setStatus("idle");
  }, []);

  return {
    isListening: status === "listening",
    isSupported,
    errorMessage,
    interimTranscript,
    startListening,
    stopListening,
  };
}
