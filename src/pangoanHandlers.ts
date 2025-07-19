// This file handles the "Pangoan" features.
import TelegramBot from 'node-telegram-bot-api';

// --- Configuration ---
const REQUIRED_CHANNEL = '@pangooancom';

// File IDs and Captions
const habitFileId = "CgACAgQAAxkBAAOBaHpvZaBGnOzLpyS4OaQsajNnDfUAAnAYAAKC59BTsfVZJLDIaYk2BA";
const plannerFileId = "BAACAgQAAxDAAN_aHpss3h1QK4GFeSI-ALwTFeljRMAAoIZAAKQndhTYk5kZoi2xEM2BA";
// ... (add other file IDs here)
const homeFileId = "CgACAgQAAxkBAAOMaHp1dmfEYa-FU-sImsDkDI9OjCkAAnUYAAKC59BThP1aHMwxgQQ2BA";
const poleFileId = "CgACAgQAAxkBAAOKaHp1UPDbDBjkoLQCi5ASU3CrgZQAAnEYAAKC59BTn4JO0zFncJ02BA";
const studyFileId = "CgACAgQAAxkBAAOLaHp1X6FUht1QHGAhzJe5mYB_DNgAAnMYAAKC59BT7qa2VQj49q42BA";

const videoCaptions: Record<string, string> = {
    habitFile: "عادت‌ها؛ جایی که هر روز پیشرفتت رو جشن می‌گیری!...",
    plannerFile: "کارها؛ دیگه هیچ کاری از دستت در نمیره!...",
    // ... (add other captions here)
    homeFile: " خانه؛ همه چیز زیر نظرته! 👀...",
    poleFile: " قطب؛ اینجا با بقیه رقابت می‌کنی و رشد می‌کنی! 🤝...",
    studyFile: " مطالعه؛ ابزار نهایی درس خوندنت! 🤓...",
};

function sendJoinRequest(bot: TelegramBot, chatId: TelegramBot.ChatId) {
    bot.sendMessage(chatId, '🚫 برای استفاده از این بخش، باید عضو کانال ما بشی:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 عضویت در کانال', url: `https://t.me/${REQUIRED_CHANNEL.replace('@', '')}` }],
                [{ text: '✅ عضویت انجام شد، بررسی کن', callback_data: 'check_join' }]
            ]
        }
    });
}

// This function is exported and called from index.js
export function setupPangoanHandlers(bot: TelegramBot) {
    // Listener for "Pangoan" feature
    bot.onText(/⭐ میخوام پنگوئن رو بشناسم/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        if (!userId) return;

        try {
            const member = await bot.getChatMember(REQUIRED_CHANNEL, userId);
            const isMember = ['member', 'administrator', 'creator'].includes(member.status);
            if (isMember) {
                bot.sendMessage(chatId, 'کدوم بخش پنگوئن رو می‌خوای ببینی؟', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🧠 عادت‌ها', callback_data: 'habitFile' }, { text: '📅 برنامه‌ریزی', callback_data: 'plannerFile' }],
                            [{ text: '📚 زمان مطالعه', callback_data: 'studyFile' }, { text: '📊 قطب(عادت‌های گروهی)', callback_data: 'poleFile' }],
                            [{ text: '🏠 خونه', callback_data: 'homeFile' }]
                        ]
                    }
                });
            } else {
                sendJoinRequest(bot, chatId);
            }
        } catch (err) {
            console.error('❌ Error checking user in channel:', err);
            sendJoinRequest(bot, chatId);
        }
    });

    // Listener for callback queries
    bot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const data = callbackQuery.data as string;
        const chatId = msg?.chat.id;
        const userId = callbackQuery.from.id;

        if (!chatId) return;

        if (data === 'check_join') {
            // Handle membership check logic here...
            return;
        }

        // This logic only runs for the video buttons
        if (['habitFile', 'plannerFile', 'homeFile', 'poleFile', 'studyFile'].includes(data)) {
            let videoId = '';
            switch (data) {
                case 'habitFile': videoId = habitFileId; break;
                case 'plannerFile': videoId = plannerFileId; break;
                case 'homeFile': videoId = homeFileId; break;
                case 'poleFile': videoId = poleFileId; break;
                case 'studyFile': videoId = studyFileId; break;
            }

            const caption = data ? videoCaptions[data] : 'گزینه نامعتبر.';

            if (videoId) {
                bot.sendVideo(chatId, videoId, { caption });
            }
            bot.answerCallbackQuery(callbackQuery.id);
        }
    });
}
