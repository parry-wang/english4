let voicesLoaded = false;
let englishVoice: SpeechSynthesisVoice | null = null;
let initPromise: Promise<void> | null = null;
let isMobile = false;
let isIOS = false;

function detectDevice() {
  if (typeof navigator === 'undefined') return;
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
}

detectDevice();

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
        if (isIOS) {
          englishVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || null;
        } else {
          englishVoice = voices.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.default)
          ) || voices.find(v => v.lang.startsWith('en')) || null;
        }
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
    }, 1500);
  });

  return initPromise;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

export function isMobileDevice(): boolean {
  return isMobile;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  immediate?: boolean;
}

export function speak(text: string, options: SpeakOptions = {}): SpeechSynthesisUtterance | null {
  if (!isSpeechSupported()) return null;

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

  const doSpeak = () => {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (options.onError) options.onError();
    }
  };

  if (voicesLoaded && englishVoice) {
    doSpeak();
  } else if (options.immediate) {
    doSpeak();
  } else {
    initSpeech().then(() => {
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      doSpeak();
    });
  }

  return utterance;
}

export function speakImmediate(text: string, options: SpeakOptions = {}): SpeechSynthesisUtterance | null {
  return speak(text, { ...options, immediate: true });
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

export function prewarmSpeech(): void {
  if (!isSpeechSupported()) return;
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // ignore
  }
}

export { initSpeech };
