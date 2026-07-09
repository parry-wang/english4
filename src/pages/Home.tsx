import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Headphones,
  PenTool,
  ClipboardList,
  User,
  ArrowRight,
  Flame,
  Target,
  BookMarked,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Home() {
  const { wordProgress, readingProgress, startDate } = useAppStore();

  // Calculate total study days from startDate to today
  const studyDays = Math.max(
    1,
    Math.ceil(
      (new Date().getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Calculate learned words (status !== 'new')
  const learnedWords = Object.values(wordProgress).filter(
    (w) => w.status !== 'new'
  ).length;

  // Calculate total mistakes
  const totalMistakes = Object.values(wordProgress).reduce(
    (sum, w) => sum + (w.mistakeCount || 0),
    0
  );

  // Calculate completed readings
  const completedReadings = Object.values(readingProgress).filter(
    (r) => r.completed
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden px-6 py-16 text-white"
        style={{
          background: 'linear-gradient(135deg, #1B3A5C 0%, #2A5580 50%, #FF6B35 100%)',
        }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            CET-4 英语四级学习平台
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
            全面覆盖词汇、阅读、听力与写作，助你高效备考大学英语四级考试
          </p>
          <Link
            to="/vocabulary/learn"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-[#1B3A5C] shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            开始学习
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Learning Dashboard */}
      <section className="mx-auto -mt-8 max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="今日单词进度"
            value={`${learnedWords}/50`}
            icon={<Flame className="h-6 w-6 text-[#FF6B35]" />}
          />
          <StatCard
            label="累计学习天数"
            value={studyDays}
            icon={<Target className="h-6 w-6 text-[#FF6B35]" />}
          />
          <StatCard
            label="错题数量"
            value={totalMistakes}
            icon={<BookMarked className="h-6 w-6 text-[#FF6B35]" />}
          />
          <StatCard
            label="完成阅读"
            value={completedReadings}
            icon={<BookOpen className="h-6 w-6 text-[#FF6B35]" />}
          />
        </div>
      </section>

      {/* Daily Recommendations */}
      <section className="mx-auto mt-10 max-w-5xl px-6">
        <h2 className="mb-4 text-xl font-bold text-[#1B3A5C]">每日推荐</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <RecommendCard
            title="每日单词推荐"
            description="今日精选单词，每天50个核心词汇"
            icon={<BookOpen className="h-8 w-8 text-[#1B3A5C]" />}
            to="/vocabulary/learn"
            color="bg-blue-50"
          />
          <RecommendCard
            title="每日阅读推荐"
            description="精选阅读篇章，提升理解能力"
            icon={<FileText className="h-8 w-8 text-[#1B3A5C]" />}
            to="/reading"
            color="bg-green-50"
          />
          <RecommendCard
            title="每日听力推荐"
            description="真题听力训练，磨砺耳朵"
            icon={<Headphones className="h-8 w-8 text-[#1B3A5C]" />}
            to="/listening"
            color="bg-orange-50"
          />
        </div>
      </section>

      {/* Quick Entry Navigation */}
      <section className="mx-auto mt-10 max-w-5xl px-6 pb-12">
        <h2 className="mb-4 text-xl font-bold text-[#1B3A5C]">快速入口</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          <QuickEntry icon={<BookOpen className="h-7 w-7" />} label="单词记忆" to="/vocabulary" />
          <QuickEntry icon={<FileText className="h-7 w-7" />} label="阅读理解" to="/reading" />
          <QuickEntry icon={<Headphones className="h-7 w-7" />} label="听力练习" to="/listening" />
          <QuickEntry icon={<PenTool className="h-7 w-7" />} label="作文题材" to="/writing" />
          <QuickEntry icon={<ClipboardList className="h-7 w-7" />} label="试卷练习" to="/exam" />
          <QuickEntry icon={<User className="h-7 w-7" />} label="个人中心" to="/profile" />
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md hover:scale-[1.02]">
      {icon}
      <span className="text-3xl font-bold text-[#1B3A5C]">{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}

function RecommendCard({
  title,
  description,
  icon,
  to,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className={`flex min-w-[220px] flex-col gap-3 rounded-xl p-5 shadow-sm transition hover:shadow-md hover:scale-[1.02] ${color}`}
    >
      {icon}
      <h3 className="font-semibold text-[#1B3A5C]">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[#FF6B35]">
        去学习 <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function QuickEntry({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md hover:scale-[1.02] text-[#1B3A5C]"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}