import TelegramBot from 'node-telegram-bot-api';
require('dotenv').config();

const token = process.env.TELEGRAM_TOKEN || 'you telegram token';
const bot = new TelegramBot(token, { polling: true });


bot.on('message', (msg) => {
var bye = "bye";
if (msg.text?.toString().toLowerCase().includes(bye)) {
bot.sendMessage(msg.chat.id, "Hope to see you around again , Bye");
}
})

// این دستور یک پیام با دکمه‌های شیشه‌ای ارسال می‌کند
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // تعریف دکمه‌ها و چیدمان آن‌ها
    const options = {
        reply_markup: {
            inline_keyboard: [
                // ردیف اول دکمه‌ها
                [
                    { text: 'گوگل', url: 'https://google.com' }, // دکمه از نوع لینک
                    { text: 'ثبت تولد دوستم', callback_data: 'option_1' } // دکمه با داده بازگشتی
                ],
                // ردیف دوم دکمه‌ها
                [
                    { text: 'گزینه ۲', callback_data: 'option_2' }
                ]
            ]
        }
    };

    bot.sendMessage(chatId, 'یک گزینه را انتخاب کنید:', options);
});


// این بخش به کلیک روی دکمه‌های شیشه‌ای گوش می‌دهد
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data; // داده بازگشتی که در دکمه تعریف کردید
    const chatId = msg?.chat.id;
    const queryId = callbackQuery.id;

    let responseText = '';

    if (data === 'option_1') {
        responseText = 'شما گزینه ۱ را انتخاب کردید.';
    } else if (data === 'option_2') {
        responseText = 'شما گزینه ۲ را انتخاب کردید.';
    }

    // ارسال پاسخ به کاربر
    chatId && bot.sendMessage(chatId, responseText,{
        reply_markup: {
            inline_keyboard: [
                // ردیف اول دکمه‌ها
                [
                    { text: 'گوگل', url: 'https://google.com' }, // دکمه از نوع لینک
                    { text: 'ثبت تولد دوستم', callback_data: 'option_1' } // دکمه با داده بازگشتی
                ],
                // ردیف دوم دکمه‌ها
                [
                    { text: 'گزینه ۲', callback_data: 'option_2' }
                ]
            ]
        }
    });

    // برای حذف حالت لودینگ از روی دکمه، این متد را فراخوانی کنید
    bot.answerCallbackQuery(queryId);
});


// کدهای قبلی شما
bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match && match[1];
    resp && bot.sendMessage(chatId, resp);
});

bot.onText(/عکس سیناب/, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendPhoto(chatId, 'https://testbuckett.storage.c2.liara.space/sinab.jpg', {
        caption: 'عکس سیناب'
    });
});

console.log('Bot is running...');
