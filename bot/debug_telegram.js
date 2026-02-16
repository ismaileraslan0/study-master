import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

console.log('Token exists:', !!token);
console.log('Chat ID exists:', !!chatId);

if (!token || !chatId) {
    console.error('❌ Missing credentials in .env file');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

async function sendTest() {
    try {
        console.log('Attempting to send test message...');
        await bot.sendMessage(chatId, '🔔 Test message from Debug Script (StudyMaster)');
        console.log('✅ Message sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send message:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.body);
        }
    }
}

sendTest();
