import { create } from 'zustand';

interface WordProgress {
  wordId: number;
  status: 'new' | 'learning' | 'mastered';
  mistakeCount: number;
  lastReviewed: string;
  nextReview: string;
}

interface ReadingProgress {
  passageId: number;
  completed: boolean;
  score: number;
  answers: Record<number, string>;
}

interface ListeningProgress {
  passageId: number;
  completed: boolean;
  score: number;
  answers: Record<number, string>;
}

interface ExamRecord {
  id: string;
  createdAt: string;
  totalScore: number;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
  timeSpent: number;
  answers: Record<string, string>;
}

interface AppState {
  // User
  startDate: string;
  setStartDate: (date: string) => void;

  // Vocabulary
  wordProgress: Record<number, WordProgress>;
  currentDay: number;
  setCurrentDay: (day: number) => void;
  updateWordProgress: (wordId: number, progress: Partial<WordProgress>) => void;

  // Reading
  readingProgress: Record<number, ReadingProgress>;
  updateReadingProgress: (passageId: number, progress: Partial<ReadingProgress>) => void;

  // Listening
  listeningProgress: Record<number, ListeningProgress>;
  updateListeningProgress: (passageId: number, progress: Partial<ListeningProgress>) => void;

  // Writing
  completedWritings: number[];
  addCompletedWriting: (id: number) => void;

  // Exam
  examRecords: ExamRecord[];
  addExamRecord: (record: ExamRecord) => void;

  // Favorites
  favoriteWords: number[];
  favoriteReadings: number[];
  favoriteListenings: number[];
  toggleFavoriteWord: (id: number) => void;
  toggleFavoriteReading: (id: number) => void;
  toggleFavoriteListening: (id: number) => void;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  startDate: loadFromStorage('cet4_startDate', new Date().toISOString().split('T')[0]),
  setStartDate: (date) => {
    saveToStorage('cet4_startDate', date);
    set({ startDate: date });
  },

  wordProgress: loadFromStorage('cet4_wordProgress', {}),
  currentDay: loadFromStorage('cet4_currentDay', 1),
  setCurrentDay: (day) => {
    saveToStorage('cet4_currentDay', day);
    set({ currentDay: day });
  },
  updateWordProgress: (wordId, progress) => {
    const current = get().wordProgress;
    const updated = {
      ...current,
      [wordId]: { ...current[wordId], wordId, ...progress } as WordProgress,
    };
    saveToStorage('cet4_wordProgress', updated);
    set({ wordProgress: updated });
  },

  readingProgress: loadFromStorage('cet4_readingProgress', {}),
  updateReadingProgress: (passageId, progress) => {
    const current = get().readingProgress;
    const updated = {
      ...current,
      [passageId]: { ...current[passageId], passageId, ...progress } as ReadingProgress,
    };
    saveToStorage('cet4_readingProgress', updated);
    set({ readingProgress: updated });
  },

  listeningProgress: loadFromStorage('cet4_listeningProgress', {}),
  updateListeningProgress: (passageId, progress) => {
    const current = get().listeningProgress;
    const updated = {
      ...current,
      [passageId]: { ...current[passageId], passageId, ...progress } as ListeningProgress,
    };
    saveToStorage('cet4_listeningProgress', updated);
    set({ listeningProgress: updated });
  },

  completedWritings: loadFromStorage('cet4_completedWritings', []),
  addCompletedWriting: (id) => {
    const current = get().completedWritings;
    if (!current.includes(id)) {
      const updated = [...current, id];
      saveToStorage('cet4_completedWritings', updated);
      set({ completedWritings: updated });
    }
  },

  examRecords: loadFromStorage('cet4_examRecords', []),
  addExamRecord: (record) => {
    const updated = [...get().examRecords, record];
    saveToStorage('cet4_examRecords', updated);
    set({ examRecords: updated });
  },

  favoriteWords: loadFromStorage('cet4_favoriteWords', []),
  favoriteReadings: loadFromStorage('cet4_favoriteReadings', []),
  favoriteListenings: loadFromStorage('cet4_favoriteListenings', []),
  toggleFavoriteWord: (id) => {
    const current = get().favoriteWords;
    const updated = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
    saveToStorage('cet4_favoriteWords', updated);
    set({ favoriteWords: updated });
  },
  toggleFavoriteReading: (id) => {
    const current = get().favoriteReadings;
    const updated = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
    saveToStorage('cet4_favoriteReadings', updated);
    set({ favoriteReadings: updated });
  },
  toggleFavoriteListening: (id) => {
    const current = get().favoriteListenings;
    const updated = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
    saveToStorage('cet4_favoriteListenings', updated);
    set({ favoriteListenings: updated });
  },
}));
