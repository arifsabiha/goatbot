const SABBIR = "Ariful Islam Sabbir";
module.exports.config = {
  name: "uns",
  version: "1.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Unsend a bot message — reply to it with /uns",
  usePrefix: true,
  category: "Utility",
  usages: "Reply to any bot message with /uns",
  cooldowns: 3
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID, messageReply } = event;
  const botID = String(api.getCurrentUserID());

  if (!messageReply) {
    return api.sendMessage(
      "❌ You did not reply to any message!\n\n📌 Usage:\n• Reply to the bot message you want to unsend and type /uns",
      threadID,
      messageID
    );
  }

  const targetMsgID = messageReply.messageID;
  const targetSenderID = String(messageReply.senderID);

  if (targetSenderID !== botID) {
    return api.sendMessage(
      "❌ Only bot's own messages can be unsent!",
      threadID,
      messageID
    );
  }

  try {
    await api.unsendMessage(targetMsgID);
    try {
      await api.unsendMessage(messageID);
    } catch (e) {}
  } catch (err) {
    return api.sendMessage(
      `❌ Could not unsend message!\n🐛 Error: ${err.message}`,
      threadID,
      messageID
    );
  }
};
