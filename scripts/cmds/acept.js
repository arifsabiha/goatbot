const SABBIR = "Ariful Islam Sabbir";
module.exports.config = {
  name: "acept",
  version: "1.0.0",
  role: 2,
  credits: "Ariful Islam Sabbir",
  usePrefix: true,
  hidden: false,
  category: "System",
  countDown: 5,
  shortDescription: "Accept or reject pending group chat requests",
  longDescription: "View, accept, or reject pending group chats in the bot inbox",
  guide: {
    en: "{pn} — view list\n{pn} add [number] — accept\n{pn} del [number] — reject\n{pn} all — accept all",
    bn: "{pn} — view list\n{pn} add [number] — accept\n{pn} del [number] — reject\n{pn} all — accept all"
  }
};

module.exports.onStart = async function ({ api, event, args, message }) {
  const { threadID, messageID } = event;

  const sub = (args[0] || "").toLowerCase();

  // Pending GC list fetch
  let pendingThreads = [];
  try {
    const allPending = await api.getThreadList(30, null, ["PENDING"]);
    pendingThreads = allPending.filter(t => t.isGroup === true);
  } catch (e) {
    return message.reply(`❌ Pending list আনতে পারছি না।\nError: ${e.message}`);
  }

  // ─── Show list if no argument ───
  if (!sub) {
    if (pendingThreads.length === 0) {
      return message.reply("📭 No pending group chats.");
    }

    const list = pendingThreads.map((t, i) =>
      `${i + 1}. 📌 ${t.name || "Unnamed Group"}\n   🆔 ${t.threadID}\n   👥 ${t.participantIDs?.length || "?"} members`
    ).join("\n\n");

    return message.reply(
      `📋 Pending GC List (${pendingThreads.length} টি):\n\n${list}\n\n` +
      `📌 /acept add [নম্বর] — accept করো\n` +
      `📌 /acept del [নম্বর] — reject করো\n` +
      `📌 /acept all — সব accept করো`
    );
  }

  // ─── Accept all ───
  if (sub === "all") {
    if (pendingThreads.length === 0) {
      return message.reply("📭 No pending group chats.");
    }

    let success = 0;
    let failed = 0;

    for (const thread of pendingThreads) {
      try {
        await api.sendMessage("👋 Bot activated!", thread.threadID);
        success++;
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) {
        failed++;
      }
    }

    return message.reply(
      `✅ সব pending GC process হয়েছে!\n` +
      `✔️ Accept: ${success}\n` +
      `❌ Failed: ${failed}`
    );
  }

  // ─── add or del ───
  if (sub === "add" || sub === "del") {
    const index = parseInt(args[1]);
    if (isNaN(index) || index < 1 || index > pendingThreads.length) {
      return message.reply(
        `⚠️ সঠিক নম্বর দাও (1 থেকে ${pendingThreads.length})\n` +
        `প্রথমে /acept দিয়ে list দেখো।`
      );
    }

    const target = pendingThreads[index - 1];

    if (sub === "add") {
      try {
        await api.sendMessage(`👋 Bot activated in ${target.name || "this group"}!`, target.threadID);

        // Bot join করলে nickname সেট করো
        setTimeout(async () => {
          try {
            await api.nickname("𝑺𝑨𝑩𝑩𝑰𝑹 𝑮𝑶𝑨𝑻 𝑩𝑶𝑻", target.threadID, String(api.getCurrentUserID()));
          } catch (e) {}
        }, 2000);

        return message.reply(
          `✅ Accept করা হয়েছে!\n` +
          `📌 Group: ${target.name || "Unnamed"}\n` +
          `🆔 ID: ${target.threadID}`
        );
      } catch (e) {
        return message.reply(`❌ Accept করতে পারিনি।\nError: ${e.message}`);
      }
    }

    if (sub === "del") {
      try {
        // Group থেকে bot leave করবে বা ignore করবে
        await api.removeUserFromGroup(String(api.getCurrentUserID()), target.threadID);
        return message.reply(
          `🗑️ Reject করা হয়েছে!\n` +
          `📌 Group: ${target.name || "Unnamed"}\n` +
          `🆔 ID: ${target.threadID}`
        );
      } catch (e) {
        return message.reply(
          `ℹ️ Group টি ignore করা হয়েছে।\n` +
          `📌 Group: ${target.name || "Unnamed"}`
        );
      }
    }
  }

  return message.reply(
    `⚠️ ভুল command!\n\n` +
    `📌 /acept — list দেখো\n` +
    `📌 /acept add [নম্বর] — accept করো\n` +
    `📌 /acept del [নম্বর] — reject করো\n` +
    `📌 /acept all — সব accept করো`
  );
};
