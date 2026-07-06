const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/sabbir-bot/api/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "gpt",
                aliases: ["gpt4"],
                version: "1.7",
                author: "SABBIR",
                countDown: 5,
                role: 0,
                description: {
                        bn: "জিপিটি-৪ এআই এর সাথে চ্যাট করুন",
                        en: "Chat with GPT-4 AI",
                        vi: "Trò chuyện with GPT-4 AI"
                },
                category: "ai",
                guide: {
                        bn: '   {pn} <প্রশ্ন>: আপনার প্রশ্নটি লিখুন',
                        en: '   {pn} <question>: Type your question',
                        vi: '   {pn} <câu hỏi>: Nhập câu hỏi của bạn'
                }
        },

        langs: {
                bn: {
                        noInput: "× বেবি, কিছু তো জিজ্ঞাসা করো!",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact SABBIR"
                },
                en: {
                        noInput: "× Baby, please ask something!",
                        error: "× API error: %1. Contact SABBIR"
                },
                vi: {
                        noInput: "× Cưng ơi, hãy hỏi điều gì đó!",
                        error: "× Lỗi: %1. Contact SABBIR for help."
                }
        },

        onStart: async function ({ api, event, args, message, getLang, commandName }) {
                const prompt = args.join(" ");
                if (!prompt) return message.reply(getLang("noInput"));

                return this.handleGPT({ api, event, prompt, getLang, commandName });
        },

        onReply: async function ({ api, event, Reply, getLang, commandName }) {
                if (Reply.author !== event.senderID) return;
                const prompt = event.body;
                if (!prompt) return;

                return this.handleGPT({ api, event, prompt, getLang, commandName });
        },

        handleGPT: async function ({ api, event, prompt, getLang, commandName }) {
                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        
                        const baseUrl = await baseApiUrl();                   
                        const response = await axios.get(`${baseUrl}/api/ai`, {
                                params: {
                                        prompt: prompt,
                                        ai: "gpt"
                                }
                        });

                        const replyText = response.data.response || "No response received.";
                        api.setMessageReaction("✅", event.messageID, () => {}, true);

                        return api.sendMessage(replyText, event.threadID, (error, info) => {
                                if (!error) {
                                        global.GoatBot.onReply.set(info.messageID, {
                                                commandName,
                                                author: event.senderID
                                        });
                                }
                        }, event.messageID);

                } catch (err) {
                        console.error("GPT Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        const errorMsg = err.response?.data?.error || err.message;
                        return api.sendMessage(getLang("error", errorMsg), event.threadID, event.messageID);
                }
        }
};
