const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "ss",
                version: "1.7",
                author: "SABBIR",
                role: 0,
                description: {
                        en: "Take a screenshot of a website",
                        bn: "যেকোনো ওয়েবসাইটের স্ক্রিনশট নিন",
                        vi: "Chụp ảnh màn hình của một trang web"
                },
                category: "tools",
                guide: {
                        en: "{pn} <link>",
                        bn: "{pn} <লিঙ্ক>",
                        vi: "{pn} <link>"
                },
                coolDowns: 10,
        },

        langs: {
                bn: {
                        noUrl: "• বেবি, একটি লিঙ্ক (URL) তো দাও! 😘",
                        error: "❌ An error occurred: contact MahMUD %1",
                        success: "Here's your screenshot image <😘"
                },
                en: {
                        noUrl: "• Baby, please provide a URL! 😘",
                        error: "❌ An error occurred: contact MahMUD %1",
                        success: "Here's your screenshot image <😘"
                },
                vi: {
                        noUrl: "• Cưng ơi, vui lòng cung cấp đường dẫn URL! 😘",
                        error: "❌ An error occurred: contact MahMUD %1",
                        success: "Đây là ảnh chụp màn hình của bạn <😘"
                }
        },

        onStart: async function ({ api, event, args, getLang }) {
                const { threadID, messageID } = event;
                const urlInput = args.join(" ");

                if (!urlInput) return api.sendMessage(getLang("noUrl"), threadID, messageID);

                try {
                        api.setMessageReaction("⏳", messageID, () => { }, true);

                        const apiUrlBase = await baseApiUrl();
                        const finalUrl = `${apiUrlBase}/api/ss?url=${encodeURIComponent(urlInput)}`;
                        
                        const attachment = await global.utils.getStreamFromURL(finalUrl);
                        
                        api.sendMessage({ 
                                body: getLang("success"), 
                                attachment 
                        }, threadID, (err) => {
                                if (!err) {
                                        api.setMessageReaction("🪽", messageID, () => { }, true);
                                }
                        }, messageID);

                } catch (error) {
                        api.setMessageReaction("❌", messageID, () => { }, true);
                        console.error("SS Error:", error);
                        api.sendMessage(getLang("error", error.message || "API Error"), threadID, messageID);
                }
        }
};
