# Vercel Deployment Notları

## Frontend → Vercel

```bash
# Vercel CLI kur
npm i -g vercel

# Deploy et
vercel

# Production deploy
vercel --prod
```

**Ayarlar:**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

---

## Bot → Railway (Önerilen)

**Neden Railway?**
- ✅ Free tier 500 saat/ay (aylık 20 gün 7/24)
- ✅ Auto-deploy (GitHub push → otomatik deploy)
- ✅ Environment variables (bot token gizli kalır)

**Adımlar:**

1. **GitHub'a push et**
```bash
git add .
git commit -m "AGS Disiplin Botu"
git push
```

2. **Railway'e deploy**
   - https://railway.app → Sign up
   - "New Project" → "Deploy from GitHub repo"
   - `study-master` seç
   - Root Directory: `/bot` yap
   - Start Command: `node index.js`

3. **Environment Variables**
   - `BOT_TOKEN`: 8325101387:AAGNxnYgk1sjbm85AcXKX-d0A1-ArdpKQEM
   - `CHAT_ID`: 1563156376
   - `NODE_ENV`: production

4. **Public URL al**
   - Railway bir URL verir (örn: `your-bot.railway.app`)
   - Frontend'in sync URL'ini güncelle

---

## Frontend'de Sync URL Değişikliği

`src/store/useStore.ts` dosyasında:

```typescript
const BOT_API_URL = import.meta.env.PROD 
    ? 'https://your-bot.railway.app/api/sync'  // Production
    : 'http://localhost:3001/api/sync';        // Development
```

---

## Alternatif: Render.com

Railway kadar kolay, biraz daha yavaş ama 7/24 free:
- https://render.com
- "New Web Service" → GitHub repo
- Start: `node bot/index.js`
