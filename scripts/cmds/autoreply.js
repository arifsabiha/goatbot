const SABBIR = "Ariful Islam Sabbir";
const axios = require("axios");

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const API_KEY = "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";

module.exports.config = {
  name: "autoreplybot",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  hidden: true,
  usePrefix: false,
  category: "Chat",
  cooldowns: 1
};

module.exports.onChat = async function ({ message, event, api }) {
  const { body, senderID, type, messageReply } = event;
  const botID = api.getCurrentUserID();

  if (!body || senderID == botID) return;

  const prefix = global.GoatBot?.config?.prefix || "/";
  if (body.startsWith(prefix) || body.startsWith("!")) return;

  const msg = body.toLowerCase().trim();

  const quickResponses = {
    "hi": "Hey! 👋",
    "hello": "Hello ❤️",
    "bot": "Yes? 😎",
    "assalamu alaikum": "ওয়ালাইকুম আসসালাম ❤️",
    "আসসালামু আলাইকুম": "ওয়ালাইকুম আসসালাম ❤️",
    "assalamualaikum": "Walaikum Assalam ❤️",
    "bby": "ki oise bby? 🥹"
  };

  if (quickResponses[msg]) {
    return message.reply(quickResponses[msg]);
  }

  if (
    type !== "message_reply" ||
    !messageReply ||
    messageReply.senderID != botID
  ) {
    return;
  }

  if (!API_KEY) {
    return message.reply("❌ GROQ_API_KEY not found.");
  }

  try {
    const response = await axios.post(
      GROQ_API,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly Facebook chatbot. Reply naturally in Bangla or Banglish depending on the user's language. Keep replies short, human-like and friendly."
          },
          {
            role: "user",
            content: body
          }
        ],
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

    let botReply =
      response.data?.choices?.[0]?.message?.content?.trim();

    if (!botReply) {
      botReply = "Hmm... 🤔";
    }

    return message.reply(botReply);

  } catch (err) {
    console.log(
      "Groq Error:",
      err.response?.data || err.message
    );

    return message.reply("⚠️ AI is busy. Try again later.");
  }
};
module.exports.onStart = async function ({ message, args }) {
  if (!API_KEY) {
    return message.reply("❌ GROQ_API_KEY not found.");
  }

  const input = args.join(" ");

  if (!input) {
    return message.reply("❓ Please enter a message.");
  }

  try {
    const response = await axios.post(
      GROQ_API,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly Facebook chatbot. Reply naturally in Bangla or Banglish depending on the user's language. Keep replies short, human-like and friendly."
          },
          {
            role: "user",
            content: input
          }
        ],
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

    const reply =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "Hmm... 🤔";

    return message.reply(reply);

  } catch (err) {
    console.log(
      "Groq Error:",
      err.response?.data || err.message
    );

    return message.reply("⚠️ AI is busy. Try again later.");
  }
};
