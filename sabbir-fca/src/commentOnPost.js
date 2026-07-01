"use strict";

var utils = require("../utils");
var log = require("npmlog");

function formatData(resData) {
  try {
    var comment = resData.comment_create && resData.comment_create.feedback_comment_edge
      ? resData.comment_create.feedback_comment_edge.node
      : null;
    return {
      commentID: comment ? comment.id : null,
      body: comment && comment.body ? comment.body.text : null,
      timestamp: comment ? comment.created_time : null
    };
  } catch (e) {
    return { raw: resData };
  }
}

module.exports = function(defaultFuncs, api, ctx) {
  return function commentOnPost(postID, message, callback) {
    var resolveFunc = function(){};
    var rejectFunc = function(){};
    var returnPromise = new Promise(function(resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (typeof message === "function") {
      callback = message;
      message = "";
    }

    if (!callback) {
      callback = function(err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    if (!postID) {
      return callback({ error: "commentOnPost: postID is required" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return callback({ error: "commentOnPost: message is required and must be a non-empty string" });
    }

    var feedbackID = (Buffer.from("feedback:" + postID)).toString("base64");

    var form = {
      av: ctx.userID,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "CometUFICreateCommentMutation",
      doc_id: "7690870857617540",
      variables: JSON.stringify({
        input: {
          actor_id: ctx.userID,
          client_mutation_id: Math.round(Math.random() * 19).toString(),
          feedback_id: feedbackID,
          message: {
            text: message.trim()
          },
          feedback_referrer: "/",
          is_tracking_encrypted: true,
          tracking: [],
          actor_username: null
        },
        feedLocation: "TAHOE",
        useDefaultActor: false,
        scale: 3
      })
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function(resData) {
        if (resData.errors) {
          throw resData;
        }
        return callback(null, formatData(resData.data));
      })
      .catch(function(err) {
        log.error("commentOnPost", err);
        return callback(err);
      });

    return returnPromise;
  };
};
