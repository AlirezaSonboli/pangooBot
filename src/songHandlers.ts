import TelegramBot from "node-telegram-bot-api";

// --- Helper: Get Enhanced AI Details ---
async function getEnhancedSongDetailsFromAI(songTitle: string, artistName: string): Promise<{
    // --- CHANGED ---: funFact is replaced with artistBio
    artistBio: string;
    releaseDate: string;
    genre: string;
    albumName: string;
    similarSongs: Array<{ title: string; artist: string; }>;
}> {
    const liaraApiKey = process.env.LIARA_AI_KEY;
    const defaultResponse = {
        // --- CHANGED ---
        artistBio: "بیوگرافی برای این خواننده یافت نشد.",
        releaseDate: "نامشخص",
        genre: "نامشخص",
        albumName: "نامشخص",
        similarSongs: [],
    };

    if (!liaraApiKey) {
        return { ...defaultResponse, artistBio: "کلید API برای Liara AI تنظیم نشده است." };
    }

    const liaraApiUrl = "https://ai.liara.ir/api/v1/682b8bde153623bd82f7d348/chat/completions";

    // --- ENHANCED PROMPT ---: Now asks for an artist biography instead of a fun fact.
    const prompt = `
        در مورد آهنگ "${songTitle}" از "${artistName}", یک آبجکت JSON کامل با فیلدهای زیر ارائه بده:
        1. "artistBio": یک بیوگرافی کوتاه و مختصر (دو یا سه جمله) در مورد خواننده یا گروه '${artistName}'.
        2. "releaseDate": تاریخ انتشار دقیق آهنگ.
        3. "genre": ژانر اصلی آهنگ.
        4. "albumName": نام آلبومی که آهنگ در آن قرار دارد.
        5. "similarSongs": آرایه‌ای حاوی 3 آهنگ مشابه. هر آیتم در آرایه باید یک آبجکت با دو کلید "title" و "artist" باشد.

        فقط و فقط آبجکت JSON را برگردان و هیچ متن اضافی ارسال نکن.
    `;

    const payload = {
        model: 'openai/gpt-4o-mini',
        messages: [{ role: "user", content: prompt }],
        stream: false,
        response_format: { type: "json_object" },
    };

    try {
        const response = await fetch(liaraApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${liaraApiKey}` },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Liara API Error:", await response.text());
            return defaultResponse;
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;

        if (content) {
            try {
                const parsed = JSON.parse(content);
                return {
                    // --- CHANGED ---
                    artistBio: parsed.artistBio || defaultResponse.artistBio,
                    releaseDate: parsed.releaseDate || defaultResponse.releaseDate,
                    genre: parsed.genre || defaultResponse.genre,
                    albumName: parsed.albumName || defaultResponse.albumName,
                    similarSongs: parsed.similarSongs || defaultResponse.similarSongs,
                };
            } catch (e) {
                console.error("Error parsing JSON from Liara AI:", e);
                return { ...defaultResponse, artistBio: "خطا در پردازش پاسخ AI." };
            }
        }
        return defaultResponse;

    } catch (error) {
        console.error('Error fetching from Liara AI:', error);
        return { ...defaultResponse, artistBio: 'خطایی در هنگام دریافت اطلاعات از هوش مصنوعی رخ داد.' };
    }
}

// --- Helper function to build and send song info ---
async function sendSongInfo(bot: TelegramBot, chatId: number, title: string, artist: string) {
    const aiDetails = await getEnhancedSongDetailsFromAI(title, artist);

    const similarSongsText = aiDetails.similarSongs
        .map(song => `- ${song.title} از ${song.artist}`)
        .join('\n');

    // --- CHANGED ---: The final message now includes the artist bio.
    const finalMessage = `
🎵 **${title}**
**خواننده:** ${artist}
**آلبوم:** ${aiDetails.albumName}
**ژانر:** ${aiDetails.genre}
**تاریخ انتشار:** ${aiDetails.releaseDate}

🎤 **درباره ${artist}:**
${aiDetails.artistBio}

**🎧 آهنگ‌های مشابه:**
${similarSongsText || 'موردی یافت نشد.'}
    `;

    const inline_keyboard = [];
    const youtubeQuery = encodeURIComponent(`${artist} ${title}`);
    inline_keyboard.push([{
        text: '▶️ جستجو در یوتیوب',
        url: `https://www.youtube.com/results?search_query=$${youtubeQuery}`
    }]);

    aiDetails.similarSongs.forEach(song => {
        inline_keyboard.push([{
            text: `🎵 جستجوی اطلاعات: ${song.title}`,
            callback_data: `songinfo:${song.title}:${song.artist}`
        }]);
    });

    bot.sendMessage(chatId, finalMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard
        }
    });
}


// --- Main Handler Setup ---
export function setupSongHandlers(bot: TelegramBot) {
    bot.onText(/🎵 اطلاعات آهنگ از روی فایل/, (msg) => {
        bot.sendMessage(msg.chat.id, "لطفا یک فایل صوتی (مانند mp3) از آهنگ مورد نظر خود را برای من ارسال کنید...");
    });

    bot.on('audio', async (msg) => {
        const chatId = msg.chat.id;
        if (!msg.audio) return;

        const titleFromMeta = msg.audio.title;
        const artistFromMeta = msg.audio.performer;

        if (titleFromMeta && artistFromMeta) {
            bot.sendMessage(chatId, `اطلاعات از فایل خوانده شد: "${titleFromMeta}"\nدر حال دریافت اطلاعات تکمیلی...`);
            await sendSongInfo(bot, chatId, titleFromMeta, artistFromMeta);
        } else {
            bot.sendMessage(chatId, "متاسفانه فایل صوتی شما فاقد اطلاعات (متادیتا) در مورد نام آهنگ و خواننده است.");
        }
    });

    bot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const data = callbackQuery.data;
        if (!msg || !data) return;

        if (data.startsWith('songinfo:')) {
            bot.answerCallbackQuery(callbackQuery.id, { text: 'در حال جستجو...' });
            const [_, title, artist] = data.split(':');
            if (title && artist) {
                await sendSongInfo(bot, msg.chat.id, title, artist);
            }
        } else {
            bot.answerCallbackQuery(callbackQuery.id);
        }
    });
}
