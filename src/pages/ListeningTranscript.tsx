import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  SkipBack,
  SkipForward,
  RotateCcw,
  Headphones,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import listeningData from '@/data/listening.json';
import type { ListeningPassage } from '@/types';
import { speak, speakImmediate, stopSpeaking, isSpeechSupported, initSpeech, prewarmSpeech } from '@/utils/speech';

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

type TabType = 'en' | 'cn' | 'bilingual';

function cleanSpeakerPrefix(text: string): string {
  return text.replace(/^[A-Z]:\s*/, '');
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;

export default function ListeningTranscript() {
  const { id } = useParams<{ id: string }>();
  const passageId = Number(id);
  const passage = passages.find((p) => p.id === passageId);

  const [activeTab, setActiveTab] = useState<TabType>('en');
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(0);
  const [loopMode, setLoopMode] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cleanSentences = useMemo(() => {
    if (!passage) return [];
    return passage.sentences.map((s) => ({
      ...s,
      cleanText: cleanSpeakerPrefix(s.text),
    }));
  }, [passage]);

  const cnParagraphs = useMemo(() => {
    if (!passage) return [];
    return passage.transcript_cn.split('\n').filter(Boolean);
  }, [passage]);

  const enParagraphs = useMemo(() => {
    if (!passage) return [];
    return passage.transcript.split('\n').filter(Boolean);
  }, [passage]);

  useEffect(() => {
    if (isSpeechSupported()) {
      initSpeech().then(() => setSpeechReady(true));
    }
  }, []);

  const speakSentence = useCallback(
    (idx: number) => {
      if (!cleanSentences[idx] || !speechReady) return;

      const sentence = cleanSentences[idx];

      const utterance = speakImmediate(sentence.cleanText, {
        rate: speed,
        volume: isMuted ? 0 : volume,
        onEnd: () => {
          if (loopMode) {
            setTimeout(() => speakSentence(idx), 500);
          } else if (idx < cleanSentences.length - 1) {
            const nextIdx = idx + 1;
            setActiveSentenceIdx(nextIdx);
            speakSentence(nextIdx);
          } else {
            setIsPlaying(false);
          }
        },
        onError: () => {
          setIsPlaying(false);
        },
      });

      utteranceRef.current = utterance;
    },
    [cleanSentences, speed, volume, isMuted, loopMode, speechReady]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      prewarmSpeech();
      setIsPlaying(true);
      setTimeout(() => speakSentence(activeSentenceIdx), 30);
    }
  }, [isPlaying, activeSentenceIdx, speakSentence]);

  const playSentence = useCallback(
    (idx: number) => {
      setActiveSentenceIdx(idx);
      setIsPlaying(true);
      stopSpeaking();
      prewarmSpeech();
      setTimeout(() => speakSentence(idx), 50);
    },
    [speakSentence]
  );

  const handlePrevSentence = useCallback(() => {
    const newIdx = Math.max(0, activeSentenceIdx - 1);
    setActiveSentenceIdx(newIdx);
    if (isPlaying) {
      stopSpeaking();
      setTimeout(() => speakSentence(newIdx), 80);
    }
  }, [activeSentenceIdx, isPlaying, speakSentence]);

  const handleNextSentence = useCallback(() => {
    if (!passage) return;
    const newIdx = Math.min(passage.sentences.length - 1, activeSentenceIdx + 1);
    setActiveSentenceIdx(newIdx);
    if (isPlaying) {
      stopSpeaking();
      setTimeout(() => speakSentence(newIdx), 80);
    }
  }, [passage, activeSentenceIdx, isPlaying, speakSentence]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

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

  const sentences = passage.sentences;
  const totalSentences = sentences.length;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'en', label: '英文录音稿' },
    { key: 'cn', label: '中文翻译稿' },
    { key: 'bilingual', label: '双语对照' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/listening/${passage.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 transition-colors"
        >
          <ChevronLeft size={16} />
          返回练习
        </Link>
        <Link
          to="/listening"
          className="text-sm text-gray-500 hover:text-primary-500 transition-colors"
        >
          返回列表
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-500 mb-1">{passage.title}</h1>
        <p className="text-sm text-gray-400">录音稿 · {totalSentences} 个句子</p>
      </div>

      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 min-h-[400px]">
        {activeTab === 'en' && (
          <div className="space-y-1">
            {cleanSentences.map((sentence, idx) => {
              const isActive = idx === activeSentenceIdx;
              const isHovered = idx === hoveredIdx;

              return (
                <div
                  key={idx}
                  onClick={() => playSentence(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`group relative px-3 py-3 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-primary-50 border-l-4 border-l-accent-400'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`text-base leading-relaxed ${
                      isActive ? 'text-primary-500 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {sentence.text}
                  </span>
                  {(isHovered || isActive) && (
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isActive && isPlaying ? (
                        <Pause size={16} className="text-accent-400" />
                      ) : (
                        <Play size={16} className={isActive ? 'text-accent-400' : 'text-gray-400'} />
                      )}
                    </span>
                  )}
                  {isActive && loopMode && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2">
                      <RotateCcw size={12} className="text-accent-400" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'cn' && (
          <div className="space-y-3">
            {cnParagraphs.map((line, idx) => (
              <p key={idx} className="text-base leading-relaxed text-gray-700">
                {line}
              </p>
            ))}
          </div>
        )}

        {activeTab === 'bilingual' && (
          <div className="space-y-4">
            {enParagraphs.map((enLine, idx) => {
              const cnLine = cnParagraphs[idx] || '';
              return (
                <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="text-base leading-relaxed text-gray-800 mb-1">{enLine}</p>
                  <p className="text-sm leading-relaxed text-gray-400">{cnLine}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevSentence}
              disabled={activeSentenceIdx === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <SkipBack size={14} />
              上一句
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause size={18} className="text-primary-500" />
              ) : (
                <Play size={18} className="text-primary-500 ml-0.5" />
              )}
            </button>
            <button
              onClick={handleNextSentence}
              disabled={activeSentenceIdx === totalSentences - 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              下一句
              <SkipForward size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Headphones size={14} className="text-primary-200" />
            <span className="text-sm text-primary-200">
              {activeSentenceIdx + 1} / {totalSentences}
            </span>
          </div>

          <button
            onClick={() => setLoopMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
              loopMode
                ? 'bg-accent-400 text-white'
                : 'bg-white/10 text-primary-200 hover:bg-white/20'
            }`}
          >
            <RotateCcw size={14} />
            {loopMode ? '循环中' : '单句循环'}
          </button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-white/10">
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
              onClick={() => setIsMuted((prev) => !prev)}
              className="text-primary-200 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (val > 0) setIsMuted(false);
              }}
              className="w-20 accent-accent-400 h-1"
            />
          </div>
        </div>

        {activeTab === 'en' && cleanSentences[activeSentenceIdx] && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-sm text-primary-100 line-clamp-2">
              ▶ {cleanSentences[activeSentenceIdx].text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
