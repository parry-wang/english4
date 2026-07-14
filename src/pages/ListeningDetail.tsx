import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  ChevronLeft,
  Star,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import listeningData from '@/data/listening.json';
import type { ListeningPassage } from '@/types';
import { speak, stopSpeaking, isSpeechSupported, initSpeech } from '@/utils/speech';

const passages: ListeningPassage[] = (listeningData as Array<{
  id: number;
  title: string;
  category: string;
  difficulty: number;
  audio_url: string;
  duration: number;
  transcript: string;
  transcript_cn: string;
  sentences: Array<{ start_time: number; end_time: number; text: string }>;
  questions: Array<{
    id: number;
    q: string;
    a: string;
    b: string;
    c: string;
    d: string;
    ans: string;
    exp: string;
  }>;
}>).map((p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  difficulty: p.difficulty,
  audio_url: p.audio_url,
  duration: p.duration,
  transcript: p.transcript,
  transcript_cn: p.transcript_cn,
  sentences: p.sentences,
  questions: p.questions.map((q) => ({
    id: q.id,
    question_text: q.q,
    option_a: q.a,
    option_b: q.b,
    option_c: q.c,
    option_d: q.d,
    correct_answer: q.ans,
    explanation: q.exp,
  })),
}));

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;

const categoryColors: Record<string, string> = {
  对话: 'bg-blue-100 text-blue-700',
  短文: 'bg-green-100 text-green-700',
  新闻: 'bg-orange-100 text-orange-700',
  讲座: 'bg-purple-100 text-purple-700',
};

function cleanSpeakerPrefix(text: string): string {
  return text.replace(/^[A-Z]:\s*/, '');
}

export default function ListeningDetail() {
  const { id } = useParams<{ id: string }>();
  const passageId = Number(id);
  const passage = passages.find((p) => p.id === passageId);

  const { listeningProgress, updateListeningProgress } = useAppStore();
  const existingProgress = passageId ? listeningProgress[passageId] : undefined;
  const isAlreadyCompleted = existingProgress?.completed ?? false;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [speechReady, setSpeechReady] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
    isAlreadyCompleted && existingProgress ? existingProgress.answers : {}
  );
  const [submitted, setSubmitted] = useState(isAlreadyCompleted);

  const cleanSentences = useMemo(() => {
    if (!passage) return [];
    return passage.sentences.map((s) => ({
      ...s,
      cleanText: cleanSpeakerPrefix(s.text),
    }));
  }, [passage]);

  useEffect(() => {
    if (isSpeechSupported()) {
      initSpeech().then(() => setSpeechReady(true));
    }
  }, []);

  const stopSpeech = useCallback(() => {
    stopSpeaking();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    utteranceRef.current = null;
  }, []);

  const speakSentence = useCallback(
    (sentenceIdx: number) => {
      if (!passage || !cleanSentences[sentenceIdx]) return;

      const sentence = cleanSentences[sentenceIdx];

      const utterance = speak(sentence.cleanText, {
        rate: speed,
        volume: isMuted ? 0 : volume,
        onEnd: () => {
          if (sentenceIdx < cleanSentences.length - 1) {
            const nextIdx = sentenceIdx + 1;
            setCurrentSentenceIndex(nextIdx);
            setCurrentTime(cleanSentences[nextIdx].start_time);
            speakSentence(nextIdx);
          } else {
            setIsPlaying(false);
            setCurrentTime(passage.duration);
          }
        },
        onError: () => {
          setIsPlaying(false);
        },
      });

      utteranceRef.current = utterance;

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= sentence.end_time) return sentence.end_time;
          return prev + 0.1 * speed;
        });
      }, 100);
    },
    [passage, cleanSentences, speed, volume, isMuted]
  );

  const handlePlay = useCallback(() => {
    if (!passage || !speechReady) return;

    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    if (currentTime >= passage.duration) {
      setCurrentTime(0);
      setCurrentSentenceIndex(0);
    }

    const startIdx = cleanSentences.findIndex(
      (s, i) => currentTime >= s.start_time && currentTime < s.end_time
    );
    const idx = startIdx >= 0 ? startIdx : 0;

    setCurrentSentenceIndex(idx);
    setIsPlaying(true);
    setTimeout(() => speakSentence(idx), 50);
  }, [passage, isPlaying, currentTime, cleanSentences, speechReady, stopSpeech, speakSentence]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!passage || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = ratio * passage.duration;

      const wasPlaying = isPlaying;
      stopSpeech();
      setIsPlaying(false);

      setCurrentTime(newTime);
      const startIdx = cleanSentences.findIndex(
        (s, i) => newTime >= s.start_time && newTime < s.end_time
      );
      const idx = startIdx >= 0 ? startIdx : 0;
      setCurrentSentenceIndex(idx);

      if (wasPlaying) {
        setTimeout(() => {
          setIsPlaying(true);
          speakSentence(idx);
        }, 150);
      }
    },
    [passage, isPlaying, cleanSentences, stopSpeech, speakSentence]
  );

  const handleReplayCurrent = useCallback(() => {
    if (!passage || !speechReady) return;
    stopSpeech();
    setIsPlaying(false);
    setCurrentTime(cleanSentences[currentSentenceIndex]?.start_time ?? 0);
    setTimeout(() => {
      setIsPlaying(true);
      speakSentence(currentSentenceIndex);
    }, 150);
  }, [passage, speechReady, cleanSentences, currentSentenceIndex, stopSpeech, speakSentence]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleSelectAnswer = useCallback((questionId: number, option: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    if (!passage) return;
    const score = passage.questions.reduce(
      (acc, q) => acc + (selectedAnswers[q.id] === q.correct_answer ? 1 : 0),
      0
    );
    updateListeningProgress(passage.id, {
      passageId: passage.id,
      completed: true,
      score,
      answers: selectedAnswers,
    });
    setSubmitted(true);
  }, [passage, selectedAnswers, updateListeningProgress]);

  if (!passage) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-400">未找到该听力材料</p>
        <Link to="/listening" className="text-primary-500 hover:underline mt-2 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const progressPercent = (currentTime / passage.duration) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/listening"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        返回列表
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[passage.category] || 'bg-gray-100 text-gray-600'}`}>
            {passage.category}
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                size={12}
                className={i <= passage.difficulty ? 'fill-accent-400 text-accent-400' : 'text-gray-300'}
              />
            ))}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary-500">{passage.title}</h1>
        <p className="text-sm text-gray-400 mt-1">时长 {formatTime(passage.duration)}</p>
      </div>

      {!speechReady && (
        <div className="bg-warning-50 border border-warning-200 text-warning-700 rounded-xl p-4 mb-6 text-sm">
          ⚠️ 当前浏览器不支持语音合成，请使用 Chrome、Edge 或 Safari 浏览器体验听力播放。
        </div>
      )}

      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="text-center text-sm text-primary-200 mb-4 bg-white/10 rounded-lg py-2">
          🎧 听力播放器（语音合成）
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handlePlay}
            disabled={!speechReady}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <Pause size={22} className="text-primary-500" />
            ) : (
              <Play size={22} className="text-primary-500 ml-0.5" />
            )}
          </button>

          <div className="flex-1">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="h-2 bg-white/20 rounded-full cursor-pointer relative group"
            >
              <div
                className="absolute left-0 top-0 h-full bg-accent-400 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-primary-200">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(passage.duration)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  speed === s
                    ? 'bg-white text-primary-500'
                    : 'text-primary-200 hover:bg-white/10'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReplayCurrent}
              className="flex items-center gap-1 text-primary-200 hover:text-white transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/10"
              title="复读当前句"
            >
              <RotateCcw size={14} />
              复读
            </button>
            <button onClick={toggleMute} className="text-primary-200 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-accent-400 h-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-[3px] mt-4 h-8">
          {Array.from({ length: 40 }, (_, i) => {
            const h = 8 + Math.sin(i * 0.7 + (isPlaying ? Date.now() / 200 : 0)) * 10 + Math.cos(i * 1.3) * 6;
            const isActive = (i / 40) * 100 < progressPercent;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-all duration-200 ${
                  isActive ? 'bg-accent-400' : 'bg-white/20'
                }`}
                style={{ height: `${Math.max(4, h)}px` }}
              />
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">听力题目</h2>
        <div className="space-y-6">
          {passage.questions.map((question, idx) => {
            const selected = selectedAnswers[question.id];
            const isCorrect = selected === question.correct_answer;
            const options = [
              { key: 'A', text: question.option_a },
              { key: 'B', text: question.option_b },
              { key: 'C', text: question.option_c },
              { key: 'D', text: question.option_d },
            ];

            return (
              <div
                key={question.id}
                className="bg-white rounded-xl border border-gray-100 p-5"
              >
                <p className="font-medium text-gray-800 mb-3">
                  {idx + 1}. {question.question_text}
                </p>
                <div className="space-y-2">
                  {options.map((opt) => {
                    const isSelected = selected === opt.key;
                    const showCorrect = submitted && opt.key === question.correct_answer;
                    const showWrong = submitted && isSelected && opt.key !== question.correct_answer;

                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectAnswer(question.id, opt.key)}
                        disabled={submitted}
                        className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-3 ${
                          showCorrect
                            ? 'border-success-400 bg-success-50 text-success-600'
                            : showWrong
                            ? 'border-danger-400 bg-danger-50 text-danger-600'
                            : isSelected
                            ? 'border-primary-400 bg-primary-50 text-primary-600'
                            : 'border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-gray-50'
                        } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            showCorrect
                              ? 'border-success-400 bg-success-400 text-white'
                              : showWrong
                              ? 'border-danger-400 bg-danger-400 text-white'
                              : isSelected
                              ? 'border-primary-400 bg-primary-400 text-white'
                              : 'border-gray-300 text-gray-400'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {showCorrect && <CheckCircle size={16} className="text-success-500 flex-shrink-0" />}
                        {showWrong && <XCircle size={16} className="text-danger-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {submitted && question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <span className="font-medium">解析：</span>
                    {question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8 flex-wrap">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < passage.questions.length}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            提交答案
          </button>
        ) : (
          <div className="flex items-center gap-2 text-success-600 font-medium">
            <CheckCircle size={20} />
            <span>
              已完成！得分 {listeningProgress[passage.id]?.score ?? 0}/{passage.questions.length}
            </span>
          </div>
        )}
        <Link
          to={`/listening/${passage.id}/transcript`}
          className="inline-flex items-center gap-2 px-6 py-2.5 border border-primary-500 text-primary-500 rounded-xl font-medium hover:bg-primary-50 transition-colors"
        >
          <FileText size={16} />
          查看录音稿
        </Link>
      </div>
    </div>
  );
}
