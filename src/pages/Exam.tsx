import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Clock, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Exam() {
  const examRecords = useAppStore((s) => s.examRecords);

  const totalExams = examRecords.length;
  const avgScore = totalExams > 0
    ? Math.round(examRecords.reduce((sum, r) => sum + r.totalScore, 0) / totalExams)
    : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-500">试卷练习</h1>
        <p className="text-sm text-gray-500 mt-1">模拟真实考试环境，检验学习成果</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={16} className="text-primary-400" />
            <span className="text-xs text-gray-500">已考次数</span>
          </div>
          <p className="text-2xl font-bold text-primary-500">{totalExams}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-accent-400" />
            <span className="text-xs text-gray-500">平均分</span>
          </div>
          <p className="text-2xl font-bold text-accent-400">{avgScore}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-success-500" />
            <span className="text-xs text-gray-500">最高分</span>
          </div>
          <p className="text-2xl font-bold text-success-500">
            {totalExams > 0 ? Math.max(...examRecords.map((r) => r.totalScore)) : '-'}
          </p>
        </div>
      </div>

      {/* Generate New Exam Card */}
      <Link
        to="/exam/generate"
        className="flex items-center gap-4 bg-gradient-to-r from-primary-500 to-primary-400 text-white rounded-xl p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 mb-6"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Plus size={24} />
        </div>
        <div>
          <h2 className="font-semibold text-lg">生成新试卷</h2>
          <p className="text-primary-100 text-sm">自定义题量和难度，智能组卷</p>
        </div>
      </Link>

      {/* Recent Exam Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">考试记录</h2>
        </div>

        {examRecords.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">还没有考试记录</p>
            <p className="text-xs mt-1">点击上方按钮生成新试卷</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...examRecords].reverse().map((record) => (
              <Link
                key={record.id}
                to={`/exam/review/${record.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Calendar size={18} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-primary-500 transition-colors">
                      {formatDate(record.createdAt)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> {formatTime(record.timeSpent)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    record.totalScore >= 80 ? 'text-success-500' :
                    record.totalScore >= 60 ? 'text-accent-400' : 'text-danger-400'
                  }`}>
                    {record.totalScore}
                  </p>
                  <p className="text-xs text-gray-400">总分</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
