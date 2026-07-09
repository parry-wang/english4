import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Headphones, BookOpen, PenTool, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface ExamQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  passageId: number;
  passageTitle: string;
  type: 'listening' | 'reading';
}

interface ExamData {
  id: string;
  config: {
    listeningCount: number;
    readingCount: number;
    writingCount: number;
    difficulty: number | null;
    timeLimit: number;
  };
  listeningPassages: Array<{ id: number; title: string }>;
  readingPassages: Array<{ id: number; title: string }>;
  writingTopics: Array<{
    id: number;
    title: string;
    category: string;
    difficulty: number;
    requirement: string;
  }>;
  listeningQuestions: ExamQuestion[];
  readingQuestions: ExamQuestion[];
  createdAt: string;
}

type Section = 'listening' | 'reading' | 'writing';

export default function ExamTake() {
  const navigate = useNavigate();
  const addExamRecord = useAppStore((s) => s.addExamRecord);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>('listening');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writingAnswers, setWritingAnswers] = useState<Record<number, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Load exam data
  useEffect(() => {
    const stored = sessionStorage.getItem('currentExam');
    if (!stored) {
      navigate('/exam');
      return;
    }
    try {
      const data = JSON.parse(stored) as ExamData;
      setExamData(data);
      setTimeLeft(data.config.timeLimit * 60);
    } catch {
      navigate('/exam');
    }
  }, [navigate]);

  // Timer
  useEffect(() => {
    if (!examData) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examData]);

  const handleSubmit = useCallback(() => {
    if (!examData) return;
    clearInterval(timerRef.current);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Calculate scores
    let listeningCorrect = 0;
    let listeningTotal = examData.listeningQuestions.length;
    examData.listeningQuestions.forEach((q) => {
      if (answers[`l_${q.id}`] === q.correct_answer) listeningCorrect++;
    });

    let readingCorrect = 0;
    let readingTotal = examData.readingQuestions.length;
    examData.readingQuestions.forEach((q) => {
      if (answers[`r_${q.id}`] === q.correct_answer) readingCorrect++;
    });

    const listeningScore = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 100) : 0;
    const readingScore = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 100) : 0;
    const writingScore = examData.writingTopics.length > 0
      ? Object.keys(writingAnswers).length > 0
        ? Math.round(Object.values(writingAnswers).reduce((sum, a) => sum + (a.length > 50 ? 70 : a.length > 20 ? 50 : 30), 0) / examData.writingTopics.length)
        : 0
      : 0;
    const totalScore = Math.round(
      ((listeningScore + readingScore + writingScore) / 3)
    );

    const record = {
      id: examData.id,
      createdAt: examData.createdAt,
      totalScore,
      listeningScore,
      readingScore,
      writingScore,
      timeSpent,
      answers,
    };

    addExamRecord(record);
    sessionStorage.removeItem('currentExam');
    navigate(`/exam/review/${examData.id}`);
  }, [examData, answers, writingAnswers, startTime, addExamRecord, navigate]);

  if (!examData) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const sections: { key: Section; label: string; icon: typeof Headphones; count: number }[] = [
    { key: 'listening', label: '听力', icon: Headphones, count: examData.listeningQuestions.length },
    { key: 'reading', label: '阅读', icon: BookOpen, count: examData.readingQuestions.length },
    { key: 'writing', label: '作文', icon: PenTool, count: examData.writingTopics.length },
  ];

  const getCurrentQuestions = () => {
    if (currentSection === 'listening') return examData.listeningQuestions;
    if (currentSection === 'reading') return examData.readingQuestions;
    return [];
  };

  const currentQuestions = getCurrentQuestions();
  const currentQuestion = currentSection !== 'writing' && currentQuestions[currentQIndex]
    ? currentQuestions[currentQIndex]
    : null;

  const isLowTime = timeLeft < 300;

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col" style={{ marginLeft: '0' }}>
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = currentSection === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => {
                  setCurrentSection(sec.key);
                  setCurrentQIndex(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon size={15} />
                {sec.label}
                <span className={`text-xs ${isActive ? 'text-primary-100' : 'text-gray-400'}`}>
                  ({sec.count})
                </span>
              </button>
            );
          })}
        </div>

        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg ${
          isLowTime ? 'bg-danger-50 text-danger-500' : 'bg-primary-50 text-primary-500'
        }`}>
          <Clock size={16} />
          <span className="font-mono font-semibold text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {currentSection === 'writing' ? (
            /* Writing Section */
            <div className="space-y-6">
              {examData.writingTopics.map((topic, idx) => (
                <div key={topic.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="font-semibold text-gray-800">{topic.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{topic.requirement}</p>
                  <textarea
                    value={writingAnswers[topic.id] || ''}
                    onChange={(e) => setWritingAnswers((prev) => ({ ...prev, [topic.id]: e.target.value }))}
                    placeholder="在此输入你的作文..."
                    className="w-full h-64 p-4 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                  />
                  <p className="text-xs text-gray-400 mt-2 text-right">
                    已输入 {(writingAnswers[topic.id] || '').length} 字
                  </p>
                </div>
              ))}
            </div>
          ) : currentQuestion ? (
            /* Listening / Reading Question */
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary-50 text-primary-500 rounded">
                  {currentSection === 'listening' ? '听力' : '阅读'}
                </span>
                <span>{currentQuestion.passageTitle}</span>
              </div>
              <h3 className="text-base font-medium text-gray-800 mb-5 leading-relaxed">
                {currentQIndex + 1}. {currentQuestion.question_text}
              </h3>
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const key = `${currentSection === 'listening' ? 'l' : 'r'}_${currentQuestion.id}`;
                  const optionText = currentQuestion[`option_${opt.toLowerCase()}` as keyof Pick<typeof currentQuestion, 'option_a' | 'option_b' | 'option_c' | 'option_d'>];
                  const isSelected = answers[key] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers((prev) => ({ ...prev, [key]: opt }))}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
                        isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {opt}
                      </span>
                      {optionText}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">该部分无题目</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentSection === 'writing' || currentQIndex === 0}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> 上一题
          </button>

          {/* Question Dots */}
          {currentSection !== 'writing' && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-md px-2">
              {currentQuestions.map((q, idx) => {
                const key = `${currentSection === 'listening' ? 'l' : 'r'}_${q.id}`;
                const isAnswered = !!answers[key];
                const isCurrent = idx === currentQIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-7 h-7 rounded-full text-xs font-medium flex-shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-primary-500 text-white shadow-sm'
                        : isAnswered
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.min(currentQuestions.length - 1, prev + 1))}
              disabled={currentSection === 'writing' || currentQIndex >= currentQuestions.length - 1}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              下一题 <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2.5 bg-accent-400 text-white rounded-lg text-sm font-semibold hover:bg-accent-500 transition-colors shadow-sm"
            >
              提交试卷
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">确认提交？</h3>
                <p className="text-xs text-gray-500">提交后无法修改答案</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <p>已答: {
                Object.keys(answers).length + Object.keys(writingAnswers).filter(k => writingAnswers[Number(k)]?.length > 0).length
              } 题</p>
              <p>未答: {
                (examData.listeningQuestions.length + examData.readingQuestions.length + examData.writingTopics.length) -
                (Object.keys(answers).length + Object.keys(writingAnswers).filter(k => writingAnswers[Number(k)]?.length > 0).length)
              } 题</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-lg bg-accent-400 text-white text-sm font-semibold hover:bg-accent-500 transition-colors"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
