import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

// ─────────────────────────────────────────────
// CONFIG (from .env)
// ─────────────────────────────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3001;

if (!BOT_TOKEN || !CHAT_ID || !MONGODB_URI) {
    console.error('❌ Eksik ortam değişkeni! .env dosyasını kontrol et:');
    console.error('   BOT_TOKEN, CHAT_ID, MONGODB_URI gerekli.');
    process.exit(1);
}

// ─────────────────────────────────────────────
// MONGODB
// ─────────────────────────────────────────────
const client = new MongoClient(MONGODB_URI);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('studymaster');
        console.log('✅ MongoDB bağlantısı başarılı!');
    } catch (err) {
        console.error('❌ MongoDB bağlantı hatası:', err.message);
        process.exit(1);
    }
}

async function readStoreData() {
    try {
        const doc = await db.collection('store').findOne({ _id: 'app_state' });
        return doc?.state || null;
    } catch (err) {
        console.error('❌ MongoDB okuma hatası:', err.message);
        return null;
    }
}

async function writeStoreData(data) {
    try {
        await db.collection('store').updateOne(
            { _id: 'app_state' },
            { $set: { state: data.state, updatedAt: new Date() } },
            { upsert: true }
        );
        return true;
    } catch (err) {
        console.error('❌ MongoDB yazma hatası:', err.message);
        return false;
    }
}

// ─────────────────────────────────────────────
// TELEGRAM BOT
// ─────────────────────────────────────────────
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// ─────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────
function getTodayStr() {
    // Türkiye saatine göre bugünün tarihini al
    const now = new Date();
    const trTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const year = trTime.getFullYear();
    const month = String(trTime.getMonth() + 1).padStart(2, '0');
    const day = String(trTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ─────────────────────────────────────────────
// ANALYSIS ENGINE
// ─────────────────────────────────────────────
function analyzeData(data) {
    const today = getTodayStr();
    const result = {
        overdueTasks: [],
        todayTasks: [],
        todayVideos: [],
        allClear: true
    };

    if (!data) return result;

    // 1. GÖREVLER (Tasks)
    const tasks = data.tasks || [];
    tasks.forEach(task => {
        if (!task.completed && task.date < today) {
            result.overdueTasks.push(task);
        }
        if (task.date === today) {
            result.todayTasks.push(task);
        }
    });

    // 2. PLAYLİST VİDEOLARI
    const playlists = data.playlists || [];
    playlists.forEach(playlist => {
        (playlist.videos || []).forEach(video => {
            if (video.assignedDate === today && !video.watched) {
                result.todayVideos.push({
                    ...video,
                    playlistName: playlist.name
                });
            }
            if (video.assignedDate && video.assignedDate < today && !video.watched) {
                result.overdueTasks.push({
                    title: `📺 ${video.title} (${playlist.name})`,
                    date: video.assignedDate,
                    type: 'video'
                });
            }
        });
    });

    result.allClear = result.overdueTasks.length === 0 &&
        result.todayTasks.filter(t => !t.completed).length === 0 &&
        result.todayVideos.length === 0;

    return result;
}

// ─────────────────────────────────────────────
// MESSAGE BUILDER
// ─────────────────────────────────────────────
function buildMessage(analysis) {
    const parts = [];
    const today = new Date();
    const dateStr = today.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    parts.push(`📋 *AGS DİSİPLİN RAPORU*`);
    parts.push(`📅 ${escapeMarkdown(dateStr)}`);
    parts.push(`${'─'.repeat(25)}`);

    // AŞAMA 1: GEÇMİŞİN HESABI
    if (analysis.overdueTasks.length > 0) {
        parts.push('');
        parts.push('🛑 *DÜNÜN HESABI:*');
        parts.push('');
        parts.push(`_Dün şu görevleri yapmadan nasıl rahat uyudun?_`);
        parts.push('');

        analysis.overdueTasks.forEach((task, i) => {
            const icon = task.type === 'video' ? '📺' :
                task.type === 'soru' ? '✏️' :
                    task.type === 'tekrar' ? '🔄' : '📌';
            parts.push(`  ${i + 1}\\. ${icon} ${escapeMarkdown(task.title)} \\(${escapeMarkdown(task.date)}\\)`);
        });

        parts.push('');
        parts.push(`⚠️ _Rakiplerin çalışırken sen bunları erteledin\\! AGS birinciliği böyle kazanılmaz\\!_`);
        parts.push(`💪 *Hemen bunları temizle\\!*`);
    }

    // AŞAMA 2: BUGÜNÜN ROTASI
    const todayIncomplete = analysis.todayTasks.filter(t => !t.completed);
    const todayComplete = analysis.todayTasks.filter(t => t.completed);

    if (todayIncomplete.length > 0 || analysis.todayVideos.length > 0) {
        parts.push('');
        parts.push(`${'─'.repeat(25)}`);
        parts.push('');
        parts.push('🚀 *BUGÜNÜN HEDEFİ:*');
        parts.push('');
        parts.push('_Bugün mazeret yok\\. Masaya otur ve şunları bitir:_');
        parts.push('');

        let idx = 1;

        todayIncomplete.forEach(task => {
            const icon = task.type === 'video' ? '📺' :
                task.type === 'soru' ? '✏️' :
                    task.type === 'tekrar' ? '🔄' : '📌';
            const subjectInfo = task.subject ? ` \\[${escapeMarkdown(task.subject)}\\]` : '';
            parts.push(`  ${idx}\\. ${icon} ${escapeMarkdown(task.title)}${subjectInfo}`);
            idx++;
        });

        analysis.todayVideos.forEach(video => {
            parts.push(`  ${idx}\\. 📺 ${escapeMarkdown(video.title)} \\(${escapeMarkdown(video.playlistName)}\\)`);
            idx++;
        });

        parts.push('');
        parts.push('🔥 _Akşam kontrol edeceğim, eksiksiz istiyorum\\!_');
    }

    if (todayComplete.length > 0) {
        parts.push('');
        parts.push(`✅ Bugün tamamlanan: *${todayComplete.length}* görev`);
    }

    // HER ŞEY TAMAM
    if (analysis.overdueTasks.length === 0 && todayIncomplete.length === 0 && analysis.todayVideos.length === 0) {
        parts.push('');
        parts.push('✅ *Harika gidiyorsun\\!*');
        parts.push('');

        if (analysis.todayTasks.length === 0 && analysis.todayVideos.length === 0) {
            parts.push('📭 Bugün için tanımlı görev yok\\.');
            parts.push('_Ama boş durma\\! Gir uygulamaya, plan yap\\._');
        } else {
            parts.push('🎯 Tüm görevlerin tamamlanmış\\!');
            parts.push('_Ritmi bozma, yarın da aynı disiplinle devam\\!_');
        }
    }

    parts.push('');
    parts.push(`${'─'.repeat(25)}`);
    parts.push('🤖 _AGS Disiplin Botu_');

    return parts.join('\n');
}

function escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// ─────────────────────────────────────────────
// SEND NOTIFICATION
// ─────────────────────────────────────────────
async function sendDailyNotification() {
    try {
        const data = await readStoreData();
        const analysis = analyzeData(data);
        const message = buildMessage(analysis);

        console.log('\n📬 Telegram mesajı gönderiliyor...');
        await bot.sendMessage(CHAT_ID, message, { parse_mode: 'MarkdownV2' });

        console.log('✅ Mesaj gönderildi!');
        console.log(`   📊 Gecikmiş: ${analysis.overdueTasks.length}`);
        console.log(`   📋 Bugün: ${analysis.todayTasks.length} görev + ${analysis.todayVideos.length} video`);

        return { success: true, analysis };
    } catch (err) {
        console.error('❌ Telegram hatası:', err.message);
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────
// EXPRESS SERVER
// ─────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
    res.json({
        status: '🟢 AGS Disiplin Botu çalışıyor!',
        cron: '08:00 Europe/Istanbul',
        db: db ? 'bağlı' : 'bağlı değil'
    });
});

// Frontend'den veri sync
app.post('/api/sync', async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ error: 'Veri gönderilmedi' });
        }

        const ok = await writeStoreData(data);
        if (!ok) {
            return res.status(500).json({ error: 'MongoDB yazma hatası' });
        }

        const taskCount = data?.state?.tasks?.length || 0;
        const playlistCount = data?.state?.playlists?.length || 0;
        console.log(`🔄 Sync: ${taskCount} görev, ${playlistCount} playlist`);

        res.json({ success: true, synced: new Date().toISOString() });
    } catch (err) {
        console.error('❌ Sync hatası:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Veri durumu
app.get('/api/status', async (req, res) => {
    const data = await readStoreData();
    if (!data) {
        return res.json({ status: 'no_data', message: 'Henüz veri yok.' });
    }

    const analysis = analyzeData(data);
    res.json({
        status: 'ok',
        today: getTodayStr(),
        summary: {
            overdueTasks: analysis.overdueTasks.length,
            todayTasks: analysis.todayTasks.length,
            todayVideos: analysis.todayVideos.length,
            allClear: analysis.allClear
        }
    });
});

// Manuel test
app.get('/test-notification', async (req, res) => {
    console.log('\n🧪 Manuel test...');
    const result = await sendDailyNotification();

    if (result.success) {
        res.json({
            success: true,
            message: '✅ Telegram mesajı gönderildi!',
            analysis: {
                overdueTasks: result.analysis.overdueTasks.length,
                todayTasks: result.analysis.todayTasks.length,
                todayVideos: result.analysis.todayVideos.length
            }
        });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
});

// ─────────────────────────────────────────────
// CRON JOB — Her sabah 08:00 (Europe/Istanbul)
// ─────────────────────────────────────────────
cron.schedule('0 8 * * *', () => {
    console.log('\n⏰ 08:00 — Günlük rapor...');
    sendDailyNotification();
}, {
    timezone: 'Europe/Istanbul'
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
async function start() {
    await connectDB();

    app.listen(PORT, () => {
        console.log('');
        console.log('╔══════════════════════════════════════╗');
        console.log('║   🤖 AGS DİSİPLİN BOTU AKTİF!      ║');
        console.log('╠══════════════════════════════════════╣');
        console.log(`║  📡 Port: ${PORT}`);
        console.log(`║  🧪 Test: /test-notification`);
        console.log(`║  ⏰ Cron: 08:00 (İstanbul)`);
        console.log(`║  🗄️  DB:   MongoDB Atlas`);
        console.log('╚══════════════════════════════════════╝');
        console.log('');
    });
}

start();
