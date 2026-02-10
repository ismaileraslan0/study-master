import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PlayCircle, CheckCircle, FileQuestion, Calendar, ArrowLeft, Target, BookOpen, Youtube } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function SubjectDetail() {
    const { id } = useParams<{ id: string }>();
    const { subjects, playlists, tasks, questionRecords, topics } = useStore();

    const subject = subjects.find(s => s.id === id);
    const subjectTopics = subject ? (topics[subject.id] || []) : [];

    if (!subject) {
        return (
            <div className="p-8 text-center">
                <p>Ders bulunamadı.</p>
                <Link to="/subjects" className="btn btn-primary mt-4 inline-flex">Geri Dön</Link>
            </div>
        );
    }

    // Prepare data structure: Topic -> Content
    const contentByTopic: Record<string, { videos: any[], tasks: any[], questions: any[] }> = {};

    // Initialize for all known topics
    subjectTopics.forEach(topic => {
        contentByTopic[topic] = { videos: [], tasks: [], questions: [] };
    });
    // Add "Uncategorized" topic
    contentByTopic['Genel'] = { videos: [], tasks: [], questions: [] };

    // 1. Filter Videos from Playlists
    playlists.forEach(playlist => {
        playlist.videos.forEach(video => {
            if (video.subject === subject.name) {
                const topic = (video.topic && subjectTopics.includes(video.topic)) ? video.topic : 'Genel';
                contentByTopic[topic].videos.push({ ...video, playlistName: playlist.name });
            }
        });
    });

    // 2. Filter Manual Tasks
    tasks.forEach(task => {
        if (task.subject === subject.name) {
            const topic = (task.topic && subjectTopics.includes(task.topic)) ? task.topic : 'Genel';
            contentByTopic[topic].tasks.push(task);
        }
    });

    // 3. Filter Question Records
    questionRecords.forEach(record => {
        // Match by subjectLabel (display name) which is saved in the record
        if (record.subjectLabel === subject.name) {
            const topic = (record.topic && subjectTopics.includes(record.topic)) ? record.topic : 'Genel';
            contentByTopic[topic].questions.push(record);
        }
    });

    return (
        <div className="fade-in">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Link to="/subjects" className="btn btn-ghost btn-icon">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <BookOpen size={28} className="text-[var(--accent-primary)]" />
                            <h1>{subject.name}</h1>
                        </div>
                        <p className="text-[var(--text-muted)]">
                            {subject.category.toUpperCase()} • {subjectTopics.length} Konu başlığı
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {Object.entries(contentByTopic).map(([topic, content]) => {
                    const hasContent = content.videos.length > 0 || content.tasks.length > 0 || content.questions.length > 0;
                    if (!hasContent && topic === 'Genel') return null; // Hide empty Genel

                    return (
                        <div key={topic} className="card">
                            <h2 className="text-xl font-bold mb-4 pb-2 border-b border-[var(--border-color)] flex items-center gap-2">
                                <Target size={20} className="text-[var(--accent-secondary)]" />
                                {topic}
                            </h2>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Videos Column */}
                                {content.videos.length > 0 && (
                                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                            <Youtube size={16} /> VİDEOLAR ({content.videos.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {content.videos.map(video => (
                                                <div key={video.id} className={`flex items-start gap-2 p-2 rounded ${video.watched ? 'opacity-60' : ''} bg-[var(--bg-primary)]`}>
                                                    <div className="mt-1">
                                                        {video.watched ? <CheckCircle size={14} className="text-[var(--accent-success)]" /> : <PlayCircle size={14} className="text-[var(--accent-warning)]" />}
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm ${video.watched ? 'line-through' : ''}`}>{video.title}</div>
                                                        <div className="text-xs text-[var(--text-muted)]">{video.playlistName}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tasks Column */}
                                {content.tasks.length > 0 && (
                                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                            <Calendar size={16} /> GÖREVLER ({content.tasks.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {content.tasks.map(task => (
                                                <div key={task.id} className={`flex items-start gap-2 p-2 rounded ${task.completed ? 'opacity-60' : ''} bg-[var(--bg-primary)]`}>
                                                    <div className="mt-1">
                                                        {task.completed ? <CheckCircle size={14} className="text-[var(--accent-success)]" /> : <Target size={14} className="text-[var(--accent-primary)]" />}
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm ${task.completed ? 'line-through' : ''}`}>{task.title}</div>
                                                        <div className="text-xs text-[var(--text-muted)]">{format(new Date(task.date), 'd MMM', { locale: tr })}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Questions Column */}
                                {content.questions.length > 0 && (
                                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                            <FileQuestion size={16} /> SORU ÇÖZÜMLERİ
                                        </h3>
                                        <div className="space-y-2">
                                            {content.questions.map(record => (
                                                <div key={record.id} className="p-2 rounded bg-[var(--bg-primary)] text-sm">
                                                    <div className="flex justify-between mb-1">
                                                        <span>{format(new Date(record.date), 'd MMM', { locale: tr })}</span>
                                                        <span className="font-bold">{record.totalQuestions} Soru</span>
                                                    </div>
                                                    <div className="flex gap-2 text-xs">
                                                        <span className="text-[var(--accent-success)]">{record.correctAnswers} D</span>
                                                        <span className="text-[var(--accent-danger)]">{record.wrongAnswers} Y</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
