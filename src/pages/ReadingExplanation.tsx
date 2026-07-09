import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  CheckCircle,
  XCircle,
  BookOpen,
  Languages,
  Lightbulb,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import readingData from '@/data/reading.json';
import { cn } from '@/lib/utils';
import type { ReadingPassage } from '@/types';

const passages = readingData as ReadingPassage[];

type TranslationMode = 'en' | 'cn' | 'bilingual';
type ExplanationTab = 'questions' | 'translation';

const KEY_VOCAB_PATTERNS = [
  /\b(transform|fundamental|integral|democratization|significant|algorithm)\b/gi,
  /\b(immersive|controversial|sustainable|innovation|perspective)\b/gi,
  /\b(mitigate|facilitate|comprehensive|infrastructure|phenomenon)\b/gi,
  /\b(inevitable|consequently|substantial|predominant|diversity)\b/gi,
];

export default function ReadingExplanation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const passageId = Number(id);
  const passage = passages.find((p) => p.id === passageId);
  const readingProgress = useAppStore((s) => s.readingProgress);

  const [activeTab, setActiveTab] = useState<ExplanationTab>('questions');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [translationMode, setTranslationMode] = useState<TranslationMode>('bilingual');

  if (!passage) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-400 text-lg">文章不存在</p>
        <Link to="/reading" className="text-primary-500 hover:underline mt-4 inline-block">返回阅读列表</Link>
      </div>
    );
  }

  const progress = readingProgress[passageId];
  const userAnswers = progress?.answers ?? {};

  // Split content into paragraphs
  const enParagraphs = useMemo(() =>
    passage.content_en.split('\n').filter((l) => l.trim() !== ''),
  [passage.content_en]);

  const cnParagraphs = useMemo(() =>
    passage.content_cn.split('\n').filter((l) => l.trim() !== ''),
  [passage.content_cn]);

  // Highlight key vocab
  const highlightVocab = (text: string): React.ReactNode[] => {
    const parts: (string | JSX.Element)[] = [];
    let keyIndex = 0;
    const remaining = text.replace(KEY_VOCAB_PATTERNS[0], (match) => `__KEY_${keyIndex++}_${match}__`);

    // For simplicity, do basic highlighting on common CET-4 words
    const segments = text.split(/(\b(?:transform|fundamental|integral|democratization|significant|algorithm|immersive|controversial|sustainable|innovation|perspective|mitigate|facilitate|comprehensive|infrastructure|phenomenon|inevitable|consequently|substantial|predominant|diversity)\b)/gi);

    return segments.map((seg, i) => {
      const lower = seg.toLowerCase();
      const isKeyword = /transform|fundamental|integral|democratization|significant|algorithm|immersive|controversial|sustainable|innovation|perspective|mitigate|facilitate|comprehensive|infrastructure|phenomenon|inevitable|consequently|substantial|predominant|diversity/i.test(seg) && lower.length > 3;

      if (isKeyword) {
        return (
          <span
            key={i}
            className="relative group cursor-help"
            title={`重点词汇: ${seg}`}
          >
            <span className="border-b border-dashed border-accent-400 text-primary-600 font-medium">
              {seg}
            </span>
          </span>
        );
      }
      return <span key={i}>{seg}</span>;
    });
  };

  const toggleExpand = (qId: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      return next;
    });
  };

  const getOptionText = (q: typeof passage.questions[0], option: string) => {
    if (option === 'A') return q.option_a;
    if (option === 'B') return q.option_b;
    if (option === 'C') return q.option_c;
    return q.option_d;
  };

  const correctCount = passage.questions.filter((q) => userAnswers[q.id] === q.correct_answer).length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">{passage.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              得分: <span className={cn('font-bold', correctCount === passage.questions.length ? 'text-success-500' : 'text-primary-500')}>
                {correctCount}/{passage.questions.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('questions')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'questions'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          )}
        >
          <BookOpen size={16} />
          习题讲解
        </button>
        <button
          onClick={() => setActiveTab('translation')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'translation'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          )}
        >
          <Languages size={16} />
          原文翻译
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'questions' ? (
        /* ====== 习题讲解 Tab ====== */
        <div className="space-y-3">
          {passage.questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            const isCorrect = userAnswer === question.correct_answer;
            const isExpanded = expandedQuestions.has(question.id);

            return (
              <div key={question.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Question header - clickable to expand/collapse */}
                <button
                  onClick={() => toggleExpand(question.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/80 transition"
                >
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5',
                    isCorrect ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-500'
                  )}>
                    {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                      第{index + 1}题：{question.question_text}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className={cn('font-medium', isCorrect ? 'text-success-600' : 'text-danger-500')}>
                        你的答案: {userAnswer || '(未作答)'}
                        {userAnswer && (
                          isCorrect ? ' ✓ 正确' : ' ✗ 错误'
                        )}
                      </span>
                      {!isCorrect && (
                        <span className="font-medium text-success-600">
                          正确答案: {question.correct_answer}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn(
                      'text-gray-400 flex-shrink-0 transition-transform mt-1',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                {/* Expandable details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                    <div className="mt-3 space-y-2">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const optText = getOptionText(question, opt);
                        const isUserChoice = userAnswer === opt;
                        const isCorrectOpt = opt === question.correct_answer;
                        return (
                          <div
                            key={opt}
                            className={cn(
                              'flex items-start gap-2.5 p-3 rounded-lg text-sm',
                              isCorrectOpt && 'bg-success-50',
                              !isCorrectOpt && isUserChoice && 'bg-danger-50',
                              !isCorrectOpt && !isUserChoice && 'bg-gray-50'
                            )}
                          >
                            <span className={cn(
                              'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0',
                              isCorrectOpt ? 'bg-success-500 text-white' : isUserChoice ? 'bg-danger-400 text-white' : 'bg-gray-200 text-gray-500'
                            )}>
                              {opt}
                            </span>
                            <span className={cn('leading-relaxed', isCorrectOpt ? 'text-success-700 font-medium' : isUserChoice ? 'text-danger-700' : 'text-gray-600')}>
                              {optText}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed explanation */}
                    <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb size={15} className="text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">详细解析</span>
                      </div>
                      <p className="text-sm text-amber-900 leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ====== 原文翻译 Tab ====== */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Mode switcher */}
          <div className="flex items-center gap-1 p-3 border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setTranslationMode('en')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                translationMode === 'en' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-200'
              )}
            >
              English
            </button>
            <button
              onClick={() => setTranslationMode('cn')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                translationMode === 'cn' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-200'
              )}
            >
              中文
            </button>
            <button
              onClick={() => setTranslationMode('bilingual')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                translationMode === 'bilingual' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-200'
              )}
            >
              双语模式
            </button>
          </div>

          {/* Translation content */}
          <div className="max-h-[65vh] overflow-y-auto p-6">
            {translationMode === 'bilingual' ? (
              /* Bilingual side-by-side */
              <div className="grid grid-cols-2 gap-8">
                {/* English column */}
                <div>
                  <h3 className="text-xs font-bold text-primary-500 uppercase tracking-wide mb-4">English Original</h3>
                  <div className="space-y-5 font-serif leading-8 text-[15px] text-gray-700">
                    {enParagraphs.map((para, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-gray-300 text-xs font-mono w-5 text-right flex-shrink-0 pt-2 select-none">
                          {idx + 1}
                        </span>
                        <p className="text-justify indent-8">{highlightVocab(para)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Chinese column */}
                <div>
                  <h3 className="text-xs font-bold text-accent-500 uppercase tracking-wide mb-4">中文翻译</h3>
                  <div className="space-y-5 leading-8 text-[15px] text-gray-600">
                    {cnParagraphs.map((para, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-gray-300 text-xs font-mono w-5 text-right flex-shrink-0 pt-2 select-none">
                          {idx + 1}
                        </span>
                        <p className="text-justify indent-8">{para}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : translationMode === 'en' ? (
              /* English only with highlighted vocab */
              <div className="font-serif leading-9 text-[16px] text-gray-750 max-w-3xl mx-auto space-y-5">
                {enParagraphs.map((para, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-gray-300 text-xs font-mono w-5 text-right flex-shrink-0 pt-2 select-none">
                      {idx + 1}
                    </span>
                    <p className="text-justify indent-10">{highlightVocab(para)}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* Chinese only */
              <div className="leading-9 text-[16px] text-gray-650 max-w-3xl mx-auto space-y-5">
                {cnParagraphs.map((para, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-gray-300 text-xs font-mono w-5 text-right flex-shrink-0 pt-2 select-none">
                      {idx + 1}
                    </span>
                    <p className="text-justify indent-10">{para}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Vocab legend for bilingual mode */}
            {translationMode === 'bilingual' && (
              <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                  <Lightbulb size={13} /> 重点词汇说明
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  文中带有虚线下划线的单词为本篇阅读的重点词汇，鼠标悬停可查看提示。
                  建议在完成练习后，重点关注这些词汇的用法和搭配，有助于提升词汇量和阅读能力。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
