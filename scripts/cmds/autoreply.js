const axios = require("axios");

const API_URL = "https://mahmud-rest-api-v9.onrender.com/api/hinata";

const triggers = [
  "baby",
  "bby",
  "babu",
  "bbu",
  "jan",
  "janu",
  "bot",
  "hina",
  "hinata",
  "জান",
  "জানু",
  "বেবি"
];

async function chat(text, attachments = []) {
  try {
    const { data } = await axios.post(API_URL, {
      text,
      style: 3,
      attachments
    });

    return data.message || "🙂";
  } catch (e) {
    console.log(e.response?.data || e.message);
    return "⚠️ AI is busy. Try again later.";
  }
}

module.exports = {
  config: {
    name: "baby",
    aliases: [
      "bby",
      "bbu",
      "jan",
      "janu",
      "bot",
      "hina",
      "hinata"
    ],
    version: "1.0.0",
    author: "SABBIR",
    role: 0,
    countDown: 0,
    shortDescription: "AI Chat",
    longDescription: "Facebook AI Chat",
    category: "chat",
    guide: "{pn} <message>"
  },
onStart: async function ({ message, args, event }) {
    const input = args.join(" ").trim();

    if (!input) {
      return message.reply("🙂 Bolo baby...");
    }

    const reply = await chat(input, event.attachments || []);

    return message.reply(reply);
  },
onReply: async function ({ message, event }) {
    if (event.type !== "message_reply") return;

    const input = (event.body || "").trim();

    if (!input) return;

    const reply = await chat(input, event.attachments || []);

    const info = await message.reply(reply);

    global.GoatBot.onReply.set(info.messageID, {
      commandName: "baby",
      author: event.senderID
    });
  },
onChat: async function ({ message, event }) {
    if (!event.body) return;

    const body = event.body.trim();
    const lower = body.toLowerCase();

    const prefix = triggers.find(word => lower.startsWith(word));
    if (!prefix) return;

    let text = body.slice(prefix.length).trim();

    if (!text) {
      const random = [
        "🙂 বলো...",
        "😊 কী বলবে?",
        "❤️ আমি শুনছি...",
        "🙈 হ্যাঁ বলো।",
        "🤍 তোমার জন্য আছি।"
      ];

      return message.reply(
        random[Math.floor(Math.random() * random.length)]
      );
    }

    const reply = await chat(text, event.attachments || []);

    const info = await message.reply(reply);

    global.GoatBot.onReply.set(info.messageID, {
      commandName: "baby",
      author: event.senderID
    });
  }
};



