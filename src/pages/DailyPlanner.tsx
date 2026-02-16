import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Check, X, PlayCircle, BookOpen, Target, Repeat } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Video, Task } from '../types';



const TASK_TYPES = [
    { key: 'video', label: 'Video İzle', icon: PlayCircle, color: 'var(--accent-primary)' },
    { key: 'soru', label: 'Soru Çöz', icon: BookOpen, color: 'var(--accent-success)' },
    { key: 'tekrar', label: 'Tekrar', icon: Repeat, color: 'var(--accent-warning)' },
    { key: 'diger', label: 'Diğer', icon: Target, color: 'var(--text-secondary)' },
];

export function DailyPlanner() {
    const { playlists, toggleVideoWatched, tasks, addTask, toggleTask, deleteTask, subjects, topics } = useStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // New task form
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskType, setNewTaskType] = useState<Task['type']>('video');
    const [newTaskDuration, setNewTaskDuration] = useState('');
    const [newTaskSubject, setNewTaskSubject] = useState('');
    const [newTaskTopic, setNewTaskTopic] = useState('');

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
    const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const goToToday = () => setCurrentDate(new Date());

    const getTasksForDate = (date: Date) => {
        return tasks.filter(t => t.date === format(date, 'yyyy-MM-dd'));
    };

    // Get playlist videos assigned to a specific date
    const getPlaylistVideosForDate = (date: Date): Array<Video & { playlistName: string }> => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const result: Array<Video & { playlistName: string }> = [];

        playlists.forEach(playlist => {
            const dayVideos = playlist.videos.filter(v => v.assignedDate === dateStr);
            dayVideos.forEach(video => {
                result.push({ ...video, playlistName: playlist.name, playlistId: playlist.id });
            });
        });

        return result;
    };

    const handleAddTask = () => {
        if (newTaskTitle && selectedDate) {
            const task: Task = {
                id: `task-${Date.now()}`,
                title: newTaskTitle,
                type: newTaskType,
                completed: false,
                date: format(selectedDate, 'yyyy-MM-dd'),
                duration: newTaskDuration ? parseInt(newTaskDuration) : undefined,
                subject: newTaskSubject || undefined,
                topic: newTaskTopic || undefined,
            };
            addTask(task);
            setNewTaskTitle('');
            setNewTaskDuration('');
            setShowAddModal(false);
        }
    };

    const toggleTaskComplete = (taskId: string) => {
        toggleTask(taskId);
    };

    const handleDeleteTask = (taskId: string) => {
        deleteTask(taskId);
    };

    const openAddModal = (date: Date) => {
        setSelectedDate(date);
        setShowAddModal(true);
    };

    const getTaskIcon = (type: Task['type']) => {
        const found = TASK_TYPES.find(t => t.key === type);
        if (found) {
            const Icon = found.icon;
            return <Icon size={16} color={found.color} />;
        }
        return <Target size={16} />;
    };

    const today = new Date();
    const todayTasks = getTasksForDate(today);
    const completedTodayCount = todayTasks.filter(t => t.completed).length;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>📅 Günlük Plan</h1>
                    <p>Haftalık çalışma programını yönet</p>
                </div>
            </div>

            {/* Today Summary Card */}
            <div className="card mb-4" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-dark) 100%)' }}>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 style={{ color: 'white', marginBottom: '4px' }}>Bugün - {format(today, 'd MMMM yyyy', { locale: tr })}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                            {(() => {
                                const playlistVideos = getPlaylistVideosForDate(today);
                                const totalItems = todayTasks.length + playlistVideos.length;
                                const completedPlaylistVideos = playlistVideos.filter(v => v.watched).length;
                                const totalCompleted = completedTodayCount + completedPlaylistVideos;
                                return totalItems > 0
                                    ? `${totalCompleted}/${totalItems} görev tamamlandı (${playlistVideos.length} video)`
                                    : 'Henüz görev eklenmedi';
                            })()}
                        </p>
                    </div>
                    <button
                        className="btn"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                        onClick={() => openAddModal(today)}
                    >
                        <Plus size={18} />
                        Görev Ekle
                    </button>
                </div>

                {(() => {
                    const playlistVideos = getPlaylistVideosForDate(today);
                    const totalItems = todayTasks.length + playlistVideos.length;
                    const completedPlaylistVideos = playlistVideos.filter(v => v.watched).length;
                    const totalCompleted = completedTodayCount + completedPlaylistVideos;
                    return totalItems > 0 && (
                        <div className="progress-bar mt-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${(totalCompleted / totalItems) * 100}%`,
                                    background: 'white'
                                }}
                            />
                        </div>
                    );
                })()}
            </div>

            {/* Week Navigation */}
            <div className="card mb-4">
                <div className="flex justify-between items-center mb-4">
                    <button className="btn btn-ghost" onClick={goToPreviousWeek}>
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h3 style={{ marginBottom: '4px' }}>
                            {format(weekStart, 'd MMMM', { locale: tr })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: tr })}
                        </h3>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={goToToday}
                            style={{ fontSize: '0.75rem' }}
                        >
                            Bugüne Git
                        </button>
                    </div>
                    <button className="btn btn-ghost" onClick={goToNextWeek}>
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Week Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '8px'
                }}>
                    {weekDays.map((day) => {
                        const isToday = isSameDay(day, today);
                        const dayTasks = getTasksForDate(day);
                        const completedCount = dayTasks.filter(t => t.completed).length;

                        return (
                            <div
                                key={day.toISOString()}
                                className="day-column"
                                style={{
                                    background: isToday ? 'var(--accent-primary-dark)' : 'var(--bg-tertiary)',
                                    border: isToday ? '2px solid var(--accent-primary)' : 'none',
                                    minHeight: '200px'
                                }}
                            >
                                <div
                                    className="day-header"
                                    style={{
                                        background: isToday ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: isToday ? 'white' : 'var(--text-primary)'
                                    }}
                                >
                                    <div>{format(day, 'EEE', { locale: tr })}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{format(day, 'd')}</div>
                                </div>

                                <div className="day-videos" style={{ padding: '8px' }}>
                                    {/* Playlist Videos */}
                                    {getPlaylistVideosForDate(day).map((video) => (
                                        <div
                                            key={video.id}
                                            className={`video-item ${video.watched ? 'watched' : ''}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                borderLeft: '3px solid var(--accent-warning)',
                                                paddingLeft: '6px'
                                            }}
                                            onClick={() => video.playlistId && toggleVideoWatched(video.playlistId, video.id)}
                                        >
                                            {video.watched ? (
                                                <Check size={12} color="var(--accent-success)" />
                                            ) : (
                                                <PlayCircle size={12} color="var(--accent-warning)" />
                                            )}
                                            <span style={{
                                                flex: 1,
                                                textDecoration: video.watched ? 'line-through' : 'none',
                                                opacity: video.watched ? 0.6 : 1
                                            }}>
                                                {video.title}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Manual Tasks */}
                                    {dayTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`video-item ${task.completed ? 'watched' : ''}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => toggleTaskComplete(task.id)}
                                        >
                                            {task.completed ? (
                                                <Check size={12} color="var(--accent-success)" />
                                            ) : (
                                                getTaskIcon(task.type)
                                            )}
                                            <span style={{
                                                flex: 1,
                                                textDecoration: task.completed ? 'line-through' : 'none',
                                                opacity: task.completed ? 0.6 : 1
                                            }}>
                                                {task.title}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                <X size={12} color="var(--text-muted)" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add button */}
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        style={{
                                            width: '100%',
                                            marginTop: '8px',
                                            fontSize: '0.7rem',
                                            padding: '4px'
                                        }}
                                        onClick={() => openAddModal(day)}
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>

                                {/* Summary */}
                                {(() => {
                                    const playlistVideos = getPlaylistVideosForDate(day);
                                    const totalItems = dayTasks.length + playlistVideos.length;
                                    const completedPlaylistVideos = playlistVideos.filter(v => v.watched).length;
                                    const totalCompleted = completedCount + completedPlaylistVideos;
                                    return totalItems > 0 && (
                                        <div style={{
                                            padding: '4px 8px',
                                            fontSize: '0.65rem',
                                            color: 'var(--text-muted)',
                                            borderTop: '1px solid var(--border-color)'
                                        }}>
                                            {totalCompleted}/{totalItems} ✓
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Today's Detailed Plan */}
            <div className="card">
                <h3 className="card-title mb-4">📝 Bugünün Görevleri</h3>

                {(() => {
                    const playlistVideos = getPlaylistVideosForDate(today);
                    const totalItems = todayTasks.length + playlistVideos.length;

                    return totalItems === 0 ? (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                            <Target size={40} />
                            <h4>Bugün için görev yok</h4>
                            <p>Yukarıdaki "Görev Ekle" butonuyla başla veya PlaylistPlanner'dan video ekle</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Playlist Videos */}
                            {playlistVideos.map((video) => (
                                <div
                                    key={video.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        background: video.watched ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                        borderRadius: '10px',
                                        border: `1px solid ${video.watched ? 'var(--accent-success)' : 'var(--accent-warning)'}`,
                                        borderLeft: '4px solid var(--accent-warning)',
                                        opacity: video.watched ? 0.7 : 1
                                    }}
                                >
                                    <button
                                        onClick={() => video.playlistId && toggleVideoWatched(video.playlistId, video.id)}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            border: `2px solid ${video.watched ? 'var(--accent-success)' : 'var(--accent-warning)'}`,
                                            background: video.watched ? 'var(--accent-success)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {video.watched && <Check size={16} color="white" />}
                                    </button>

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: 500,
                                            textDecoration: video.watched ? 'line-through' : 'none'
                                        }}>
                                            {video.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <PlayCircle size={14} color="var(--accent-warning)" />
                                            <span style={{ color: 'var(--accent-warning)' }}>{video.playlistName}</span>
                                            {video.subject && <span>• {video.subject}</span>}
                                            {video.duration && <span>• {video.duration} dk</span>}
                                        </div>
                                    </div>

                                    {video.url && (
                                        <a
                                            href={video.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <PlayCircle size={18} />
                                        </a>
                                    )}
                                </div>
                            ))}

                            {/* Manual Tasks */}
                            {todayTasks.map((task) => (
                                <div
                                    key={task.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        background: task.completed ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                        borderRadius: '10px',
                                        border: `1px solid ${task.completed ? 'var(--accent-success)' : 'var(--border-color)'}`,
                                        opacity: task.completed ? 0.7 : 1
                                    }}
                                >
                                    <button
                                        onClick={() => toggleTaskComplete(task.id)}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            border: `2px solid ${task.completed ? 'var(--accent-success)' : 'var(--border-color)'}`,
                                            background: task.completed ? 'var(--accent-success)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {task.completed && <Check size={16} color="white" />}
                                    </button>

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: 500,
                                            textDecoration: task.completed ? 'line-through' : 'none'
                                        }}>
                                            {task.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                                            {getTaskIcon(task.type)}
                                            <span>{TASK_TYPES.find(t => t.key === task.type)?.label}</span>
                                            {task.duration && <span>• {task.duration} dk</span>}
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDeleteTask(task.id)}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* Add Task Modal */}
            {showAddModal && selectedDate && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Görev Ekle - {format(selectedDate, 'd MMMM yyyy', { locale: tr })}</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Görev Türü</label>
                            <div className="checkbox-group">
                                {TASK_TYPES.map((type) => (
                                    <label
                                        key={type.key}
                                        className={`checkbox-item ${newTaskType === type.key ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="taskType"
                                            checked={newTaskType === type.key}
                                            onChange={() => setNewTaskType(type.key as Task['type'])}
                                        />
                                        <type.icon size={16} color={type.color} />
                                        {type.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Görev Açıklaması</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Örn: Analiz Video 1-5 izle"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Süre (dakika, opsiyonel)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Örn: 60"
                                value={newTaskDuration}
                                onChange={(e) => setNewTaskDuration(e.target.value)}
                                style={{ maxWidth: '150px' }}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Ders (Opsiyonel)</label>
                                <select
                                    className="form-input"
                                    value={newTaskSubject}
                                    onChange={(e) => {
                                        setNewTaskSubject(e.target.value);
                                        setNewTaskTopic('');
                                    }}
                                >
                                    <option value="">Seçiniz</option>
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Konu (Opsiyonel)</label>
                                <select
                                    className="form-input"
                                    value={newTaskTopic}
                                    onChange={(e) => setNewTaskTopic(e.target.value)}
                                    disabled={!newTaskSubject}
                                >
                                    <option value="">Seçiniz</option>
                                    {newTaskSubject && subjects.find(s => s.name === newTaskSubject) &&
                                        (topics[subjects.find(s => s.name === newTaskSubject)!.id] || []).map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={handleAddTask}
                            disabled={!newTaskTitle}
                        >
                            Görev Ekle
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
