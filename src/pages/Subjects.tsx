import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Plus, Trash2, Book, Tag } from 'lucide-react';

export function Subjects() {
    const { subjects, topics, addTopic, deleteTopic } = useStore();
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [newTopic, setNewTopic] = useState('');

    const toggleExpand = (subjectId: string) => {
        if (expandedSubject === subjectId) {
            setExpandedSubject(null);
        } else {
            setExpandedSubject(subjectId);
            setNewTopic('');
        }
    };

    const handleAddTopic = (subjectId: string) => {
        if (newTopic.trim()) {
            addTopic(subjectId, newTopic.trim());
            setNewTopic('');
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>📚 Dersler ve Konular</h1>
                    <p>Derslerin altındaki konu başlıklarını yönet</p>
                </div>
            </div>

            <div className="card">
                <div className="space-y-4">
                    {subjects.map((subject) => {
                        const isExpanded = expandedSubject === subject.id;
                        const subjectTopics = topics[subject.id] || [];

                        return (
                            <div key={subject.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                                    onClick={() => toggleExpand(subject.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        <div className="flex items-center gap-2">
                                            <Book size={18} className="text-[var(--accent-primary)]" />
                                            <Link to={`/subjects/${subject.id}`} className="font-semibold hover:text-[var(--accent-primary)] hover:underline" onClick={(e) => e.stopPropagation()}>
                                                {subject.name}
                                            </Link>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                                                {subject.category.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-[var(--text-muted)]">
                                        {subjectTopics.length} Konu
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-4 bg-[var(--bg-secondary)] border-t" style={{ borderColor: 'var(--border-color)' }}>
                                        {/* Add Topic Form */}
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Yeni konu ekle..."
                                                value={newTopic}
                                                onChange={(e) => setNewTopic(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(subject.id)}
                                            />
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleAddTopic(subject.id)}
                                                disabled={!newTopic.trim()}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        {/* Topic List */}
                                        {subjectTopics.length === 0 ? (
                                            <div className="text-center py-4 text-[var(--text-muted)] text-sm">
                                                Henüz konu eklenmemiş.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {subjectTopics.map((topic) => (
                                                    <div
                                                        key={topic}
                                                        className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-md group"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Tag size={14} className="text-[var(--text-muted)]" />
                                                            <span>{topic}</span>
                                                        </div>
                                                        <button
                                                            className="text-[var(--accent-danger)] opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--bg-tertiary)] rounded"
                                                            onClick={() => deleteTopic(subject.id, topic)}
                                                            title="Konuyu Sil"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {subjects.length === 0 && (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            Henüz ders eklenmemiş. Lütfen önce ders ekleyin.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
