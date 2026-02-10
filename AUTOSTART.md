# Windows Otomatik Başlatma

## Yöntem 1: Başlat Klasörü (Önerilen)

1. **`Win + R`** → `shell:startup` yaz → Enter
2. Açılan klasöre `start-all.bat` dosyasının **kısayolunu** at
3. Bilgisayar açılınca otomatik başlayacak

## Yöntem 2: Task Scheduler (Daha Gelişmiş)

1. **Başlat** → "Task Scheduler" ara
2. **Create Basic Task**
   - Name: `StudyMaster Auto Start`
   - Trigger: **At log on**
   - Action: **Start a program**
   - Program: `C:\Users\İsmail\.gemini\antigravity\scratch\study-master\start-all.bat`

---

## Manuel Başlatma

Proje klasöründe `start-all.bat` dosyasına çift tıkla — her şey başlasın.

---

## Kapatma

Açılan iki CMD penceresini kapat veya `Ctrl+C` yap.
