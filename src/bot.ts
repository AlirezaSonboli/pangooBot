// Import necessary libraries
import TelegramBot from 'node-telegram-bot-api';
import { setupPangoanHandlers } from './pangoanHandlers';
import { setupSongHandlers } from './songHandlers';
require('dotenv').config();

// --- Configuration ---
const token = process.env.TELEGRAM_TOKEN || 'your telegram token';

// --- Bot Initialization (ONLY HAPPENS HERE!) ---
// This is the single, shared bot instance for the entire application.
const bot = new TelegramBot(token, { polling: true });

setupPangoanHandlers(bot);
setupSongHandlers(bot);

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'یکی از دستورات زیر را انتخاب کن:', {
        reply_markup: {
            keyboard: [
                [{ text: '⭐ میخوام پنگوئن رو بشناسم' }],
                [{ text: '🎵 یه آهنگ برام بفرست' }]
            ],
            resize_keyboard: true,
        }
    });
});

console.log('✅ Main bot is running...');
