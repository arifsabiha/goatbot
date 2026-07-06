const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "quote",
    aliases: ["quotes", "q"],
    version: "1.7",
    author: "SABBIR",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      en: "Get a random Mahmud quote"
    },
    longDescription: {
      en: "Fetches a deep or inspiring quote from Mahmud's global API"
    },
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, api, event }) {


    try {
      const apiUrl = `${await mahmud()}/api/quote`;
      const res = await axios.get(apiUrl);
      const { quote, message: msg } = res.data;

      message.reply(`${msg}\n\n ${quote}`);
    } catch (err) {
      message.reply("🥹error, contact MahMUD.");
    }
  }
};
