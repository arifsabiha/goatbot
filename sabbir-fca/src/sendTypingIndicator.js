"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  function makeTypingIndicator(typ, threadID, callback, isGroup) {
    // Facebook removed typ.php (returns 404). Typing must go via MQTT.
    // The /thread_typing topic carries: { state, sender_fbid, thread }
    // We also try /ls_req with a Lightspeed typing task as a second attempt.
    if (!ctx.mqttClient) {
      return callback();
    }

    try {
      // Primary: publish directly to /thread_typing (same format the server sends us)
      const payload = JSON.stringify({
        state: typ ? 1 : 0,
        sender_fbid: parseInt(ctx.userID),
        thread: parseInt(threadID)
      });
      ctx.mqttClient.publish("/thread_typing", payload, { qos: 1, retain: false }, function(err) {
        if (err) log.warn("sendTypingIndicator", "mqtt publish error: %s", err.message || err);
        callback();
      });
    } catch (err) {
      log.error("sendTypingIndicator", "error: %s", err.message || err);
      callback(err);
    }
  }

  return function sendTypingIndicator(threadID, callback, isGroup) {
    if (typeof callback !== "function") {
      if (typeof callback === "boolean") {
        isGroup = callback;
      }
      callback = () => { };
    }

    makeTypingIndicator(true, threadID, callback, isGroup);

    return function end(cb) {
      if (typeof cb !== "function") cb = () => { };
      makeTypingIndicator(false, threadID, cb, isGroup);
    };
  };
};
