const SABBIR = "Ariful Islam Sabbir";
module.exports.config = {
  name: "autonickname",
  version: "1.0.0",
  role: 1,
  credits: "Ariful Islam Sabbir",
  description: "Control auto nickname feature when members join the group",
  category: "Group",
  usages:
    "autonickname on | off | status\n" +
    "autonickname set <template>   (use {name} or {firstname} in template)\n" +
    "autonickname all              (set nicknames for all members now)\n" +
    "autonickname reset            (clear all member nicknames)",
  cooldowns: 5
};

function applyTemplate(template, fullName) {
  const safe = (template || "").toString();
  const firstName = (fullName || "").trim().split(/\s+/)[0] || fullName || "";
  return safe
    .replace(/\{name\}/gi, fullName || "")
    .replace(/\{firstname\}/gi, firstName)
    .trim();
}

async function getCfg(threadsData, threadID) {
  let td = null;
  try { td = await threadsData.getData(threadID); } catch (_) {}
  const data = (td && td.data) || {};
  const cfg = data.autoNickname || { enabled: false, template: "Member {firstname}" };
  return { td, data, cfg };
}

async function saveCfg(threadsData, threadID, data, cfg) {
  data.autoNickname = cfg;
  try {
    await threadsData.setData(threadID, { data });
  } catch (_) {
    try { await threadsData.createData(threadID, { data }); } catch (_) {}
  }
}

module.exports.onStart = async function ({ api, event, threadsData }) {
  const { threadID, messageID, body } = event;
  const args = (body || "").trim().split(/\s+/);
  args.shift();
  const sub = (args.shift() || "").toLowerCase();

  const { data, cfg } = await getCfg(threadsData, threadID);

  if (!sub || sub === "status") {
    return api.sendMessage(
      `📛 Auto Nickname Status\n\n` +
      `• Status: ${cfg.enabled ? "✅ Enabled" : "❌ Disabled"}\n` +
      `• Template: ${cfg.template || "Member {firstname}"}\n\n` +
      `Usage:\n` +
      `/autonickname on\n` +
      `/autonickname off\n` +
      `/autonickname set <template>\n` +
      `/autonickname all\n` +
      `/autonickname reset`,
      threadID, messageID
    );
  }

  if (sub === "on") {
    cfg.enabled = true;
    if (!cfg.template) cfg.template = "Member {firstname}";
    await saveCfg(threadsData, threadID, data, cfg);
    return api.sendMessage(`✅ Auto nickname enabled!\n📝 Template: ${cfg.template}`, threadID, messageID);
  }

  if (sub === "off") {
    cfg.enabled = false;
    await saveCfg(threadsData, threadID, data, cfg);
    return api.sendMessage("❌ Auto nickname disabled.", threadID, messageID);
  }

  if (sub === "set") {
    const template = args.join(" ").trim();
    if (!template) {
      return api.sendMessage(
        "❌ No template provided!\n\nExample:\n/autonickname set Member {firstname}\n/autonickname set 🌟 {name}",
        threadID, messageID
      );
    }
    cfg.template = template;
    await saveCfg(threadsData, threadID, data, cfg);
    return api.sendMessage(`✅ Template set: ${template}`, threadID, messageID);
  }

  if (sub === "all") {
    let info;
    try { info = await api.getThreadInfo(threadID); }
    catch (e) { return api.sendMessage(`❌ Could not fetch group info: ${e.message || e}`, threadID, messageID); }

    const participantIDs = (info.participantIDs || []).map(String);
    if (participantIDs.length === 0) {
      return api.sendMessage("❌ No members found in group!", threadID, messageID);
    }

    const template = cfg.template || "Member {firstname}";
    const botID = String(api.getCurrentUserID());
    const nicknames = info.nicknames || {};

    let userInfo = {};
    try { userInfo = await api.getUserInfo(participantIDs); } catch (_) {}

    let success = 0, failed = 0, skipped = 0;
    await api.sendMessage(
      `⏳ Setting nicknames for ${participantIDs.length} members...\n📝 Template: ${template}`,
      threadID, messageID
    );

    for (const uid of participantIDs) {
      if (uid === botID) { skipped++; continue; }
      const fullName = (userInfo[uid] && userInfo[uid].name) || "";
      const newNick = applyTemplate(template, fullName);
      if (!newNick) { skipped++; continue; }
      if (nicknames[uid] === newNick) { skipped++; continue; }
      try {
        await api.changeNickname(newNick, threadID, uid);
        success++;
      } catch (e) {
        failed++;
      }
      await new Promise(r => setTimeout(r, 800));
    }

    return api.sendMessage(
      `✅ Auto nickname complete!\n\n` +
      `• Success: ${success}\n` +
      `• Failed: ${failed}\n` +
      `• Skipped: ${skipped}`,
      threadID, messageID
    );
  }

  if (sub === "reset") {
    let info;
    try { info = await api.getThreadInfo(threadID); }
    catch (e) { return api.sendMessage(`❌ Could not fetch group info: ${e.message || e}`, threadID, messageID); }

    const participantIDs = (info.participantIDs || []).map(String);
    const botID = String(api.getCurrentUserID());

    let success = 0, failed = 0;
    await api.sendMessage(`⏳ Clearing nicknames for ${participantIDs.length} members...`, threadID, messageID);

    for (const uid of participantIDs) {
      if (uid === botID) continue;
      try {
        await api.changeNickname("", threadID, uid);
        success++;
      } catch (e) { failed++; }
      await new Promise(r => setTimeout(r, 800));
    }

    return api.sendMessage(
      `✅ Reset complete!\n\n• Success: ${success}\n• Failed: ${failed}`,
      threadID, messageID
    );
  }

  return api.sendMessage(
    "❌ Unknown sub-command!\n\nUsage:\n/autonickname on | off | status | set <template> | all | reset",
    threadID, messageID
  );
};
