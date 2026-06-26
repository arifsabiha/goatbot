const SABBIR = "Ariful Islam Sabbir";
const axios = require("axios");
const { getName } = require("../../utils/getName.js");

module.exports.config = {
  name: "adduser",
  version: "1.3.0",
  role: 1,
  credits: "Ariful Islam Sabbir",
  hidden: false,
  usePrefix: true,
  category: "group",
  countDown: 2,
  guide: {
    bn: "{pn} <uid> or {pn} <facebook profile link>",
    en: "{pn} <uid> or {pn} <facebook profile link>"
  }
};

module.exports.onStart = async function ({ api, event, args, message }) {
  const { threadID } = event;

  if (!args[0]) return message.reply("📌 Please provide a UID or Facebook profile link.");

  const input = args[0].trim();

  if (/^\d+$/.test(input)) {
    return await addUserToGroup(input);
  }

  if (!/facebook\.com|fb\.com|fb\.me/i.test(input)) {
    return message.reply("⚠️ Please provide a valid Facebook profile link.");
  }

  let uid = null;
  try {
    const res = await axios.get(input, {
      headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36" },
      timeout: 15000
    });
    const data = res.data || "";
    const m1 = data.match(/"userID":"(\d+)"/);
    const m2 = data.match(/"actor_id":"?(\d+)"?/);
    const m3 = data.match(/profile_id=(\d+)/);
    uid = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]);
  } catch (e) {
    return message.reply("❌ Could not extract UID from the link.");
  }

  if (!uid) return message.reply("❌ Could not find UID from this link.");

  return await addUserToGroup(uid);

  async function addUserToGroup(uid) {
    try {
      uid = String(uid);
      const info = await api.getThreadInfo(threadID);
      const participantIDs = (info.participantIDs || []).map(String);
      const adminIDs = (info.adminIDs || []).map(a => String((a && a.id) ? a.id : a));
      const botID = String(api.getCurrentUserID());

      if (participantIDs.includes(uid)) {
        const name = await getName(api, uid, "this user");
        return message.reply(`ℹ️ ${name} is already in the group.`);
      }

      await api.addUserToGroup(uid, threadID);

      const name = await getName(api, uid, "User");

      if (info.approvalMode === true && !adminIDs.includes(botID)) {
        return message.reply(`📩 ${name} has been sent a join request. An admin needs to approve it.`);
      }

      return message.reply(`✅ ${name} has been successfully added!`);
    } catch (err) {
      return message.reply(
        `❌ Could not add user!\n` +
        `Possible reasons:\n` +
        `• User privacy settings prevent being added\n` +
        `• User is not in bot's friend list\n` +
        `• Group approval mode is on but bot is not admin`
      );
    }
  }
};
