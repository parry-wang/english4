import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  BookOpen,
  FileText,
  Headphones,
  PenTool,
  TrendingUp,
  AlertCircle,
  Heart,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import vocabularyData from '@/data/vocabulary.json';

type Tab = 'stats' | 'mistakes' | 'favorites';
type FavoriteSubTab = 'words' | 'readings' | 'listenings';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [favSubTab, setFavSubTab] = useState<FavoriteSubTab>('words');
  const navigate = useNavigate();

  // Store data
  const wordProgress = useAppStore((s) => s.wordProgress);
  const readingProgress = useAppStore((s) => s.readingProgress);
  const listeningProgress = useAppStore((s) => s.listeningProgress);
  const completedWritings = useAppStore((s) => s.completedWritings);
  const examRecords = useAppStore((s) => s.examRecords);
  const favoriteWords = useAppStore((s) => s.favoriteWords);
  const favoriteReadings = useAppStore((s) => s.favoriteReadings);
  const favoriteListenings = useAppStore((s) => s.favoriteListenings);

  // Stats calculations
  const totalDays = Math.ceil(
    (Date.now() - new Date(useAppStore.getState().startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) || 1;

  const masteredCount = Object.values(wordProgress).filter(
    (p) => p.status === 'mastered'
  ).length;
  const learningCount = Object.values(wordProgress).filter(
    (p) => p.status === 'learning'
  ).length;
  const wordsLearned = masteredCount + learningCount;

  const readingsCompleted = Object.values(readingProgress).filter((p) => p.completed).length;
  const listeningCompleted = Object.values(listeningProgress).filter((p) => p.completed).length;

  // Mistake data
  const wordMistakes = Object.entries(wordProgress)
    .filter(([_, p]) => p.mistakeCount > 0)
    .map(([id, p]) => ({
      id: Number(id),
      mistakeCount: p.mistakeCount,
      word: vocabularyData.find((w) => w.id === Number(id))?.word || `#${id}`,
    }))
    .sort((a, b) => b.mistakeCount - a.mistakeCount);

  const readingMistakes = Object.entries(readingProgress)
    .filter(([_, p]) => {
      if (!('score' in p)) return false;
      return p.score !== undefined && p.score < 60;
    })
    .slice(0, 5);

  const listeningMistakes = Object.entries(listeningProgress)
    .filter(([_, p]) => {
      if (!('score' in p)) return false;
      return p.score !== undefined && p.score < 60;
    })
    .slice(0, 5);

  // Weekly activity data (simulated for last 7 days)
  const weeklyData = useMemo(() => {
    const data: { day: string; count: number }[] = [];
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        day: days[d.getDay()],
        // Simulate: check if there was activity on that day
        count:
          Math.floor(Math.random() * 10) +
          (i === 0 ? Math.floor(wordsLearned % 7) : 0),
      });
    }
    return data;
  }, [wordsLearned]);

  // Module completion percentages
  const moduleCompletion = [
    {
      name: '单词',
      icon: BookOpen,
      percent: Math.round((wordsLearned / vocabularyData.length) * 100),
      color: 'bg-primary-500',
    },
    {
      name: '阅读',
      icon: FileText,
      percent: Math.min(100, readingsCompleted * 20),
      color: 'bg-accent-400',
    },
    {
      name: '听力',
      icon: Headphones,
      percent: Math.min(100, listeningCompleted * 15),
      color: 'bg-success-500',
    },
    {
      name: '作文',
      icon: PenTool,
      percent: Math.min(100, completedWritings.length * 4),
      color: 'bg-purple-500',
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats', label: '学习统计' },
    { key: 'mistakes', label: '错题汇总' },
    { key: 'favorites', label: '我的收藏' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white shadow-lg">
          <User size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">个人中心</h1>
          <p className="text-sm text-gray-500">已学习 {totalDays} 天 · CET-4 学习者</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <Calendar size={18} className="mx-auto text-primary-400 mb-1" />
          <p className="text-lg font-bold text-gray-800">{totalDays}</p>
          <p className="text-xs text-gray-400">学习天数</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <BookOpen size={18} className="mx-auto text-accent-400 mb-1" />
          <p className="text-lg font-bold text-gray-800">{wordsLearned}</p>
          <p className="text-xs text-gray-400">已学单词</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <FileText size={18} className="mx-auto text-success-500 mb-1" />
          <p className="text-lg font-bold text-gray-800">{readingsCompleted}</p>
          <p className="text-xs text-gray-400">阅读完成</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <Headphones size={18} className="mx-auto text-purple-500 mb-1" />
          <p className="text-lg font-bold text-gray-800">{listeningCompleted}</p>
          <p className="text-xs text-gray-400">听力完成</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 min-h-[300px]">
        {activeTab === 'stats' && (
          <>
            {/* Weekly Activity Bar Chart (CSS only) */}
            <h3 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-primary-400" />
              本周学习活动
            </h3>
            <div className="flex items-end justify-between h-40 px-4 mb-8">
              {weeklyData.map((d) => {
                const maxVal = Math.max(...weeklyData.map((x) => x.count), 1);
                const heightPercent = (d.count / maxVal) * 100;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1.5 w-8">
                    <span className="text-xs text-gray-400">{d.count}</span>
                    <div
                      className="w-full bg-primary-400 rounded-t-md transition-all duration-500 hover:bg-primary-500 cursor-default"
                      style={{ height: `${Math.max(heightPercent, 8)}%`, minHeight: '8px' }}
                      title={`${d.day}: ${d.count} 次活动`}
                    />
                    <span className="text-xs text-gray-500">{d.day}</span>
                  </div>
                );
              })}
            </div>

            {/* Module Completion Circular Progress */}
            <h3 className="font-semibold text-gray-800 text-sm mb-4">模块完成度</h3>
            <div className="grid grid-cols-4 gap-4">
              {moduleCompletion.map((mod) => {
                const Icon = mod.icon;
                const radius = 28;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (mod.percent / 100) * circumference;
                return (
                  <div key={mod.name} className="text-center">
                    <svg width="72" height="72" viewBox="0 0 72 72" className="mx-auto">
                      <circle cx="36" cy="36" r={radius} fill="none" stroke="#E8EDF2" strokeWidth="6" />
                      <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        fill="none"
                        stroke={mod.color.replace('bg-', '')}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 36 36)"
                        className="transition-all duration-700"
                        style={{
                          stroke:
                            mod.name === '单词'
                              ? '#1B3A5C'
                              : mod.name === '阅读'
                              ? '#FF6B35'
                              : mod.name === '听力'
                              ? '#4CAF50'
                              : '#9333EA',
                        }}
                      />
                      <text x="36" y="39" textAnchor="middle" className="text-xs fill-gray-700 font-bold">
                        {mod.percent}%
                      </text>
                    </svg>
                    <Icon size={14} className={`mx-auto mt-1.5 ${
                      mod.name === '单词' ? 'text-primary-400' :
                      mod.name === '阅读' ? 'text-accent-400' :
                      mod.name === '听力' ? 'text-success-500' : 'text-purple-500'
                    }`} />
                    <p className="text-xs text-gray-500 mt-0.5">{mod.name}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'mistakes' && (
          <>
            <h3 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-1.5">
              <AlertCircle size={16} className="text-danger-400" />
              错题汇总
            </h3>

            {/* Word Mistakes */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">单词错误 ({wordMistakes.length})</h4>
              {wordMistakes.length > 0 ? (
                <ul className="space-y-2">
                  {wordMistakes.slice(0, 10).map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{m.word}</span>
                      <span className="text-xs text-danger-500 bg-danger-50 px-2 py-0.5 rounded">
                        错 {m.mistakeCount} 次
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">暂无错词记录 🎉</p>
              )}
            </div>

            {/* Reading Mistakes */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">阅读薄弱 ({readingMistakes.length})</h4>
              {readingMistakes.length > 0 ? (
                <ul className="space-y-2">
                  {readingMistakes.map(([id]) => (
                    <Link
                      key={id}
                      to={`/reading/${id}`}
                      className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">阅读 #{id}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                    </Link>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">表现不错！</p>
              )}
            </div>

            {/* Listening Mistakes */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">听力薄弱 ({listeningMistakes.length})</h4>
              {listeningMistakes.length > 0 ? (
                <ul className="space-y-2">
                  {listeningMistakes.map(([id]) => (
                    <Link
                      key={id}
                      to={`/listening/${id}`}
                      className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">听力 #{id}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                    </Link>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">表现不错！</p>
              )}
            </div>

            {(wordMistakes.length > 0 || readingMistakes.length > 0 || listeningMistakes.length > 0) && (
              <button
                onClick={() => navigate('/vocabulary/mistakes')}
                className="w-full mt-2 py-2.5 bg-danger-500 text-white rounded-lg text-sm font-semibold hover:bg-danger-600 transition-colors shadow-sm"
              >
                一键复习
              </button>
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            <h3 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-1.5">
              <Heart size={16} className="text-pink-400" />
              我的收藏
            </h3>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
              {([
                { key: 'words' as const, label: `收藏单词 (${favoriteWords.length})` },
                { key: 'readings' as const, label: `收藏阅读 (${favoriteReadings.length})` },
                { key: 'listenings' as const, label: `收藏听力 (${favoriteListenings.length})` },
              ]).map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => setFavSubTab(sub.key)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                    favSubTab === sub.key
                      ? 'bg-white text-primary-500 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Favorites Content */}
            {favSubTab === 'words' && (
              favoriteWords.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {favoriteWords.map((wid) => {
                    const word = vocabularyData.find((w) => w.id === wid);
                    return word ? (
                      <li
                        key={wid}
                        className="flex items-center justify-between py-2.5 px-3 bg-pink-50 rounded-lg"
                      >
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{word.word}</span>
                          <span className="text-xs text-gray-500 ml-2">{word.phonetic}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{word.meaning}</p>
                        </div>
                      </li>
                    ) : null;
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 py-12 text-center">还没有收藏单词</p>
              )
            )}

            {favSubTab === 'readings' && (
              favoriteReadings.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {favoriteReadings.map((rid) => (
                    <Link
                      key={rid}
                      to={`/reading/${rid}`}
                      className="flex items-center justify-between py-2.5 px-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">阅读文章 #{rid}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                    </Link>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 py-12 text-center">还没有收藏阅读</p>
              )
            )}

            {favSubTab === 'listenings' && (
              favoriteListenings.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {favoriteListenings.map((lid) => (
                    <Link
                      key={lid}
                      to={`/listening/${lid}`}
                      className="flex items-center justify-between py-2.5 px-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">听力材料 #{lid}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                    </Link>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 py-12 text-center">还没有收藏听力</p>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
