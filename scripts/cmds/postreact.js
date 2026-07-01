"use strict";

const axios = require("axios");

const REACTION_MAP = {
  like: "like",
  love: "heart",
  heart: "heart",
  haha: "haha",
  wow: "wow",
  sad: "sad",
  angry: "angry",
  "👍": "like",
  "❤️": "heart",
  "😆": "haha",
  "😮": "wow",
  "😢": "sad",
  "😠": "angry"
};

const REACTION_EMOJI = {
  like: "👍 Like",
  heart: "❤️ Love",
  haha: "😆 Haha",
  wow: "😮 Wow",
  sad: "😢 Sad",
  angry: "😠 Angry"
};

// ── সব ধরনের URL থেকে numeric post ID বের করে ──────────────────────────────
function parseIDFromURL(raw) {
  if (!raw) return null;
  raw = raw.trim();

  // Direct numeric ID
  if (/^\d+$/.test(raw)) return raw;

  let url;
  try {
    url = new URL(raw.startsWith("http") ? raw : "https://" + raw);
  } catch (e) {
    return null;
  }

  const p = url.searchParams;

  // ?story_fbid=xxx  or  ?story_fbid=xxx&id=yyy
  if (p.get("story_fbid")) return p.get("story_fbid");

  // ?fbid=xxx  (photo)
  if (p.get("fbid")) return p.get("fbid");

  // ?p=xxx
  if (p.get("p")) return p.get("p");

  const path = url.pathname;

  // /posts/123456  or  /posts/pfbid... (skip non-numeric pfbid)
  const postNum = path.match(/\/posts\/(\d+)/);
  if (postNum) return postNum[1];

  // /photo/123456  or  /video/123456
  const media = path.match(/\/(photo|video|reel)\/(\d+)/);
  if (media) return media[2];

  // /story.php?id=xxx
  if (p.get("id") && path.includes("story")) return p.get("id");

  // /?v=xxx  (video)
  if (p.get("v")) return p.get("v");

  // /groups/xxx/posts/123456
  const groupPost = path.match(/\/groups\/[^/]+\/posts\/(\d+)/);
  if (groupPost) return groupPost[1];

  return null;
}

// ── redirect follow করে actual URL থেকে ID বের করে ─────────────────────────
async function _fetchAndResolve(rawUrl) {
  const url = rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl;
  const res = await axios.get(url, {
    maxRedirects: 5,
    timeout: 7000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    },
    validateStatus: () => true
  });

  const finalUrl = res.request?.res?.responseUrl || res.config?.url || url;
  const fromRedirect = parseIDFromURL(finalUrl);
  if (fromRedirect) return { id: fromRedirect, resolved: finalUrl };

  if (res.data && typeof res.data === "string") {
    const html = res.data;
    const patterns = [
      /"story_fbid"\s*[=:,]\s*"?(\d{10,})/,
      /"post_id"\s*[=:,]\s*"?(\d{10,})/,
      /top_level_post_id[":]+(\d{10,})/,
      /content_owner_id_new[":]+(\d{10,})/,
      /"id"\s*:\s*"(\d{14,})"/
    ];
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) return { id: m[1], resolved: finalUrl };
    }
  }
  return { id: null, resolved: null };
}

async function resolvePostID(rawUrl) {
  // সরাসরি parse করার চেষ্টা
  const direct = parseIDFromURL(rawUrl);
  if (direct) return { id: direct, resolved: rawUrl };

  // HTTP fetch — 8 সেকেন্ডের মধ্যে না পেলে null return করো
  try {
    return await Promise.race([
      _fetchAndResolve(rawUrl),
      new Promise(resolve => setTimeout(() => resolve({ id: null, resolved: null }), 8000))
    ]);
  } catch (e) {
    return { id: null, resolved: null };
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports.config = {
  name: "postreact",
  version: "4.0.0",
  role: 1,
  credits: "Ariful Islam Sabbir",
  usePrefix: true,
  category: "Facebook",
  countDown: 5,
  shortDescription: "FB post-এ react, comment ও spam comment করো",
  longDescription: "Facebook post-এ react, comment, দুটোই, বা 100 বার spam comment করো।",
  guide: {
    en: [
      "react  → {pn} react <url> [like|love|haha|wow|sad|angry]",
      "comment→ {pn} comment <url> <text>",
      "both   → {pn} both <url> [reaction] | <text>",
      "spam   → {pn} spam <url> <text> [count=100]"
    ].join("\n"),
    bn: [
      "react  → {pn} react <url> [like|love|haha|wow|sad|angry]",
      "comment→ {pn} comment <url> <লেখা>",
      "both   → {pn} both <url> [reaction] | <লেখা>",
      "spam   → {pn} spam <url> <লেখা> [সংখ্যা=100]"
    ].join("\n")
  }
};

module.exports.onStart = async function ({ api, event, args, message }) {
  console.log("[DEBUG postreact] onStart called | sub:", args[0], "| args:", JSON.stringify(args));
  const sub = (args[0] || "").toLowerCase();

  if (!sub || !["react", "comment", "both", "spam"].includes(sub)) {
    return message.reply(
      `╔═══════════════════════════╗\n` +
      `║   📌 FB POST COMMAND     ║\n` +
      `╠═══════════════════════════╣\n` +
      `║ Subcommand:               ║\n` +
      `║  react  — post-এ react    ║\n` +
      `║  comment— post-এ কমেন্ট  ║\n` +
      `║  both   — react + comment ║\n` +
      `║  spam   — 100 বার comment ║\n` +
      `╠═══════════════════════════╣\n` +
      `║ Example:                  ║\n` +
      `║ /postreact spam           ║\n` +
      `║   <url> ভালো পোস্ট!       ║\n` +
      `║ /postreact spam           ║\n` +
      `║   <url> great post! 50    ║\n` +
      `╚═══════════════════════════╝`
    );
  }

  const rawUrl = args[1];
  if (!rawUrl) {
    return message.reply(`❌ Post URL বা Post ID দাও!\nExample: /postreact ${sub} https://fb.com/...`);
  }

  // সরাসরি parse করার চেষ্টা — fast path
  let postID = parseIDFromURL(rawUrl);

  // share/p/ বা অন্য format হলে fetch করে দেখো
  if (!postID) {
    await message.reply(`🔍 URL থেকে ID বের করছি...`);
    const result = await resolvePostID(rawUrl);
    postID = result.id;
  }

  if (!postID) {
    return message.reply(
      `❌ এই URL থেকে Post ID বের করতে পারিনি!\n\n` +
      `📌 Post ID কীভাবে পাবে:\n\n` +
      `1️⃣ Post টা Facebook-এ open করো\n` +
      `2️⃣ Post এর Date/Time তে click করো\n` +
      `3️⃣ Browser এর address bar থেকে URL copy করো\n` +
      `4️⃣ URL এ যে বড় number টা আছে সেটা দাও\n\n` +
      `✅ Example:\n` +
      `fb.com/groups/xyz/posts/📌123456789\n` +
      `fb.com/permalink.php?story_fbid=📌123456789\n\n` +
      `অথবা সরাসরি numeric ID টা দাও:\n` +
      `/postreact ${sub} 123456789012345 ...`
    );
  }

  // ── REACT ──────────────────────────────────────────────────────────────────
  if (sub === "react") {
    const rawReaction = (args[2] || "like").toLowerCase();
    const reaction = REACTION_MAP[rawReaction] || "like";

    try {
      await api.setPostReaction(postID, reaction);
      return message.reply(
        `✅ React সফল!\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `📌 Post ID: ${postID}\n` +
        `${REACTION_EMOJI[reaction] || "👍 Like"} দেওয়া হয়েছে`
      );
    } catch (err) {
      console.error("[PostReact] react error:", err);
      return message.reply(
        `❌ React করা যায়নি!\n` +
        `Error: ${err.error || err.message || JSON.stringify(err)}`
      );
    }
  }

  // ── COMMENT ────────────────────────────────────────────────────────────────
  if (sub === "comment") {
    const commentText = args.slice(2).join(" ").trim();
    if (!commentText) {
      return message.reply(`❌ Comment লেখো!\nExample: /postreact comment <url> ভালো পোস্ট!`);
    }
    try {
      const result = await api.commentOnPost(postID, commentText);
      return message.reply(
        `✅ Comment সফল!\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `📌 Post ID: ${postID}\n` +
        `💬 Comment: ${commentText}` +
        (result && result.commentID ? `\n🆔 Comment ID: ${result.commentID}` : "")
      );
    } catch (err) {
      console.error("[PostReact] comment error:", err);
      return message.reply(
        `❌ Comment করা যায়নি!\n` +
        `Error: ${err.error || err.message || JSON.stringify(err)}`
      );
    }
  }

  // ── BOTH ───────────────────────────────────────────────────────────────────
  if (sub === "both") {
    const rest = args.slice(2).join(" ");
    const pipeIdx = rest.indexOf("|");

    let rawReaction = "like";
    let commentText = "";

    if (pipeIdx !== -1) {
      rawReaction = rest.slice(0, pipeIdx).trim().toLowerCase() || "like";
      commentText = rest.slice(pipeIdx + 1).trim();
    } else {
      const parts = rest.trim().split(/\s+/);
      rawReaction = (parts[0] || "like").toLowerCase();
      commentText = parts.slice(1).join(" ");
    }

    if (!commentText) {
      return message.reply(
        `❌ Comment লেখা নেই!\n\nExample:\n/postreact both <url> love | ভালো পোস্ট!`
      );
    }

    const reaction = REACTION_MAP[rawReaction] || "like";
    const lines = [`📌 Post ID: ${postID}\n━━━━━━━━━━━━━━━━`];

    try {
      await api.setPostReaction(postID, reaction);
      lines.push(`${REACTION_EMOJI[reaction] || "👍 Like"} → ✅ সফল`);
    } catch (err) {
      console.error("[PostReact] react error:", err);
      lines.push(`👍 React → ❌ ব্যর্থ (${err.error || err.message || "unknown"})`);
    }

    try {
      const result = await api.commentOnPost(postID, commentText);
      lines.push(
        `💬 Comment → ✅ সফল` +
        (result && result.commentID ? ` [ID: ${result.commentID}]` : "")
      );
      lines.push(`   "${commentText}"`);
    } catch (err) {
      console.error("[PostReact] comment error:", err);
      lines.push(`💬 Comment → ❌ ব্যর্থ (${err.error || err.message || "unknown"})`);
    }

    return message.reply(lines.join("\n"));
  }

  // ── SPAM ───────────────────────────────────────────────────────────────────
  if (sub === "spam") {
    console.log("[DEBUG postreact] spam branch | rawUrl:", args[1]);
    const allAfterUrl = args.slice(2).join(" ").trim();
    if (!allAfterUrl) {
      return message.reply(
        `❌ Comment লেখো!\n\nExample:\n/postreact spam <url> ভালো পোস্ট!\n/postreact spam <url> ভালো পোস্ট! 50`
      );
    }

    // শেষ token যদি number হয় তাহলে সেটা count, বাকিটা comment
    const tokens = allAfterUrl.split(" ");
    const lastToken = tokens[tokens.length - 1];
    let count = 100;
    let commentText = allAfterUrl;

    if (/^\d+$/.test(lastToken)) {
      count = Math.min(Math.max(parseInt(lastToken), 1), 100);
      commentText = tokens.slice(0, -1).join(" ").trim();
    }

    if (!commentText) {
      return message.reply(`❌ Comment লেখো!\nExample: /postreact spam <url> ভালো পোস্ট!`);
    }

    // শুরুর message
    await message.reply(
      `🚀 Spam শুরু হচ্ছে!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 Post ID  : ${postID}\n` +
      `💬 Comment  : ${commentText}\n` +
      `🔢 মোট     : ${count} বার\n` +
      `⏳ একটু অপেক্ষা করো...`
    );

    let success = 0;
    let failed = 0;

    for (let i = 1; i <= count; i++) {
      try {
        await api.commentOnPost(postID, commentText);
        success++;
      } catch (err) {
        failed++;
        console.error(`[PostReact Spam] #${i} error:`, err.error || err.message || err);
        // 3 বার পরপর fail হলে থামো
        if (failed >= 3 && success === 0) {
          await message.reply(
            `❌ Spam বন্ধ হয়ে গেছে!\n` +
            `প্রথম ${i} বারেই ${failed} বার error।\n` +
            `Error: ${err.error || err.message || "unknown"}`
          );
          return;
        }
      }

      // প্রতি 10টায় একটা progress update
      if (i % 10 === 0) {
        await message.reply(`📊 Progress: ${i}/${count} | ✅ ${success} সফল | ❌ ${failed} ব্যর্থ`);
      }

      // প্রতিটার মাঝে 1.5 সেকেন্ড delay (rate limit এড়াতে)
      await sleep(1500);
    }

    return message.reply(
      `🏁 Spam সম্পন্ন!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 Post ID : ${postID}\n` +
      `✅ সফল     : ${success} বার\n` +
      `❌ ব্যর্থ   : ${failed} বার\n` +
      `💬 Comment : ${commentText}`
    );
  }
};
