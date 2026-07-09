import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardCheck, AlertCircle, Search, Play, ChevronRight, Shuffle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import vocabularyData from '@/data/vocabulary.json';
import type { VocabularyWord } from '@/types';

const words = vocabularyData as VocabularyWord[];
const TOTAL_WORDS = words.length;

export default function Vocabulary() {
  const { wordProgress, startDate } = useAppStore();

  const stats = useMemo(() => {
    const entries = Object.values(wordProgress);
    const mastered = entries.filter(e => e.status === 'mastered').length;
    const learning = entries.filter(e => e.status === 'learning').length;
    const newCount = entries.filter(e => e.status === 'new').length;
    const learned = mastered + learning + newCount;
    return { mastered, learning, newCount, learned };
  }, [wordProgress]);

  const studyDays = useMemo(() => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    return Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
  }, [startDate]);

  const todayLearnedCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return Object.values(wordProgress).filter(
      p => p.lastReviewed && p.lastReviewed.startsWith(today)
    ).length;
  }, [wordProgress]);

  const heatmapData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = Object.values(wordProgress).filter(
        p => p.lastReviewed && p.lastReviewed.startsWith(dateStr)
      ).length;
      days.push({ date: dateStr, count });
    }
    return days;
  }, [wordProgress]);

  const maxHeat = Math.max(...heatmapData.map(d => d.count), 1);

  const circumference = 2 * Math.PI * 54;
  const progressPercent = stats.learned / TOTAL_WORDS;
  const strokeDashoffset = circumference * (1 - progressPercent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-500">单词记忆</h1>
        <p className="text-sm text-gray-500 mt-1">CET-4 核心词汇 {TOTAL_WORDS} 词 · 随机模式</p>
      </div>

      {/* Progress + Daily Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circular Progress */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-primary-500 mb-4">学习进度</h2>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#E8EDF2" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="#1B3A5C" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-primary-500">{stats.learned}</span>
                <span className="text-xs text-gray-400">已学习</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span className="text-sm text-gray-600">已掌握</span>
                <span className="text-sm font-semibold ml-auto">{stats.mastered}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-400" />
                <span className="text-sm text-gray-600">学习中</span>
                <span className="text-sm font-semibold ml-auto">{stats.learning}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-200" />
                <span className="text-sm text-gray-600">新单词</span>
                <span className="text-sm font-semibold ml-auto">{stats.newCount}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm text-gray-500">未开始</span>
                <span className="text-sm font-semibold ml-auto text-gray-400">{TOTAL_WORDS - stats.learned}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Random Learning Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-sm p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Shuffle size={20} />
            <h2 className="text-lg font-semibold">随机背单词</h2>
          </div>
          <p className="text-3xl font-bold mb-1">随机50词</p>
          <p className="text-primary-200 mb-2">每次从词库中随机抽取</p>
          {todayLearnedCount > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-primary-200 mb-1">
                <span>今日已学</span>
                <span>{todayLearnedCount} 词</span>
              </div>
              <div className="w-full h-2 bg-primary-400/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayLearnedCount / 50) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
          <Link
            to="/vocabulary/learn"
            className="inline-flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Play size={16} />
            {todayLearnedCount > 0 ? '继续练习' : '开始学习'}
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/vocabulary/quiz"
          className="group bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-all border border-transparent hover:border-accent-400/30"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mb-3">
            <ClipboardCheck size={20} className="text-accent-400" />
          </div>
          <h3 className="font-semibold text-primary-500 group-hover:text-accent-400 transition-colors">单词测试</h3>
          <p className="text-sm text-gray-400 mt-1">随机出题检验成果</p>
          <ChevronRight size={16} className="mt-2 text-gray-300 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/vocabulary/mistakes"
          className="group bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-all border border-transparent hover:border-danger-400/30"
        >
          <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center mb-3">
            <AlertCircle size={20} className="text-danger-400" />
          </div>
          <h3 className="font-semibold text-primary-500 group-hover:text-danger-400 transition-colors">错题本</h3>
          <p className="text-sm text-gray-400 mt-1">巩固易错词汇</p>
          <ChevronRight size={16} className="mt-2 text-gray-300 group-hover:text-danger-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/vocabulary/search"
          className="group bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-all border border-transparent hover:border-primary-400/30"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
            <Search size={20} className="text-primary-400" />
          </div>
          <h3 className="font-semibold text-primary-500 group-hover:text-primary-400 transition-colors">词汇检索</h3>
          <p className="text-sm text-gray-400 mt-1">搜索全部 {TOTAL_WORDS} 词</p>
          <ChevronRight size={16} className="mt-2 text-gray-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-primary-500 mb-4">学习统计</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-primary-50 rounded-xl">
            <p className="text-2xl font-bold text-primary-500">{TOTAL_WORDS}</p>
            <p className="text-sm text-gray-500 mt-1">总词数</p>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-xl">
            <p className="text-2xl font-bold text-success-500">{stats.learned}</p>
            <p className="text-sm text-gray-500 mt-1">已学习</p>
          </div>
          <div className="text-center p-4 bg-accent-50 rounded-xl">
            <p className="text-2xl font-bold text-accent-400">{studyDays}</p>
            <p className="text-sm text-gray-500 mt-1">学习天数</p>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-primary-500 mb-4">学习热力图（近30天）</h2>
        <div className="flex gap-1.5 flex-wrap">
          {heatmapData.map((day) => {
            const intensity = day.count === 0 ? 0 : Math.ceil((day.count / maxHeat) * 4);
            const colors = [
              'bg-gray-100',
              'bg-success-100',
              'bg-success-400/60',
              'bg-success-400',
              'bg-success-600',
            ];
            return (
              <div
                key={day.date}
                className={`heatmap-cell w-5 h-5 ${colors[intensity]} cursor-pointer relative`}
                title={`${day.date}: ${day.count} 词`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <span>少</span>
          <div className="w-3 h-3 bg-gray-100 rounded-sm" />
          <div className="w-3 h-3 bg-success-100 rounded-sm" />
          <div className="w-3 h-3 bg-success-400/60 rounded-sm" />
          <div className="w-3 h-3 bg-success-400 rounded-sm" />
          <div className="w-3 h-3 bg-success-600 rounded-sm" />
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
