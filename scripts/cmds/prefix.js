const fs = require("fs-extra");

module.exports = {
	config: {
		name: "prefix",
		version: "2.0",
		author: "SABBIR",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "View or change bot prefix",
			bn: "বটের প্রিফিক্স দেখুন বা পরিবর্তন করুন"
		},
		longDescription: {
			en: "View current prefix or change prefix for this group / global system",
			bn: "বর্তমান প্রিফিক্স দেখুন অথবা এই গ্রুপ / সম্পূর্ণ সিস্টেমের প্রিফিক্স পরিবর্তন করুন"
		},
		category: "config",
		guide: {
			en: "   {pn} — view current prefix\n"
				+ "   {pn} <new prefix> — change prefix for this group\n"
				+ "   {pn} <new prefix> -g — change global prefix (admin only)\n"
				+ "   {pn} reset — reset this group's prefix to default",
			bn: "   {pn} — বর্তমান প্রিফিক্স দেখুন\n"
				+ "   {pn} <নতুন প্রিফিক্স> — এই গ্রুপের প্রিফিক্স পরিবর্তন করুন\n"
				+ "   {pn} <নতুন প্রিফিক্স> -g — গ্লোবাল প্রিফিক্স পরিবর্তন করুন (শুধু এডমিন)\n"
				+ "   {pn} reset — এই গ্রুপের প্রিফিক্স ডিফল্টে রিসেট করুন"
		}
	},

	langs: {
		en: {
			currentPrefix: "╭──── 🔧 PREFIX INFO ────╮\n│\n│ 🌐 Global Prefix : %1\n│ 🏠 Group Prefix  : %2\n│\n╰──────────────────────╯",
			onlyAdmin: "❌ Only bot admin can change the global prefix!",
			confirmGlobal: "✅ React to this message to confirm changing the global prefix to: %1",
			confirmGroup: "✅ React to this message to confirm changing this group's prefix to: %1",
			successGlobal: "╭──── ✅ SUCCESS ────╮\n│\n│ 🌐 Global prefix changed!\n│ New prefix: %1\n│\n╰───────────────────╯",
			successGroup: "╭──── ✅ SUCCESS ────╮\n│\n│ 🏠 Group prefix changed!\n│ New prefix: %1\n│\n╰───────────────────╯",
			reset: "╭──── 🔄 RESET ────╮\n│\n│ Prefix reset to default!\n│ Default: %1\n│\n╰──────────────────╯",
			noArgs: "╭──── ❓ USAGE ────╮\n│\n│ {pn} — view prefix\n│ {pn} <new> — change group prefix\n│ {pn} <new> -g — change global\n│ {pn} reset — reset group prefix\n│\n╰──────────────────╯"
		},
		bn: {
			currentPrefix: "╭──── 🔧 প্রিফিক্স তথ্য ────╮\n│\n│ 🌐 গ্লোবাল প্রিফিক্স : %1\n│ 🏠 গ্রুপ প্রিফিক্স   : %2\n│\n╰────────────────────────╯",
			onlyAdmin: "❌ শুধুমাত্র বট এডমিন গ্লোবাল প্রিফিক্স পরিবর্তন করতে পারবেন!",
			confirmGlobal: "✅ গ্লোবাল প্রিফিক্স '%1' করতে এই মেসেজে যেকোনো রিঅ্যাক্ট করুন",
			confirmGroup: "✅ এই গ্রুপের প্রিফিক্স '%1' করতে এই মেসেজে যেকোনো রিঅ্যাক্ট করুন",
			successGlobal: "╭──── ✅ সফল ────╮\n│\n│ 🌐 গ্লোবাল প্রিফিক্স পরিবর্তন হয়েছে!\n│ নতুন প্রিফিক্স: %1\n│\n╰──────────────────╯",
			successGroup: "╭──── ✅ সফল ────╮\n│\n│ 🏠 গ্রুপের প্রিফিক্স পরিবর্তন হয়েছে!\n│ নতুন প্রিফিক্স: %1\n│\n╰──────────────────╯",
			reset: "╭──── 🔄 রিসেট ────╮\n│\n│ প্রিফিক্স ডিফল্টে রিসেট হয়েছে!\n│ ডিফল্ট: %1\n│\n╰───────────────────╯",
			noArgs: "╭──── ❓ ব্যবহার ────╮\n│\n│ {pn} — প্রিফিক্স দেখুন\n│ {pn} <নতুন> — গ্রুপ প্রিফিক্স বদলান\n│ {pn} <নতুন> -g — গ্লোবাল বদলান\n│ {pn} reset — গ্রুপ প্রিফিক্স রিসেট\n│\n╰─────────────────────╯"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		const globalPrefix = global.GoatBot.config.prefix;
		const groupPrefix = global.utils.getPrefix(event.threadID);

		if (!args[0]) {
			return message.reply(
				getLang("currentPrefix", globalPrefix, groupPrefix)
			);
		}

		if (args[0].toLowerCase() === "reset") {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(getLang("reset", globalPrefix));
		}

		const newPrefix = args[0];

		if (args[1] === "-g") {
			if (role < 2)
				return message.reply(getLang("onlyAdmin"));

			return message.reply(getLang("confirmGlobal", newPrefix), (err, info) => {
				global.GoatBot.onReaction.set(info.messageID, {
					commandName,
					author: event.senderID,
					newPrefix,
					setGlobal: true,
					messageID: info.messageID
				});
			});
		}

		return message.reply(getLang("confirmGroup", newPrefix), (err, info) => {
			global.GoatBot.onReaction.set(info.messageID, {
				commandName,
				author: event.senderID,
				newPrefix,
				setGlobal: false,
				messageID: info.messageID
			});
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			const dirConfig = require("path").normalize(`${process.cwd()}/config.json`);
			fs.writeFileSync(dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successGroup", newPrefix));
		}
	},

	onChat: async function ({ event, message, getLang }) {
		if (event.body && event.body.trim().toLowerCase() === "prefix") {
			const globalPrefix = global.GoatBot.config.prefix;
			const groupPrefix = global.utils.getPrefix(event.threadID);
			return message.reply(getLang("currentPrefix", globalPrefix, groupPrefix));
		}
	}
};
