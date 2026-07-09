export interface VocabularyWord {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  example_en: string;
  example_cn: string;
  category: string;
  difficulty: number;
}

export interface ReadingPassage {
  id: number;
  title: string;
  category: string;
  difficulty: number;
  content_en: string;
  content_cn: string;
  word_count: number;
  estimated_time: string;
  questions: ReadingQuestion[];
}

export interface ReadingQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

export interface ListeningPassage {
  id: number;
  title: string;
  category: string;
  difficulty: number;
  audio_url: string;
  duration: number;
  transcript: string;
  transcript_cn: string;
  sentences: ListeningSentence[];
  questions: ListeningQuestion[];
}

export interface ListeningSentence {
  start_time: number;
  end_time: number;
  text: string;
}

export interface ListeningQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

export interface WritingTopic {
  id: number;
  title: string;
  category: string;
  difficulty: number;
  requirement: string;
  sample_essay: string;
  key_points: string[];
  tips: string;
  useful_expressions: string[];
}

export interface ExamConfig {
  listeningCount: number;
  readingCount: number;
  writingCount: number;
  difficulty: number | null;
  timeLimit: number;
}
