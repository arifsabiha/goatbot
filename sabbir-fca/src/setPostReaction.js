/**
 * @fix by NTKhang
 * update as Thursday, 10 February 2022
 * do not remove the author name to get more updates
 */

 "use strict";

 var utils = require("../utils");
 var log = require("npmlog");
 
 function formatData(resData) {
   var fb = resData && resData.feedback_react && resData.feedback_react.feedback;
   if (!fb) return {
     viewer_feedback_reaction_info: null,
     supported_reactions: null,
     top_reactions: [],
     reaction_count: null
   };
   return {
     viewer_feedback_reaction_info: fb.viewer_feedback_reaction_info,
     supported_reactions: fb.supported_reactions,
     top_reactions: (fb.top_reactions && Array.isArray(fb.top_reactions.edges)) ? fb.top_reactions.edges : [],
     reaction_count: fb.reaction_count
   };
 }
 
 module.exports = function(defaultFuncs, api, ctx) {
   return function setPostReaction(postID, type, callback) {
     var resolveFunc = function(){};
     var rejectFunc = function(){};
     var returnPromise = new Promise(function (resolve, reject) {
       resolveFunc = resolve;
       rejectFunc = reject;
     });
 
     if (!callback) {
       if (utils.getType(type) === "Function" || utils.getType(type) === "AsyncFunction") {
         callback = type;
         type = 0;
       }
       else {
         callback = function (err, data) {
           if (err) {
             return rejectFunc(err);
           }
           resolveFunc(data);
         };
       }
     }
 
     var map = {
       unlike: 0,
       like: 1,
       heart: 2,
       love: 16,
       haha: 4,
       wow: 3,
       sad: 7,
       angry: 8
     };
     
     if (utils.getType(type) === "String") {
       var mapped = map[type.toLowerCase()];
       if (mapped === undefined) {
         return callback({ error: "setPostReaction: Unknown reaction name '" + type + "'. Valid: " + Object.keys(map).join(", ") });
       }
       type = mapped;
     } else if (utils.getType(type) === "Number") {
       // Numeric reaction ID — must be a finite integer
       if (!Number.isFinite(type) || !Number.isInteger(type)) {
         return callback({ error: "setPostReaction: numeric reaction type must be a finite integer" });
       }
     } else {
       return callback({ error: "setPostReaction: type must be a reaction name (string) or numeric ID" });
     }
     
     var form = {
       av: ctx.userID,
       fb_api_caller_class: "RelayModern",
       fb_api_req_friendly_name: "CometUFIFeedbackReactMutation",
       doc_id: "4769042373179384",
       variables: JSON.stringify({
         input: {
           actor_id: ctx.userID,
           feedback_id: (new Buffer.from("feedback:" + postID)).toString("base64"),
           feedback_reaction: type,
           feedback_source: "OBJECT",
           is_tracking_encrypted: true,
           tracking: [],
           session_id: "f7dd50dd-db6e-4598-8cd9-561d5002b423",
           client_mutation_id: Math.round(Math.random() * 19).toString()
         },
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
         log.error("setPostReaction", err);
         return callback(err);
       });
 
     return returnPromise;
   };
 };