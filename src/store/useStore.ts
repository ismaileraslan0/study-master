import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreState } from '../types';

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStore = create<StoreState>()(
    persist(
        (set) => ({
            // Subjects
            subjects: [],

            addSubject: (subject) =>
                set((state) => ({
                    subjects: [
                        ...state.subjects,
                        { ...subject, id: generateId() },
                    ],
                })),

            deleteSubject: (id) =>
                set((state) => ({
                    subjects: state.subjects.filter((s) => s.id !== id),
                })),

            // Playlists
            playlists: [],

            addPlaylist: (playlist) =>
                set((state) => ({
                    playlists: [
                        ...state.playlists,
                        {
                            ...playlist,
                            id: generateId(),
                            createdAt: new Date().toISOString(),
                        },
                    ],
                })),

            updatePlaylist: (id, update) =>
                set((state) => ({
                    playlists: state.playlists.map((p) =>
                        p.id === id ? { ...p, ...update } : p
                    ),
                })),

            deletePlaylist: (id) =>
                set((state) => ({
                    playlists: state.playlists.filter((p) => p.id !== id),
                })),

            toggleVideoWatched: (playlistId, videoId) =>
                set((state) => ({
                    playlists: state.playlists.map((p) =>
                        p.id === playlistId
                            ? {
                                ...p,
                                videos: p.videos.map((v) =>
                                    v.id === videoId ? { ...v, watched: !v.watched } : v
                                ),
                            }
                            : p
                    ),
                })),

            // Question records
            questionRecords: [],

            addQuestionRecord: (record) =>
                set((state) => ({
                    questionRecords: [
                        { ...record, id: generateId() },
                        ...state.questionRecords,
                    ],
                })),

            deleteQuestionRecord: (id) =>
                set((state) => ({
                    questionRecords: state.questionRecords.filter((r) => r.id !== id),
                })),

            // Exam records
            examRecords: [],

            addExamRecord: (record) =>
                set((state) => ({
                    examRecords: [{ ...record, id: generateId() }, ...state.examRecords],
                })),

            deleteExamRecord: (id) =>
                set((state) => ({
                    examRecords: state.examRecords.filter((r) => r.id !== id),
                })),

            // Tasks
            tasks: [],

            addTask: (task) =>
                set((state) => ({
                    tasks: [...state.tasks, task],
                })),

            toggleTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, completed: !t.completed } : t
                    ),
                })),

            deleteTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== id),
                })),

            // Topics
            topics: {},
            addTopic: (subjectId, topic) =>
                set((state) => {
                    const currentTopics = state.topics[subjectId] || [];
                    if (currentTopics.includes(topic)) return state;
                    return {
                        topics: {
                            ...state.topics,
                            [subjectId]: [...currentTopics, topic],
                        },
                    };
                }),

            deleteTopic: (subjectId, topic) =>
                set((state) => ({
                    topics: {
                        ...state.topics,
                        [subjectId]: (state.topics[subjectId] || []).filter((t) => t !== topic),
                    },
                })),


        }),
        {
            name: 'study-master-storage',
        }
    )
);

// ─────────────────────────────────────────────
// BOT SYNC — Store değişikliklerini bot API'sine gönder
// ─────────────────────────────────────────────
const BOT_API_URL = import.meta.env.VITE_BOT_API_URL
    ? `${import.meta.env.VITE_BOT_API_URL}/api/sync`
    : 'http://localhost:3001/api/sync';
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function syncToBot() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        try {
            const state = useStore.getState();
            // Fonksiyonları çıkar, sadece veriyi gönder
            const { tasks, playlists, subjects, topics, questionRecords, examRecords } = state;
            await fetch(BOT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state: { tasks, playlists, subjects, topics, questionRecords, examRecords }
                }),
            });
        } catch {
            // Bot sunucusu kapalıysa sessizce devam et
        }
    }, 2000);
}

// Store değişikliklerini dinle
useStore.subscribe(syncToBot);
