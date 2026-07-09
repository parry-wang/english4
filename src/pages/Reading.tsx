import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Clock, FileText, CheckCircle, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import readingData from '@/data/reading.json';
import { cn } from '@/lib/utils';
import type { ReadingPassage } from '@/types';

const passages = readingData as ReadingPassage[];

const CATEGORIES = ['全部', '科技', '教育', '环境', '经济', '文化', '社会', '健康', '历史', '心理', '艺术'];
const DIFFICULTIES = [
  { label: '全部', value: 0 },
  { label: '简单', value: 1 },
  { label: '中等', value: 2 },
  { label: '较难', value: 3 },
];
const PAGE_SIZE = 12;

const difficultyLabel = (d: number) => {
  if (d === 1) return '简单';
  if (d === 2) return '中等';
  return '较难';
};

const difficultyColor = (d: number) => {
  if (d === 1) return 'text-success-500';
  if (d === 2) return 'text-amber-500';
  return 'text-danger-500';
};

export default function Reading() {
  const [category, setCategory] = useState('全部');
  const [difficulty, setDifficulty] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const readingProgress = useAppStore((s) => s.readingProgress);
  const favoriteReadings = useAppStore((s) => s.favoriteReadings);
  const toggleFavoriteReading = useAppStore((s) => s.toggleFavoriteReading);

  const filtered = useMemo(() => {
    let list = passages;
    if (category !== '全部') list = list.filter((p) => p.category === category);
    if (difficulty !== 0) list = list.filter((p) => p.difficulty === difficulty);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    return list;
  }, [category, difficulty, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const completedCount = Object.values(readingProgress).filter((r) => r.completed).length;

  const handleCategoryChange = (c: string) => {
    setCategory(c);
    setPage(1);
  };

  const handleDifficultyChange = (d: number) => {
    setDifficulty(d);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-500">阅读理解</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 <span className="font-semibold text-primary-500">{passages.length}+</span> 篇文章
            <span className="mx-2">|</span>
            已完成 <span className="font-semibold text-success-500">{completedCount}</span> / {passages.length}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="bg-primary-50 rounded-lg px-4 py-2">
            完成率 <span className="font-bold text-primary-500">{passages.length ? Math.round((completedCount / passages.length) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => handleCategoryChange(c)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              category === c
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-500'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Difficulty filter + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => handleDifficultyChange(d.value)}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-all',
                difficulty === d.value
                  ? 'bg-accent-400 text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:bg-accent-50 hover:text-accent-400'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文章标题..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition"
          />
        </div>
      </div>

      {/* Passage grid */}
      {paged.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-40" />
          <p>暂无匹配的文章</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paged.map((passage) => {
            const progress = readingProgress[passage.id];
            const isCompleted = progress?.completed;
            const isFavorite = favoriteReadings.includes(passage.id);
            return (
              <div
                key={passage.id}
                className="group relative bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <Link to={`/reading/${passage.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 group-hover:text-primary-500 transition-colors line-clamp-1">
                        {passage.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-primary-50 text-primary-500 text-xs font-medium">
                          {passage.category}
                        </span>
                        <span className={cn('flex items-center gap-0.5 text-xs', difficultyColor(passage.difficulty))}>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < passage.difficulty ? 'fill-current' : 'text-gray-300'}
                            />
                          ))}
                          <span className="ml-0.5">{difficultyLabel(passage.difficulty)}</span>
                        </span>
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-50 text-success-600 text-xs font-medium flex-shrink-0">
                        <CheckCircle size={12} />
                        已完成
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {passage.word_count} 词
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {passage.estimated_time}
                    </span>
                    {isCompleted && (
                      <span className="text-primary-400 font-medium">
                        得分 {progress.score}/{passage.questions.length}
                      </span>
                    )}
                  </div>
                </Link>
                {/* Favorite button */}
                <button
                  onClick={(e) => { e.preventDefault(); toggleFavoriteReading(passage.id); }}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Heart
                    size={16}
                    className={cn(
                      'transition-colors',
                      isFavorite ? 'fill-danger-400 text-danger-400' : 'text-gray-300 hover:text-danger-400'
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-50 transition"
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            if (
              p === 1 ||
              p === totalPages ||
              Math.abs(p - currentPage) <= 1
            ) {
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition',
                    currentPage === p
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-white border border-gray-200 hover:bg-primary-50'
                  )}
                >
                  {p}
                </button>
              );
            }
            if (Math.abs(p - currentPage) === 2) {
              return <span key={p} className="text-gray-400 text-sm">...</span>;
            }
            return null;
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-50 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
