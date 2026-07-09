import { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  RotateCcw,
  Headphones,
  Play,
} from 'lucide-react';
import listeningData from '@/data/listening.json';
import type { ListeningPassage } from '@/types';

// Map raw JSON to typed passage
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

export default function ListeningTranscript() {
  const { id } = useParams<{ id: string }>();
  const passageId = Number(id);
  const passage = passages.find((p) => p.id === passageId);

  const [activeTab, setActiveTab] = useState<TabType>('en');
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(0);
  const [loopMode, setLoopMode] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleSentenceClick = useCallback((idx: number) => {
    setActiveSentenceIdx(idx);
  }, []);

  const handlePrevSentence = useCallback(() => {
    setActiveSentenceIdx((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextSentence = useCallback(() => {
    if (!passage) return;
    setActiveSentenceIdx((prev) => Math.min(passage.sentences.length - 1, prev + 1));
  }, [passage]);

  // Split transcript_cn into paragraphs for bilingual mode
  const cnParagraphs = useMemo(() => {
    if (!passage) return [];
    return passage.transcript_cn.split('\n').filter(Boolean);
  }, [passage]);

  const enParagraphs = useMemo(() => {
    if (!passage) return [];
    return passage.transcript.split('\n').filter(Boolean);
  }, [passage]);

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
      {/* Back link */}
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

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-500 mb-1">{passage.title}</h1>
        <p className="text-sm text-gray-400">录音稿 · {totalSentences} 个句子</p>
      </div>

      {/* Tab navigation */}
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

      {/* Transcript Content */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 min-h-[400px]">
        {/* English Transcript */}
        {activeTab === 'en' && (
          <div className="space-y-1">
            {sentences.map((sentence, idx) => {
              const isActive = idx === activeSentenceIdx;
              const isHovered = idx === hoveredIdx;

              return (
                <div
                  key={idx}
                  onClick={() => handleSentenceClick(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`group relative px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-primary-50 border-l-3 border-l-accent-400'
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
                  {/* Hover play icon */}
                  {(isHovered || isActive) && (
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Play size={14} className={isActive ? 'text-accent-400' : 'text-gray-400'} />
                    </span>
                  )}
                  {/* Active indicator */}
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

        {/* Chinese Translation */}
        {activeTab === 'cn' && (
          <div className="space-y-3">
            {cnParagraphs.map((line, idx) => (
              <p key={idx} className="text-base leading-relaxed text-gray-700">
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Bilingual View */}
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

      {/* Replay Controls */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          {/* Sentence navigation */}
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
              onClick={handleNextSentence}
              disabled={activeSentenceIdx === totalSentences - 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              下一句
              <SkipForward size={14} />
            </button>
          </div>

          {/* Current sentence indicator */}
          <div className="flex items-center gap-2">
            <Headphones size={14} className="text-primary-200" />
            <span className="text-sm text-primary-200">
              {activeSentenceIdx + 1} / {totalSentences}
            </span>
          </div>

          {/* Loop mode toggle */}
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

        {/* Current sentence preview */}
        {activeTab === 'en' && sentences[activeSentenceIdx] && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-primary-200 truncate">
              ▶ {sentences[activeSentenceIdx].text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
