import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, BookOpen, CheckCircle } from 'lucide-react';
import writingData from '@/data/writing.json';
import { useAppStore } from '@/store/useAppStore';

const categories = ['全部', '议论文', '说明文', '应用文', '图表作文'];
const difficultyLabels: Record<number, string> = { 1: '简单', 2: '中等', 3: '较难' };

export default function Writing() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const completedWritings = useAppStore((s) => s.completedWritings);

  const filtered = useMemo(() => {
    return writingData.filter((topic) => {
      if (activeCategory !== '全部' && topic.category !== activeCategory) return false;
      if (difficultyFilter !== null && topic.difficulty !== difficultyFilter) return false;
      if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [activeCategory, difficultyFilter, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-500">作文题材</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 <span className="text-accent-400 font-semibold">{writingData.length}+</span> 篇精选题目
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
          <BookOpen size={16} className="text-primary-400" />
          <span className="text-sm text-gray-600">
            已完成 <span className="font-semibold text-accent-400">{completedWritings.length}</span> 篇
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 mb-6">
        {/* Difficulty Filter */}
        <div className="flex gap-2">
          {[null, 1, 2, 3].map((d) => (
            <button
              key={d === null ? 'all' : d}
              onClick={() => setDifficultyFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                difficultyFilter === d
                  ? 'bg-accent-400 text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {d === null ? '全部难度' : difficultyLabels[d]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索题目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 bg-white"
          />
        </div>
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((topic) => {
          const isCompleted = completedWritings.includes(topic.id);
          return (
            <Link
              key={topic.id}
              to={`/writing/${topic.id}`}
              className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-gray-100 group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 group-hover:text-primary-500 transition-colors line-clamp-2 pr-2">
                  {topic.title}
                </h3>
                {isCompleted && (
                  <CheckCircle size={18} className="text-success-500 flex-shrink-0 mt-0.5" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-primary-50 text-primary-500 text-xs rounded-md font-medium">
                  {topic.category}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < topic.difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                {topic.requirement}
              </p>

              {isCompleted && (
                <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-accent-50 text-accent-400 text-xs rounded-full font-medium">
                  <BookOpen size={12} />
                  查看范文
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">没有找到匹配的题目</p>
        </div>
      )}
    </div>
  );
}
