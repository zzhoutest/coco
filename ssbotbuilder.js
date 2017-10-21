var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var backoff = require('backoff');
var configuration;
var Botwebserver;
var events={};
var authtoken;
var tokenState = false;
var BotServiceAgent;
var listeners = {};
require('log-timestamp');

/*Module Declaration*/
var ssBotBuilder = function() {

};

/*Interface API to create WebServer*/
ssBotBuilder.prototype.createService = function(config, callback) {
  console.log('---configuration---');
  configuration = config;

  // process client config, and this is used for bot to communicate to bot platform
  if(config.hasOwnProperty("clientconfig")) {    
    configuration.clientconfig = config.clientconfig;
  } else {
    configuration.clientconfig = {};    
  }

  if (!configuration.clientconfig.scheme) {
    configuration.clientconfig.scheme = 'http';
  }

  if(configuration.clientconfig.connpoolsize != null) {
    BotServiceAgent = new require('http').Agent({ keepAlive: true,maxSockets: configuration.clientconfig.connpoolsize });
  }

  console.log('---client config---');
  console.log(configuration.clientconfig);

  // process server config, and this is used of bot platform to communicate to bot
  if(config.hasOwnProperty("serverconfig")) {    
    configuration.serverconfig = config.serverconfig;     
  } else {
    configuration.serverconfig = {};            
  }
  
  if (!configuration.serverconfig.scheme) {
    configuration.serverconfig.scheme = 'http';
  }

  if (!configuration.serverconfig.port) {
    if (configuration.serverconfig.scheme == 'http') {
      configuration.serverconfig.port = 3000;
    } else {
      configuration.serverconfig.port = 443;
    }
  }

  if (!configuration.serverconfig.webhook) {
    configuration.serverconfig.webhook = '/bot/message'; 
  }

  console.log('---server config---');
  console.log(configuration.serverconfig);

  Botwebserver = express();
  Botwebserver.use(bodyParser.json());
  Botwebserver.use(bodyParser.urlencoded({
    extended: true
  }));

  if (configuration.serverconfig.scheme == 'https') {
    //Server setup https
    const https = require('https');
    const fs = require('fs');
    if (!fs.existsSync(configuration.serverconfig.key) || !fs.existsSync(configuration.serverconfig.cert)) {
      console.log('certificate or key is not present at the specified path');
      process.exit(1);
    }
    const options = {
      key: fs.readFileSync(configuration.serverconfig.key),
      cert: fs.readFileSync(configuration.serverconfig.cert)
    };
    https.createServer(options, Botwebserver).listen(configuration.serverconfig.port, function() {
      console.log('Bot is listening on port: ' + configuration.serverconfig.port);
      if (callback) {
        callback(null, Botwebserver);
      }
    }).on('error',
      function(err) {
        if (err.errno === 'EADDRINUSE') {
          console.log('port is already in use');
          process.exit(1);
        } else if (err.errno === 'EACCES') {
          console.log('requires elevated privileges');
          process.exit(1);
        } else {
          console.log(err);
        }
      });
  } else {
	  Botwebserver.listen(configuration.serverconfig.port, function() {
    console.log('Bot is listening on port: ' + configuration.serverconfig.port);
    if (callback) {
      callback(null, Botwebserver);
    }
  }).on('error',
    function(err) {
      if (err.errno === 'EADDRINUSE') {
        console.log('port is already in use');
        process.exit(1);
      } else if (err.errno === 'EACCES') {
        console.log('requires elevated privileges');
        process.exit(1);
      } else {
        console.log(err);
      }
    });
  }

  configureServiceRoute(Botwebserver);
  authtoken = require('./authtoken')(configuration.botID, configuration.accesstoken, configuration.botservice, configuration.clientconfig, tokenManager);
  authtoken.fetchAccessToken();
}

/*Interface API to register Callback Listener in App for receiving messages*/
ssBotBuilder.prototype.listen = function(event, listener) {
  if (typeof(listener) != 'function') {
    throw new Error('Listener must be a function');
  }
  listeners[event] = listener;
}

/* Interface API to upload file to MAAP cloud storage
  bot can upload local file or file url
*/
ssBotBuilder.prototype.upload = function(fileObject, cb) {
  console.log('---uploadFile---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return;
  }
  
  var message = {};
  console.log('fileType: ' + fileObject.fileType + ' until: ' + fileObject.until + ' fileLocalPath: ' + fileObject.fileLocalPath + ' fileUrl: ' + fileObject.fileUrl);
  
  if (!fileObject.fileType || (!fileObject.fileLocalPath && !fileObject.fileUrl)) {
    cb && cb("missing mandatory values");
    return;
  }

  if (fileObject.fileLocalPath && fileObject.fileUrl) {
    cb && cb("only either fileLocalPath or fileUrl allowed and cannot be both");
    return;
  }

  // if bot does not provide "until", set it as 30 days
  if (!fileObject.until) {
    var ms = new Date().getTime() + (86400000 * 30);
    fileObject.until = new Date(ms);
  }

  var uploadUrl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/files';
  console.log("request url: " + uploadUrl);

  var clientOptions;
  if (fileObject.fileLocalPath) {
    var file = require('fs').createReadStream(fileObject.fileLocalPath);
    clientOptions = {
      url: uploadUrl,
      method: "POST",
      formData: {
        "fileType": fileObject.fileType,
        "until": fileObject.until,
        "fileContent": file
      },
      headers: {
        "Authorization": "Bearer " + authtoken.getAccessToken(),
        "Content-Type": "multipart/form-data"
      }
    };
  } else {
    clientOptions = {
      url: uploadUrl,
      method: "POST",
      formData: {
        "fileType": fileObject.fileType,
        "until": fileObject.until,
        "fileUrl": fileObject.fileUrl
      },
      headers: {
        "Authorization": "Bearer " + authtoken.getAccessToken(),
        "Content-Type": "multipart/form-data"
      }
    };
  }

  if(BotServiceAgent){
    clientOptions.agent = BotServiceAgent;
  }

  if (configuration.clientconfig.scheme == 'https' && configuration.clientconfig.ca != null) {
    clientOptions.agentOptions = {};
    clientOptions.agentOptions.ca = configuration.clientconfig.ca && require('fs').readFileSync(configuration.clientconfig.ca);
  }
  attemptrequest(clientOptions, cb);
}


/*Interface API to send Message in existing Chat
  the msg should be wrapped in a "RCSMessage" object
  */
ssBotBuilder.prototype.reply = function(src, msg, cb) {
  console.log('---reply---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return ;
  }
  msg.messageContact = src.messageContact;
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/messages';
  console.log('SENDING message with body' + JSON.stringify(msg));
  send(msg, requesturl, "POST", cb);
};

/*Interface API to send Unsolicited Message  to User*/
ssBotBuilder.prototype.say = function(dest, msg, cb) {
  console.log('---say---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return ;
  }
  msg.messageContact = dest;
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/messages';
  console.log('SENDING message with body' + JSON.stringify(msg));
  send(msg, requesturl, "POST", cb);
};

/*Interface API to send typing indication*/
ssBotBuilder.prototype.typing = function(dest, value, cb) {
  console.log('---typing---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return ;
  }
  var message = {
    "RCSMessage" : {
      "isTyping": value
    }
  };
  message.messageContact = dest;
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/messages';
  console.log('SENDING message with body' + JSON.stringify(message));
  send(message, requesturl, "POST", cb);
};

/*Interface API to send read report*/
ssBotBuilder.prototype.read = function (msgId, cb) {
  console.log('---read---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return;
  }
  var message = {
    "RCSMessage" : {
      "status": "displayed"
    }
  };
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/messages/' +
    msgId + '/status';
  console.log("request url is " + requesturl + " , message is: " + JSON.stringify(message));
  send(message, requesturl, "PUT", cb);
};

/*Interface API to send revoke*/
ssBotBuilder.prototype.revoke = function (msgId, cb) {
  console.log('---revoke---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return;
  }
  var message = {
    "RCSMessage" : {
      "status": "canceled",
    }
  };
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/messages/' +
    msgId + '/status';
  console.log("request url is " + requesturl + " , message is: " + JSON.stringify(message));
  send(message, requesturl, "PUT", cb);
};

/*Interface API to get message status*/
ssBotBuilder.prototype.msgstatus = function (msgId, cb) {
  console.log('---get msg status---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return;
  }

  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/messages/' +
    msgId + '/status';
  console.log("request url is " + requesturl);
  send(null, requesturl, "GET", cb);
};

/*Interface API to get uploaded file information*/
ssBotBuilder.prototype.fileinfo = function (fileId, cb) {
  console.log('---get file information---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return;
  }

  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/files/' +
    fileId;
  console.log("request url is " + requesturl);
  send(null, requesturl, "GET", cb);
};

/*Interface API to delete uploaded file*/
ssBotBuilder.prototype.deleteFile = function (fileId, cb) {
  console.log('---delete file---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return;
  }

  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/files/' +
    fileId;
  console.log("request url is " + requesturl);
  send(null, requesturl, "DELETE", cb);
};

/*Interface API to query remote contact capability*/
ssBotBuilder.prototype.capability = function (userContact, chatId, cb) {
  console.log('---query capability---');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State");
    return;
  }
  if (!userContact && !chatId) {
    console.log("no contact");
    cb && cb("no contact");
    return;
  }
  if (userContact && chatId) {
    console.log("only one contact allowed");
    cb && cb("only one contact allowed");
    return;
  }
  var requesturl;
  if (userContact) {
    requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/contactCapabilities?userContact=' + userContact;
  } else {
    requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + configuration.apipath + configuration.botID + '/contactCapabilities?chatId=' + chatId;
  }
  console.log("request url is " + requesturl);
  send(null, requesturl, "GET", cb);
};

/*Interface API to read Messages for Specific Keywords of type 'textMessage'(plain text message),
'displayText'(displayText from suggested reply/action) and
'postback' (postback.data from suggested response*/
ssBotBuilder.prototype.handle = function(keywords, event, cb) {
  if (!cb) {
    console.log('Callback is null');
    process.exit(1);
  }
  if (typeof(keywords) == 'string') {
    keywords = [keywords];
  }
  var regkeywords = [];
  if (!store_regexp(keywords, regkeywords)) {
    console.log('Contains Invalid expression');
    process.exit(1);
  }
  var matches_pair = {
    keywords: regkeywords,
    cb: cb
  };
  events[event] = events[event] || [];
  events[event].push(matches_pair);
}

/*Private API to routeMessages*/
var configureServiceRoute = function(webserver) {
  // Handle CORS
  webserver.options(configuration.serverconfig.webhook, cors());

  // logic to handle webhook POST
  webserver.post(configuration.serverconfig.webhook, cors(), function(req, res) {
    var obj = req.body;
    console.log('POST MESSAGE:  ' + JSON.stringify(obj));

    // TODO: Remove follow handling
    if (obj && obj.messageType && (obj.messageType.toLowerCase() == 'follow' || obj.messageType.toLowerCase() == 'unfollow')) {
      console.log('got a follow message');
      var followMessage = {
        botID: obj.botID,
        botNumber: obj.botNumber
      };
      followMessage.message = obj.message;
      followMessage.contacts = obj.contacts;
      listeners['follow'] && listeners['follow'](followMessage);
    }

    // send everything to webhook
    if (obj) {
      set_event_type(obj);
      if (obj.RCSMessage && obj.RCSMessage.textMessage) {
        var text = obj.RCSMessage.textMessage;
        if (!(match_regexp(text, obj, 'textMessage'))) {
          listeners['webhook'] && listeners['webhook'](obj);
        }
      } else if (obj.RCSMessage && obj.RCSMessage.suggestedResponse) {
        var suggestionResponse = obj.RCSMessage.suggestedResponse.response;
        var reply;
        if (suggestionResponse.hasOwnProperty('reply')) {
          reply = suggestionResponse.reply;
        } else if (suggestionResponse.hasOwnProperty('action')) {
          reply = suggestionResponse.action;
        }
        if (!(match_regexp(reply.displayText, obj, 'displayText'))) {
          if (!reply.postback || !(match_regexp(reply.postback.data, obj, 'postback'))) {
            listeners['webhook'] && listeners['webhook'](obj);
          }
        }
      } else {
        listeners['webhook'] && listeners['webhook'](obj);
      }
    }
    res.send('ok');
  });
}

/*Private API to set event type*/
set_event_type = function(message) {
  if (message && !message.event) {
    if (message.RCSMessage) {
      if (message.RCSMessage.textMessage || message.RCSMessage.fileMessage || message.RCSMessage.audioMessage || message.RCSMessage.geolocationPushMessage) {
        message.event = "message";
      } else if (message.RCSMessage.suggestedResponse || message.RCSMessage.sharedData) {
        message.event = "response";
        if (message.RCSMessage.suggestedResponse && message.RCSMessage.suggestedResponse.response.reply && message.RCSMessage.suggestedResponse.response.reply.postback && message.RCSMessage.suggestedResponse.response.reply.postback.data == "new_bot_user_initiation") {
          message.event = "newUser";
        }
      } else if (message.RCSMessage.isTyping) {
        message.event = "isTyping";
      } else if (message.RCSMessage.status) {
        message.event = "messageStatus";
      } else {
        message.event = "unknown";
      }
    } else if (message.file) {
      message.event = "fileStatus";
    } else if (message.messageContact && message.messageContact.userContact && message.messageContact.chatId) {
      message.event = "alias";
    } else {
      message.event = "unknown";
    }
  }
}

/*Private API to store Regexp Objects*/
store_regexp = function(tests, regarr) {
  for (var t = 0; t < tests.length; t++) {
    var test = null;
    if (typeof(tests[t]) == 'string') {
      try {
        test = new RegExp(tests[t], 'gi');
      } catch (err) {
        console.log('Error in Regular expression: ' + tests[t] + ': ' + err);
        return false;
      }
      if (!test) {
        return false;
      }
    } else {
      test = tests[t];
    }
    regarr.push(test);
  }
  return true;
};
/*Private API to check Pattern Matching */
match_regexp = function(text, message, evt) {
  if (events[evt]) {
    var matches_pairarr = events[evt];
    for (var i = 0; i < matches_pairarr.length; i++) {
      var matches_pair = matches_pairarr[i];
      var keywords = matches_pair.keywords || [];
      for (var t = 0; t < keywords.length; t++) {
        var test = keywords[t];
        if (match = text.match(test)) {
          var cb = matches_pair.cb;
          cb && cb(message);
      return true;
        }
      }
    }
  }
  return false;
};


var tokenManager = {
  onNotReady: function() {
    tokenState = false ;
    console.log('not ready now');
    listeners['state'] && listeners['state'](false);
  },
  onReady: function() {
    tokenState = true;
    console.log("ready indication: " + authtoken.getAccessToken());

    listeners['state'] && listeners['state'](true);
  }
}

var attemptrequest = function(opts, cb) {
    var call = backoff.call(request, opts, function(err, res, body) {
      console.log('Num retries: ' + call.getNumRetries() + ":" + err);
      if (err) {
          console.log('Error: ' + err.message);
          cb(err, res);
      } else {
          console.log('Status: ' + res.statusCode);
          cb(err, res, body);
      }
    });

    call.retryIf(function(err) { return true; });
    call.setStrategy(new backoff.ExponentialStrategy());
    call.failAfter(10);
    call.start();
}

/*Private API to send Messages to Bot Service*/
var send = function(msg, requesturl, method, cb) {
  var clientOptions;
  
  if (msg) {
    clientOptions = {
      url: requesturl,
      method: method,
      headers: {
        'Content-type': 'application/json',
        'Authorization': ('Bearer ' + authtoken.getAccessToken())
      },
      json: msg
    };
  } else {
    clientOptions = {
      url: requesturl,
      method: method,
      headers: {
        'Authorization': ('Bearer ' + authtoken.getAccessToken())
      }
    };
  }
  if(BotServiceAgent){
    clientOptions.agent = BotServiceAgent;
  }
  if (configuration.clientconfig.scheme == 'https' && configuration.clientconfig.ca != null) {
    clientOptions.agentOptions = {};
    clientOptions.agentOptions.ca = configuration.clientconfig.ca && require('fs').readFileSync(configuration.clientconfig.ca);
  }

  attemptrequest(clientOptions,cb);
}

module.exports = new ssBotBuilder();
