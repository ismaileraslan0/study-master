import 'dotenv/config';

const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

if (!token || !chatId) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const url = `https://api.telegram.org/bot${token}/sendMessage`;

async function sendTest() {
    try {
        console.log('Attempting to send test message via fetch...');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: '🔔 Test via fetch (StudyMaster)'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Message sent successfully!', data);
    } catch (error) {
        console.error('❌ Failed to send message:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

sendTest();
