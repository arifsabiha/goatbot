const SABBIR = "Ariful Islam Sabbir";
const axios = require("axios");

const SABBIR_API = "";
const CYBERBOT_API = "https://simsimi.cyberbot.top";

module.exports.config = {
  name: "autoreplybot",
  version: "6.0.0",
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

  // ১. নির্দিষ্ট কিওয়ার্ড চেক (এগুলো থাকলে সরাসরি উত্তর দিবে)
  const quickResponses = {
    "hi": "Hey!",
    "assalamu alaikum": "walaikum assalam",
    "আসসালামু আলাইকুম": "ওয়ালাইকুম আসসালাম",
    "bot": "Did you just call me a bot? 😏",
    "hello": "Hey there!",
    "bby": "ki oise bby🥹",
    "assalamualaikum": "Walaikumassalam"
  };
  
  if (quickResponses[msg]) return message.reply(quickResponses[msg]);

  // ২. রিপ্লাই চেক: যদি কেউ বটের মেসেজে রিপ্লাই না দেয়, তবে বট চুপ থাকবে
  // শুধুমাত্র নির্দিষ্ট কিওয়ার্ড ছাড়া অন্য সব কথার জন্য এই নিয়ম
  if (type !== "message_reply" || messageReply.senderID !== botID) return;

  try {
    const resCyber = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(body)}`);
    let botReply = resCyber.data.text || resCyber.data.response;

    if (botReply && !botReply.includes("I don't know")) {
      const cleanReply = botReply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
      const finalMsg = cleanReply || "Hmm..."; 
      
      message.reply(finalMsg);

      // 3. Auto-save response
      if (finalMsg !== "Hmm...") {
        const teachUrl = `${SABBIR_API}/teach?ask=${encodeURIComponent(body)}&ans=${encodeURIComponent(finalMsg)}`;
        axios.get(teachUrl).catch(() => {});
      }
    }
  } catch (err) {
    console.log("Reply Error: " + err.message);
  }
};

module.exports.onStart = async function ({ message, args }) {
  // onStart handles direct command usage
  const input = args.join(" ");
  if (!input) return message.reply("Say something...");
  try {
    const res = await axios.get(`${CYBERBOT_API}/simsimi?text=${encodeURIComponent(input)}`);
    let reply = res.data.text || res.data.response;
    const cleanReply = reply.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
    message.reply(cleanReply || "Hmm...");
  } catch (e) {
    message.reply("Server down.");
  }
};
