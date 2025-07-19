import TelegramBot, { ChatMember } from 'node-telegram-bot-api';
require('dotenv').config();

const token = process.env.TELEGRAM_TOKEN || 'your telegram token';
const bot = new TelegramBot(token, { polling: true });
const REQUIRED_CHANNEL = '@pangooancom'; // 👈 آیدی کانالت اینجا تعریف شده

// فایل آیدی‌ها
const habitFileId = "CgACAgQAAxkBAAOBaHpvZaBGnOzLpyS4OaQsajNnDfUAAnAYAAKC59BTsfVZJLDIaYk2BA";
const plannerFileId = "BAACAgQAAxkDAAN_aHpss3h1QK4GFeSI-ALwTFeljRMAAoIZAAKQndhTYk5kZoi2xEM2BA";
const homeFileId = "CgACAgQAAxkBAAOMaHp1dmfEYa-FU-sImsDkDI9OjCkAAnUYAAKC59BThP1aHMwxgQQ2BA";
const poleFileId = "CgACAgQAAxkBAAOKaHp1UPDbDBjkoLQCi5ASU3CrgZQAAnEYAAKC59BTn4JO0zFncJ02BA";
const studyFileId = "CgACAgQAAxkBAAOLaHp1X6FUht1QHGAhzJe5mYB_DNgAAnMYAAKC59BT7qa2VQj49q42BA";

// کپشن‌ها
const videoCaptions: Record<string, string> = {
    habitFile: "عادت‌ها؛ جایی که هر روز پیشرفتت رو جشن می‌گیری! 🎉عادت جدیدت رو بساز، مشخص کن چه روزایی می‌خوای انجامش بدی، و پیشرفتت رو روی تقویم با ایموجی‌ها ببین. با هر بار تکرار، امتیازت بیشتر می‌شه و می‌تونی باهاش هم باغچه‌ات رو خوشگل کنی و هم از فروشگاه برای خودت جایزه بخری. کی گفته نظم باید خسته‌کننده باشه؟ 😉",
    plannerFile: "کارها؛ دیگه هیچ کاری از دستت در نمیره! 📝یه پلنر کامل با نمایش روزانه، هفتگی و ماهانه که خیالت رو از بابت مدیریت کارها راحت می‌کنه. برای کارهای مهم یادآور بذار، سختی‌شون رو مشخص کن و با ذهنی آروم، روزت رو مدیریت کن. نظم یعنی همین! ✨!",
    homeFile: " خانه؛ همه چیز زیر نظرته! 👀صفحه‌ای که با یک نگاه بهت می‌گه اوضاع از چه قراره. کارها، عادت‌های شخصی و گروهی، امتحانات پیش رو، و یادداشت‌هات، همه و همه یک جا جمع شدن. به تقویم شمسی هم دسترسی کامل داری تا با تسلط کامل، برای روزها و هفته‌های آینده‌ات برنامه‌ریزی کنی.",
    poleFile: " قطب؛ اینجا با بقیه رقابت می‌کنی و رشد می‌کنی! 🤝اینجا می‌تونی به ده‌ها چالش گروهی آماده ملحق شی و با بقیه اعضای پنگوئن رقابت کنی! از ورزش و سلامتی گرفته تا یادگیری مهارت جدید، برای هر هدفی یه گروه هست. تازه، خودت هم می‌تونی چالش بسازی و دوستات رو دعوت کنی تا با هم بترکونید! 🚀.",
    studyFile: " مطالعه؛ ابزار نهایی درس خوندنت! 🤓اینجا دیگه داستان درس خوندن فرق می‌کنه! با کرنومتر دقیق، زمان مطالعه‌ات رو ثبت کن و با نمودارها، ببین کجای کار لنگ می‌زنه. تازه، می‌تونی توی رقابت‌های روزانه شرکت کنی و خودت رو تو لیست نفرات برتر ببینی. درس خوندن هیچوقت اینقدر هیجان‌انگیز نبوده! 🔥",
};

// ارسال ویدیو بر اساس callback
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = msg?.chat.id ?? "";
    const queryId = callbackQuery.id;
    const userId = msg?.from?.id ?? 0;

    let videoId: string | undefined;
    let caption = '';
    if (data === 'check_join') {
        try {
            const member = await bot.getChatMember(REQUIRED_CHANNEL, userId);
            const isMember = ['member', 'administrator', 'creator'].includes(member.status);

            if (isMember) {
                bot.sendMessage(chatId, '✅ عضویتت تأیید شد! حالا دوباره گزینه "⭐ میخوام پنگوئن رو بشناسم" رو بزن.');
            } else {
                bot.sendMessage(chatId, '❌ هنوز عضو نشدی! لطفاً اول در کانال عضو شو.');
            }
        } catch (err) {
            bot.sendMessage(chatId, 'خطا در بررسی عضویت. لطفاً دوباره امتحان کن.');
        }

        bot.answerCallbackQuery(callbackQuery.id);
    }

    switch (data) {
        case 'habitFile':
            videoId = habitFileId;
            caption = videoCaptions.habitFile;
            break;
        case 'plannerFile':
            videoId = plannerFileId;
            caption = videoCaptions.plannerFile;
            break;
        case 'homeFile':
            videoId = homeFileId;
            caption = videoCaptions.homeFile;
            break;
        case 'poleFile':
            videoId = poleFileId;
            caption = videoCaptions.poleFile;
            break;
        case 'studyFile':
            videoId = studyFileId;
            caption = videoCaptions.studyFile;
            break;
        default:
            caption = '⛔️ گزینه نامعتبر بود.';
    }

    if (videoId && chatId) {
        bot.sendVideo(chatId, videoId, { caption });
    } else if (chatId) {
        bot.sendMessage(chatId, caption);
    }

    bot.answerCallbackQuery(queryId);
});

// نمایش دکمه‌های شیشه‌ای
bot.onText(/⭐ میخوام پنگوئن رو بشناسم/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    try {
        const member = userId && await bot.getChatMember(REQUIRED_CHANNEL, userId);
        const isMember =
            typeof member === 'object' &&
            member !== null &&
            'status' in member &&
            ['member', 'administrator', 'creator'].includes((member as ChatMember).status);

        if (!isMember) {
            return sendJoinRequest(chatId);
        }

        // کاربر عضو بود، دکمه‌ها رو نشون بده
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🧠 عادت‌ها', callback_data: 'habitFile' },
                        { text: '📅 برنامه‌ریزی', callback_data: 'plannerFile' },
                    ],
                    [
                        { text: '📚 زمان مطالعه', callback_data: 'studyFile' },
                        { text: '📊 قطب(عادت‌های گروهی)', callback_data: 'poleFile' },
                    ],
                    [
                        { text: '🏠 خونه', callback_data: 'homeFile' },
                    ]
                ]
            }
        };

        bot.sendMessage(chatId, 'کدوم بخش پنگوئن رو می‌خوای ببینی؟', options);
    } catch (err) {
        console.error('❌ Error checking user in channel:', err);
        return sendJoinRequest(chatId);
    }
});


// کیبورد معمولی
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'یکی از دستورات زیر را انتخاب کن:', {
        reply_markup: {
            keyboard: [
                [{ text: '⭐ میخوام پنگوئن رو بشناسم' }],
            ],
            resize_keyboard: true,
        }
    });
});
function sendJoinRequest(chatId: number) {
    bot.sendMessage(chatId, '🚫 برای استفاده از این بخش، باید عضو کانال ما بشی:', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📢 عضویت در کانال', url: `https://t.me/${REQUIRED_CHANNEL.replace('@', '')}` }
                ],
                [
                    { text: '✅ عضویت انجام شد، بررسی کن', callback_data: 'check_join' }
                ]
            ]
        }
    });
}

console.log('✅ Bot is running...');
