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

/*Module Declaration*/
var ssBotBuilder = function() {

};

/*Interface API to create WebServer*/
ssBotBuilder.prototype.createService = function(config, callback) {
  configuration = config;
  if(config.hasOwnProperty("serverconfig")) {
    configuration.serverconfig = config.serverconfig
  } else {
    configuration.serverconfig = {};
    configuration.serverconfig.scheme = 'http';
  }
  if(config.hasOwnProperty("clientconfig")) {
    console.log(config.clientconfig);
    configuration.clientconfig = config.clientconfig
  } else {
    configuration.clientconfig = {};
    configuration.clientconfig.scheme = 'http';
  }

  if(configuration.clientconfig.connpoolsize != null) {
    BotServiceAgent = new require('http').Agent({ keepAlive: true,maxSockets: configuration.clientconfig.connpoolsize });
  }

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
    https.createServer(options, Botwebserver).listen(configuration.port, function() {
      console.log('** Bot listening on port ' + configuration.port);
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
  Botwebserver.listen(configuration.port, function() {
    console.log('** Bot listening on port ' + configuration.port);
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
  fileObject :{"fileType":"image/jpg" ,"filePath": "./ft.jpg"}
*/
ssBotBuilder.prototype.uploadFile = function(src, fileObject, cb) {
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State")
    return;
  }
  var message = {};
  console.log('FileType: ' + fileObject.fileType + ' filePath : ' + fileObject.filePath);
  if (fileObject.fileType == '' || fileObject.filePath == '') {
    return cb && cb("Empty params");
  }
  var uploadUrl = configuration.clientconfig.scheme + '://' + configuration.botservice + '/bot/v1/' + configuration.botID + '/files';
  console.log("request url: " + uploadUrl);

  var file = require('fs').createReadStream(fileObject.filePath);
  var clientOptions = {
    url: uploadUrl,
    method: "POST",
    formData: {
      "fileType": fileObject.fileType,
      "file": file
    },
    headers: {
      "Authorization": "Bearer " + authtoken.getAccessToken(),
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };
  if(BotServiceAgent){
    clientOptions.agent = BotServiceAgent;
  }
  if (configuration.clientconfig.scheme == 'https' && configuration.clientconfig.ca != null) {
    clientOptions.agentOptions = {};
    clientOptions.agentOptions.ca = require('fs').readFileSync(configuration.clientconfig.ca);
  }
  attemptrequest(clientOptions, cb);
}

/* Interface API to send File to User
  fileObject :{"thumbnailFileName":"thumbnail.jpg" ,"thumbnailUrl": "url", "thumbnailMIMEType": "image/jpg", "thumbnailFileSize: 12345,
               "fileName":"file.jpg" ,"fileUrl": "url", "fileMIMEType": "image/jpg", "fileSize: 12345}
*/
ssBotBuilder.prototype.sendFile = function (src, fileObject, cb) {
  if (fileObject.fileUrl == '') {
    return cb && cb("File url not provided");
  }
  var message = {
    "RCSMessage" : { }
  };
  message.chatId = src.chatId;
  message.messageContact = src.messageContact;
  message.RCSMessage.fileMessage = fileObject;
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + '/bot/v1/' + configuration.botID + '/messages';
  console.log('SENDING message with body' + JSON.stringify(message));
  send(message, requesturl, "POST", cb);
};

/*Interface API to send Message in existing Chat*/
ssBotBuilder.prototype.reply = function(src, resp, cb) {
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State")
    return ;
  }
  resp.messageContact = src.messageContact;
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + '/bot/v1/' + configuration.botID + '/messages';
  console.log('SENDING message with body' + JSON.stringify(resp));
  send(resp, requesturl, "POST", cb);
};

/*Interface API to send Unsolicited Message  to User*/
ssBotBuilder.prototype.say = function(destUser, appmsg, cb) {
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State")
    return ;
  }
  appmsg.messageContact = {};
  appmsg.messageContact.userContact = destUser.userContact;
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + '/bot/v1/' + configuration.botID + '/messages';
  console.log('SENDING message with body' + JSON.stringify(appmsg));
  send(appmsg, requesturl, "POST", cb);
};

/*Interface API to send typing indication*/
ssBotBuilder.prototype.typing = function(src, value, cb) {
  console.log('TYPING');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State")
    return ;
  }
  var message = {
    "RCSMessage" : {
      "isTyping": value,
    }
  };
  message.messageContact = src.messageContact;
  var requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + '/bot/v1/' + configuration.botID + '/messages';
  console.log('SENDING message with body' + JSON.stringify(message));
  send(message, requesturl, "POST", cb);
};

/*Interface API to send read report*/
ssBotBuilder.prototype.readReport = function (src, cb) {
  console.log('Sending Read Report');
  if (!tokenState) {
    console.log("Bot Server is not in ready State");
    cb && cb("Bot Server is not in ready State")
    return;
  }
  var message = {
    "status": "Displayed"
  }
  requesturl = configuration.clientconfig.scheme + '://' + configuration.botservice + '/bot/v1/' + configuration.botID + '/messages/' +
    src.RCSMessage.msgId + '/status';
  console.log("request url is " + requesturl + " , message is: " + JSON.stringify(message));
  send(message, requesturl, "PUT", cb);
};

var fillSuggestions = function(msg) {
  var suggestions = [];
  if (msg.hasOwnProperty("replies")) {
    msg.replies.forEach(function(element) {
      var suggestion = {};
      suggestion.reply = {
        "displayText": element.displayText
      };
      if (element.hasOwnProperty("postback")) {
        suggestion.reply.postback = element.postback;
      }
      suggestions.push(suggestion);
    })
  }
  if (msg.hasOwnProperty("actions")) {
    msg.actions.forEach(function(action) {
      var suggestion = {};
      if (action.type == "url") {
        suggestion.action = {
          "urlAction": {
              "openUrl": {
                "url": action.url
              }
          }
        };
      } else if (action.type == "dialer") {
        if (action.dialerAction == "audio") {
          suggestion.action = {
            "dialerAction": {
              "dialPhoneNumber": {
                "phoneNumber": action.phoneNumber
              }
            }
          };
        } else if (action.dialerAction == "enriched") {
          suggestion.action = {
            "dialerAction": {
              "dialEnrichedCall": {
                "phoneNumber": action.phoneNumber,
                "subject": action.subject,
                "fallbackUrl": action.fallbackUrl
              }
            }
          };
        } else if (action.dialerAction == "video") {
          suggestion.action = {
            "dialerAction": {
              "dialVideoCall": {
                "phoneNumber": action.phoneNumber,
                "fallbackUrl": action.fallbackUrl
              }
            }
          };
        }
      } else if (action.type == "map") {
        if (action.mapAction == "show") {
          suggestion.action = {};
          suggestion.action.mapAction = {
            "showLocation": {
              "location": {
                "latitude": action.latitude,
                "longitude": action.longitude,
                "label": action.label
              },
              "fallbackUrl": action.fallbackUrl
            }
          };
        } else if (action.mapAction == "query") {
          suggestion.action = {};
          suggestion.action.mapAction = {
            "showLocation": {
              "location": {
                "query": action.query
              },
              "fallbackUrl": action.fallbackUrl
            }
          };
        } else if (action.mapAction == "push") {
          suggestion.action = {};
          suggestion.action.mapAction = {
            "requestLocationPush": {
              "title": action.title,
            }
          };
        }
      } else if (action.type == "calendar") {
        suggestion.action = {};
        suggestion.action.calendarAction = {
          "createCalendarEvent": {
            "title": action.title,
            "startTime": action.startTime,
            "endTime": action.endTime,
            "description": action.description,
            "fallbackUrl": action.fallbackUrl
          }
        };
      } else if (action.type == "compose") {
        if (action.composeAction == "message") {
          suggestion.action = {};
          suggestion.action.composeAction = {
            "composeTextMessage": {
              "title": action.title,
              "phoneNumber": action.phoneNumber,
              "text" : action.text
            }
          };
        } else if (action.composeAction == "recording") {
          suggestion.action = {};
          suggestion.action.composeAction = {
            "composeRecordingMessage": {
              "title": action.title,
              "phoneNumber": action.phoneNumber,
              "type" : action.recordingType
            }
          };
        }
      } else if (action.type == "device") {
        suggestion.action = {};
        suggestion.action.deviceAction = {
          "requestDeviceSpecifics": {
            "title": action.title
          }
        };
      } else if (action.type == "settings") {
        if (action.settingsAction == "disableAnonymize") {
          suggestion.action = {};
          suggestion.action.settingsAction = {
            "disableAnonymization": {
              title: action.title
            }
          };
        } else if (action.settingsAction == "enableNotifications") {
          suggestion.action = {};
          suggestion.action.settingsAction = {
            "enableDisplayedNotifications": {
              title: action.title
            }
          };
        }
      }
      suggestion.action.displayText = action.displayText;
      if (action.hasOwnProperty("postback")) {
          suggestion.action.postback = action.postback;
        }
      //console.log("suggestion : " + JSON.stringify(suggestion));
      suggestions.push(suggestion)
    })
  }
  return suggestions;
}

var fillRichCardContent = function(msg) {
  var response = {};
  var message = {};
  var layout = {};
  var content = {};
  var media = {};
  message.generalPurposeCard = {};
  layout.cardOrientation = msg.layout.cardOrientation.toUpperCase();
  if (layout.cardOrientation == "HORIZONTAL") {
    layout.imageAlignment = msg.layout.imageAlignment.toUpperCase();
  }
  message.generalPurposeCard.layout = layout;
  message.generalPurposeCard.content = content;
  //Fill Title
  if (msg.content.hasOwnProperty("title")) {
    content.title = msg.content.title;
  }
  //Fill Description
  if (msg.content.hasOwnProperty("description")) {
    content.description = msg.content.description;
  }
  //Fill Media
  if (msg.content.hasOwnProperty("media")) {
    //validate the mandatory params
    if (!(msg.content.media.hasOwnProperty("mediaUrl")) &&
      !(msg.content.media.hasOwnProperty("mediaContenttype")) &&
      !(msg.content.media.hasOwnProperty("mediaFileSize")) &&
      !(msg.content.media.hasOwnProperty("height"))) {
      console.log("template is not compliant")
      return;
    }
    if (msg.content.hasOwnProperty("thumbnailUrl") &&
      !(msg.content.media.hasOwnProperty("thumbnailContentType")) &&
      !(msg.content.media.hasOwnProperty("thumbnailFileSize"))) {
      console.log("thubnail information is not provided")
      return;
    }
    media = msg.content.media;
    content.media = media;
    //console.log(JSON.stringify(message));
  }
  //0-* no. of suggested replies.
  var suggestions = fillSuggestions(msg.content);

  if (suggestions.length != 0) {
    message.generalPurposeCard.content.suggestions = suggestions;
  }
  response.message = message;
  return response;
}
var fillRichCardCarouselContent = function(msg) {
  var response = {};
  var message = {};
  var contents = [];
  message.generalPurposeCardCarousel = {};
  message.generalPurposeCardCarousel.layout = {
    "cardWidth": msg.layout.width
  }
  message.generalPurposeCardCarousel.content = contents;
  msg.content.forEach(function(elem) {
    var cardContent = {};
    //Fill Title
    if (elem.hasOwnProperty("title")) {
      cardContent.title = elem.title;
    }
    //Fill Description
    if (elem.hasOwnProperty("description")) {
      cardContent.description = elem.description;
    }
    //Fill Media
    if (elem.hasOwnProperty("media")) {
      //validate the mandatory params
      if (!(elem.media.hasOwnProperty("mediaUrl")) &&
        !(elem.media.hasOwnProperty("mediaContenttype")) &&
        !(elem.media.hasOwnProperty("mediaFileSize")) &&
        !(elem.media.hasOwnProperty("height"))) {
        console.log("template is not compliant")
        return;
      }
      if (elem.media.hasOwnProperty("thumbnailUrl") &&
        !(elem.media.hasOwnProperty("thumbnailContentType")) &&
        !(elem.media.hasOwnProperty("thumbnailFileSize"))) {
        console.log("thubnail information is not provided")
        return;
      }
      cardContent.media = elem.media;
    }
    //Fill Selected Reply
    if (elem.hasOwnProperty("selectedreply")) {
      cardContent.cardSelectedReply = {
        "reply": elem.selectedreply
      }
    }
    //0-* no. of suggested replies.
    var suggestions = fillSuggestions(elem);
    if (suggestions.length != 0) {
      cardContent.suggestions = suggestions;
    }
    contents.push(cardContent);
  })
  response.message = message;
  return response;
}

/*Private API to fill messsage Content*/
var fillMessageContent = function(msg, resp) {
  console.log(JSON.stringify(resp));
  if (typeof resp == 'string') {
    msg.contentType = 'text/plain';
    msg.text = resp;
  } else if(resp.type == 'botmessage'){
    msg.contentType = 'application/vnd.gsma.botmessage.v1.0+json';
    if (resp.carousel == true) { //carousel format
      msg.text = fillRichCardCarouselContent(resp);
    } else {
      msg.text = fillRichCardContent(resp);
    }
  } else if(resp.type == 'botsuggestion'){
    msg.suggestions = fillSuggestions(resp);
    msg.persistent = resp.persistent;
    if (resp.text) {
      msg.contentType = 'text/plain';
      msg.text = resp.text;
    } else if (resp.richCard) {
      msg.contentType = 'application/vnd.gsma.botmessage.v1.0+json';
      if (resp.richCard.carousel == true) { //carousel format
        msg.text = fillRichCardCarouselContent(resp.richCard);
      } else {
        msg.text = fillRichCardContent(resp.richCard);
      }
    }
  }
}

/*Private API to routeMessages*/
var configureServiceRoute = function(webserver) {
  // Handle CORS
  webserver.options('/bot/message', cors());

  // Handle bot publish request
  webserver.get('/bot/message', function(req, res) {
    console.log('handle publish bot message');
    var params = new Array(configuration.TOKEN, req.query.timestamp, req.query.nonce);
    params.sort();
    var concatParams = params.join('');
    //  console.log("sign:" + req.query.signature);
    var hash = require('crypto').createHash('sha1').update(concatParams).digest('base64');
    if (hash.localeCompare(hash) === 0) {
      console.log('Bot Publish Success');
      res.writeHead(200, {
        "Content-Type": "text/plain"
      });
      res.end(req.query.echo);
    } else {
      console.log('Bot Publish Failed');
      res.writeHead(401, {
        "Content-Type": "text/plain"
      });
      res.end("Unauthorized request");
    }
  });
  webserver.post('/bot/message', cors(), function(req, res) {
    var obj = req.body;
    console.log('GOT A POST MESSAGE :  ' + JSON.stringify(obj));
    if (obj && obj.RCSMessage) {
      var message = {};
      message.messageContact = obj.messageContact;
      message.RCSMessage = obj.RCSMessage;

      if (message.RCSMessage.textMessage) {
        message.text = message.RCSMessage.textMessage;
        if (!(match_regexp(message, 'message'))) {
          if(listeners['message']) {
            listeners['message'](message);
          } else {
            console.log('listener not defined');
          }
        }
      } else if (message.RCSMessage.suggestedResponse) {
        var suggestionResponse = message.RCSMessage.suggestedResponse.response;
        if (suggestionResponse.hasOwnProperty('reply')) {
          message.text = suggestionResponse.reply.displayText;
        } else if (suggestionResponse.hasOwnProperty('action')) {
          message.text = suggestionResponse.action.displayText;
        }
        if (!(match_regexp(message, 'displayText'))) {
          listeners['message'] && listeners['message'](message);
        }
      } else if (obj.RCSMessage.status) {
        listeners['disposition'] && listeners['disposition'](message);
      } else if (obj.RCSMessage.geolocationPushMessage) {
        listeners['location'] && listeners['location'](message);
      } else if (obj.RCSMessage.fileMessage) {
        listeners['file'] && listeners['file'](message);
      } else if (obj.RCSMessage.audioMessage) {
        listeners['audioMessage'] && listeners['audioMessage'](message);
      } else if (obj.RCSMessage.sharedData) {
        listeners['sharedData'] && listeners['sharedData'](message);
      }
    } else {
      console.log('Got an empty message from Samsung Bot Service');
    }
    res.send('ok');
  });
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
match_regexp = function(message, evt) {
  if (events[evt]) {
    var matches_pairarr = events[evt];
    for (var i = 0; i < matches_pairarr.length; i++) {
      var matches_pair = matches_pairarr[i];
      var keywords = matches_pair.keywords || [];
      for (var t = 0; t < keywords.length; t++) {
        var test = keywords[t];
        if (match = message.text.match(test)) {
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
  var clientOptions = {
    url: requesturl,
    method: method,
    headers: {
      'Content-type': 'application/json',
      'Authorization': ('Bearer ' + authtoken.getAccessToken())
    },
    json: msg
  };
  if(BotServiceAgent){
    clientOptions.agent = BotServiceAgent;
  }
  if (configuration.clientconfig.scheme == 'https' && configuration.clientconfig.ca != null) {
    clientOptions.agentOptions = {};
    clientOptions.agentOptions.ca = require('fs').readFileSync(configuration.clientconfig.ca);
  }

  attemptrequest(clientOptions,cb);
}

/*Interface API to read Messages for Specific Keywords of type 'message'(plain text message)
 and 'displayText'(displayText from suggested reply/action)*/
ssBotBuilder.prototype.read = function(keywords, event, cb) {
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
module.exports = new ssBotBuilder();
