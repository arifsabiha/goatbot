"use strict";

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

function extractPostID(input) {
  if (!input) return null;
  input = input.trim();

  // Direct numeric ID
  if (/^\d+$/.test(input)) return input;

  try {
    const url = new URL(input.startsWith("http") ? input : "https://" + input);
    const params = url.searchParams;

    if (params.get("story_fbid")) return params.get("story_fbid");
    if (params.get("fbid")) return params.get("fbid");
    if (params.get("p")) return params.get("p");

    const postMatch = url.pathname.match(/\/posts\/(\d+)/);
    if (postMatch) return postMatch[1];

    const mediaMatch = url.pathname.match(/\/(photo|video)\/(\d+)/);
    if (mediaMatch) return mediaMatch[2];

    const storyMatch = url.pathname.match(/\/story\/(\d+)/);
    if (storyMatch) return storyMatch[1];
  } catch (e) {}

  return null;
}

module.exports.config = {
  name: "postreact",
  version: "2.0.0",
  role: 1,
  credits: "Ariful Islam Sabbir",
  usePrefix: true,
  category: "Facebook",
  countDown: 5,
  shortDescription: "FB post-এ react ও comment করো",
  longDescription: "Facebook post-এ react দাও, comment করো অথবা দুটোই একসাথে করো।",
  guide: {
    en: [
      "react  → {pn} react <post_url_or_id> [like|love|haha|wow|sad|angry]",
      "comment→ {pn} comment <post_url_or_id> <text>",
      "both   → {pn} both <post_url_or_id> [reaction] | <comment text>"
    ].join("\n"),
    bn: [
      "react  → {pn} react <post_url_or_id> [like|love|haha|wow|sad|angry]",
      "comment→ {pn} comment <post_url_or_id> <লেখা>",
      "both   → {pn} both <post_url_or_id> [reaction] | <comment লেখা>"
    ].join("\n")
  }
};

module.exports.onStart = async function ({ api, event, args, message }) {
  const sub = (args[0] || "").toLowerCase();

  if (!sub || !["react", "comment", "both"].includes(sub)) {
    return message.reply(
      `╔══════════════════════════╗\n` +
      `║   📌 FB POST COMMAND    ║\n` +
      `╠══════════════════════════╣\n` +
      `║ Subcommand গুলো:         ║\n` +
      `║  react   — post-এ react  ║\n` +
      `║  comment — post-এ কমেন্ট ║\n` +
      `║  both    — দুটোই একসাথে  ║\n` +
      `╠══════════════════════════╣\n` +
      `║ Example:                 ║\n` +
      `║ /postreact react         ║\n` +
      `║   <url> love             ║\n` +
      `║                          ║\n` +
      `║ /postreact comment       ║\n` +
      `║   <url> ভালো পোস্ট!      ║\n` +
      `║                          ║\n` +
      `║ /postreact both          ║\n` +
      `║   <url> love | সুন্দর!   ║\n` +
      `╚══════════════════════════╝`
    );
  }

  const rawUrl = args[1];
  if (!rawUrl) {
    return message.reply(`❌ Post URL বা Post ID দাও!\nExample: /postreact ${sub} https://fb.com/...`);
  }

  const postID = extractPostID(rawUrl);
  if (!postID) {
    return message.reply(
      `❌ Post URL থেকে ID বের করতে পারিনি!\n\n` +
      `✅ Valid format:\n` +
      `• https://fb.com/.../posts/123456\n` +
      `• https://www.facebook.com/permalink.php?story_fbid=123456\n` +
      `• সরাসরি numeric Post ID যেমন: 123456789`
    );
  }

  // ── REACT ──────────────────────────────────────────────────────────────────
  if (sub === "react") {
    const rawReaction = (args[2] || "like").toLowerCase();
    const reaction = REACTION_MAP[rawReaction] || "like";

    try {
      await api.setPostReaction(postID, reaction);
      return message.reply(
        `✅ React সফল হয়েছে!\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 Post ID  : ${postID}\n` +
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
      return message.reply(
        `❌ Comment লেখো!\n` +
        `Example: /postreact comment <url> ভালো পোস্ট!`
      );
    }

    try {
      const result = await api.commentOnPost(postID, commentText);
      return message.reply(
        `✅ Comment সফল হয়েছে!\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 Post ID   : ${postID}\n` +
        `💬 Comment   : ${commentText}` +
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
      // No pipe: first token = reaction, rest = comment
      const parts = rest.trim().split(/\s+/);
      rawReaction = (parts[0] || "like").toLowerCase();
      commentText = parts.slice(1).join(" ");
    }

    if (!commentText) {
      return message.reply(
        `❌ Comment লেখা নেই!\n\n` +
        `Example:\n/postreact both <url> love | ভালো পোস্ট!`
      );
    }

    const reaction = REACTION_MAP[rawReaction] || "like";
    const lines = [`📌 Post ID: ${postID}\n━━━━━━━━━━━━━━━━━━━━`];

    // React
    try {
      await api.setPostReaction(postID, reaction);
      lines.push(`${REACTION_EMOJI[reaction] || "👍 Like"} → ✅ সফল`);
    } catch (err) {
      console.error("[PostReact] react error:", err);
      lines.push(`👍 React → ❌ ব্যর্থ (${err.error || err.message || "unknown"})`);
    }

    // Comment
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
};
