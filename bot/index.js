import 'dotenv/config';


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

// Motivational Messages
const MOTIVATIONAL_MESSAGES = [
    "Aferin! Bir görevi daha bitirdin, hedefine bir adım daha yaklaştın! 🚀",
    "Harikasın! Böyle devam et, başarı kaçınılmaz! 💪",
    "Süpersin! Disiplin, özgürlüktür. Özgürlüğüne koşuyorsun! 🏃‍♂️",
    "Tebrikler! Bir taş daha koydun duvarına. Sağlam ilerliyorsun! 🧱",
    "Helal olsun! Rakiplerin uyurken sen çalışıyorsun (ya da en azından görevi bitirdin)! 😉",
    "Mükemmel! Küçük adımlar büyük zaferlere götürür. Devam! 🔥",
    "Bravo! Azmin takdire şayan. Aynen böyle devam! ⭐",
    "Çok iyi gidiyorsun! Bu hızla AGS senin! 🏆",
    "Görev tamamlandı! Şimdi sırada ne var? 😎",
    "Durmak yok! Hızını almışken devamını getir! 🚄",
    "İşte bu! Başarı detaylarda gizlidir ve sen detayları hallediyorsun! 🧐",
    "Ders bırakılmaz, mola verilir. Mola bitti, derse dön! ⏳",
    "Gelecekteki sen sana teşekkür edecek. Şimdi çalışmaya devam et! 🙏",
    "En zor kısmı başlamaktı, sen zaten başladın. Bitirmeden kalkma! 🚫",
    "Bu konuyu halledersen akşam ne kadar rahat uyuyacağını düşün! 😴",
    "Rakiplerin yoruldu, sen devam edersen farkı şimdi açarsın! 🏃💨",
    "Sadece 1 saat daha odaklan, neler başarabileceğine şaşıracaksın! 🧠",
    "Hayallerin için ter dökmen gerekiyor. Bu terler, yarın gözyaşı olmasın! 💧",
    "Bugün ektiğin tohumlar yarın ağaç olacak. Sulamaya devam et! 🌳"
];

const AFTERNOON_MESSAGES = [
    "Selam! Nasıl gidiyor? Bırakmadın değil mi? 👀",
    "Öğleden sonra rehaveti çökmesin! Bir kahve al ve masaya dön ☕",
    "Günün yarısı bitti, hedeflerin ne durumda? Hızlanma vakti! ⚡",
    "Şu an çalışıyor olman lazım, telefona bakıyor olman değil! 😉",
    "Mola bitti asker! Cepheye (masaya) geri dön! 🫡",
    "Bırakmak yok! Akşama gururlu bir rapor görmek istiyorum 📉📈",
    "Enerjin düşmesin, bitiş çizgisine daha var ama yolun yarısını geçtin! 🏁",
    "Şşşt! Daldın gittin, odaklan tekrar! 🔔"
];

function getRandomMotivation() {
    return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

function getRandomAfternoonMsg() {
    return AFTERNOON_MESSAGES[Math.floor(Math.random() * AFTERNOON_MESSAGES.length)];
}

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
// TELEGRAM SENDER (Native Fetch)
// ─────────────────────────────────────────────
async function sendTelegramMessage(text) {
    if (!BOT_TOKEN || !CHAT_ID) {
        console.error('❌ Telegram token veya Chat ID eksik!');
        return false;
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'MarkdownV2'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Telegram API Hatası (${response.status}): ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error('❌ Mesaj gönderme hatası:', error.message);
        return false;
    }
}

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

// ─────────────────────────────────────────────
// EVENING REPORT BUILDER
// ─────────────────────────────────────────────
function buildEveningMessage(analysis) {
    const parts = [];
    const today = new Date();
    const dateStr = today.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    parts.push(`🌙 *GÜN SONU RAPORU*`);
    parts.push(`📅 ${escapeMarkdown(dateStr)}`);
    parts.push(`${'─'.repeat(25)}`);

    const completedTasks = analysis.todayTasks.filter(t => t.completed);
    const incompleteTasks = analysis.todayTasks.filter(t => !t.completed);
    const completedVideos = analysis.todayVideos.filter(v => v.watched);
    const incompleteVideos = analysis.todayVideos.filter(v => !v.watched);

    // Total stats
    const totalCompleted = completedTasks.length + completedVideos.length;
    const totalIncomplete = incompleteTasks.length + incompleteVideos.length;

    if (totalCompleted > 0) {
        parts.push('');
        parts.push(`✅ *BUGÜN NELER YAPILDI?*`);
        parts.push(`Toplam ${totalCompleted} görev/video tamamlandı.`);

        if (completedTasks.length > 0) parts.push(`- ${completedTasks.length} Görev`);
        if (completedVideos.length > 0) parts.push(`- ${completedVideos.length} Video`);

        parts.push('');
        parts.push(getRandomMotivation());
    } else {
        parts.push('');
        parts.push('❌ *BUGÜN HİÇBİR ŞEY YAPILMADI MI?*');
        parts.push('_Yarın bunun telafisi şart!_');
    }

    if (totalIncomplete > 0) {
        parts.push('');
        parts.push(`⚠️ *YARINA KALANLAR:*`);
        parts.push(`Toplam ${totalIncomplete} eksik var.`);
        parts.push('_Bunları yarın ilk iş olarak halletmelisin._');
    }

    parts.push('');
    parts.push(`${'─'.repeat(25)}`);
    parts.push('😴 _İyi geceler, yarın daha güçlü başla!_');

    return parts.join('\n');
}

function escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// ─────────────────────────────────────────────
// SEND NOTIFICATION
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// SEND NOTIFICATION (DAILY & EVENING)
// ─────────────────────────────────────────────
async function sendDailyNotification() {
    try {
        const data = await readStoreData();
        const analysis = analyzeData(data);
        const message = buildMessage(analysis);

        console.log('\n📬 Günlük Rapor gönderiliyor...');
        await sendTelegramMessage(message);
        return { success: true, analysis };
    } catch (err) {
        console.error('❌ Rapor hatası:', err.message);
        return { success: false, error: err.message };
    }
}

async function sendEveningReport() {
    try {
        const data = await readStoreData();
        const analysis = analyzeData(data);

        // Sadece bugün verisi varsa rapor at, yoksa boşuna rahatsız etme
        if (analysis.todayTasks.length === 0 && analysis.todayVideos.length === 0) {
            console.log('📭 Bugün işlem yok, akşam raporu atlanıyor.');
            return { success: true, skipped: true };
        }

        const message = buildEveningMessage(analysis);

        console.log('\n🌙 Akşam Raporu gönderiliyor...');
        await sendTelegramMessage(message);
        return { success: true, analysis };
    } catch (err) {
        console.error('❌ Akşam raporu hatası:', err.message);
        return { success: false, error: err.message };
    }
}

async function sendAfternoonCheck() {
    try {
        const data = await readStoreData();
        const analysis = analyzeData(data);

        // Eğer bugün yapılacak bir şey yoksa rahatsız etme
        const todoCount = analysis.todayTasks.filter(t => !t.completed).length + analysis.todayVideos.length;

        if (todoCount === 0) {
            console.log('📭 Yapılacak iş kalmamış (veya yok), öğle bildirimi atlanıyor.');
            return { success: true, skipped: true };
        }

        const msg = getRandomAfternoonMsg() + `\n\n📌 *Kalan Görev:* ${todoCount} adet`;
        console.log('\n☀️ Öğle kontrolü gönderiliyor...');
        await sendTelegramMessage(msg);
        return { success: true };
    } catch (err) {
        console.error('❌ Öğle bildirimi hatası:', err.message);
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

// Frontend'den veri çekme (SYNC GET)
app.get('/api/sync', async (req, res) => {
    try {
        const data = await readStoreData();
        if (!data) {
            return res.json({ state: null });
        }
        res.json({ state: data });
    } catch (err) {
        console.error('❌ Sync GET hatası:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Frontend'den veri sync (SYNC POST)
app.post('/api/sync', async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ error: 'Veri gönderilmedi' });
        }

        const oldData = await readStoreData(); // Mevcut veriyi oku

        const ok = await writeStoreData(data);
        if (!ok) {
            return res.status(500).json({ error: 'MongoDB yazma hatası' });
        }

        // --- DEĞİŞİKLİK VE MOTİVASYON KONTROLÜ ---
        if (oldData) {
            // 1. YENİ GÖREV/PLAYLIST EKLENDİ Mİ?
            const oldTaskIds = (oldData.tasks || []).map(t => t.id);
            const newTaskIds = (data.state?.tasks || []).map(t => t.id);
            const addedTasks = (data.state?.tasks || []).filter(t => !oldTaskIds.includes(t.id));

            const oldPlaylistIds = (oldData.playlists || []).map(p => p.id);
            const newPlaylistIds = (data.state?.playlists || []).map(p => p.id);
            const addedPlaylists = (data.state?.playlists || []).filter(p => !oldPlaylistIds.includes(p.id));

            if (addedTasks.length > 0 || addedPlaylists.length > 0) {
                const parts = [];
                parts.push('🆕 *YENİ EKLEME VAR!*');

                addedTasks.forEach(t => {
                    parts.push(`📌 Görev: _${escapeMarkdown(t.title)}_`);
                });

                addedPlaylists.forEach(p => {
                    parts.push(`📺 Playlist: _${escapeMarkdown(p.name)}_`);
                });

                parts.push('');
                parts.push('Plan yapmak başarının yarısıdır. Hadi başlayalım! 🚀');

                sendTelegramMessage(parts.join('\n')).catch(e => console.error(e));
            }

            // 2. TAMAMLANAN GÖREVLER (MOTİVASYON)
            const newCompletedTasks = (data.state?.tasks || []).filter(t => t.completed);

            // Yeni tamamlanan görevleri bul
            // (Eski listede completed olmayan veya hiç olmayan, şimdi completed olan)
            const newlyCompleted = newCompletedTasks.filter(nT => {
                const ancientTask = (oldData.tasks || []).find(oT => oT.id === nT.id);
                return !ancientTask || !ancientTask.completed;
            });

            // Playlist videoları için de kontrol
            const newWatchedVideos = [];
            (data.state?.playlists || []).forEach(pl => {
                (pl.videos || []).forEach(v => {
                    if (v.watched) newWatchedVideos.push(v.videoId);
                });
            });

            const oldWatchedVideos = [];
            (oldData.playlists || []).forEach(pl => {
                (pl.videos || []).forEach(v => {
                    if (v.watched) oldWatchedVideos.push(v.videoId);
                });
            });

            const newlyWatchedCount = newWatchedVideos.filter(vId => !oldWatchedVideos.includes(vId)).length;

            if (newlyCompleted.length > 0 || newlyWatchedCount > 0) {
                const motivation = getRandomMotivation();
                const count = newlyCompleted.length + newlyWatchedCount;
                const msg = `🎯 ${count} görev/video tamamlandı!\n\n${motivation}`;

                console.log('👏 Motivasyon mesajı gönderiliyor...');
                sendTelegramMessage(msg).catch(err => console.error('Motivasyon gönderilemedi:', err));
            }
        }
        // ---------------------------

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

// manuel test
app.get('/test-notification', async (req, res) => {
    console.log('\n🧪 Manuel test (Günlük Rapor)...');
    const result = await sendDailyNotification();
    res.json(result);
});

app.get('/test-afternoon', async (req, res) => {
    console.log('\n🧪 Manuel test (Öğle Kontrolü)...');
    const result = await sendAfternoonCheck();
    res.json(result);
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
// CRON JOB — Her akşam 23:00 (Europe/Istanbul)
// ─────────────────────────────────────────────
cron.schedule('0 23 * * *', () => {
    console.log('\n🌙 23:00 — Akşam raporu...');
    sendEveningReport();
}, {
    timezone: 'Europe/Istanbul'
});

// ─────────────────────────────────────────────
// CRON JOB — Öğle Kontrolü 14:30 (Europe/Istanbul)
// ─────────────────────────────────────────────
cron.schedule('30 14 * * *', () => {
    console.log('\n☀️ 14:30 — Öğle kontrolü...');
    sendAfternoonCheck();
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
