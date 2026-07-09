import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Headphones, Clock, Star, CheckCircle, Heart } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import listeningData from '@/data/listening.json';
import type { ListeningPassage } from '@/types';

// JSON uses shorthand keys, map to interface
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

const CATEGORIES = ['全部', '对话', '短文', '新闻', '讲座'] as const;
const DIFFICULTIES = [
  { label: '全部', value: 0 },
  { label: '简单', value: 1 },
  { label: '中等', value: 2 },
  { label: '较难', value: 3 },
] as const;

const PAGE_SIZE = 12;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= level ? 'fill-accent-400 text-accent-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

function WaveformBars() {
  const heights = [8, 16, 12, 20, 14, 10, 18, 8, 14, 20, 12, 16, 10, 18, 8, 14];
  return (
    <div className="flex items-end gap-[2px] h-5">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full bg-accent-400"
          style={{ height: `${h}px`, opacity: 0.4 + (i % 3) * 0.2 }}
        />
      ))}
    </div>
  );
}

const categoryColors: Record<string, string> = {
  对话: 'bg-blue-100 text-blue-700',
  短文: 'bg-green-100 text-green-700',
  新闻: 'bg-orange-100 text-orange-700',
  讲座: 'bg-purple-100 text-purple-700',
};

export default function Listening() {
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [activeDifficulty, setActiveDifficulty] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { listeningProgress, favoriteListenings, toggleFavoriteListening } = useAppStore();

  const filtered = useMemo(() => {
    return passages.filter((p) => {
      if (activeCategory !== '全部' && p.category !== activeCategory) return false;
      if (activeDifficulty !== 0 && p.difficulty !== activeDifficulty) return false;
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [activeCategory, activeDifficulty, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const completedCount = Object.values(listeningProgress).filter((p) => p.completed).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Headphones size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-500">听力练习</h1>
            <p className="text-sm text-gray-500">
              {passages.length}+篇 · 已完成 {completedCount} 篇
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Difficulty + Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => { setActiveDifficulty(d.value); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                activeDifficulty === d.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索听力材料..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 w-56"
          />
        </div>
      </div>

      {/* Passage Grid */}
      {paged.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Headphones size={48} className="mx-auto mb-3 opacity-30" />
          <p>没有找到匹配的听力材料</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {paged.map((passage) => {
            const progress = listeningProgress[passage.id];
            const isCompleted = progress?.completed;
            const isFavorite = favoriteListenings.includes(passage.id);

            return (
              <div
                key={passage.id}
                className="group relative bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-primary-200 transition-all duration-200"
              >
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavoriteListening(passage.id); }}
                  className="absolute top-4 right-4 z-10"
                >
                  <Heart
                    size={18}
                    className={`transition-colors ${
                      isFavorite ? 'fill-red-400 text-red-400' : 'text-gray-300 hover:text-red-300'
                    }`}
                  />
                </button>

                <Link to={`/listening/${passage.id}`} className="block">
                  {/* Top row: category + difficulty */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[passage.category] || 'bg-gray-100 text-gray-600'}`}>
                      {passage.category}
                    </span>
                    <DifficultyStars level={passage.difficulty} />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-800 mb-3 group-hover:text-primary-500 transition-colors line-clamp-1">
                    {passage.title}
                  </h3>

                  {/* Bottom row: waveform + duration + status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <WaveformBars />
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock size={13} />
                        <span className="text-xs">{formatDuration(passage.duration)}</span>
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center gap-1 text-success-500">
                        <CheckCircle size={14} />
                        <span className="text-xs font-medium">
                          {progress.score}/{passage.questions.length}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
