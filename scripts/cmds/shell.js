const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
        config: {
                name: "shell",
                aliases: ["terminal", "sh"],
                version: "1.7",
                author: "SABBIR",
                countDown: 5,
                role: 2,
                description: {
                        bn: "সরাসরি সার্ভার টার্মিনালে কমান্ড রান করুন (অ্যাডমিন)",
                        en: "Run commands directly in the server terminal (Admin)",
                        vi: "Chạy lệnh trực tiếp trong terminal máy chủ (Quản trị viên)"
                },
                category: "admin",
                guide: {
                        bn: '   {pn} <কমান্ড>: টার্মিনাল কমান্ড রান করতে ব্যবহার করুন',
                        en: '   {pn} <command>: Use to run terminal commands',
                        vi: '   {pn} <lệnh>: Sử dụng để chạy lệnh terminal'
                }
        },

        langs: {
                bn: {
                        noInput: "× বেবি, টার্মিনালে রান করার জন্য কোনো কমান্ড দাও! 💻",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact SABBIR।"
                },
                en: {
                        noInput: "× Baby, please provide a command to run in terminal! 💻",
                        error: "× Execution error: %1. Contact SABBIR for help."
                },
                vi: {
                        noInput: "× Cưng ơi, hãy cung cấp lệnh để chạy trong terminal! 💻",
                        error: "× Lỗi thực thi: %1. Contact SABBIR for help."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const command = args.join(" ");
                if (!command) return message.reply(getLang("noInput"));

                try {
                        
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const { stdout, stderr } = await exec(command);

                        if (stderr) {
                                api.setMessageReaction("⚠️", event.messageID, () => {}, true);
                                return message.send(`[STDERR]\n${stderr}`);
                        }

                        api.setMessageReaction("✅", event.messageID, () => {}, true);
                        return message.send(stdout || "✅ Command executed (No output)");

                } catch (err) {
                        console.error("Shell Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};
