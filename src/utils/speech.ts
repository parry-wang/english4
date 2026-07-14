let voicesLoaded = false;
let englishVoice: SpeechSynthesisVoice | null = null;
let initPromise: Promise<void> | null = null;

function initSpeech(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    const tryLoadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded = true;
        englishVoice = voices.find(v =>
          v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.default)
        ) || voices.find(v => v.lang.startsWith('en')) || null;
        resolve();
        return true;
      }
      return false;
    };

    if (tryLoadVoices()) return;

    window.speechSynthesis.onvoiceschanged = () => {
      tryLoadVoices();
    };

    setTimeout(() => {
      tryLoadVoices();
      resolve();
    }, 1000);
  });

  return initPromise;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

export function speak(text: string, options: SpeakOptions = {}): SpeechSynthesisUtterance | null {
  if (!isSpeechSupported()) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = options.rate ?? 1;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;

  const speakWithRetry = (retryCount: number = 0) => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (retryCount < 3) {
        setTimeout(() => speakWithRetry(retryCount + 1), 100 * (retryCount + 1));
      }
    }
  };

  if (voicesLoaded) {
    speakWithRetry();
  } else {
    initSpeech().then(() => {
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      speakWithRetry();
    });
  }

  return utterance;
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function pauseSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.resume();
  }
}

export function isSpeaking(): boolean {
  return isSpeechSupported() && window.speechSynthesis.speaking;
}

export { initSpeech };
