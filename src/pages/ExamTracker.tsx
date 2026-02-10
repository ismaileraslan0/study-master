import { useState } from 'react';
import { useStore } from '../store/useStore';
import { AGS_SUBJECTS, OABT_SUBJECTS, type SubjectResult, type ExamType } from '../types';
import { Plus, Trash2, ClipboardCheck, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface BransSubject {
    key: string;
    label: string;
    questionCount: number;
}

export function ExamTracker() {
    const { examRecords, addExamRecord, deleteExamRecord } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [examType, setExamType] = useState<ExamType>('oabt');
    const [examName, setExamName] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [results, setResults] = useState<Record<string, { correct: number; wrong: number; empty: number }>>({});
    const [wrongTopics, setWrongTopics] = useState('');

    // Branş denemesi için dinamik dersler
    const [bransSubjects, setBransSubjects] = useState<BransSubject[]>([]);
    const [newBransLabel, setNewBransLabel] = useState('');
    const [newBransCount, setNewBransCount] = useState('');

    const subjects = examType === 'ags' ? AGS_SUBJECTS : examType === 'oabt' ? OABT_SUBJECTS : bransSubjects;

    const handleExamTypeChange = (type: ExamType) => {
        setExamType(type);
        setResults({});
        if (type === 'brans') {
            setBransSubjects([]);
        }
    };

    const handleAddBransSubject = () => {
        if (newBransLabel && newBransCount) {
            const key = `brans_${Date.now()}`;
            setBransSubjects([...bransSubjects, {
                key,
                label: newBransLabel,
                questionCount: parseInt(newBransCount) || 0
            }]);
            setNewBransLabel('');
            setNewBransCount('');
        }
    };

    const handleRemoveBransSubject = (key: string) => {
        setBransSubjects(bransSubjects.filter(s => s.key !== key));
        const newResults = { ...results };
        delete newResults[key];
        setResults(newResults);
    };

    const updateResult = (subjectKey: string, field: 'correct' | 'wrong' | 'empty', value: number) => {
        setResults({
            ...results,
            [subjectKey]: {
                correct: results[subjectKey]?.correct || 0,
                wrong: results[subjectKey]?.wrong || 0,
                empty: results[subjectKey]?.empty || 0,
                [field]: value,
            },
        });
    };

    const calculateNet = (correct: number, wrong: number) => {
        return correct - wrong / 4;
    };

    const handleSubmit = () => {
        if (!examName) return;
        if (examType === 'brans' && bransSubjects.length === 0) return;

        const subjectResults: SubjectResult[] = subjects.map((s) => {
            const r = results[s.key] || { correct: 0, wrong: 0, empty: 0 };
            return {
                subject: s.key,
                subjectLabel: s.label,
                correct: r.correct,
                wrong: r.wrong,
                empty: r.empty,
                net: calculateNet(r.correct, r.wrong),
            };
        });

        const totalNet = subjectResults.reduce((sum, r) => sum + r.net, 0);

        addExamRecord({
            date,
            examType,
            examName,
            results: subjectResults,
            totalNet,
            wrongTopics: wrongTopics.split(',').map((t) => t.trim()).filter(Boolean),
            notes: undefined,
        });

        // Reset
        setExamName('');
        setResults({});
        setWrongTopics('');
        setBransSubjects([]);
        setShowModal(false);
    };

    const getTotalNet = () => {
        return subjects.reduce((sum, s) => {
            const r = results[s.key];
            if (!r) return sum;
            return sum + calculateNet(r.correct, r.wrong);
        }, 0);
    };

    const getExamTypeLabel = (type: ExamType) => {
        switch (type) {
            case 'ags': return 'AGS';
            case 'oabt': return 'ÖABT';
            case 'brans': return 'BRANŞ';
        }
    };

    const getExamTypeTagClass = (type: ExamType) => {
        switch (type) {
            case 'ags': return 'tag-warning';
            case 'oabt': return 'tag-success';
            case 'brans': return 'tag-info';
            default: return 'tag-info';
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1>📋 Deneme Takibi</h1>
                    <p>AGS, ÖABT ve Branş deneme sonuçlarını kaydet</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    Deneme Ekle
                </button>
            </div>

            {/* Exam Records */}
            {examRecords.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <ClipboardCheck size={48} />
                        <h3>Henüz deneme girilmedi</h3>
                        <p>İlk deneme sonucunu ekle</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {examRecords.map((exam) => (
                        <div key={exam.id} className="card">
                            <div className="card-header">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="card-title">{exam.examName}</h3>
                                        <span className={`tag ${getExamTypeTagClass(exam.examType)}`}>
                                            {getExamTypeLabel(exam.examType)}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        {format(new Date(exam.date), 'd MMMM yyyy', { locale: tr })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="net-display">{exam.totalNet.toFixed(2)}</div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>TOPLAM NET</span>
                                    </div>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => deleteExamRecord(exam.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Results Table */}
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Ders</th>
                                            <th>Doğru</th>
                                            <th>Yanlış</th>
                                            <th>Boş</th>
                                            <th>Net</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exam.results.map((r) => (
                                            <tr key={r.subject}>
                                                <td>{r.subjectLabel}</td>
                                                <td style={{ color: 'var(--accent-success)' }}>{r.correct}</td>
                                                <td style={{ color: 'var(--accent-danger)' }}>{r.wrong}</td>
                                                <td style={{ color: 'var(--text-muted)' }}>{r.empty}</td>
                                                <td style={{ fontWeight: 600 }}>{r.net.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {exam.wrongTopics.length > 0 && (
                                <div className="mt-4">
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yanlış Yapılan Konular:</span>
                                    <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                                        {exam.wrongTopics.map((topic, i) => (
                                            <span key={i} className="tag tag-danger">{topic}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Exam Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <div className="modal-header">
                            <h2>Yeni Deneme Ekle</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Sınav Türü</label>
                                <div className="checkbox-group">
                                    <label className={`checkbox-item ${examType === 'ags' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="modalExamType"
                                            checked={examType === 'ags'}
                                            onChange={() => handleExamTypeChange('ags')}
                                        />
                                        AGS
                                    </label>
                                    <label className={`checkbox-item ${examType === 'oabt' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="modalExamType"
                                            checked={examType === 'oabt'}
                                            onChange={() => handleExamTypeChange('oabt')}
                                        />
                                        ÖABT
                                    </label>
                                    <label className={`checkbox-item ${examType === 'brans' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="modalExamType"
                                            checked={examType === 'brans'}
                                            onChange={() => handleExamTypeChange('brans')}
                                        />
                                        Branş
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Deneme Adı</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Örn: ÖSYM 2024-1"
                                    value={examName}
                                    onChange={(e) => setExamName(e.target.value)}
                                />
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
                        </div>

                        {/* Branş denemesi için ders ekleme */}
                        {examType === 'brans' && (
                            <div className="form-group" style={{
                                padding: '16px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '12px',
                                marginBottom: '16px'
                            }}>
                                <label className="form-label">Ders Ekle</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ders adı (örn: Analiz)"
                                        value={newBransLabel}
                                        onChange={(e) => setNewBransLabel(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Soru sayısı"
                                        value={newBransCount}
                                        onChange={(e) => setNewBransCount(e.target.value)}
                                        style={{ width: '120px' }}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleAddBransSubject}
                                        disabled={!newBransLabel || !newBransCount}
                                    >
                                        <Plus size={18} />
                                        Ekle
                                    </button>
                                </div>

                                {bransSubjects.length > 0 && (
                                    <div className="mt-3 flex gap-2" style={{ flexWrap: 'wrap' }}>
                                        {bransSubjects.map((s) => (
                                            <span key={s.key} className="tag tag-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {s.label} ({s.questionCount} soru)
                                                <button
                                                    onClick={() => handleRemoveBransSubject(s.key)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Subject Inputs */}
                        {subjects.length > 0 && (
                            <div className="form-group">
                                <label className="form-label">Ders Ders Sonuçlar</label>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Ders</th>
                                                <th>Soru</th>
                                                <th>Doğru</th>
                                                <th>Yanlış</th>
                                                <th>Boş</th>
                                                <th>Net</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subjects.map((s) => {
                                                const r = results[s.key] || { correct: 0, wrong: 0, empty: 0 };
                                                const net = calculateNet(r.correct, r.wrong);
                                                return (
                                                    <tr key={s.key}>
                                                        <td>{s.label}</td>
                                                        <td style={{ color: 'var(--text-muted)' }}>{s.questionCount}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                style={{ width: '70px', padding: '6px 10px' }}
                                                                min="0"
                                                                max={s.questionCount}
                                                                value={r.correct || ''}
                                                                onChange={(e) => updateResult(s.key, 'correct', parseInt(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                style={{ width: '70px', padding: '6px 10px' }}
                                                                min="0"
                                                                max={s.questionCount}
                                                                value={r.wrong || ''}
                                                                onChange={(e) => updateResult(s.key, 'wrong', parseInt(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                style={{ width: '70px', padding: '6px 10px' }}
                                                                min="0"
                                                                max={s.questionCount}
                                                                value={r.empty || ''}
                                                                onChange={(e) => updateResult(s.key, 'empty', parseInt(e.target.value) || 0)}
                                                            />
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>{net.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: 'var(--bg-tertiary)' }}>
                                                <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600 }}>TOPLAM NET:</td>
                                                <td style={{ fontWeight: 700, color: 'var(--accent-primary-light)' }}>
                                                    {getTotalNet().toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Yanlış Yapılan Konular (virgülle ayır)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Örn: Limit, Türev, İntegral"
                                value={wrongTopics}
                                onChange={(e) => setWrongTopics(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={handleSubmit}
                            disabled={!examName || (examType === 'brans' && bransSubjects.length === 0)}
                        >
                            Denemeyi Kaydet
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
