import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sliders, Headphones, BookOpen, PenTool, Play } from 'lucide-react';
import readingData from '@/data/reading.json';
import listeningData from '@/data/listening.json';
import writingData from '@/data/writing.json';

interface ExamConfig {
  listeningCount: number;
  readingCount: number;
  writingCount: number;
  difficulty: number | null;
  timeLimit: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ExamGenerate() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ExamConfig>({
    listeningCount: 10,
    readingCount: 10,
    writingCount: 1,
    difficulty: null,
    timeLimit: 60,
  });

  const updateConfig = (partial: Partial<ExamConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleGenerate = () => {
    // Filter by difficulty if set
    const filteredListening = config.difficulty
      ? listeningData.filter((p) => p.difficulty === config.difficulty)
      : listeningData;
    const filteredReading = config.difficulty
      ? readingData.filter((p) => p.difficulty === config.difficulty)
      : readingData;
    const filteredWriting = config.difficulty
      ? writingData.filter((t) => t.difficulty === config.difficulty)
      : writingData;

    // Randomly select questions
    const selectedListening = shuffleArray(filteredListening).slice(0, config.listeningCount);
    const selectedReading = shuffleArray(filteredReading).slice(0, config.readingCount);
    const selectedWriting = shuffleArray(filteredWriting).slice(0, config.writingCount);

    // Collect all questions with passage references
    const listeningQuestions = selectedListening.flatMap((passage) =>
      passage.questions.map((q) => ({
        ...q,
        passageId: passage.id,
        passageTitle: passage.title,
        type: 'listening' as const,
      }))
    );
    const readingQuestions = selectedReading.flatMap((passage) =>
      passage.questions.map((q) => ({
        ...q,
        passageId: passage.id,
        passageTitle: passage.title,
        type: 'reading' as const,
      }))
    );

    const examData = {
      id: Date.now().toString(),
      config,
      listeningPassages: selectedListening,
      readingPassages: selectedReading,
      writingTopics: selectedWriting,
      listeningQuestions,
      readingQuestions,
      createdAt: new Date().toISOString(),
    };

    sessionStorage.setItem('currentExam', JSON.stringify(examData));
    navigate('/exam/take');
  };

  const totalQuestions = config.listeningCount + config.readingCount + config.writingCount;
  const maxListening = listeningData.length;
  const maxReading = readingData.length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/exam')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        返回试卷练习
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
            <Sliders size={20} className="text-primary-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">试卷生成器</h1>
            <p className="text-xs text-gray-500">自定义参数，智能组卷</p>
          </div>
        </div>

        {/* Listening Count */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Headphones size={15} className="text-primary-400" />
            听力题数量
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={25}
              value={config.listeningCount}
              onChange={(e) => updateConfig({ listeningCount: Number(e.target.value) })}
              className="flex-1 accent-primary-500"
            />
            <span className="w-10 text-center text-sm font-semibold text-primary-500">
              {config.listeningCount}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">可用题库: {maxListening} 题</p>
        </div>

        {/* Reading Count */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <BookOpen size={15} className="text-primary-400" />
            阅读题数量
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={25}
              value={config.readingCount}
              onChange={(e) => updateConfig({ readingCount: Number(e.target.value) })}
              className="flex-1 accent-primary-500"
            />
            <span className="w-10 text-center text-sm font-semibold text-primary-500">
              {config.readingCount}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">可用题库: {maxReading} 题</p>
        </div>

        {/* Writing Count */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <PenTool size={15} className="text-primary-400" />
            作文题数量
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => updateConfig({ writingCount: n })}
                className={`w-12 h-10 rounded-lg text-sm font-medium transition-all ${
                  config.writingCount === n
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">难度</label>
          <div className="flex gap-2">
            {[
              { value: null, label: '全部' },
              { value: 1, label: '简单' },
              { value: 2, label: '中等' },
              { value: 3, label: '较难' },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => updateConfig({ difficulty: opt.value })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  config.difficulty === opt.value
                    ? 'bg-accent-400 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Limit */}
        <div className="mb-8">
          <label className="text-sm font-medium text-gray-700 mb-2 block">考试时间</label>
          <div className="flex gap-2">
            {[30, 60, 90, 120].map((t) => (
              <button
                key={t}
                onClick={() => updateConfig({ timeLimit: t })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  config.timeLimit === t
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}分钟
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">试卷预览</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-3">
              <Headphones size={18} className="mx-auto text-primary-400 mb-1" />
              <p className="text-lg font-bold text-gray-800">{config.listeningCount}</p>
              <p className="text-xs text-gray-500">听力题</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <BookOpen size={18} className="mx-auto text-primary-400 mb-1" />
              <p className="text-lg font-bold text-gray-800">{config.readingCount}</p>
              <p className="text-xs text-gray-500">阅读题</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <PenTool size={18} className="mx-auto text-primary-400 mb-1" />
              <p className="text-lg font-bold text-gray-800">{config.writingCount}</p>
              <p className="text-xs text-gray-500">作文题</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            共 {totalQuestions} 题 · {config.timeLimit} 分钟
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-600 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <Play size={18} />
          生成试卷
        </button>
      </div>
    </div>
  );
}
