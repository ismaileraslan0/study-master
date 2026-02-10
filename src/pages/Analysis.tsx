import { useStore } from '../store/useStore';
import { AGS_SUBJECTS, OABT_SUBJECTS } from '../types';
import { BarChart3, AlertTriangle } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Analysis() {
    const { examRecords, questionRecords } = useStore();

    // Get exam stats by subject for ÖABT
    const getOABTSubjectStats = () => {
        const oabtExams = examRecords.filter((e) => e.examType === 'oabt');
        if (oabtExams.length === 0) return [];

        return OABT_SUBJECTS.map((s, index) => {
            const totals = oabtExams.reduce(
                (acc, exam) => {
                    const result = exam.results.find((r) => r.subject === s.key);
                    if (result) {
                        acc.correct += result.correct;
                        acc.wrong += result.wrong;
                        acc.net += result.net;
                        acc.count++;
                    }
                    return acc;
                },
                { correct: 0, wrong: 0, net: 0, count: 0 }
            );

            return {
                name: s.label,
                avgNet: totals.count > 0 ? totals.net / totals.count : 0,
                totalCorrect: totals.correct,
                totalWrong: totals.wrong,
                maxPossible: s.questionCount,
                fill: COLORS[index % COLORS.length],
            };
        });
    };

    // Get exam stats by subject for AGS
    const getAGSSubjectStats = () => {
        const agsExams = examRecords.filter((e) => e.examType === 'ags');
        if (agsExams.length === 0) return [];

        return AGS_SUBJECTS.map((s, index) => {
            const totals = agsExams.reduce(
                (acc, exam) => {
                    const result = exam.results.find((r) => r.subject === s.key);
                    if (result) {
                        acc.correct += result.correct;
                        acc.wrong += result.wrong;
                        acc.net += result.net;
                        acc.count++;
                    }
                    return acc;
                },
                { correct: 0, wrong: 0, net: 0, count: 0 }
            );

            return {
                name: s.label,
                avgNet: totals.count > 0 ? totals.net / totals.count : 0,
                totalCorrect: totals.correct,
                totalWrong: totals.wrong,
                maxPossible: s.questionCount,
                fill: COLORS[index % COLORS.length],
            };
        });
    };

    // Net progress over time
    const getNetProgressData = () => {
        const oabtExams = examRecords
            .filter((e) => e.examType === 'oabt')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((e) => ({
                date: format(new Date(e.date), 'd MMM', { locale: tr }),
                net: e.totalNet,
                name: e.examName,
            }));

        const agsExams = examRecords
            .filter((e) => e.examType === 'ags')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((e) => ({
                date: format(new Date(e.date), 'd MMM', { locale: tr }),
                net: e.totalNet,
                name: e.examName,
            }));

        return { oabt: oabtExams, ags: agsExams };
    };

    // Find weak topics
    const getWeakTopics = () => {
        const topicCounts: Record<string, number> = {};

        examRecords.forEach((exam) => {
            exam.wrongTopics.forEach((topic) => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        });

        // NEW: Add wrong answers from question records
        questionRecords.forEach((record) => {
            if (record.topic && record.wrongAnswers > 0) {
                // Add the number of wrong answers to the topic count
                topicCounts[record.topic] = (topicCounts[record.topic] || 0) + record.wrongAnswers;
            }
        });

        return Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count }));
    };

    // Question success rate distribution
    const getSuccessDistribution = () => {
        const ranges = [
            { name: '0-25%', value: 0 },
            { name: '26-50%', value: 0 },
            { name: '51-75%', value: 0 },
            { name: '76-100%', value: 0 },
        ];

        questionRecords.forEach((record) => {
            const rate = (record.correctAnswers / record.totalQuestions) * 100;
            if (rate <= 25) ranges[0].value++;
            else if (rate <= 50) ranges[1].value++;
            else if (rate <= 75) ranges[2].value++;
            else ranges[3].value++;
        });

        return ranges.filter((r) => r.value > 0);
    };

    const oabtStats = getOABTSubjectStats();
    const agsStats = getAGSSubjectStats();
    const progressData = getNetProgressData();
    const weakTopics = getWeakTopics();
    const successDist = getSuccessDistribution();

    const hasData = examRecords.length > 0 || questionRecords.length > 0;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>📊 Analiz</h1>
                <p>Performansını detaylı analiz et</p>
            </div>

            {!hasData ? (
                <div className="card">
                    <div className="empty-state">
                        <BarChart3 size={48} />
                        <h3>Henüz veri yok</h3>
                        <p>Deneme veya soru çözümleri ekledikçe analizler burada görünecek</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* ÖABT Subject Performance */}
                    {oabtStats.length > 0 && (
                        <div className="card mb-6">
                            <h3 className="card-title mb-4">📐 ÖABT Ders Bazlı Ortalama Net</h3>
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={oabtStats}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="#a0a0b0" fontSize={12} />
                                        <YAxis stroke="#a0a0b0" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Bar dataKey="avgNet" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* AGS Subject Performance */}
                    {agsStats.length > 0 && (
                        <div className="card mb-6">
                            <h3 className="card-title mb-4">🎯 AGS Ders Bazlı Ortalama Net</h3>
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={agsStats}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="#a0a0b0" fontSize={12} />
                                        <YAxis stroke="#a0a0b0" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Bar dataKey="avgNet" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="grid-2">
                        {/* Net Progress */}
                        {progressData.oabt.length > 1 && (
                            <div className="card">
                                <h3 className="card-title mb-4">📈 ÖABT Net İlerlemesi</h3>
                                <div style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={progressData.oabt}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="date" stroke="#a0a0b0" fontSize={12} />
                                            <YAxis stroke="#a0a0b0" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#1a1a2e',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="net"
                                                stroke="#6366f1"
                                                strokeWidth={2}
                                                dot={{ fill: '#6366f1' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {progressData.ags.length > 1 && (
                            <div className="card">
                                <h3 className="card-title mb-4">📈 AGS Net İlerlemesi</h3>
                                <div style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={progressData.ags}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="date" stroke="#a0a0b0" fontSize={12} />
                                            <YAxis stroke="#a0a0b0" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#1a1a2e',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="net"
                                                stroke="#22d3ee"
                                                strokeWidth={2}
                                                dot={{ fill: '#22d3ee' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid-2 mt-6">
                        {/* Weak Topics */}
                        {weakTopics.length > 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">⚠️ En Çok Yanlış Yapılan Konular</h3>
                                    <AlertTriangle size={20} color="var(--accent-warning)" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {weakTopics.map((item, index) => (
                                        <div
                                            key={item.topic}
                                            className="flex justify-between items-center"
                                            style={{
                                                padding: '10px 14px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '8px',
                                            }}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: 'var(--gradient-danger)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600
                                                }}>
                                                    {index + 1}
                                                </span>
                                                {item.topic}
                                            </span>
                                            <span className="tag tag-danger">{item.count}x</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Success Distribution */}
                        {successDist.length > 0 && (
                            <div className="card">
                                <h3 className="card-title mb-4">🎯 Başarı Oranı Dağılımı</h3>
                                <div style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={successDist}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {successDist.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#1a1a2e',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
