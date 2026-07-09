import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import vocabularyData from '@/data/vocabulary.json';
import type { VocabularyWord } from '@/types';

const words = vocabularyData as VocabularyWord[];
const CATEGORIES = ['全部', '动词', '名词', '形容词', '副词', '介词', '代词', '连词'];
const DIFFICULTIES = ['全部', '1', '2', '3'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 50;

export default function VocabularySearch() {
  const { favoriteWords, toggleFavoriteWord } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [difficultyFilter, setDifficultyFilter] = useState('全部');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredWords = useMemo(() => {
    let result = words;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        w => w.word.toLowerCase().includes(q) || w.meaning.includes(q)
      );
    }

    if (categoryFilter !== '全部') {
      result = result.filter(w => w.category === categoryFilter);
    }

    if (difficultyFilter !== '全部') {
      result = result.filter(w => w.difficulty === Number(difficultyFilter));
    }

    if (activeLetter) {
      result = result.filter(w => w.word.charAt(0).toUpperCase() === activeLetter);
    }

    return result;
  }, [searchQuery, categoryFilter, difficultyFilter, activeLetter]);

  const totalPages = Math.ceil(filteredWords.length / PAGE_SIZE);
  const paginatedWords = filteredWords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleLetterClick = useCallback((letter: string) => {
    setActiveLetter(prev => prev === letter ? null : letter);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((cat: string) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  }, []);

  const handleDifficultyChange = useCallback((d: string) => {
    setDifficultyFilter(d);
    setCurrentPage(1);
  }, []);

  const difficultyLabel = (d: number) => {
    if (d === 1) return '简单';
    if (d === 2) return '中等';
    return '困难';
  };

  const difficultyColor = (d: number) => {
    if (d === 1) return 'bg-success-50 text-success-600';
    if (d === 2) return 'bg-accent-50 text-accent-400';
    return 'bg-danger-50 text-danger-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/vocabulary" className="text-gray-400 hover:text-primary-500 transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-semibold text-primary-500">词汇检索</h1>
        <span className="text-sm text-gray-400">({filteredWords.length} 词)</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="搜索单词或释义..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">词性</label>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-primary-50 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">难度</label>
          <div className="flex gap-1.5">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  difficultyFilter === d
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-primary-50 border border-gray-200'
                }`}
              >
                {d === '全部' ? '全部' : difficultyLabel(Number(d))}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Letter Index */}
        <div className="hidden md:flex flex-col gap-0.5 flex-shrink-0">
          {LETTERS.map(letter => {
            const hasWords = words.some(w => w.word.charAt(0).toUpperCase() === letter);
            return (
              <button
                key={letter}
                onClick={() => hasWords && handleLetterClick(letter)}
                className={`w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                  activeLetter === letter
                    ? 'bg-primary-500 text-white'
                    : hasWords
                      ? 'bg-white text-primary-400 hover:bg-primary-50 border border-gray-100'
                      : 'text-gray-200 cursor-default'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="flex-1 space-y-2">
          {paginatedWords.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Search size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">没有找到匹配的词汇</p>
            </div>
          ) : (
            paginatedWords.map(word => (
              <div
                key={word.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary-500">{word.word}</span>
                    <span className="text-xs text-gray-400">{word.phonetic}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${difficultyColor(word.difficulty)}`}>
                      {difficultyLabel(word.difficulty)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{word.meaning}</p>
                </div>
                <button
                  onClick={() => toggleFavoriteWord(word.id)}
                  className="flex-shrink-0 p-1.5 hover:bg-accent-50 rounded-lg transition-colors"
                >
                  <Star
                    size={18}
                    className={favoriteWords.includes(word.id)
                      ? 'text-accent-400 fill-accent-400'
                      : 'text-gray-300'
                    }
                  />
                </button>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
