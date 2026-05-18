import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechOptions {
  rate?: number;
  onEnd?: () => void;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string, options: SpeechOptions = {}) => {
      if (!supported) return;

      stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 0.95;
      utterance.pitch = 1;
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        options.onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang.startsWith("en") && v.localService) ??
        voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
    },
    [supported, stop]
  );

  const pause = useCallback(() => {
    if (!isSpeaking || isPaused) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (!isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isPaused]);

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return { speak, stop, pause, resume, isSpeaking, isPaused, supported };
}

export function buildReadableScript(explanation: {
  toolName: string;
  description: string;
  safetyWarnings: string[];
  usageSteps: string[];
  beginnerTips: string;
  disclaimer: string;
}): string {
  const parts = [
    `Tool identified: ${explanation.toolName}.`,
    explanation.description,
    "Safety warnings.",
    ...explanation.safetyWarnings.map((w, i) => `${i + 1}. ${w}`),
    "How to use it.",
    ...explanation.usageSteps.map((s, i) => `Step ${i + 1}. ${s}`),
  ];

  if (explanation.beginnerTips) {
    parts.push(`Tip for beginners: ${explanation.beginnerTips}`);
  }
  parts.push(explanation.disclaimer);

  return parts.join(" ");
}
