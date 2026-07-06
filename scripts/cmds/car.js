const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const response = await axios.get("https://raw.githubusercontent.com/sabbir-bot/api/main/baseApiUrl.json");
        return response.data.mahmud;
};

module.exports = {
        config: {
                name: "car",
                aliases: ["carvideo", "carvid", "গাড়ি"],
                version: "1.7",
                author: "SABBIR",
                countDown: 10,
                role: 0,
                description: {
                        bn: "র‍্যান্ডম কার এডিট ভিডিও পান",
                        en: "Get a random car edit video",
                        vi: "Lấy một video chỉnh sửa xe hơi ngẫu nhiên"
                },
                category: "media",
                guide: {
                        bn: '   {pn}: একটি র‍্যান্ডম কার ভিডিও দেখতে ব্যবহার করুন',
                        en: '   {pn}: Use to get a random car video',
                        vi: '   {pn}: Sử dụng để lấy một video xe hơi ngẫu nhiên'
                }
        },

        langs: {
                bn: {
                        noVideo: "× কোনো ভিডিও খুঁজে পাওয়া যায়নি",
                        success: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐂𝐚𝐫 𝐯𝐢𝐝𝐞𝐨 𝐛𝐚𝐛𝐲 <😘",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact SABBIR।"
                },
                en: {
                        noVideo: "× No videos found",
                        success: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐂𝐚𝐫 𝐯𝐢𝐝𝐞𝐨 𝐛𝐚𝐛𝐲 <😘",
                        error: "× API error: %1. Contact SABBIR for help."
                },
                vi: {
                        noVideo: "× Không tìm thấy video nàn",
                        success: "Video xe hơi của cưng đây <😘",
                        error: "× Lỗi: %1. Contact SABBIR for help."
                }
        },

        onStart: async function ({ api, event, message, getLang }) {
                const filePath = path.join(__dirname, "cache", `car_${Date.now()}.mp4`);
                if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const apiUrl = await mahmud();
                        const res = await axios.get(`${apiUrl}/api/album/mahmud/videos/car?userID=${event.senderID}`);
                        
                        if (!res.data.success || !res.data.videos.length) {
                                return message.reply(getLang("noVideo"));
                        }

                        const url = res.data.videos[Math.floor(Math.random() * res.data.videos.length)];
                        const videoRes = await axios({
                                url,
                                method: "GET",
                                responseType: "stream",
                                headers: { 'User-Agent': 'Mozilla/5.0' }
                        });

                        const writer = fs.createWriteStream(filePath);
                        videoRes.data.pipe(writer);

                        writer.on("finish", () => {
                                return message.reply({
                                        body: getLang("success"),
                                        attachment: fs.createReadStream(filePath)
                                }, () => {
                                        api.setMessageReaction("✅", event.messageID, () => {}, true);
                                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                                });
                        });

                        writer.on("error", (err) => { throw err; });

                } catch (err) {
                        console.error("Car Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
