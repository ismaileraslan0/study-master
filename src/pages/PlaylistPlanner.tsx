import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { DAYS_OF_WEEK, VIDEO_TYPES, type DayOfWeek, type Video, type VideoType } from '../types';
import { Plus, Trash2, Play, CheckCircle, Calendar, X, ExternalLink, BookOpen, Youtube, Settings, Fingerprint, Loader2 } from 'lucide-react';

// YouTube thumbnail URL generator
const getYouTubeThumbnail = (url: string): string | undefined => {
    if (!url) return undefined;
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (videoIdMatch) {
        return `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
    }
    return undefined;
};

// Extract Playlist ID from URL
const getPlaylistId = (url: string): string | undefined => {
    const match = url.match(/[?&]list=([^#\&\?]+)/);
    return match ? match[1] : undefined;
};

export function PlaylistPlanner() {
    const { playlists, addPlaylist, deletePlaylist, toggleVideoWatched, subjects, addSubject, topics } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'manual' | 'youtube'>('manual');

    // Form States
    const [playlistName, setPlaylistName] = useState('');
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
    const [selectedSubject, setSelectedSubject] = useState(''); // Default subject for playlist
    const [selectedTopic, setSelectedTopic] = useState(''); // Default topic for playlist
    const [newSubjectName, setNewSubjectName] = useState('');
    const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);

    // NEW: Scheduling states
    const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
    const [videosPerDay, setVideosPerDay] = useState(2); // Default: 2 videos per day
    const [endDate, setEndDate] = useState(''); // Calculated end date

    // YouTube API States
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_YOUTUBE_API_KEY || '');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    // Bulk video input
    const [bulkVideoText, setBulkVideoText] = useState('');
    const [videos, setVideos] = useState<Partial<Video>[]>([]);

    useEffect(() => {
        const savedKey = localStorage.getItem('youtube_api_key');
        if (savedKey) setApiKey(savedKey);
    }, []);

    const saveApiKey = () => {
        localStorage.setItem('youtube_api_key', apiKey);
        setShowApiKeyInput(false);
    };

    const fetchPlaylistVideos = async () => {
        const playlistId = getPlaylistId(playlistUrl);
        if (!playlistId) {
            setApiError('Geçersiz YouTube Playlist Linki');
            return;
        }
        if (!apiKey) {
            setApiError('Lütfen önce API Anahtarı girin');
            setShowApiKeyInput(true);
            return;
        }

        setIsLoading(true);
        setApiError('');

        try {
            let allItems: any[] = [];
            let nextPageToken = '';

            // Fetch first page to get title if playlist name is empty
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.items && data.items.length > 0 && !playlistName) {
                setPlaylistName(data.items[0].snippet.title);
            }

            // Fetch items
            do {
                const itemsResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`
                );
                const itemsData = await itemsResponse.json();

                if (itemsData.error) throw new Error(itemsData.error.message);

                allItems = [...allItems, ...itemsData.items];
                nextPageToken = itemsData.nextPageToken;
            } while (nextPageToken);

            const fetchedVideos: Partial<Video>[] = allItems.map(item => ({
                title: item.snippet.title,
                duration: 20, // Default duration since playlistItems doesn't return duration
                url: `https://youtube.com/watch?v=${item.contentDetails.videoId}`,
                thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                videoType: 'konu',
                subject: selectedSubject, // Apply default subject
                topic: selectedTopic,
                watched: false
            }));

            setVideos([...videos, ...fetchedVideos]);
            setPlaylistUrl('');
            setActiveTab('manual'); // Switch to view list
        } catch (error: any) {
            setApiError(error.message || 'Video listesi çekilemedi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkAdd = () => {
        const lines = bulkVideoText.split('\n').filter(line => line.trim());
        const newVideos = lines.map(line => ({
            title: line.trim(),
            duration: 20,
            url: '',
            videoType: 'konu' as VideoType,
            subject: selectedSubject,
            topic: selectedTopic,
            watched: false
        }));
        setVideos([...videos, ...newVideos]);
        setBulkVideoText('');
    };

    const handleRemoveVideo = (index: number) => {
        setVideos(videos.filter((_, i) => i !== index));
    };

    const updateVideo = (index: number, field: keyof Video, value: any) => {
        setVideos(videos.map((v, i) =>
            i === index ? { ...v, [field]: value } : v
        ));
    };

    const toggleDay = (day: DayOfWeek) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter((d) => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleAddNewSubject = () => {
        if (newSubjectName.trim()) {
            addSubject({ name: newSubjectName.trim(), category: 'genel' });
            setSelectedSubject(newSubjectName.trim());
            setNewSubjectName('');
            setShowNewSubjectInput(false);
        }
    };

    // Helper: Parse YYYY-MM-DD string as local date (avoids UTC timezone issues)
    const parseLocalDate = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Helper: Format date as YYYY-MM-DD in local timezone
    const formatDateStr = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper: Get DayOfWeek key from a Date object
    const getDayOfWeekKey = (date: Date): DayOfWeek => {
        const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const index = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 1=Tue, ..., 6=Sun
        return DAYS_OF_WEEK[index].key;
    };

    // NEW: Get next selected day from a given date
    const getNextSelectedDay = (currentDate: Date, selectedDays: DayOfWeek[]): Date => {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);

        while (true) {
            if (selectedDays.includes(getDayOfWeekKey(nextDate))) {
                return nextDate;
            }
            nextDate.setDate(nextDate.getDate() + 1);
        }
    };

    // NEW: Calculate end date based on videos, videos per day, and selected days
    const calculateEndDate = (
        totalVideos: number,
        videosPerDay: number,
        selectedDays: DayOfWeek[],
        startDateStr: string
    ): string => {
        if (!totalVideos || !videosPerDay || selectedDays.length === 0 || !startDateStr) {
            return '';
        }

        let currentDate = parseLocalDate(startDateStr);
        let videosPlaced = 0;

        // Find the first selected day from start date
        while (!selectedDays.includes(getDayOfWeekKey(currentDate))) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Place videos and find end date
        while (videosPlaced < totalVideos) {
            if (selectedDays.includes(getDayOfWeekKey(currentDate))) {
                const videosToPlace = Math.min(videosPerDay, totalVideos - videosPlaced);
                videosPlaced += videosToPlace;

                if (videosPlaced >= totalVideos) {
                    return formatDateStr(currentDate);
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return formatDateStr(currentDate);
    };

    // NEW: useEffect to calculate end date when inputs change
    useEffect(() => {
        if (videos.length > 0 && selectedDays.length > 0 && startDate && videosPerDay > 0) {
            const calculated = calculateEndDate(videos.length, videosPerDay, selectedDays, startDate);
            setEndDate(calculated);
        } else {
            setEndDate('');
        }
    }, [videos, selectedDays, startDate, videosPerDay]);

    const handleSubmit = () => {
        if (playlistName && videos.length > 0 && selectedDays.length > 0 && startDate) {
            const playlistId = `playlist-${Date.now()}`;

            // NEW ALGORITHM: Distribute videos with start date and daily limit
            let currentDate = parseLocalDate(startDate);

            // Find the first selected day from start date
            while (!selectedDays.includes(getDayOfWeekKey(currentDate))) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Distribute videos with daily limit
            const videoList: Video[] = [];
            let videoIndex = 0;
            let currentDayVideoCount = 0;

            while (videoIndex < videos.length) {
                const v = videos[videoIndex];
                const currentDateStr = formatDateStr(currentDate);

                videoList.push({
                    id: `video-${Date.now()}-${videoIndex}`,
                    title: v.title || 'Adsız Video',
                    duration: v.duration || 20,
                    watched: false,
                    url: v.url || undefined,
                    thumbnail: v.thumbnail || getYouTubeThumbnail(v.url || ''),
                    videoType: v.videoType || 'konu',
                    subject: v.subject || selectedSubject || undefined,
                    topic: v.topic || undefined,
                    assignedDate: currentDateStr, // NEW: Assign actual date based on start date
                    playlistId: playlistId
                });

                videoIndex++;
                currentDayVideoCount++;

                // Check if we've reached daily limit
                if (currentDayVideoCount >= videosPerDay && videoIndex < videos.length) {
                    // Move to next selected day
                    currentDate = getNextSelectedDay(currentDate, selectedDays);
                    currentDayVideoCount = 0;
                }
            }

            addPlaylist({
                name: playlistName,
                subject: selectedSubject || undefined,
                videos: videoList,
                selectedDays,
                startDate: startDate, // NEW: Save start date
                videosPerDay: videosPerDay, // NEW: Save videos per day
                endDate: endDate // NEW: Save calculated end date
            });

            // Reset form
            setPlaylistName('');
            setSelectedDays([]);
            setVideos([]);
            setSelectedSubject('');
            setShowModal(false);
            setActiveTab('manual');
            setStartDate(''); // NEW: Reset start date
            setVideosPerDay(2); // NEW: Reset to default
            setEndDate(''); // NEW: Reset end date
        } else {
            alert('Lütfen playlist adını, videoları, günleri ve başlangıç tarihini doldurun!');
        }
    };

    // Distribute videos to selected days using actual assignedDate values
    const getDistributedPlan = (playlist: typeof playlists[0]) => {
        const plan: { day: DayOfWeek; dayLabel: string; dateStr?: string; videos: Video[] }[] = [];

        // Group videos by their assigned date
        const dateGroups = new Map<string, Video[]>();
        const topicVideos = playlist.videos.filter(v => v.videoType === 'konu' || !v.videoType);

        topicVideos.forEach(video => {
            const dateKey = video.assignedDate || 'unassigned';
            if (!dateGroups.has(dateKey)) {
                dateGroups.set(dateKey, []);
            }
            dateGroups.get(dateKey)!.push(video);
        });

        // Sort dates chronologically and create plan entries
        const sortedDates = Array.from(dateGroups.keys()).sort();

        sortedDates.forEach(dateStr => {
            const videos = dateGroups.get(dateStr)!;
            if (dateStr === 'unassigned') {
                // Fallback for videos without assignedDate (old data)
                const sortedDays = DAYS_OF_WEEK.filter(d => playlist.selectedDays.includes(d.key));
                sortedDays.forEach(day => {
                    plan.push({ day: day.key, dayLabel: day.label, videos: [] });
                });
                videos.forEach((video, index) => {
                    plan[index % plan.length].videos.push(video);
                });
            } else {
                // Use actual date to determine day label
                const date = parseLocalDate(dateStr);
                const dayKey = getDayOfWeekKey(date);
                const dayInfo = DAYS_OF_WEEK.find(d => d.key === dayKey);
                const dayLabel = dayInfo?.label || dateStr;
                // Format: "Pazartesi (16 Şub)"
                const shortDate = `${date.getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][date.getMonth()]}`;
                plan.push({
                    day: dayKey,
                    dayLabel: `${dayLabel} (${shortDate})`,
                    dateStr: dateStr,
                    videos: videos
                });
            }
        });

        return plan;
    };



    return (
        <div className="fade-in">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1>📺 Video Planı</h1>
                    <p>YouTube playlistlerini günlere dağıt</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
                        <Settings size={20} />
                        API Ayarı
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Playlist Ekle
                    </button>
                </div>
            </div>

            {/* API Key Modal */}
            {showApiKeyInput && (
                <div className="card mb-4 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                        <Fingerprint size={20} className="text-primary" />
                        <h3>YouTube API Anahtarı</h3>
                    </div>
                    <p className="text-sm text-muted mb-3">
                        Playlistleri otomatik çekmek için Google Cloud Console'dan alacağınız YouTube Data API v3 anahtarını girin.
                        Anahtar sadece tarayıcınızda saklanır.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            className="form-input"
                            placeholder="AIzaSy..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={saveApiKey}>Kaydet</button>
                    </div>
                </div>
            )}

            {playlists.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Calendar size={48} />
                        <h3>Henüz playlist eklenmedi</h3>
                        <p>Yeni bir playlist ekleyerek başla</p>
                    </div>
                </div>
            ) : (
                <div className="grid-1" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {playlists.map((playlist) => (
                        <div key={playlist.id} className="card">
                            <div className="card-header">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="card-title">{playlist.name}</h3>
                                        {playlist.subject && (
                                            <span className="tag tag-info">
                                                <BookOpen size={12} />
                                                {playlist.subject}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        {playlist.videos.length} video • {playlist.selectedDays.length} gün
                                    </p>
                                </div>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deletePlaylist(playlist.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        İzlenen: {playlist.videos.filter(v => v.watched).length}/{playlist.videos.length}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--accent-primary-light)' }}>
                                        %{Math.round((playlist.videos.filter(v => v.watched).length / playlist.videos.length) * 100)}
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${(playlist.videos.filter(v => v.watched).length / playlist.videos.length) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Week Plan - Topic Videos */}
                            <div className="week-plan" style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(getDistributedPlan(playlist).length, 7)}, 1fr)`,
                                gap: '12px'
                            }}>
                                {getDistributedPlan(playlist).map((dayPlan) => (
                                    <div key={dayPlan.day} className="day-column">
                                        <div className="day-header">{dayPlan.dayLabel}</div>
                                        <div className="day-videos">
                                            {dayPlan.videos.map((video) => (
                                                <div
                                                    key={video.id}
                                                    className={`video-item ${video.watched ? 'watched' : ''}`}
                                                    style={{ flexDirection: 'column', alignItems: 'stretch' }}
                                                >
                                                    {video.thumbnail && (
                                                        <div style={{
                                                            width: '100%',
                                                            height: '60px',
                                                            borderRadius: '6px',
                                                            overflow: 'hidden',
                                                            marginBottom: '8px'
                                                        }}>
                                                            <img
                                                                src={video.thumbnail}
                                                                alt={video.title}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div
                                                        className="flex items-center gap-2"
                                                        onClick={() => toggleVideoWatched(playlist.id, video.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {video.watched ? (
                                                            <CheckCircle size={14} color="var(--accent-success)" />
                                                        ) : (
                                                            <Play size={14} />
                                                        )}
                                                        <span style={{ flex: 1, fontSize: '0.8rem' }}>{video.title}</span>
                                                    </div>

                                                    {/* Subject & Topic tags */}
                                                    {(video.subject || video.topic) && (
                                                        <div className="flex gap-1 mt-1 flex-wrap">
                                                            {video.subject && (
                                                                <span style={{ fontSize: '0.65rem', padding: '2px 4px', background: 'var(--bg-tertiary)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                                                    {video.subject}
                                                                </span>
                                                            )}
                                                            {video.topic && (
                                                                <span style={{ fontSize: '0.65rem', padding: '2px 4px', background: 'var(--bg-tertiary)', borderRadius: '4px', color: 'var(--accent-primary-light)' }}>
                                                                    {video.topic}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center mt-1">
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            {video.duration} dk
                                                        </span>
                                                        {video.url && (
                                                            <a
                                                                href={video.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{
                                                                    color: 'var(--accent-primary-light)',
                                                                    display: 'flex',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Playlist Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h2>Yeni Playlist Ekle</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Playlist Adı</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Örn: Analiz Dersleri"
                                        value={playlistName}
                                        onChange={(e) => setPlaylistName(e.target.value)}
                                    />
                                </div>

                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Varsayılan Ders</label>
                                    {showNewSubjectInput ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Yeni ders adı"
                                                value={newSubjectName}
                                                onChange={(e) => setNewSubjectName(e.target.value)}
                                            />
                                            <button className="btn btn-secondary" onClick={handleAddNewSubject}>Ekle</button>
                                            <button className="btn btn-ghost" onClick={() => setShowNewSubjectInput(false)}>İptal</button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <select
                                                className="form-input"
                                                value={selectedSubject}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                            >
                                                <option value="">Ders seçin (opsiyonel)</option>
                                                {subjects.map((s) => (
                                                    <option key={s.id} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                            <button className="btn btn-secondary" onClick={() => setShowNewSubjectInput(true)}>
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Konu (Opsiyonel)</label>
                                    <select
                                        className="form-input"
                                        value={selectedTopic}
                                        onChange={(e) => setSelectedTopic(e.target.value)}
                                        disabled={!selectedSubject}
                                    >
                                        <option value="">Konu seçin</option>
                                        {selectedSubject && subjects.find(s => s.name === selectedSubject) &&
                                            (topics[subjects.find(s => s.name === selectedSubject)!.id] || []).map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Çalışılacak Günler</label>
                                <div className="checkbox-group">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <label
                                            key={day.key}
                                            className={`checkbox-item ${selectedDays.includes(day.key) ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDays.includes(day.key)}
                                                onChange={() => toggleDay(day.key)}
                                            />
                                            {day.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* NEW: Start Date and Videos Per Day */}
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">📅 Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">📊 Günde Kaç Video?</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="1"
                                        max="10"
                                        value={videosPerDay}
                                        onChange={(e) => setVideosPerDay(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            </div>

                            {/* NEW: End Date Display */}
                            {endDate && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    borderRadius: '8px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={18} color="var(--accent-primary)" />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Bitiş Tarihi:
                                        </span>
                                        <strong style={{ color: 'var(--accent-primary)' }}>
                                            {new Date(endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </strong>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="tabs mb-4 border-b border-gray-700 flex gap-4">
                                <button
                                    className={`pb-2 px-2 ${activeTab === 'manual' ? 'border-b-2 border-primary text-primary font-bold' : 'text-gray-400'}`}
                                    onClick={() => setActiveTab('manual')}
                                >
                                    Manuel Ekle
                                </button>
                                <button
                                    className={`pb-2 px-2 flex items-center gap-2 ${activeTab === 'youtube' ? 'border-b-2 border-primary text-primary font-bold' : 'text-gray-400'}`}
                                    onClick={() => setActiveTab('youtube')}
                                >
                                    <Youtube size={18} />
                                    YouTube'dan Çek
                                </button>
                            </div>

                            {activeTab === 'youtube' && (
                                <div className="form-group p-4 bg-tertiary rounded-lg mb-4">
                                    <label className="form-label">YouTube Playlist Linki</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="https://www.youtube.com/playlist?list=..."
                                            value={playlistUrl}
                                            onChange={(e) => setPlaylistUrl(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            onClick={fetchPlaylistVideos}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Getir'}
                                        </button>
                                    </div>
                                    {apiError && <p className="text-red-400 text-sm mt-2">{apiError}</p>}
                                    {!apiKey && <p className="text-yellow-400 text-xs mt-2">API anahtarı girmeniz gerekir.</p>}
                                </div>
                            )}

                            {activeTab === 'manual' && (
                                <div className="form-group">
                                    <label className="form-label">Toplu Video Ekle (her satıra bir video)</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Video başlıklarını buraya yapıştırın..."
                                        value={bulkVideoText}
                                        onChange={(e) => setBulkVideoText(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-secondary mt-2 w-full"
                                        onClick={handleBulkAdd}
                                        disabled={!bulkVideoText.trim()}
                                    >
                                        <Plus size={16} /> Videoları Ekle
                                    </button>
                                </div>
                            )}

                            {/* Video List */}
                            {videos.length > 0 && (
                                <div className="form-group mt-4">
                                    <label className="form-label flex justify-between">
                                        <span>Eklenen Videolar ({videos.length})</span>
                                        <button className="text-sm text-red-400" onClick={() => setVideos([])}>Tümünü Sil</button>
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {videos.map((video, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    padding: '12px',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    alignItems: 'flex-start'
                                                }}
                                            >
                                                {/* Thumbnail Preview */}
                                                <div style={{ width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: '#000' }}>
                                                    {(video.thumbnail || getYouTubeThumbnail(video.url || '')) ? (
                                                        <img src={video.thumbnail || getYouTubeThumbnail(video.url || '')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-600"><Play size={20} /></div>
                                                    )}
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    {/* Title & URL Row */}
                                                    <div className="flex gap-2 mb-2">
                                                        <div style={{ flex: 1, display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    style={{ padding: '4px 8px', fontSize: '0.9rem', flex: 1 }}
                                                                    value={video.title}
                                                                    onChange={(e) => updateVideo(index, 'title', e.target.value)}
                                                                    placeholder="Video Başlığı"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    style={{ padding: '4px 8px', fontSize: '0.9rem', flex: 1 }}
                                                                    value={video.url || ''}
                                                                    onChange={(e) => updateVideo(index, 'url', e.target.value)}
                                                                    placeholder="YouTube Linki"
                                                                />
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <select
                                                                    className="form-input"
                                                                    style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                                                                    value={video.subject || ''}
                                                                    onChange={(e) => updateVideo(index, 'subject', e.target.value)}
                                                                >
                                                                    <option value="">Ders Seç</option>
                                                                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                                </select>
                                                                <select
                                                                    className="form-input"
                                                                    style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                                                                    value={video.topic || ''}
                                                                    onChange={(e) => updateVideo(index, 'topic', e.target.value)}
                                                                    disabled={!video.subject}
                                                                >
                                                                    <option value="">Konu Seç</option>
                                                                    {video.subject && subjects.find(s => s.name === video.subject) &&
                                                                        (topics[subjects.find(s => s.name === video.subject)!.id] || []).map(t => (
                                                                            <option key={t} value={t}>{t}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-icon btn-danger"
                                                            style={{ width: '30px', height: '30px' }}
                                                            onClick={() => handleRemoveVideo(index)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Details Row */}
                                                    <div className="flex gap-2 flex-wrap">
                                                        <div style={{ flex: 1, minWidth: '120px' }}>
                                                            <select
                                                                className="form-input py-1 text-sm"
                                                                value={video.subject || ''}
                                                                onChange={(e) => updateVideo(index, 'subject', e.target.value)}
                                                            >
                                                                <option value="">{selectedSubject ? `Varsayılan (${selectedSubject})` : 'Ders Seç'}</option>
                                                                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: '120px' }}>
                                                            <input
                                                                type="text"
                                                                className="form-input py-1 text-sm"
                                                                placeholder="Konu (opsiyonel)"
                                                                value={video.topic || ''}
                                                                onChange={(e) => updateVideo(index, 'topic', e.target.value)}
                                                            />
                                                        </div>
                                                        <div style={{ width: '130px' }}>
                                                            <select
                                                                className="form-input py-1 text-sm"
                                                                value={video.videoType || 'konu'}
                                                                onChange={(e) => updateVideo(index, 'videoType', e.target.value)}
                                                            >
                                                                {VIDEO_TYPES.map(vt => <option key={vt.key} value={vt.key}>{vt.label}</option>)}
                                                            </select>
                                                        </div>
                                                        <div style={{ width: '60px' }}>
                                                            <input
                                                                type="number"
                                                                className="form-input py-1 text-sm"
                                                                value={video.duration}
                                                                onChange={(e) => updateVideo(index, 'duration', parseInt(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={handleSubmit}
                                disabled={!playlistName || videos.length === 0 || selectedDays.length === 0 || !startDate}
                            >
                                Playlist Oluştur ({videos.length} Video)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
