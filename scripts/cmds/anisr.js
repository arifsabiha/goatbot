const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/sabbir-bot/api/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "anisr",
                aliases: ["animesearch", "anisrch"],
                version: "1.7",
                author: "SABBIR",
                countDown: 10,
                role: 0,
                description: {
                        bn: "যেকোনো এনিমে সার্চ করে ভিডিও দেখুন",
                        en: "Search any anime and get its video",
                        vi: "Tìm kiếm bất kỳ phim hoạt hình nào và lấy video của nó"
                },
                category: "anime",
                guide: {
                        bn: '   {pn} <এনিমে নাম>: ভিডিও পেতে এনিমে নাম লিখুন',
                        en: '   {pn} <anime name>: Provide the anime name to search',
                        vi: '   {pn} <tên anime>: Cung cấp tên anime để tìm kiếm'
                }
        },

        langs: {
                bn: {
                        noQuery: "• বেবি, এনিমে এর নাম তো দাও! 😘",
                        success: "• 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐚𝐧𝐢𝐦𝐞 𝐯𝐢𝐝𝐞𝐨 <😘\n• 𝐒𝐞𝐚𝐫𝐜𝐡: %1",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact SABBIR।"
                },
                en: {
                        noQuery: "• Baby, please provide a search query! 😘",
                        success: "• 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐚𝐧𝐢𝐦𝐞 𝐯𝐢𝐝𝐞𝐨 <😘\n• 𝐒𝐞𝐚𝐫𝐜𝐡: %1",
                        error: "× API error: %1. Contact SABBIR for help."
                },
                vi: {
                        noQuery: "• Cưng ơi, vui lòng nhập tên anime! 😘",
                        success: "• Video anime của cưng đây <😘\n• Tìm kiếm: %1",
                        error: "× Lỗi: %1. Contact SABBIR for help."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const kw = args.join(" ");
                if (!kw) return message.reply(getLang("noQuery"));

                const cacheDir = path.join(__dirname, "cache");
                const videoPath = path.join(cacheDir, `anisr_${Date.now()}.mp4`);
                fs.ensureDirSync(cacheDir);

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const base = await baseApiUrl();
                        const apiUrl = `${base}/api/anisr?search=${encodeURIComponent(kw)}`;

                        const response = await axios({
                                method: "get",
                                url: apiUrl,
                                responseType: "stream",
                                timeout: 60000
                        });

                        const writer = fs.createWriteStream(videoPath);
                        response.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                                writer.on("finish", resolve);
                                writer.on("error", reject);
                        });

                        if (fs.statSync(videoPath).size < 100) throw new Error("File empty or invalid.");

                        api.setMessageReaction("✅", event.messageID, () => {}, true);

                        return message.reply({
                                body: getLang("success", kw),
                                attachment: fs.createReadStream(videoPath)
                        }, () => {
                                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        });

                } catch (err) {
                        console.error("Anisr Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
