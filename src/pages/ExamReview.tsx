import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Headphones,
  BookOpen,
  PenTool,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Target,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function ExamReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'listening' | 'reading' | 'writing'>('listening');
  const examRecords = useAppStore((s) => s.examRecords);

  const record = examRecords.find((r) => r.id === id);

  if (!record) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>考试记录未找到</p>
        <Link to="/exam" className="text-sm text-primary-500 mt-2 inline-block">返回试卷练习</Link>
      </div>
    );
  }

  const tabs = [
    { key: 'listening' as const, label: '听力', icon: Headphones },
    { key: 'reading' as const, label: '阅读', icon: BookOpen },
    { key: 'writing' as const, label: '作文', icon: PenTool },
  ];

  // Score data
  const scores = [
    { label: '听力', score: record.listeningScore, max: 100 },
    { label: '阅读', score: record.readingScore, max: 100 },
    { label: '作文', score: record.writingScore, max: 100 },
  ];

  // Weak area analysis
  const getWeakAreas = () => {
    const areas: string[] = [];
    if (record.listeningScore < 60) areas.push('听力');
    if (record.readingScore < 60) areas.push('阅读');
    if (record.writingScore < 60) areas.push('作文');
    return areas;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m}分钟`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/exam')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        返回试卷练习
      </button>

      {/* Score Overview Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-xl p-6 shadow-md mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm mb-1">总分</p>
            <p className="text-4xl font-bold">{record.totalScore}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-primary-100">用时 {formatTime(record.timeSpent)}</p>
            <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${
              record.totalScore >= 80 ? 'bg-success-500/30' :
              record.totalScore >= 60 ? 'bg-accent-400/30' : 'bg-danger-500/30'
            }`}>
              {record.totalScore >= 80 ? '优秀' : record.totalScore >= 60 ? '及格' : '需努力'}
            </p>
          </div>
        </div>

        {/* Score Bars */}
        <div className="mt-5 space-y-3">
          {scores.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span>{item.label}</span>
                <span>{item.score}/{item.max}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    item.score >= 80 ? 'bg-success-400' :
                    item.score >= 60 ? 'bg-accent-300' : 'bg-danger-400'
                  }`}
                  style={{ width: `${(item.score / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const score = tab.key === 'listening' ? record.listeningScore :
                        tab.key === 'reading' ? record.readingScore :
                        record.writingScore;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-primary-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} className="mb-0.5" />
              {tab.label}
              <span className="text-[10px] opacity-70">{score}分</span>
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        {activeTab !== 'writing' ? (
          /* Listening / Reading Review */
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">
              {activeTab === 'listening' ? '听力题目' : '阅读题目'}
            </h3>
            <p className="text-xs text-gray-400">
              此页面展示各题答题情况（详细题目数据在生成时已记录，此处显示分数概览）
            </p>
            <div className="grid grid-cols-10 gap-2 pt-4">
              {Array.from({
                length:
                  activeTab === 'listening'
                    ? Math.round((record.listeningScore / 100) * 10)
                    : Math.round((record.readingScore / 100) * 10),
              }).map((_, i) => (
                <div key={i} className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
                  <CheckCircle size={16} className="text-success-500" />
                </div>
              ))}
              {Array.from({
                length: 10 -
                  (activeTab === 'listening'
                    ? Math.round((record.listeningScore / 100) * 10)
                    : Math.round((record.readingScore / 100) * 10)),
              }).map((_, i) => (
                <div key={i} className="w-8 h-8 bg-danger-50 rounded-lg flex items-center justify-center">
                  <XCircle size={16} className="text-danger-400" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Writing Review */
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">作文评分</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                作文得分：<span className="font-bold text-primary-500">{record.writingScore}/100</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                作文内容已提交并自动评分，建议查看范文进行对比学习。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Analysis */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-400" />
          成绩分析
        </h2>

        {/* Visual Bar Chart */}
        <div className="space-y-4 mb-6">
          {scores.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className={`font-semibold ${
                  item.score >= 80 ? 'text-success-500' :
                  item.score >= 60 ? 'text-accent-400' : 'text-danger-400'
                }`}>{item.score}%</span>
              </div>
              <div className="h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2 text-xs font-medium ${
                    item.score >= 80 ? 'bg-success-500 text-white' :
                    item.score >= 60 ? 'bg-accent-400 text-white' : 'bg-danger-400 text-white'
                  }`}
                  style={{ width: `${Math.max(item.score, 5)}%` }}
                >
                  {item.score > 15 && `${item.score}%`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weak Areas */}
        {getWeakAreas().length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
              <AlertCircle size={16} />
              需要加强的模块
            </h3>
            <ul className="space-y-2">
              {getWeakAreas().map((area) => (
                <li key={area} className="text-sm text-amber-800 flex items-center gap-2">
                  <Target size={14} />
                  <span>{area} - 建议增加{area}练习量</span>
                  <Link
                    to={
                      area === '听力'
                        ? '/listening'
                        : area === '阅读'
                        ? '/reading'
                        : '/writing'
                    }
                    className="ml-auto text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                  >
                    去练习
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {getWeakAreas().length === 0 && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <p className="text-sm text-success-700 flex items-center gap-2">
              <CheckCircle size={16} />
              表现优秀！各科目成绩均衡，继续保持！
            </p>
          </div>
        )}

        {/* Suggestion */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            to="/exam/generate"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm"
          >
            再次挑战
          </Link>
        </div>
      </div>
    </div>
  );
}
