import { useState } from 'react';
import { useStore } from '../store/useStore';
import { AGS_SUBJECTS, OABT_SUBJECTS } from '../types';
import { Plus, Trash2, FileQuestion } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';


export function QuestionTracker() {
    const { questionRecords, addQuestionRecord, deleteQuestionRecord, subjects: storeSubjects, topics: storeTopics } = useStore();
    const [examType, setExamType] = useState<'ags' | 'oabt'>('oabt');
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState(''); // NEW: Topic state
    const [totalQuestions, setTotalQuestions] = useState('');
    const [correctAnswers, setCorrectAnswers] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');

    const subjects = examType === 'ags' ? AGS_SUBJECTS : OABT_SUBJECTS;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject || !totalQuestions || !correctAnswers) return;

        const total = parseInt(totalQuestions);
        const correct = parseInt(correctAnswers);
        const wrong = total - correct;
        const subjectData = subjects.find((s) => s.key === subject);

        addQuestionRecord({
            date,
            examType,
            subject,
            subjectLabel: subjectData?.label || subject,
            totalQuestions: total,
            correctAnswers: correct,
            wrongAnswers: wrong,
            topic: topic || undefined, // NEW: Save topic
            notes: notes || undefined,
        });

        // Reset form
        setSubject('');
        setTopic('');
        setTotalQuestions('');
        setCorrectAnswers('');
        setNotes('');
    };

    // Calculate stats by subject
    const getSubjectStats = () => {
        const stats: Record<string, { total: number; correct: number; wrong: number }> = {};

        questionRecords.forEach((record) => {
            if (!stats[record.subjectLabel]) {
                stats[record.subjectLabel] = { total: 0, correct: 0, wrong: 0 };
            }
            stats[record.subjectLabel].total += record.totalQuestions;
            stats[record.subjectLabel].correct += record.correctAnswers;
            stats[record.subjectLabel].wrong += record.wrongAnswers;
        });

        return Object.entries(stats).map(([label, data]) => ({
            label,
            ...data,
            success: Math.round((data.correct / data.total) * 100),
        }));
    };

    const subjectStats = getSubjectStats();

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>✏️ Soru Takibi</h1>
                <p>Çözdüğün soruları kaydet ve analiz et</p>
            </div>

            <div className="grid-2">
                {/* Add Question Form */}
                <div className="card">
                    <h3 className="card-title mb-4">Yeni Kayıt Ekle</h3>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Sınav Türü</label>
                            <div className="checkbox-group">
                                <label className={`checkbox-item ${examType === 'ags' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="examType"
                                        checked={examType === 'ags'}
                                        onChange={() => { setExamType('ags'); setSubject(''); setTopic(''); }}
                                    />
                                    AGS
                                </label>
                                <label className={`checkbox-item ${examType === 'oabt' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="examType"
                                        checked={examType === 'oabt'}
                                        onChange={() => { setExamType('oabt'); setSubject(''); setTopic(''); }}
                                    />
                                    ÖABT
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Ders</label>
                            <select
                                className="form-select"
                                value={subject}
                                onChange={(e) => { setSubject(e.target.value); setTopic(''); }}
                            >
                                <option value="">Ders Seçin</option>
                                {subjects.map((s) => (
                                    <option key={s.key} value={s.key}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Topic Dropdown */}
                        <div className="form-group">
                            <label className="form-label">Konu (Opsiyonel)</label>
                            {(() => {
                                // Find topics for the selected subject
                                const subjectData = subjects.find(s => s.key === subject);
                                const matchedStoreSubject = storeSubjects.find(s => s.name === subjectData?.label);
                                const availableTopics = matchedStoreSubject ? (storeTopics[matchedStoreSubject.id] || []) : [];
                                return availableTopics.length > 0 ? (
                                    <select
                                        className="form-select"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                    >
                                        <option value="">Konu Seçin</option>
                                        {availableTopics.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={subject ? 'Henüz tanımlı konu yok, elle girin...' : 'Önce ders seçin'}
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                    />
                                );
                            })()}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Toplam Soru</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={totalQuestions}
                                    onChange={(e) => setTotalQuestions(e.target.value)}
                                    min="1"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Doğru Sayısı</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={correctAnswers}
                                    onChange={(e) => setCorrectAnswers(e.target.value)}
                                    min="0"
                                    max={totalQuestions}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tarih</label>
                            <input
                                type="date"
                                className="form-input"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notlar (opsiyonel)</label>
                            <textarea
                                className="form-textarea"
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Zor konular, hatırlatmalar..."
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            <Plus size={20} />
                            Kaydet
                        </button>
                    </form>
                </div>

                {/* Subject Stats */}
                <div className="card">
                    <h3 className="card-title mb-4">Konu Bazlı Analiz</h3>

                    {subjectStats.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {subjectStats.map((stat) => (
                                <div
                                    key={stat.label}
                                    style={{
                                        padding: '12px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span style={{ fontWeight: 500 }}>{stat.label}</span>
                                        <span className={`tag ${stat.success >= 70 ? 'tag-success' : stat.success >= 50 ? 'tag-warning' : 'tag-danger'}`}>
                                            %{stat.success}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${stat.success}%`,
                                                background: stat.success >= 70
                                                    ? 'var(--gradient-success)'
                                                    : stat.success >= 50
                                                        ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                                                        : 'var(--gradient-danger)'
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span>{stat.total} soru</span>
                                        <span style={{ color: 'var(--accent-success)' }}>{stat.correct} doğru</span>
                                        <span style={{ color: 'var(--accent-danger)' }}>{stat.wrong} yanlış</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FileQuestion size={48} />
                            <h3>Henüz kayıt yok</h3>
                            <p>Soru çözdükçe istatistikler burada görünecek</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Records */}
            <div className="card mt-6">
                <h3 className="card-title mb-4">Son Kayıtlar</h3>

                {questionRecords.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Sınav</th>
                                    <th>Ders</th>
                                    <th>Konu</th>
                                    <th>Toplam</th>
                                    <th>Doğru</th>
                                    <th>Yanlış</th>
                                    <th>Başarı</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {questionRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td>{format(new Date(record.date), 'd MMM yyyy', { locale: tr })}</td>
                                        <td>
                                            <span className={`tag ${record.examType === 'ags' ? 'tag-warning' : 'tag-success'}`}>
                                                {record.examType.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{record.subjectLabel}</td>
                                        <td className="text-sm text-gray-400">{record.topic || '-'}</td>
                                        <td>{record.totalQuestions}</td>
                                        <td style={{ color: 'var(--accent-success)' }}>{record.correctAnswers}</td>
                                        <td style={{ color: 'var(--accent-danger)' }}>{record.wrongAnswers}</td>
                                        <td>%{Math.round((record.correctAnswers / record.totalQuestions) * 100)}</td>
                                        <td>
                                            <button
                                                className="btn btn-icon btn-danger btn-sm"
                                                onClick={() => deleteQuestionRecord(record.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FileQuestion size={48} />
                        <h3>Henüz kayıt yok</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
