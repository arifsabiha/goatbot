const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "murgichore",
  version: "5.0.0",
  hasPermssion: 2,
  credits: "Ariful Islam Sabbir",
  description: "Murgi chor meme",
  usePrefix: true,
  category: "Edit",
  usages: "murgichore [@mention/reply]",
  cooldowns: 5
};

/* TARGET RESOLVE */
async function resolveTarget(api, event) {

  const {
    mentions,
    senderID,
    messageReply
  } = event;

  /* MENTION */
  if (
    mentions &&
    Object.keys(mentions).length > 0
  ) {

    const uid =
      Object.keys(mentions)[0];

    return uid;
  }

  /* REPLY */
  if (
    messageReply &&
    messageReply.senderID
  ) {

    return messageReply.senderID;
  }

  return null;
}

/* LOADING */
async function showLoading(
  api,
  threadID
) {

  const frames = [

`🐔 মুরগি চোর ধরা হচ্ছে...

▒▒▒▒▒▒▒▒▒▒ 0%`,

`🚨 এলাকা ঘেরাও করা হচ্ছে...

██▒▒▒▒▒▒▒▒ 25%`,

`📂 প্রমাণ সংগ্রহ করা হচ্ছে...

█████▒▒▒▒▒ 50%`,

`⚡ চোরের ছবি বানানো হচ্ছে...

███████▒▒▒ 75%`,

`✅ চোর ধরা সম্পন্ন...

██████████ 100%`

  ];

  const msg =
    await api.sendMessage(
      frames[0],
      threadID
    );

  for (
    let i = 1;
    i < frames.length;
    i++
  ) {

    await new Promise(
      r => setTimeout(r, 500)
    );

    try {

      await api.editMessage(
        frames[i],
        msg.messageID
      );

    } catch (_) {}
  }

  return msg.messageID;
}

module.exports.onStart =
async function ({
  api,
  event
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  try {

    /* TARGET */
    const targetID =
      await resolveTarget(
        api,
        event
      );

    if (!targetID) {

      return api.sendMessage(
        "🐔 কাউকে mention/reply করুন",
        threadID,
        messageID
      );
    }

    /* LOADING */
    await showLoading(
      api,
      threadID
    );

    /* USER INFO */
    const userInfo =
      await api.getUserInfo(
        targetID
      );

    const targetName =
      userInfo[targetID]
        ? userInfo[targetID].name
        : "চোর";

    /* TOKEN */
    const token =
"6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

    /* PP URL */
    const senderPP =
`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${token}`;

    const targetPP =
`https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${token}`;

    /* BASE IMAGE */
    const base =
      await Jimp.read(
"https://i.imgur.com/dPIvlGF.jpeg"
      );

    /* LOAD PPs */
    const [
      senderImg,
      targetImg
    ] = await Promise.all([

      Jimp.read(
        (
          await axios.get(
            senderPP,
            {
              responseType:
                "arraybuffer"
            }
          )
        ).data
      ),

      Jimp.read(
        (
          await axios.get(
            targetPP,
            {
              responseType:
                "arraybuffer"
            }
          )
        ).data
      )

    ]);

    /* STYLE */
    senderImg
      .circle()
      .resize(75, 75);

    targetImg
      .circle()
      .resize(75, 75);

    /*
      LEFT PERSON
      sender
    */
    base.composite(
      senderImg,
      55,
      240
    );

    /*
      MAIN CHOR
      target
    */
    base.composite(
      targetImg,
      240,
      220
    );

    /* SAVE */
    const cachePath =
      path.join(
        __dirname,
        `cache_${Date.now()}.png`
      );

    await base.writeAsync(
      cachePath
    );

    /* SEND */
    return api.sendMessage({

      body:
`🐔 শালা মুরগি চোর ${targetName}

শশুর বাড়িতে গিয়ে মুরগি চুরি করতে গিয়ে ধরা খাইসে 😹`,

      attachment:
        fs.createReadStream(
          cachePath
        )

    },

    threadID,

    () => {

      fs.unlinkSync(
        cachePath
      );
    },

    messageID
    );

  } catch (e) {

    console.log(e);

    return api.sendMessage(
      "❌ Error",
      threadID,
      messageID
    );
  }
};
