import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Copy, CheckCircle, Lightbulb, BookOpen, MessageSquare } from 'lucide-react';
import writingData from '@/data/writing.json';
import { useAppStore } from '@/store/useAppStore';

export default function WritingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sample' | 'points' | 'expressions'>('sample');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const addCompletedWriting = useAppStore((s) => s.addCompletedWriting);
  const completedWritings = useAppStore((s) => s.completedWritings);

  const topic = writingData.find((t) => t.id === Number(id));

  if (!topic) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>题目未找到</p>
      </div>
    );
  }

  const isCompleted = completedWritings.includes(topic.id);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleMarkComplete = () => {
    addCompletedWriting(topic.id);
  };

  // Highlight key sentences in sample essay
  const highlightEssay = (essay: string) => {
    const keyPhrases = topic.useful_expressions;
    let result = essay;
    // We'll split the essay by newlines and wrap key expressions
    const lines = result.split('\n');
    return lines.map((line, lineIdx) => {
      let elements: (string | JSX.Element)[] = [line];
      keyPhrases.forEach((phrase, phraseIdx) => {
        const newElements: (string | JSX.Element)[] = [];
        elements.forEach((el) => {
          if (typeof el !== 'string') {
            newElements.push(el);
            return;
          }
          const parts = el.split(phrase);
          if (parts.length === 1) {
            newElements.push(el);
          } else {
            parts.forEach((part, i) => {
              if (part) newElements.push(part);
              if (i < parts.length - 1) {
                newElements.push(
                  <span key={`${lineIdx}-${phraseIdx}-${i}`} className="bg-accent-50 text-accent-500 font-medium px-0.5 rounded">
                    {phrase}
                  </span>
                );
              }
            });
          }
        });
        elements = newElements;
      });
      return (
        <span key={lineIdx}>
          {elements}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  const tabs = [
    { key: 'sample' as const, label: '高分范文', icon: BookOpen },
    { key: 'points' as const, label: '写作要点', icon: Lightbulb },
    { key: 'expressions' as const, label: '常用表达', icon: MessageSquare },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/writing')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        返回列表
      </button>

      {/* Title Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-3">{topic.title}</h1>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary-50 text-primary-500 text-sm rounded-lg font-medium">
            {topic.category}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < topic.difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
              />
            ))}
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-success-50 text-success-600 text-xs rounded-full">
              <CheckCircle size={12} /> 已完成
            </span>
          )}
        </div>
      </div>

      {/* Requirement */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold text-primary-500 mb-2 flex items-center gap-1.5">
          <BookOpen size={16} />
          写作要求
        </h2>
        <p className="text-gray-700 text-sm leading-relaxed">{topic.requirement}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-primary-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        {activeTab === 'sample' && (
          <div>
            <h2 className="text-sm font-semibold text-primary-500 mb-4">高分范文</h2>
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {highlightEssay(topic.sample_essay)}
            </div>
          </div>
        )}

        {activeTab === 'points' && (
          <div>
            <h2 className="text-sm font-semibold text-primary-500 mb-4">写作要点</h2>
            <ol className="space-y-3 mb-6">
              {topic.key_points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 text-sm pt-0.5">{point}</span>
                </li>
              ))}
            </ol>

            {/* Tips Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                <Lightbulb size={15} />
                写作小贴士
              </h3>
              <ul className="space-y-1.5">
                {(Array.isArray(topic.tips) ? topic.tips : [topic.tips]).map((tip, idx) => (
                  <li key={idx} className="text-sm text-amber-800 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'expressions' && (
          <div>
            <h2 className="text-sm font-semibold text-primary-500 mb-4">常用表达</h2>
            <ul className="space-y-2">
              {topic.useful_expressions.map((expr, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700 font-medium">{expr}</span>
                  <button
                    onClick={() => handleCopy(expr, idx)}
                    className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-white transition-colors"
                    title="复制"
                  >
                    {copiedIdx === idx ? (
                      <CheckCircle size={16} className="text-success-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mark Complete Button */}
      <button
        onClick={handleMarkComplete}
        disabled={isCompleted}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
          isCompleted
            ? 'bg-success-50 text-success-600 cursor-default'
            : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md active:scale-[0.98]'
        }`}
      >
        {isCompleted ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle size={18} /> 已标记完成
          </span>
        ) : (
          '标记已完成'
        )}
      </button>
    </div>
  );
}
