import TelegramBot from "node-telegram-bot-api";

// --- Helper: Get Liara AI Details ---
// --- CHANGED ---: Renamed function and updated it to return a structured object.
async function getSongDetailsFromLiara(songTitle: string, artistName: string): Promise<{ funFact: string; releaseDate: string; }> {
    const liaraApiKey = process.env.LIARA_AI_KEY;
    if (!liaraApiKey) {
        // Return a default object in case of configuration error
        return {
            funFact: "کلید API برای Liara AI تنظیم نشده است.",
            releaseDate: "نامشخص"
        };
    }

    const liaraApiUrl = "https://ai.liara.ir/api/v1/682b8bde153623bd82f7d348/chat/completions";

    // --- CHANGED ---: A more powerful and specific prompt asking for a JSON object.
    // This makes the output structured and predictable.
    const prompt = `
        در مورد آهنگ "${songTitle}" از "${artistName}"، اطلاعات زیر را در قالب یک آبجکت JSON ارائه بده:
        1. یک فیلد به نام "funFact" که حاوی یک حقیقت جالب و دقیق (مثلا تاریخی، مربوط به تولید، یا داستانی) در مورد آهنگ باشد.
        2. یک فیلد به نام "releaseDate" که حاوی تاریخ انتشار دقیق آهنگ (روز، ماه، سال) باشد.

        فقط و فقط آبجکت JSON را برگردان و هیچ متن اضافی ارسال نکن.
    `;

    const payload = {
        model: 'openai/gpt-4o-mini',
        messages: [{
            role: "user",
            content: prompt,
        },],
        stream: false,
        // --- NEW ---: Instruct the model to output JSON
        response_format: { type: "json_object" },
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
        const content = result.choices?.[0]?.message?.content;

        // --- CHANGED ---: Parse the JSON response from the AI
        if (content) {
            try {
                const parsedContent = JSON.parse(content);
                return {
                    funFact: parsedContent.funFact || "نتوانستم حقیقت جالبی پیدا کنم.",
                    releaseDate: parsedContent.releaseDate || "نامشخص"
                };
            } catch (e) {
                console.error("Error parsing JSON from Liara AI:", e);
                return {
                    funFact: content, // Return the raw text if JSON parsing fails
                    releaseDate: "نامشخص"
                };
            }
        }

        return {
            funFact: "نتوانستم حقیقت جالبی پیدا کنم.",
            releaseDate: "نامشخص"
        };

    } catch (error) {
        console.error('Error fetching from Liara AI:', error);
        return {
            funFact: 'خطایی در هنگام دریافت اطلاعات از هوش مصنوعی رخ داد.',
            releaseDate: 'نامشخص'
        };
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

        // --- CHANGED: Simplified logic ---
        const titleFromMeta = msg.audio.title;
        const artistFromMeta = msg.audio.performer;

        if (titleFromMeta && artistFromMeta) {
            bot.sendMessage(chatId, `اطلاعات از متادیتای فایل خوانده شد: "${titleFromMeta}" از "${artistFromMeta}".\nدر حال تکمیل اطلاعات و دریافت حقیقت جالب...`);

            // --- CHANGED ---: Call the new function to get both fun fact and release date.
            const aiDetails = await getSongDetailsFromLiara(titleFromMeta, artistFromMeta);

            const finalMessage = `
            🎵 **آهنگ شناسایی شد!** (از روی فایل)

            **عنوان:** ${titleFromMeta}
            **خواننده:** ${artistFromMeta}
            **تاریخ انتشار:** ${aiDetails.releaseDate}

            **یک حقیقت جالب:**
            ${aiDetails.funFact}
            `;

            bot.sendMessage(chatId, finalMessage, { parse_mode: 'Markdown' });

        } else {
            // STEP 2: Fallback logic (like ACRCloud) would go here.
            // For now, we just inform the user that metadata is missing.
            bot.sendMessage(chatId, "متاسفانه فایل صوتی شما فاقد اطلاعات (متادیتا) در مورد نام آهنگ و خواننده است. در حال حاضر، شناسایی آهنگ بدون این اطلاعات امکان‌پذیر نیست.");
        }
    });
}
