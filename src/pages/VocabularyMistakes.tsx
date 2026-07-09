import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import vocabularyData from '@/data/vocabulary.json';
import type { VocabularyWord } from '@/types';

const words = vocabularyData as VocabularyWord[];
const CATEGORIES = ['全部', '动词', '名词', '形容词', '副词', '介词', '代词', '连词'];

export default function VocabularyMistakes() {
  const { wordProgress, updateWordProgress } = useAppStore();
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const mistakeWords = useMemo(() => {
    const result: (VocabularyWord & { mistakeCount: number })[] = [];
    for (const w of words) {
      const p = wordProgress[w.id];
      if (p && p.mistakeCount > 0) {
        result.push({ ...w, mistakeCount: p.mistakeCount });
      }
    }
    if (categoryFilter !== '全部') {
      return result
        .filter(w => w.category === categoryFilter)
        .sort((a, b) => b.mistakeCount - a.mistakeCount);
    }
    return result.sort((a, b) => b.mistakeCount - a.mistakeCount);
  }, [wordProgress, categoryFilter]);

  const handleResetMistake = useCallback((wordId: number) => {
    updateWordProgress(wordId, { mistakeCount: 0, status: 'mastered' });
  }, [updateWordProgress]);

  const handleRequiz = useCallback(() => {
    navigate('/vocabulary/quiz');
  }, [navigate]);

  if (mistakeWords.length === 0 && categoryFilter === '全部') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vocabulary" className="text-gray-400 hover:text-primary-500 transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg font-semibold text-primary-500">错题本</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <CheckCircle size={48} className="text-success-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-primary-500 mb-2">太棒了！</h2>
          <p className="text-gray-500">目前没有错题，继续保持！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/vocabulary" className="text-gray-400 hover:text-primary-500 transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg font-semibold text-primary-500">错题本</h1>
          <span className="text-sm text-gray-400">({mistakeWords.length} 词)</span>
        </div>
        <button
          onClick={handleRequiz}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-400 text-white hover:bg-accent-500 transition-colors text-sm font-medium"
        >
          <RefreshCw size={14} />
          重新测试
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-primary-50 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Word List */}
      <div className="space-y-3">
        {mistakeWords.map(word => {
          const isExpanded = expandedId === word.id;
          return (
            <div key={word.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : word.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary-500">{word.word}</span>
                    <span className="text-sm text-gray-400">{word.phonetic}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{word.meaning}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-50 text-danger-400 text-xs font-medium">
                    <AlertTriangle size={10} />
                    {word.mistakeCount}次
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-700">{word.example_en}</p>
                    <p className="text-sm text-gray-400">{word.example_cn}</p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetMistake(word.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-success-500 hover:bg-success-50 transition-colors"
                    >
                      <CheckCircle size={14} />
                      标记已掌握
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {mistakeWords.length === 0 && categoryFilter !== '全部' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-500">该分类下暂无错题</p>
        </div>
      )}
    </div>
  );
}
