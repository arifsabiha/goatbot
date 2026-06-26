"use strict";

const SABBIR = "Ariful Islam Sabbir";
const axios = require("axios");

module.exports.config = {
  name: "say",
  version: "1.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  usePrefix: true,
  category: "Fun",
  countDown: 5,
  shortDescription: "Convert text to voice audio",
  usages: "say [text]"
};

module.exports.onStart = async function ({ message, args }) {
  const text = args.join(" ").trim();

  if (!text) {
    return message.reply("📝 Usage: /say [text]\nExample: /say hello how are you");
  }

  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=bn&q=${encodeURIComponent(text)}`;

    const res = await axios.get(ttsUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      timeout: 15000
    });

    return message.reply({ attachment: res.data });
  } catch (e) {
    return message.reply("⚠️ Failed to generate voice, please try again.");
  }
};
