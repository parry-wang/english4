import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Vocabulary from '@/pages/Vocabulary';
import VocabularyLearn from '@/pages/VocabularyLearn';
import VocabularyQuiz from '@/pages/VocabularyQuiz';
import VocabularyMistakes from '@/pages/VocabularyMistakes';
import VocabularySearch from '@/pages/VocabularySearch';
import Reading from '@/pages/Reading';
import ReadingDetail from '@/pages/ReadingDetail';
import ReadingExplanation from '@/pages/ReadingExplanation';
import Listening from '@/pages/Listening';
import ListeningDetail from '@/pages/ListeningDetail';
import ListeningTranscript from '@/pages/ListeningTranscript';
import Writing from '@/pages/Writing';
import WritingDetail from '@/pages/WritingDetail';
import Exam from '@/pages/Exam';
import ExamGenerate from '@/pages/ExamGenerate';
import ExamTake from '@/pages/ExamTake';
import ExamReview from '@/pages/ExamReview';
import Profile from '@/pages/Profile';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/vocabulary/learn" element={<VocabularyLearn />} />
          <Route path="/vocabulary/quiz" element={<VocabularyQuiz />} />
          <Route path="/vocabulary/mistakes" element={<VocabularyMistakes />} />
          <Route path="/vocabulary/search" element={<VocabularySearch />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/reading/:id" element={<ReadingDetail />} />
          <Route path="/reading/:id/explanation" element={<ReadingExplanation />} />
          <Route path="/listening" element={<Listening />} />
          <Route path="/listening/:id" element={<ListeningDetail />} />
          <Route path="/listening/:id/transcript" element={<ListeningTranscript />} />
          <Route path="/writing" element={<Writing />} />
          <Route path="/writing/:id" element={<WritingDetail />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/exam/generate" element={<ExamGenerate />} />
          <Route path="/exam/take" element={<ExamTake />} />
          <Route path="/exam/review/:id" element={<ExamReview />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}
