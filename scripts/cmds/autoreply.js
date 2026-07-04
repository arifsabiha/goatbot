const axios = require("axios");

//const API_KEY = "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";
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// Memory Cache
const chatHistory = {};
const MAX_HISTORY = 50;

// Quick Reply
const quickReplies = {
  "hi": "Hey! 👋",
  "hello": "Hello ❤️",
  "assalamu alaikum": "ওয়ালাইকুম আসসালাম ❤️",
  "assalamualaikum": "Walaikum Assalam ❤️",
  "আসসালামু আলাইকুম": "ওয়ালাইকুম আসসালাম ❤️",
  "bby": "ki oise bby? 🥹",
  "bot": "Yes? 😎"
};

module.exports.config = {
  name: "autoreplybot",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir + ChatGPT",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 1
};

// Memory Functions
function getHistory(threadID) {
  if (!chatHistory[threadID]) {
    chatHistory[threadID] = [
      {
        role: "system",
        content:
"You are a friendly Facebook chatbot. Reply naturally in Bangla or Banglish depending on the user's language. Keep replies short, human-like, funny and friendly. Never say you are an AI unless asked."
}
    ];
  }

  return chatHistory[threadID];
}

function addMessage(threadID, role, content) {
  const history = getHistory(threadID);

  history.push({
    role,
    content
  });

  if (history.length > MAX_HISTORY) {
    history.splice(1, history.length - MAX_HISTORY);
  }
}
module.exports.onChat = async function ({ message, event, api }) {
  const { body, senderID, type, messageReply } = event;
  const botID = api.getCurrentUserID();

  if (!body || senderID == botID) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix) || body.startsWith("!")) return;

  const text = body.trim().toLowerCase();

  // Quick Reply
  if (quickReplies[text]) {
    return message.reply(quickReplies[text]);
  }

  // শুধুমাত্র বটের মেসেজে reply করলে AI উত্তর দিবে
  if (
    type !== "message_reply" ||
    !messageReply ||
    messageReply.senderID != botID
  ) {
    return;
  }

  if (!API_KEY || API_KEY === "YOUR_GROQ_API_KEY") {
    return message.reply("❌ GROQ_API_KEY not configured.");
  }

  const threadID = event.threadID;

  addMessage(threadID, "user", body);

  try {
    const history = getHistory(threadID);

    const response = await axios.post(
      GROQ_API,
      {
        model: MODEL,
        messages: history,
        temperature: 1.5,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    let reply =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "Hmm... 🤔";

    addMessage(threadID, "assistant", reply);

    return message.reply(reply);

  } catch (err) {
    console.log(
      "[Groq Error]",
      err.response?.data || err.message
    );

    return message.reply("⚠️ AI is busy, try again later.");
  }
};
module.exports.onStart = async function ({ message, args, event }) {
  if (!API_KEY || API_KEY === "YOUR_GROQ_API_KEY") {
    return message.reply("❌ GROQ_API_KEY not configured.");
  }

  const input = args.join(" ").trim();

  if (!input) {
    return message.reply("❓ Please enter a message.");
  }

  const threadID = event.threadID;

  addMessage(threadID, "user", input);

  try {
    const history = getHistory(threadID);

    const response = await axios.post(
      GROQ_API,
      {
        model: MODEL,
        messages: history,
        temperature: 0.8,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    let reply =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "Hmm... 🤔";

    addMessage(threadID, "assistant", reply);

    return message.reply(reply);

  } catch (err) {
    console.log("[Groq Error]", err.response?.data || err.message);

    return message.reply("⚠️ AI is busy, try again later.");
  }
};
