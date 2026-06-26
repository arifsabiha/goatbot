const SABBIR = "Ariful Islam Sabbir";
const axios = require("axios");

module.exports.config = {
  name: "owner",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "Show bot owner information",
  usePrefix: true,
  category: "Info",
  usages: "owner",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event, message }) {
  const ownerText =
    `╔══✨ OWNER INFO ✨══╗\n\n` +
    `👤 Name: Md Ariful Islam Sabbir\n` +
    `📚 Class: 12+\n` +
    `☪️ Religion: Islam\n` +
    `💔 Relationship: Single\n` +
    `👑 Role: Bot Admin & Developer\n\n` +
    `╠══════════════════════╣\n` +
    `  💖 Powered by Sabbir Chat Bot\n` +
    `╚══════════════════════╝`;

  try {
    const imgUrl = "https://i.imgur.com/jqEKJpB.jpeg";
    const response = await axios.get(imgUrl, { responseType: "stream" });

    await api.sendMessage(
      {
        body: ownerText,
        attachment: response.data
      },
      event.threadID,
      event.messageID
    );
  } catch (err) {
    return message.reply(ownerText);
  }
};
