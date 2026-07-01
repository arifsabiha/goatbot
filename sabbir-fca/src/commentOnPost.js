"use strict";

var utils = require("../utils");
var log = require("npmlog");

// ── Known doc_ids for comment mutations (newest → oldest) ────────────────────
// Facebook rotates these; we try each in sequence until one works.
var COMMENT_MUTATIONS = [
  {
    doc_id: "3990729237650259",
    friendly_name: "UFICreateCommentMutation",
    buildVars: function(userID, feedbackID, text) {
      return {
        input: {
          actor_id: userID,
          client_mutation_id: Math.round(Math.random() * 19).toString(),
          feedback_id: feedbackID,
          message: { text: text },
          feedback_referrer: "/",
          is_tracking_encrypted: true,
          tracking: [],
          actor_username: null
        },
        useDefaultActor: false,
        scale: 3
      };
    },
    extractResult: function(data) {
      try {
        var edge = data && (
          (data.comment_create && data.comment_create.feedback_comment_edge) ||
          (data.ufi_comment_create && data.ufi_comment_create.feedback_comment_edge)
        );
        if (!edge) return { commentID: null };
        return {
          commentID: edge.node ? edge.node.id : null,
          body: edge.node && edge.node.body ? edge.node.body.text : null
        };
      } catch (e) { return { commentID: null }; }
    }
  },
  {
    doc_id: "7690870857617540",
    friendly_name: "CometUFICreateCommentMutation",
    buildVars: function(userID, feedbackID, text) {
      return {
        input: {
          actor_id: userID,
          client_mutation_id: Math.round(Math.random() * 19).toString(),
          feedback_id: feedbackID,
          message: { text: text },
          feedback_referrer: "/",
          is_tracking_encrypted: true,
          tracking: [],
          actor_username: null
        },
        feedLocation: "TAHOE",
        useDefaultActor: false,
        scale: 3
      };
    },
    extractResult: function(data) {
      try {
        var edge = data && data.comment_create && data.comment_create.feedback_comment_edge;
        if (!edge) return { commentID: null };
        return {
          commentID: edge.node ? edge.node.id : null,
          body: edge.node && edge.node.body ? edge.node.body.text : null
        };
      } catch (e) { return { commentID: null }; }
    }
  },
  {
    doc_id: "4205942669439029",
    friendly_name: "CometUFICreateCommentMutation",
    buildVars: function(userID, feedbackID, text) {
      return {
        input: {
          actor_id: userID,
          client_mutation_id: Math.round(Math.random() * 19).toString(),
          feedback_id: feedbackID,
          message: { text: text },
          feedback_referrer: "/",
          is_tracking_encrypted: true,
          tracking: [],
          actor_username: null
        },
        feedLocation: "PERMALINK",
        useDefaultActor: false,
        scale: 3
      };
    },
    extractResult: function(data) {
      try {
        var edge = data && data.comment_create && data.comment_create.feedback_comment_edge;
        return { commentID: edge && edge.node ? edge.node.id : null };
      } catch (e) { return { commentID: null }; }
    }
  }
];

// ── Try one GraphQL mutation ─────────────────────────────────────────────────
function tryGraphQL(defaultFuncs, ctx, mutation, feedbackID, text) {
  return new Promise(function(resolve, reject) {
    var form = {
      av: ctx.userID,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: mutation.friendly_name,
      doc_id: mutation.doc_id,
      variables: JSON.stringify(mutation.buildVars(ctx.userID, feedbackID, text))
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function(resData) {
        if (resData.errors) {
          return reject(new Error("GraphQL errors: " + JSON.stringify(resData.errors)));
        }
        var result = mutation.extractResult(resData.data || resData);
        resolve(result);
      })
      .catch(reject);
  });
}

// ── Legacy fallback: add_comment.php ────────────────────────────────────────
function tryLegacy(defaultFuncs, ctx, postID, text) {
  return new Promise(function(resolve, reject) {
    var form = {
      av: ctx.userID,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "UFICreateCommentMutation",
      doc_id: "1547341872241141",
      variables: JSON.stringify({
        input: {
          actor_id: ctx.userID,
          client_mutation_id: Math.round(Math.random() * 19).toString(),
          feedback_id: (Buffer.from("feedback:" + postID)).toString("base64"),
          message: { text: text },
          is_tracking_encrypted: false,
          tracking: []
        },
        useDefaultActor: false,
        scale: 3
      })
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function(resData) {
        if (resData.errors) return reject(new Error("legacy errors"));
        resolve({ commentID: null, legacy: true });
      })
      .catch(reject);
  });
}

// ── Main export ─────────────────────────────────────────────────────────────
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

    if (!postID) return callback({ error: "commentOnPost: postID is required" });
    if (!message || typeof message !== "string" || !message.trim()) {
      return callback({ error: "commentOnPost: message must be a non-empty string" });
    }

    var feedbackID = (Buffer.from("feedback:" + postID)).toString("base64");
    var text = message.trim();

    // Try each mutation in sequence, stop on first success
    (function tryNext(index) {
      if (index >= COMMENT_MUTATIONS.length) {
        // All GraphQL mutations failed → try legacy
        log.warn("commentOnPost", "All GraphQL doc_ids failed, trying legacy...");
        return tryLegacy(defaultFuncs, ctx, postID, text)
          .then(function(result) { callback(null, result); })
          .catch(function(err) {
            log.error("commentOnPost", "All attempts failed:", err);
            callback(err);
          });
      }

      var mutation = COMMENT_MUTATIONS[index];
      log.verbose("commentOnPost", "Trying doc_id=" + mutation.doc_id);

      tryGraphQL(defaultFuncs, ctx, mutation, feedbackID, text)
        .then(function(result) {
          log.verbose("commentOnPost", "Success with doc_id=" + mutation.doc_id);
          callback(null, result);
        })
        .catch(function(err) {
          log.verbose("commentOnPost", "doc_id=" + mutation.doc_id + " failed, trying next...");
          tryNext(index + 1);
        });
    })(0);

    return returnPromise;
  };
};
