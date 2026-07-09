import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, FileText, ChevronLeft, ChevronRight, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import readingData from '@/data/reading.json';
import { cn } from '@/lib/utils';
import type { ReadingPassage } from '@/types';

const passages = readingData as ReadingPassage[];

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export default function ReadingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const passageId = Number(id);
  const passage = passages.find((p) => p.id === passageId);

  const readingProgress = useAppStore((s) => s.readingProgress);
  const updateReadingProgress = useAppStore((s) => s.updateReadingProgress);

  const existingProgress = passageId ? readingProgress[passageId] : undefined;
  const alreadyCompleted = existingProgress?.completed ?? false;

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(alreadyCompleted ? existingProgress.answers : {});
  const [submitted, setSubmitted] = useState(alreadyCompleted);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Timer
  useEffect(() => {
    if (submitted) return;
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Split content into paragraphs and add line numbers
  const paragraphs = useMemo(() => {
    if (!passage) return [];
    return passage.content_en.split('\n').filter((l) => l.trim() !== '');
  }, [passage]);

  if (!passage) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-400 text-lg">文章不存在</p>
        <Link to="/reading" className="text-primary-500 hover:underline mt-4 inline-block">返回阅读列表</Link>
      </div>
    );
  }

  const questions = passage.questions;
  const question = questions[currentQ];

  const handleSelectOption = (option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
    updateReadingProgress(passageId, {
      passageId,
      completed: true,
      score: correct,
      answers,
    });
  };

  const allAnswered = questions.every((q) => answers[q.id]);
  const correctCount = submitted ? questions.filter((q) => answers[q.id] === q.correct_answer).length : 0;

  const getOptionKey = (q: typeof question, option: string) => {
    if (option === 'A') return q.option_a;
    if (option === 'B') return q.option_b;
    if (option === 'C') return q.option_c;
    return q.option_d;
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white border-b border-gray-100 px-5 py-3 rounded-t-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reading')} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm line-clamp-1">{passage.title}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              <span className="flex items-center gap-1"><FileText size={12} />{passage.word_count} 词</span>
              <span className="flex items-center gap-1"><Clock size={12} />{passage.estimated_time}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold',
            submitted ? 'bg-gray-100 text-gray-400' : 'bg-primary-50 text-primary-500'
          )}>
            <Clock size={14} />
            {formatTime(elapsed)}
          </div>
        </div>
      </div>

      {/* Main content: left-right split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Article */}
        <div className="w-3/5 border-r border-gray-100 overflow-y-auto bg-gray-50/50">
          <div className="p-6 max-w-none">
            <div className="font-serif leading-8 text-[15px] text-gray-700 space-y-4">
              {paragraphs.map((para, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="text-gray-300 text-xs font-mono w-6 text-right flex-shrink-0 pt-1 select-none">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-justify indent-8">{para}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Questions */}
        <div className="w-2/5 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {/* Question progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-gray-500">
                第 {currentQ + 1} / {questions.length} 题
              </span>
              <div className="flex gap-1">
                {questions.map((q, i) => {
                  const answered = answers[q.id];
                  const isCorrect = submitted && answered === q.correct_answer;
                  const isWrong = submitted && answered && answered !== q.correct_answer;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQ(i)}
                      className={cn(
                        'w-7 h-7 rounded-md text-xs font-medium transition-all',
                        i === currentQ
                          ? 'bg-primary-500 text-white shadow-sm'
                          : isCorrect
                          ? 'bg-success-50 text-success-600'
                          : isWrong
                          ? 'bg-danger-50 text-danger-500'
                          : answered
                          ? 'bg-primary-50 text-primary-500'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question text */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-800 leading-relaxed">
                {currentQ + 1}. {question.question_text}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {OPTION_LABELS.map((label) => {
                const optionText = getOptionKey(question, label);
                const isSelected = answers[question.id] === label;
                const isCorrectOption = submitted && label === question.correct_answer;
                const isWrongSelection = submitted && isSelected && label !== question.correct_answer;

                return (
                  <button
                    key={label}
                    onClick={() => handleSelectOption(label)}
                    disabled={submitted}
                    className={cn(
                      'w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all',
                      isCorrectOption
                        ? 'border-success-500 bg-success-50'
                        : isWrongSelection
                        ? 'border-danger-400 bg-danger-50'
                        : isSelected
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-100 bg-white hover:border-primary-200 hover:bg-primary-50/50',
                      submitted && 'cursor-default'
                    )}
                  >
                    <span className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                      isCorrectOption
                        ? 'bg-success-500 text-white'
                        : isWrongSelection
                        ? 'bg-danger-400 text-white'
                        : isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    )}>
                      {isCorrectOption ? <CheckCircle size={14} /> : isWrongSelection ? <XCircle size={14} /> : label}
                    </span>
                    <span className={cn(
                      'text-sm leading-relaxed pt-0.5',
                      isCorrectOption ? 'text-success-700 font-medium' : isWrongSelection ? 'text-danger-600' : 'text-gray-700'
                    )}>
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation after submission */}
            {submitted && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 mb-1">解析</p>
                <p className="text-sm text-amber-800 leading-relaxed">{question.explanation}</p>
              </div>
            )}
          </div>

          {/* Bottom navigation / submit */}
          <div className="border-t border-gray-100 p-4 bg-white flex-shrink-0">
            {submitted ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-lg font-bold">
                  <span className={cn(correctCount === questions.length ? 'text-success-500' : 'text-primary-500')}>
                    {correctCount}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{questions.length}</span>
                </div>
                <Link
                  to={`/reading/${passageId}/explanation`}
                  className="block w-full text-center py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition shadow-sm"
                >
                  查看详细讲解
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} /> 上一题
                </button>
                {currentQ < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition shadow-sm"
                  >
                    下一题 <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className="flex-1 py-2.5 rounded-xl bg-accent-400 text-white font-medium text-sm hover:bg-accent-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    提交答案
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
