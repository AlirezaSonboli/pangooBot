import TelegramBot from "node-telegram-bot-api";

// --- Helper: Get Liara AI Info ---
async function getSongInfoFromLiara(songTitle: string, artistName: string): Promise<string> {
    const liaraApiKey = process.env.LIARA_AI_KEY;
    if (!liaraApiKey) {
        return "کلید API برای Liara AI تنظیم نشده است.";
    }

    const liaraApiUrl ="https://ai.liara.ir/api/v1/682b8bde153623bd82f7d348/chat/completions"
    const prompt = `یک حقیقت جالب (fun fact) در مورد آهنگ "${songTitle}" از "${artistName}" بگو.`;

    const payload = {
        model: 'openai/gpt-4o-mini', // Or another model supported by Liara
        messages: [{
            role: "user",
            content: prompt,
        }, ],
        stream: false,
    };

    try {
        const response = await fetch(liaraApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${liaraApiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Liara API Error:", errorBody);
            throw new Error(`Liara API request failed with status ${response.status}`);
        }

        const result = await response.json();
        const funFact = result.choices?.[0]?.message?.content?.trim();
        return funFact || "نتوانستم حقیقت جالبی پیدا کنم.";

    } catch (error) {
        console.error('Error fetching from Liara AI:', error);
        return 'خطایی در هنگام دریافت اطلاعات از هوش مصنوعی رخ داد.';
    }
}


// --- Main Handler Setup ---
export function setupSongHandlers(bot: TelegramBot) {
    // 1. Listen for the button press
    bot.onText(/🎵 اطلاعات آهنگ از روی فایل/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "لطفا یک فایل صوتی (مانند mp3) از آهنگ مورد نظر خود را برای من ارسال کنید...");
    });

    // 2. Listen for an audio file
    bot.on('audio', async (msg) => {
        const chatId = msg.chat.id;
        if (!msg.audio) return;

        let songData: any = null;
        let identifiedBy = ''; // To track how we found the info

        // --- NEW: HYBRID APPROACH ---
        // STEP 1: Try to get info from the file's metadata first.
        const titleFromMeta = msg.audio.title;
        const artistFromMeta = msg.audio.performer;

        if (titleFromMeta && artistFromMeta) {
            bot.sendMessage(chatId, "اطلاعات از متادیتای فایل خوانده شد. در حال دریافت حقیقت جالب...");
            songData = {
                title: titleFromMeta,
                artists: [{ name: artistFromMeta }],
                // Add placeholder data for album and release date as they aren't in metadata
                album: { name: 'نامشخص' },
                release_date: 'نامشخص'
            };
            identifiedBy = 'metadata';
        } else {
            // STEP 2: If metadata is missing, fall back to AI recognition (ACRCloud).
            bot.sendMessage(chatId, "فایل متادیتا ندارد...");
        }
        // --- STEP 3: Process the result and send to user ---
        if (songData) {
            const title = songData.title;
            const artists = songData.artists.map((a: any) => a.name).join(', ');
            const album = songData.album.name;
            const releaseDate = songData.release_date;

            // Get a fun fact from Liara AI
            const funFact = await getSongInfoFromLiara(title, artists);

            // Format and send the final message
            const finalMessage = `
🎵 **آهنگ شناسایی شد!** ${identifiedBy === 'metadata' ? '(از روی فایل)' : '(توسط هوش مصنوعی)'}

**عنوان:** ${title}
**خواننده:** ${artists}
**آلبوم:** ${album}
**تاریخ انتشار:** ${releaseDate}

**یک حقیقت جالب:**
${funFact}
            `;
            bot.sendMessage(chatId, finalMessage, { parse_mode: 'Markdown' });

        } else {
            bot.sendMessage(chatId, "متاسفانه نتوانستم این آهنگ را شناسایی کنم. لطفا یک فایل دیگر را امتحان کنید.");
        }
    });
}
