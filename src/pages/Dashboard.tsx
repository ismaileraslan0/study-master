import { useStore } from '../store/useStore';
import {
    Youtube,
    FileQuestion,
    ClipboardCheck,
    Calendar,
    CheckCircle,
    PlayCircle,
    ExternalLink,
    Clock,
    Check
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Video } from '../types';

export function Dashboard() {
    const { playlists, questionRecords, examRecords, toggleVideoWatched } = useStore();

    // Calculate stats
    const totalVideos = playlists.reduce((sum, p) => sum + p.videos.length, 0);
    const watchedVideos = playlists.reduce(
        (sum, p) => sum + p.videos.filter((v) => v.watched).length,
        0
    );
    const videoProgress = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;

    const totalQuestions = questionRecords.reduce((sum, r) => sum + r.totalQuestions, 0);
    const correctQuestions = questionRecords.reduce((sum, r) => sum + r.correctAnswers, 0);
    const questionSuccess = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

    const lastExam = examRecords[0];
    const avgNet = examRecords.length > 0
        ? (examRecords.reduce((sum, e) => sum + e.totalNet, 0) / examRecords.length).toFixed(1)
        : 0;

    // Get today's playlist videos
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const todaysVideos: Array<Video & { playlistName: string }> = [];
    playlists.forEach(playlist => {
        const dayVideos = playlist.videos.filter(v => v.assignedDate === todayStr);
        dayVideos.forEach(video => {
            todaysVideos.push({ ...video, playlistName: playlist.name, playlistId: playlist.id });
        });
    });

    const watchedTodayCount = todaysVideos.filter(v => v.watched).length;
    const todayProgress = todaysVideos.length > 0 ? Math.round((watchedTodayCount / todaysVideos.length) * 100) : 0;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Hoş Geldin 👋</h1>
                <p>{format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <Youtube />
                    </div>
                    <div className="stat-content">
                        <h3>{watchedVideos}/{totalVideos}</h3>
                        <p>Video İzlendi</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon secondary">
                        <FileQuestion />
                    </div>
                    <div className="stat-content">
                        <h3>{totalQuestions}</h3>
                        <p>Soru Çözüldü</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">
                        <CheckCircle />
                    </div>
                    <div className="stat-content">
                        <h3>%{questionSuccess}</h3>
                        <p>Başarı Oranı</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon danger">
                        <ClipboardCheck />
                    </div>
                    <div className="stat-content">
                        <h3>{avgNet}</h3>
                        <p>Ortalama Net</p>
                    </div>
                </div>
            </div>

            {/* ========== TODAY'S VIDEOS SECTION ========== */}
            <div className="card mb-6 todays-videos-section">
                <div className="card-header">
                    <div className="flex items-center gap-2">
                        <div className="todays-videos-icon">
                            <PlayCircle size={22} />
                        </div>
                        <div>
                            <h3 className="card-title">🎬 Bugün İzlenecek Videolar</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {todaysVideos.length > 0
                                    ? `${watchedTodayCount}/${todaysVideos.length} video tamamlandı`
                                    : 'Bugün için planlanmış video yok'}
                            </p>
                        </div>
                    </div>
                    {todaysVideos.length > 0 && (
                        <span className={`tag ${todayProgress === 100 ? 'tag-success' : 'tag-primary'}`}>
                            %{todayProgress}
                        </span>
                    )}
                </div>

                {/* Progress bar for today */}
                {todaysVideos.length > 0 && (
                    <div className="progress-bar mb-4" style={{ height: '6px' }}>
                        <div
                            className="progress-fill"
                            style={{
                                width: `${todayProgress}%`,
                                background: todayProgress === 100
                                    ? 'var(--gradient-success)'
                                    : 'var(--gradient-primary)'
                            }}
                        />
                    </div>
                )}

                {todaysVideos.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <Calendar size={48} />
                        <h3>Bugün için video yok</h3>
                        <p>Playlist Planner'dan bir playlist ekleyip günleri seç</p>
                    </div>
                ) : (
                    <div className="today-video-grid">
                        {todaysVideos.map((video) => (
                            <div
                                key={video.id}
                                className={`today-video-card ${video.watched ? 'watched' : ''}`}
                            >
                                {/* Thumbnail */}
                                <a
                                    href={video.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="today-video-thumbnail-link"
                                >
                                    <div className="today-video-thumbnail">
                                        {video.thumbnail ? (
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="today-video-thumbnail-placeholder">
                                                <Youtube size={40} />
                                            </div>
                                        )}
                                        <div className="today-video-play-overlay">
                                            <PlayCircle size={48} />
                                        </div>
                                        {video.duration && (
                                            <div className="today-video-duration">
                                                <Clock size={12} />
                                                {video.duration} dk
                                            </div>
                                        )}
                                        {video.watched && (
                                            <div className="today-video-watched-badge">
                                                <Check size={20} />
                                            </div>
                                        )}
                                    </div>
                                </a>

                                {/* Video Info */}
                                <div className="today-video-info">
                                    <a
                                        href={video.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="today-video-title"
                                        title={video.title}
                                    >
                                        {video.title}
                                    </a>

                                    <div className="today-video-meta">
                                        <span className="tag tag-warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                            {video.playlistName}
                                        </span>
                                        {video.subject && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {video.subject}
                                            </span>
                                        )}
                                    </div>

                                    <div className="today-video-actions">
                                        <button
                                            className={`today-video-watch-btn ${video.watched ? 'done' : ''}`}
                                            onClick={() => video.playlistId && toggleVideoWatched(video.playlistId, video.id)}
                                            title={video.watched ? 'İzlendi olarak işaretlendi' : 'İzlendi olarak işaretle'}
                                        >
                                            {video.watched ? (
                                                <>
                                                    <Check size={14} />
                                                    İzlendi
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={14} />
                                                    İzlendi İşaretle
                                                </>
                                            )}
                                        </button>
                                        <a
                                            href={video.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="today-video-open-btn"
                                            title="YouTube'da aç"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Progress Section */}
            <div className="grid-2">
                {/* Video Progress */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📺 Video İlerlemesi</h3>
                        <span className="tag tag-primary">{videoProgress}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${videoProgress}%` }} />
                    </div>
                    <p className="mt-4" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {playlists.length} playlist'te {totalVideos} video bulunuyor
                    </p>
                </div>

                {/* Recent Exam */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📊 Son Deneme</h3>
                        {lastExam && (
                            <span className={`tag ${lastExam.examType === 'ags' ? 'tag-warning' : 'tag-success'}`}>
                                {lastExam.examType.toUpperCase()}
                            </span>
                        )}
                    </div>
                    {lastExam ? (
                        <>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                {lastExam.examName} - {format(new Date(lastExam.date), 'd MMMM', { locale: tr })}
                            </p>
                            <div className="net-display">{lastExam.totalNet.toFixed(2)} Net</div>
                        </>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>Henüz deneme girilmedi</p>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card mt-6">
                <div className="card-header">
                    <h3 className="card-title">📝 Son Etkinlikler</h3>
                </div>
                {questionRecords.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Ders</th>
                                    <th>Soru</th>
                                    <th>Doğru</th>
                                    <th>Yanlış</th>
                                    <th>Başarı</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questionRecords.slice(0, 5).map((record) => (
                                    <tr key={record.id}>
                                        <td>{format(new Date(record.date), 'd MMM', { locale: tr })}</td>
                                        <td>
                                            <span className={`tag ${record.examType === 'ags' ? 'tag-warning' : 'tag-success'}`}>
                                                {record.subjectLabel}
                                            </span>
                                        </td>
                                        <td>{record.totalQuestions}</td>
                                        <td style={{ color: 'var(--accent-success)' }}>{record.correctAnswers}</td>
                                        <td style={{ color: 'var(--accent-danger)' }}>{record.wrongAnswers}</td>
                                        <td>
                                            %{Math.round((record.correctAnswers / record.totalQuestions) * 100)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <Calendar size={48} />
                        <h3>Henüz kayıt yok</h3>
                        <p>Soru çözmeye başladığında burada görünecek</p>
                    </div>
                )}
            </div>
        </div>
    );
}
