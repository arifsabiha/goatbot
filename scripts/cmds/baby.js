const SABBIR = "Ariful Islam Sabbir";
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "database", "teach.json");

function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) fs.writeJsonSync(DB_PATH, {});
    return fs.readJsonSync(DB_PATH);
  } catch (e) { return {}; }
}

function saveDB(data) {
  try { fs.writeJsonSync(DB_PATH, data, { spaces: 2 }); } catch (e) {}
}

function normalize(str) {
  return (str || "").toLowerCase().trim().replace(/\s+/g, " ");
}

const TEACH_URL = "https://sabbir-baby-api.onrender.com/api/teach";

module.exports.config = {
  name: "teach",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "Teach the bot question-answer pairs",
  usePrefix: true,
  category: "Chat",
  usages: "reply with /teach <answer> | /teach q <question> a <answer>",
  cooldowns: 3
};

module.exports.onStart = async function ({ api, event, message, args }) {
  const sub = (args[0] || "").toLowerCase();
  const { messageReply } = event;

  // Format 1: reply to a message with /teach <answer>
  if (messageReply && messageReply.body && sub !== "list" && sub !== "del" && sub !== "q") {
    const question = messageReply.body.trim();
    const answer = args.join(" ").trim();

    if (!answer) {
      return message.reply(
        "❌ No answer provided!\n\n" +
        "📌 How to use:\n" +
        "   The message you reply to becomes the question\n" +
        "   Text after /teach becomes the answer\n\n" +
        "✅ Example: (reply to someone's message)\n" +
        "   /teach I am SABBIR BOT"
      );
    }

    if (!question) return message.reply("❌ The replied message has no text!");

    const db = loadDB();
    const existingKey = Object.keys(db).find(k => normalize(k) === normalize(question));
    db[existingKey || question] = answer;
    saveDB(db);

    try {
      await axios.post(TEACH_URL, { question, answer }, {
        headers: { "Content-Type": "application/json" },
        timeout: 8000
      });
    } catch (e) {}

    return message.reply(
      `✅ Learned!\n\n❓ Question: ${question}\n✅ Answer: ${answer}`
    );
  }

  // Format 4: /teach q <question> a <answer>
  if (sub === "q") {
    const restArgs = args.slice(1);
    const aIdx = restArgs.indexOf("a");
    if (aIdx === -1 || aIdx === 0) {
      return message.reply(
        "❌ Wrong format!\n\n" +
        "Correct format:\n" +
        "/teach q <প্রশ্ন> a <উত্তর>\n" +
        "Example: /teach q who are you a I am SABBIR BOT"
      );
    }
    const question = restArgs.slice(0, aIdx).join(" ").trim();
    const answer = restArgs.slice(aIdx + 1).join(" ").trim();
    if (!question) return message.reply("❌ No question provided!");
    if (!answer) return message.reply("❌ No answer provided!");

    const db = loadDB();
    const existingKey = Object.keys(db).find(k => normalize(k) === normalize(question));
    db[existingKey || question] = answer;
    saveDB(db);

    try {
      await axios.post(TEACH_URL, { question, answer }, {
        headers: { "Content-Type": "application/json" },
        timeout: 8000
      });
    } catch (e) {}

    return message.reply(
      `✅ Learned!\n\n❓ Question: ${question}\n✅ Answer: ${answer}`
    );
  }

  // Help message
  return message.reply(
    "📚 কীভাবে শেখাবে:\n\n" +
    "1️⃣ সহজ উপায় — কারো message এ reply করে:\n" +
    "   /teach <উত্তর>\n" +
    "   (reply করা message = প্রশ্ন, তোমার লেখা = উত্তর)\n\n" +
    "2️⃣ সরাসরি:\n" +
    "   /teach q <প্রশ্ন> a <উত্তর>\n\n" +
    "" +
    "🗑️ মুছতে:বস সাব্বির কে মেসেজ দিন"
  );
};

module.exports.onChat = async function ({ api, event, message }) {
  const body = (event.body || "").trim();
  if (!body || body.startsWith("/")) return;

  const db = loadDB();
  const normBody = normalize(body);
  const key = Object.keys(db).find(k => normalize(k) === normBody);
  if (!key) return;

  try {
    await message.reply(db[key]);
  } catch (e) {}
};
