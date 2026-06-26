const SABBIR = "Ariful Islam Sabbir";
module.exports.config = {
  name: "ping",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Ariful Islam Sabbir",
  description: "Show bot response time",
  usePrefix: true,
  category: "Info",
  usages: "ping",
  cooldowns: 3
};

module.exports.onStart = async function ({ message }) {
  const start = Date.now();
  await message.reply("🏓 Pinging...");
  const ping = Date.now() - start;
  return message.reply(`🏓 Pong!\n⚡ Response: ${ping}ms`);
};
