import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, X, Trophy, Shuffle, Volume2, VolumeX, Volume } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import vocabularyData from '@/data/vocabulary.json';
import type { VocabularyWord } from '@/types';
import { speak, stopSpeaking, isSpeechSupported, initSpeech } from '@/utils/speech';

const words = vocabularyData as VocabularyWord[];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectRandomWords(allWords: VocabularyWord[], count: number, masteredIds: Set<number>): VocabularyWord[] {
  const notMastered = allWords.filter(w => !masteredIds.has(w.id));
  if (notMastered.length >= count) {
    return shuffle(notMastered).slice(0, count);
  }
  const mastered = allWords.filter(w => masteredIds.has(w.id));
  return [...shuffle(notMastered), ...shuffle(mastered).slice(0, count - notMastered.length)];
}

export default function VocabularyLearn() {
  const { wordProgress, updateWordProgress } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [seed, setSeed] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(0.9);
  const [speechReady, setSpeechReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isSpeechSupported()) {
      initSpeech().then(() => setSpeechReady(true));
    }
  }, []);

  const handleSpeak = useCallback((word: string) => {
    if (!speechReady) return;
    setIsSpeaking(true);
    speak(word, {
      rate: speed,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [speechReady, speed]);

  useEffect(() => {
    if (autoPlay && currentWord && speechReady) {
      const timer = setTimeout(() => handleSpeak(currentWord.word), 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPlay, speechReady, handleSpeak]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const todayWords = useMemo(() => {
    const masteredIds = new Set<number>();
    Object.values(wordProgress).forEach(w => {
      if (w.status === 'mastered') masteredIds.add(w.wordId);
    });
    return selectRandomWords(words, 50, masteredIds);
  }, [seed, wordProgress]);

  const currentWord = todayWords[currentIndex];
  const totalWords = todayWords.length;

  const reviewedCount = useMemo(() => {
    let count = 0;
    for (const w of todayWords) {
      const p = wordProgress[w.id];
      if (p && p.status !== 'new') count++;
    }
    return count;
  }, [todayWords, wordProgress]);

  const handleMarkMastered = useCallback(() => {
    if (!currentWord) return;
    updateWordProgress(currentWord.id, {
      status: 'mastered',
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
    } else {
      setCompleted(true);
    }
  }, [currentWord, currentIndex, totalWords, updateWordProgress]);

  const handleMarkLearning = useCallback(() => {
    if (!currentWord) return;
    updateWordProgress(currentWord.id, {
      status: 'learning',
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
    } else {
      setCompleted(true);
    }
  }, [currentWord, currentIndex, totalWords, updateWordProgress]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setFlipped(prev => !prev);
  }, []);

  const handleShuffle = useCallback(() => {
    setSeed(s => s + 1);
    setCurrentIndex(0);
    setFlipped(false);
    setCompleted(false);
  }, []);

  const masteredInSession = useMemo(() => {
    let count = 0;
    for (const w of todayWords) {
      const p = wordProgress[w.id];
      if (p && p.status === 'mastered') count++;
    }
    return count;
  }, [todayWords, wordProgress]);

  if (todayWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Trophy size={64} className="text-accent-400 mb-4" />
        <h2 className="text-xl font-bold text-primary-500 mb-2">全部学完了！</h2>
        <p className="text-gray-500 mb-6">你已经完成了所有词汇的学习</p>
        <Link to="/vocabulary" className="text-accent-400 hover:underline">返回首页</Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} className="text-success-500" />
          </div>
          <h2 className="text-xl font-bold text-primary-500 mb-2">本轮学习完成！</h2>
          <p className="text-gray-500 mb-6">随机50词已浏览</p>
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-success-500">{masteredInSession}</p>
              <p className="text-xs text-gray-400">已掌握</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-400">{reviewedCount - masteredInSession}</p>
              <p className="text-xs text-gray-400">学习中</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Shuffle size={16} />
              换一批
            </button>
            <Link
              to="/vocabulary/quiz"
              className="px-5 py-2.5 rounded-xl bg-accent-400 text-white hover:bg-accent-500 transition-colors"
            >
              去测试
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
        <Link to="/vocabulary" className="text-gray-400 hover:text-primary-500 transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-semibold text-primary-500 flex items-center gap-2">
          <Shuffle size={16} className="text-accent-400" />
          随机背单词 · 50词
        </h1>
        <button
          onClick={handleShuffle}
          className="text-sm text-accent-400 hover:text-accent-500 transition-colors flex items-center gap-1"
          title="换一批"
        >
          <Shuffle size={14} />
          换一批
        </button>
      </div>

      {/* Index indicator */}
      <div className="flex items-center gap-1">
        {todayWords.map((_, idx) => {
          const w = wordProgress[todayWords[idx].id];
          let color = 'bg-gray-100';
          if (idx === currentIndex) color = 'bg-primary-500';
          else if (w?.status === 'mastered') color = 'bg-success-500';
          else if (w?.status === 'learning') color = 'bg-accent-400';
          return (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full ${color} transition-colors cursor-pointer`}
              onClick={() => { setCurrentIndex(idx); setFlipped(false); }}
            />
          );
        })}
      </div>

      {/* Flip Card */}
      <div className="flip-card w-full h-72 cursor-pointer" onClick={handleFlip}>
        <div className={`flip-card-inner relative w-full h-full ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card-front absolute inset-0 bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center p-8">
            <span className="text-3xl font-bold text-primary-500 mb-3">{currentWord?.word}</span>
            <span className="text-lg text-gray-400 mb-4">{currentWord?.phonetic}</span>
            {speechReady && (
              <button
                onClick={(e) => { e.stopPropagation(); currentWord && handleSpeak(currentWord.word); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors text-sm font-medium ${
                  isSpeaking
                    ? 'bg-primary-500 text-white animate-pulse'
                    : 'bg-primary-50 text-primary-500 hover:bg-primary-100'
                }`}
              >
                {isSpeaking ? <Volume2 size={16} /> : <Volume size={16} />}
                {isSpeaking ? '播放中...' : '播放发音'}
              </button>
            )}
            <span className="text-sm text-gray-300 mt-6">点击卡片查看释义</span>
          </div>
          {/* Back */}
          <div className="flip-card-back absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 text-white">
            <span className="text-2xl font-bold mb-2">{currentWord?.word}</span>
            <span className="text-primary-200 mb-4">{currentWord?.phonetic}</span>
            {speechReady && (
              <button
                onClick={(e) => { e.stopPropagation(); currentWord && handleSpeak(currentWord.word); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors text-sm font-medium mb-4 ${
                  isSpeaking
                    ? 'bg-white text-primary-600 animate-pulse'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {isSpeaking ? <Volume2 size={16} /> : <Volume size={16} />}
                {isSpeaking ? '播放中...' : '播放发音'}
              </button>
            )}
            <span className="text-xl font-semibold mb-6">{currentWord?.meaning}</span>
            <div className="text-sm text-primary-200 space-y-1 text-center">
              <p>{currentWord?.example_en}</p>
              <p className="text-primary-300">{currentWord?.example_cn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      {speechReady && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  autoPlay ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {autoPlay ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {autoPlay ? '自动播放' : '手动播放'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">语速</span>
              <div className="flex gap-1">
                {[0.7, 0.9, 1.1].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      speed === s ? 'bg-accent-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          上一个
        </button>
        <button
          onClick={handleMarkMastered}
          className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-success-500 text-white hover:bg-success-600 transition-colors font-medium"
        >
          <Check size={16} />
          我认识了
        </button>
        <button
          onClick={handleMarkLearning}
          className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-accent-400 text-white hover:bg-accent-500 transition-colors font-medium"
        >
          <X size={16} />
          还不熟悉
        </button>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>学习进度</span>
          <span>{currentIndex + 1}/{totalWords}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
