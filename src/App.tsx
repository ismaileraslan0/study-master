import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { fetchServerState } from './store/useStore';
import { Dashboard } from './pages/Dashboard';
import { PlaylistPlanner } from './pages/PlaylistPlanner';
import { QuestionTracker } from './pages/QuestionTracker';
import { ExamTracker } from './pages/ExamTracker';
import { Analysis } from './pages/Analysis';
import { DailyPlanner } from './pages/DailyPlanner';
import { Subjects } from './pages/Subjects';
import { SubjectDetail } from './pages/SubjectDetail';
import './index.css';

function App() {
  useEffect(() => {
    fetchServerState();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="playlist" element={<PlaylistPlanner />} />
          <Route path="daily-plan" element={<DailyPlanner />} />
          <Route path="questions" element={<QuestionTracker />} />
          <Route path="exams" element={<ExamTracker />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/:id" element={<SubjectDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

