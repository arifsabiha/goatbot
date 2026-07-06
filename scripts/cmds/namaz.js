const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/sabbir-bot/api/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "namaz",
                aliases: ["prayer", "salah", "নামাজ"],
                version: "1.7",
                author: "SABBIR",
                countDown: 5,
                role: 0,
                description: {
                        bn: "আপনার শহরের নামাজের সময়সূচী জানুন",
                        en: "Get prayer times for your city",
                        vi: "Xem thời gian cầu nguyện cho thành phố của bạn"
                },
                category: "Islamic",
                guide: {
                        bn: '   {pn} <শহরের নাম>: (যেমন: {pn} Dhaka)',
                        en: '   {pn} <city>: (Ex: {pn} Dhaka)',
                        vi: '   {pn} <thành phố>: (VD: {pn} Dhaka)'
                }
        },

        langs: {
                bn: {
                        noData: "× দুঃখিত বেবি, %1 শহরের নামাজের সময় পাওয়া যায়নি। 🕌",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact SABBIR।"
                },
                en: {
                        noData: "× Sorry baby, prayer times for %1 were not found. 🕌",
                        error: "× API error: %1. Contact SABBIR for help."
                },
                vi: {
                        noData: "× Xin lỗi cưng, không tìm thấy thời gian cầu nguyện cho %1. 🕌",
                        error: "× Lỗi: %1. Contact SABBIR for help."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const city = args.join(" ") || "Dhaka";

                try {
                        
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const baseUrl = await baseApiUrl();
                        const apiUrl = `${baseUrl}/api/namaz/font3/${encodeURIComponent(city)}`;

                        const response = await axios.get(apiUrl, {
                                headers: { "author": authorName }
                        });

                        if (response.data?.error) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(response.data.error);
                        }

                        if (response.data?.message) {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                return message.reply(response.data.message);
                        }

                        api.setMessageReaction("❓", event.messageID, () => {}, true);
                        return message.reply(getLang("noData", city));

                } catch (err) {
                        console.error("Namaz Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        const errorMsg = err.response?.data?.error || err.message;
                        return message.reply(getLang("error", errorMsg));
                }
        }
};
