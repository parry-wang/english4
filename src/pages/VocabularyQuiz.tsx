import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, ArrowRight, Shuffle, Settings, Volume2, Volume } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import vocabularyData from '@/data/vocabulary.json';
import type { VocabularyWord } from '@/types';
import { speak, speakImmediate, stopSpeaking, isSpeechSupported, initSpeech, prewarmSpeech } from '@/utils/speech';

const words = vocabularyData as VocabularyWord[];

interface QuizQuestion {
  wordId: number;
  type: 'en2cn' | 'cn2en';
  question: string;
  options: string[];
  correctIndex: number;
  correctWord: VocabularyWord;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuiz(allWords: VocabularyWord[], count: number): QuizQuestion[] {
  const selected = shuffle(allWords).slice(0, count);
  return selected.map(word => {
    const type = Math.random() > 0.5 ? 'en2cn' : 'cn2en';
    const question = type === 'en2cn' ? word.word : word.meaning;
    const correctAnswer = type === 'en2cn' ? word.meaning : word.word;

    const pool = allWords.filter(w => w.id !== word.id);
    const distractors = shuffle(pool).slice(0, 3);
    const wrongAnswers = distractors.map(d => type === 'en2cn' ? d.meaning : d.word);

    const options = shuffle([correctAnswer, ...wrongAnswers]);
    const correctIndex = options.indexOf(correctAnswer);

    return { wordId: word.id, type, question, options, correctIndex, correctWord: word };
  });
}

const QUIZ_SIZE_OPTIONS = [20, 30, 50, 100];

export default function VocabularyQuiz() {
  const { wordProgress, updateWordProgress } = useAppStore();
  const [startSize, setStartSize] = useState(20);
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [wrongWords, setWrongWords] = useState<VocabularyWord[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isSpeechSupported()) {
      initSpeech().then(() => setSpeechReady(true));
    }
  }, []);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handleSpeak = useCallback((word: string) => {
    if (!speechReady) return;
    prewarmSpeech();
    setIsSpeaking(true);
    speakImmediate(word, {
      rate: 0.9,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [speechReady]);

  const learnedWords = useMemo(() => {
    const learnedIds = new Set<number>();
    Object.values(wordProgress).forEach(w => {
      if (w.status === 'learning' || w.status === 'mastered') {
        learnedIds.add(w.wordId);
      }
    });
    return words.filter(w => learnedIds.has(w.id));
  }, [wordProgress]);

  const maxAvailableSize = useMemo(() => {
    return Math.min(100, learnedWords.length);
  }, [learnedWords]);

  const effectiveSize = useMemo(() => {
    return Math.min(startSize, maxAvailableSize);
  }, [startSize, maxAvailableSize]);

  const handleStart = useCallback(() => {
    if (learnedWords.length === 0) return;
    setQuestions(generateQuiz(learnedWords, effectiveSize));
    setStarted(true);
    setCurrentQ(0);
    setSelectedIndex(null);
    setAnswered(false);
    setWrongWords([]);
    setCorrectCount(0);
    setFinished(false);
  }, [learnedWords, effectiveSize]);

  const handleRestart = useCallback(() => {
    setStarted(false);
    setFinished(false);
  }, []);

  const question = questions[currentQ];

  const handleSelect = useCallback((idx: number) => {
    if (answered || !question) return;
    setSelectedIndex(idx);
    setAnswered(true);

    const isCorrect = idx === question.correctIndex;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongWords(prev => [...prev, question.correctWord]);
      const existing = useAppStore.getState().wordProgress[question.wordId];
      updateWordProgress(question.wordId, {
        status: 'learning',
        mistakeCount: (existing?.mistakeCount ?? 0) + 1,
        lastReviewed: new Date().toISOString(),
      });
    }
  }, [answered, question, updateWordProgress]);

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedIndex(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  }, [currentQ, questions.length]);

  if (!started) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/vocabulary" className="text-gray-400 hover:text-primary-500 transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg font-semibold text-primary-500 flex items-center gap-2">
            <Shuffle size={16} className="text-accent-400" />
            单词测试
          </h1>
          <div className="w-6" />
        </div>

        {/* Config card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings size={28} className="text-accent-400" />
            </div>
            <h2 className="text-xl font-bold text-primary-500 mb-1">单词测试</h2>
            <p className="text-sm text-gray-500 mb-3">
              已学习 <span className="font-semibold text-accent-400">{learnedWords.length}</span> / {words.length} 词
            </p>
            {learnedWords.length < 10 && (
              <p className="text-xs text-danger-400 bg-danger-50 rounded-lg px-3 py-2 inline-block">
                建议先学习至少 10 个单词再来测试哦
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">选择题目数量</p>
            <div className="grid grid-cols-4 gap-2">
              {QUIZ_SIZE_OPTIONS.map(size => {
                const disabled = size > learnedWords.length;
                return (
                  <button
                    key={size}
                    onClick={() => !disabled && setStartSize(size)}
                    disabled={disabled}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      disabled
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : startSize === size
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {size}题
                  </button>
                );
              })}
            </div>
            {effectiveSize < startSize && learnedWords.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                已学习单词不足 {startSize} 个，将抽取 {effectiveSize} 题
              </p>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={learnedWords.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${
              learnedWords.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-accent-400 text-white hover:bg-accent-500'
            }`}
          >
            <Shuffle size={18} />
            {learnedWords.length === 0 ? '先去学习单词吧' : `开始测试（${effectiveSize}题）`}
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            score >= 80 ? 'bg-success-50' : score >= 60 ? 'bg-accent-50' : 'bg-danger-50'
          }`}>
            <span className={`text-3xl font-bold ${
              score >= 80 ? 'text-success-500' : score >= 60 ? 'text-accent-400' : 'text-danger-400'
            }`}>
              {score}
            </span>
          </div>
          <h2 className="text-xl font-bold text-primary-500 mb-2">测试完成</h2>
          <p className="text-gray-500 mb-6">
            答对 {correctCount}/{questions.length} 题
          </p>

          {wrongWords.length > 0 && (
            <div className="text-left mb-6">
              <h3 className="font-semibold text-primary-500 mb-3">错题回顾</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {wrongWords.map(w => (
                  <div key={w.id} className="flex items-start gap-3 p-3 bg-danger-50 rounded-xl">
                    <XCircle size={16} className="text-danger-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-primary-500">{w.word}</p>
                      <p className="text-sm text-gray-500">{w.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleRestart}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Shuffle size={16} />
              再测一次
            </button>
            <Link
              to="/vocabulary/mistakes"
              className="px-5 py-2.5 rounded-xl bg-accent-400 text-white hover:bg-accent-500 transition-colors"
            >
              查看错题本
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleRestart}
          className="text-gray-400 hover:text-primary-500 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-primary-500">单词测试</h1>
        <span className="text-sm text-gray-400">{currentQ + 1}/{questions.length}</span>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-sm text-gray-400 mb-2">
          {question.type === 'en2cn' ? '选择正确的中文释义' : '选择对应的英文单词'}
        </p>
        <div className="flex items-center gap-3 mb-6">
          <p className="text-2xl font-bold text-primary-500">{question.question}</p>
          {question.type === 'en2cn' && speechReady && (
            <button
              onClick={() => handleSpeak(question.question)}
              className={`p-2 rounded-full transition-colors ${
                isSpeaking
                  ? 'bg-primary-500 text-white animate-pulse'
                  : 'bg-primary-50 text-primary-500 hover:bg-primary-100'
              }`}
              title="播放发音"
            >
              {isSpeaking ? <Volume2 size={18} /> : <Volume size={18} />}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            let style = 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50';
            if (answered) {
              if (idx === question.correctIndex) {
                style = 'border-success-500 bg-success-50';
              } else if (idx === selectedIndex && idx !== question.correctIndex) {
                style = 'border-danger-400 bg-danger-50';
              } else {
                style = 'border-gray-100 opacity-50';
              }
            } else if (idx === selectedIndex) {
              style = 'border-primary-500 bg-primary-50';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${style}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium flex-shrink-0"
                    style={{
                      borderColor: answered && idx === question.correctIndex ? '#4CAF50' :
                        answered && idx === selectedIndex ? '#EF5350' : '#d1d5db',
                      color: answered && idx === question.correctIndex ? '#4CAF50' :
                        answered && idx === selectedIndex ? '#EF5350' : '#9ca3af',
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm">{opt}</span>
                  {answered && idx === question.correctIndex && (
                    <CheckCircle size={18} className="text-success-500 ml-auto" />
                  )}
                  {answered && idx === selectedIndex && idx !== question.correctIndex && (
                    <XCircle size={18} className="text-danger-400 ml-auto" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      {answered && (
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors font-medium"
        >
          {currentQ < questions.length - 1 ? '下一题' : '查看结果'}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
