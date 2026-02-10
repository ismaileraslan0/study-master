// Type definitions for Study Master application

// Days of the week
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
];

// Video types
export type VideoType = 'konu' | 'soru' | 'tekrar';

export const VIDEO_TYPES: { key: VideoType; label: string; icon: string }[] = [
  { key: 'konu', label: 'Konu Anlatımı', icon: '📚' },
  { key: 'soru', label: 'Soru Çözümü', icon: '✏️' },
  { key: 'tekrar', label: 'Genel Tekrar', icon: '🔄' },
];

// Subject/Topic
export interface Subject {
  id: string;
  name: string;
  category: 'ags' | 'oabt' | 'genel';
}

// YouTube Video
export interface Video {
  id: string;
  title: string;
  duration: number; // in minutes
  watched: boolean;
  url?: string; // YouTube link
  thumbnail?: string; // YouTube thumbnail URL
  videoType: VideoType; // Konu, Soru çözüm, Genel tekrar
  subject?: string; // Ders adı (Matematik vb.)
  topic?: string;   // Konu adı (Köklü Sayılar vb.)
  assignedDate?: string; // YYYY-MM-DD format (for DailyPlanner integration)
  playlistId?: string; // Which playlist this video belongs to
}

// Playlist
export interface Playlist {
  id: string;
  name: string;
  subject?: string; // Konu başlığı
  subjectId?: string; // Konu ID
  videos: Video[];
  selectedDays: DayOfWeek[];
  createdAt: string;
  startDate?: string; // YYYY-MM-DD - Playlist başlangıç tarihi
  videosPerDay?: number; // Günde kaç video dağıtılacak
  endDate?: string; // YYYY-MM-DD - Hesaplanan bitiş tarihi
}

// Distributed video plan
export interface DailyPlan {
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  videos: Video[];
}

// AGS Exam Subjects
export const AGS_SUBJECTS = [
  { key: 'sozelMantik', label: 'Sözel Mantık', questionCount: 15 },
  { key: 'sayisalMantik', label: 'Sayısal Mantık', questionCount: 15 },
  { key: 'tarih', label: 'Tarih', questionCount: 6 },
  { key: 'cografya', label: 'Coğrafya', questionCount: 6 },
  { key: 'egitimBilimleri', label: 'Eğitim Bilimleri', questionCount: 30 },
  { key: 'mevzuat', label: 'Mevzuat', questionCount: 8 },
] as const;

// ÖABT Exam Subjects
export const OABT_SUBJECTS = [
  { key: 'analiz', label: 'Analiz', questionCount: 18 },
  { key: 'cebir', label: 'Cebir', questionCount: 12 },
  { key: 'geometri', label: 'Geometri', questionCount: 12 },
  { key: 'uygulamaliMatematik', label: 'Uygulamalı Matematik', questionCount: 8 },
] as const;

export type AGSSubjectKey = typeof AGS_SUBJECTS[number]['key'];
export type OABTSubjectKey = typeof OABT_SUBJECTS[number]['key'];

// Exam type including branch exams
export type ExamType = 'ags' | 'oabt' | 'brans';

// Question practice record
export interface QuestionRecord {
  id: string;
  date: string;
  examType: ExamType;
  subject: string;
  subjectLabel: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  notes?: string;
  topic?: string; // Konu adı (elle girilen)
  topicId?: string; // İlişkili konu ID
}

// Exam subject result
export interface SubjectResult {
  subject: string;
  subjectLabel: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
}

// Full exam record
export interface ExamRecord {
  id: string;
  date: string;
  examType: ExamType;
  examName: string;
  results: SubjectResult[];
  totalNet: number;
  wrongTopics: string[];
  notes?: string;
}

// Store state
export interface StoreState {
  // Subjects/Topics
  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  deleteSubject: (id: string) => void;

  // Playlists
  playlists: Playlist[];
  addPlaylist: (playlist: Omit<Playlist, 'id' | 'createdAt'>) => void;
  updatePlaylist: (id: string, update: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  toggleVideoWatched: (playlistId: string, videoId: string) => void;

  // Question records
  questionRecords: QuestionRecord[];
  addQuestionRecord: (record: Omit<QuestionRecord, 'id'>) => void;
  deleteQuestionRecord: (id: string) => void;

  // Exam records
  examRecords: ExamRecord[];
  addExamRecord: (record: Omit<ExamRecord, 'id'>) => void;
  deleteExamRecord: (id: string) => void;

  // Tasks (Daily Planner)
  tasks: Task[];
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Topics
  topics: Record<string, string[]>; // subjectId -> topicList
  addTopic: (subjectId: string, topic: string) => void;
  deleteTopic: (subjectId: string, topic: string) => void;
}

// Task definition
export interface Task {
  id: string;
  title: string;
  type: 'video' | 'soru' | 'tekrar' | 'diger';
  completed: boolean;
  date: string; // YYYY-MM-DD
  duration?: number; // in minutes
  subject?: string;
  topic?: string;
}
