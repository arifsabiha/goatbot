const SABBIR = "Ariful Islam Sabbir";
module.exports.config = {
  name: "setnicname",
  version: "1.0.0",
  role: 0,
  credits: "Ariful Islam Sabbir",
  description: "Set someone's nickname in the group",
  usePrefix: true,
  category: "Group",
  usages: "setnicname [nickname] — via reply or @mention",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID, messageReply, mentions, body, senderID } = event;

  const args = (body || "").trim().split(/\s+/);
  args.shift();

  const mentionIDs = Object.keys(mentions || {});

  let targetID = null;
  let nickname = "";

  if (mentionIDs.length > 0) {
    targetID = mentionIDs[0];
    const mentionTag = mentions[targetID] || "";
    const bodyAfterCmd = (body || "").replace(/^\/setnicname\s*/i, "");
    nickname = bodyAfterCmd.replace(mentionTag, "").trim();
  } else if (messageReply) {
    targetID = String(messageReply.senderID);
    nickname = args.join(" ").trim();
  } else {
    targetID = String(senderID);
    nickname = args.join(" ").trim();
  }

  if (!nickname) {
    return api.sendMessage(
      "❌ No nickname provided!\n\n📌 Usage:\n• Reply to someone's message: /setnicname new name\n• Mention someone: /setnicname @person new name\n• Your own: /setnicname new name\n• To clear nickname: /setnicname reset",
      threadID,
      messageID
    );
  }

  const finalNickname = nickname.toLowerCase() === "reset" ? "" : nickname;

  try {
    await api.changeNickname(finalNickname, threadID, targetID);

    let targetName = "User";
    try {
      const info = await api.getUserInfo([targetID]);
      if (info && info[targetID]) targetName = info[targetID].name || "User";
    } catch (e) {}

    if (finalNickname === "") {
      return api.sendMessage(
        `✅ ${targetName}'s nickname has been cleared!`,
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      `✅ ${targetName}'s nickname has been set!\n📛 New name: ${finalNickname}`,
      threadID,
      messageID
    );
  } catch (err) {
    return api.sendMessage(
      `❌ Could not set nickname!\n🐛 Error: ${err.message}`,
      threadID,
      messageID
    );
  }
};
