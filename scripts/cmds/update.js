const axios = require("axios");
const fs = require("fs-extra");
const execSync = require("child_process").execSync;
const dirBootLogTemp = `${__dirname}/tmp/rebootUpdated.txt`;

module.exports = {
	config: {
		name: "update",
		version: "1.7",
		author: "SABBIR",
		role: 2,
		description: {
			en: "Check for and install updates for the chatbot.",
			bn: "বটের আপডেট চেক করে ইনস্টল করা"
		},
		category: "owner",
		guide: {
			en: "{pn}",
			bn: "{pn}"
		}
	},

	langs: {
		en: {
			noUpdates: "✅ | You are using the latest version of HinataBot V3 (v%1).",
			updatePrompt: "💫 | You are using version %1. There is a new version %2. Do you want to update the chatbot to the latest version?"
				+ "\n\n⬆️ | The following files will be updated:"
				+ "\n%3%4"
				+ "\n\nℹ️ | See details at "
				+ "\n💡 | React to this message to confirm.",
			fileWillDelete: "\n🗑️ | The following files/folders will be deleted:\n%1",
			andMore: " ...and %1 more files",
			updateConfirmed: "🚀 | Confirmed, updating...",
			updateComplete: "✅ | Update complete, do you want to restart the chatbot now (reply with \"yes\" or \"y\" to confirm)?",
			updateTooFast: "⭕ Because the latest update was released %1 minutes %2 seconds ago, you can't update now. Please try again after %3 minutes %4 seconds to avoid errors.",
			botWillRestart: "🔄 | The bot will restart now!"
		},

		bn: {
			noUpdates: "✅ | তুমি ইতিমধ্যে HinataBot V3 এর সর্বশেষ ভার্সন (v%1) ব্যবহার করছো।",
			updatePrompt: "💫 | তুমি বর্তমানে %1 ভার্সন ব্যবহার করছো। নতুন ভার্সন %2 পাওয়া গেছে। বট আপডেট করতে চাও?"
				+ "\n\n⬆️ | নিচের ফাইলগুলো আপডেট হবে:"
				+ "\n%3%4"
				+ "\n\nℹ️ | বিস্তারিত দেখো: "
				+ "\n💡 | কনফার্ম করতে এই মেসেজে রিয়্যাক্ট দাও।",
			fileWillDelete: "\n🗑️ | নিচের ফাইল/ফোল্ডার ডিলিট হবে:\n%1",
			andMore: " ...আরও %1 টি ফাইল",
			updateConfirmed: "🚀 | কনফার্ম হয়েছে, আপডেট শুরু হচ্ছে...",
			updateComplete: "✅ | আপডেট সম্পন্ন! এখন কি বট রিস্টার্ট করতে চাও? (yes বা y লিখে কনফার্ম করো)",
			updateTooFast: "⭕ সর্বশেষ আপডেট %1 মিনিট %2 সেকেন্ড আগে রিলিজ হয়েছে, এখন আপডেট করা যাবে না। %3 মিনিট %4 সেকেন্ড পরে আবার চেষ্টা করো।",
			botWillRestart: "🔄 | বট এখন রিস্টার্ট হচ্ছে!"
		}
	},

	onLoad: async function ({ api }) {
		if (fs.existsSync(dirBootLogTemp)) {
			const threadID = fs.readFileSync(dirBootLogTemp, "utf-8");
			fs.removeSync(dirBootLogTemp);
			api.sendMessage("The chatbot has been restarted.", threadID);
		}
	},

	onStart: async function ({ message, getLang, commandName, event }) {
		const { data: { version } } = await axios.get("https://raw.githubusercontent.com/sabbir-bot/api/main/baseApiUrl.json");
		const { data: versions } = await axios.get("https://raw.githubusercontent.com/sabbir-bot/api/main/baseApiUrl.json");

		const currentVersion = require("../../package.json").version;
		if (compareVersion(version, currentVersion) < 1)
			return message.reply(getLang("noUpdates", currentVersion));

		const newVersions = versions.slice(versions.findIndex(v => v.version == currentVersion) + 1);

		let fileWillUpdate = [...new Set(newVersions.map(v => Object.keys(v.files || {})).flat())]
			.sort()
			.filter(f => f?.length);
		const totalUpdate = fileWillUpdate.length;
		fileWillUpdate = fileWillUpdate.slice(0, 10).map(file => ` - ${file}`).join("\n");

		let fileWillDelete = [...new Set(newVersions.map(v => Object.keys(v.deleteFiles || {}).flat()))]
			.sort()
			.filter(f => f?.length);
		const totalDelete = fileWillDelete.length;
		fileWillDelete = fileWillDelete.slice(0, 10).map(file => ` - ${file}`).join("\n");

		message.reply(
			getLang(
				"updatePrompt",
				currentVersion,
				version,
				fileWillUpdate + (totalUpdate > 10 ? "\n" + getLang("andMore", totalUpdate - 10) : ""),
				totalDelete > 0 ? "\n" + getLang("fileWillDelete",
					fileWillDelete + (totalDelete > 10 ? "\n" + getLang("andMore", totalDelete - 10) : "")
				) : ""
			),
			(err, info) => {
				if (err) return console.error(err);

				global.GoatBot.onReaction.set(info.messageID, {
					messageID: info.messageID,
					threadID: info.threadID,
					authorID: event.senderID,
					commandName
				});
			}
		);
	},

	onReaction: async function ({ message, getLang, Reaction, event }) {
		if (event.userID != Reaction.authorID) return;

		const { data: lastCommit } = await axios.get('https://api.github.com/repos/mahmudx7/Hinata-Bot-V3/commits/main');
		const lastCommitDate = new Date(lastCommit.commit.committer.date);

		if (new Date().getTime() - lastCommitDate.getTime() < 5 * 60 * 1000) {
			const minutes = Math.floor((new Date().getTime() - lastCommitDate.getTime()) / 1000 / 60);
			const seconds = Math.floor((new Date().getTime() - lastCommitDate.getTime()) / 1000 % 60);
			const minutesCooldown = Math.floor((5 * 60 * 1000 - (new Date().getTime() - lastCommitDate.getTime())) / 1000 / 60);
			const secondsCooldown = Math.floor((5 * 60 * 1000 - (new Date().getTime() - lastCommitDate.getTime())) / 1000 % 60);
			return message.reply(getLang("updateTooFast", minutes, seconds, minutesCooldown, secondsCooldown));
		}

		await message.reply(getLang("updateConfirmed"));
		execSync("node update", { stdio: "inherit" });
		fs.writeFileSync(dirBootLogTemp, event.threadID);

		message.reply(getLang("updateComplete"), (err, info) => {
			if (err) return console.error(err);

			global.GoatBot.onReply.set(info.messageID, {
				messageID: info.messageID,
				threadID: info.threadID,
				authorID: event.senderID
			});
		});
	},

	onReply: async function ({ message, getLang, event }) {
		if (['yes', 'y'].includes(event.body?.toLowerCase())) {
			await message.reply(getLang("botWillRestart"));
			process.exit(2);
		}
	}
};

function compareVersion(version1, version2) {
	const v1 = version1.split(".");
	const v2 = version2.split(".");
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i])) return 1;
		if (parseInt(v1[i]) < parseInt(v2[i])) return -1;
	}
	return 0;
}
