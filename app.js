var ssbot = require('./ssbotbuilder.js');
var fs = require("fs");

var options = {  
  botID: 'otDmWxrJS4aRPYLQNrLLJg',
  accesstoken: 'su3JwlKUZXlU_ErSrgt1Vc9oDSo9vbt7RpJBNr_sl2g',
  botservice: 'pue1-maap1elb-apigw-1295337022.us-east-1.elb.amazonaws.com',
  apipath: '/bot/v1/',
  clientconfig: {
    scheme: 'http',
    connpoolsize: 10
  },
  serverconfig: {
    scheme: 'http',
    port: 3000,
    webhook: '/callback'
  }
};

ssbot.createService(options, function (err, webserver) {
  if (!err) {
    ssbot.listen('state', onStateListener);
    //ssbot.listen('follow',OnSubscribeMsg);
    ssbot.listen('webhook', onWebhookMessage);
  }
});

var onWebhookMessage = function (message) {
  console.log("+++webhook callback received+++\n" + JSON.stringify(message));
  var reply;  
  
  if (!message) {
    console.log("!!!empty message!!!");
    return;
  }

  if (message.event == "newUser") {
    reply = JSON.parse(fs.readFileSync("res/json/text_hello.json"));
  } else if (message.event == "message") {
      ssbot.read(message.RCSMessage.msgId, onResponse);
      ssbot.typing(message.messageContact, "active", onResponse);
      reply = JSON.parse(fs.readFileSync("res/json/text_default.json"));
      ssbot.reply(message, reply, onResponse);
  } else if (message.event == "response") {
  } else if (message.event == "isTyping") {
  } else if (message.event == "messageStatus") {
  } else if (message.event == "fileStatus") {
  } else if (message.event == "alias") {
  } else {
    ssbot.read(message.RCSMessage.msgId, onResponse);
    ssbot.typing(message.messageContact, "active", onResponse);
    reply = JSON.parse(fs.readFileSync("res/json/text_default.json"));
    ssbot.reply(message, reply, onResponse);
  }
}

ssbot.handle(['menu_basic'], 'postback', handle_menu_basic);
ssbot.handle(['menu_10776'], 'postback', handle_menu_10776);

var handle_menu_basic = function (message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
}

var handle_menu_10776 = function (message) {
}

var onResponse = function (err, res, body) {
  if (err) {
    console.log("err:"+err.message);
  }
  if (res) {
    console.log("statusCode:"+res.statusCode);
    console.log("statusMessage:"+res.statusMessage);
  }
  if (body) {
    console.log("body:"+JSON.stringify(body));
  }
}

var onStateListener = function (state, reason) {
  if (!state) {
    console.log('Cannot send any message all messages should be buffered now ' + reason);
  } else {
    console.log("Bot is working correctly");
  }
}

var onLocationMessageListener = function (message) {
  console.log("User location received : " + JSON.stringify(message.RCSMessage.geolocationPushMessage));
}

var onFileMessageListener = function (message) {
  console.log("File received : " + JSON.stringify(message.RCSMessage.fileMessage));
}

var OnDispositionMsg = function (message) {
  console.log("Disposition Message : " + message.RCSMessage.status);
}

var onAudioMessageListener = function (message) {
  console.log("Audio Message : " + JSON.stringify(message.RCSMessage.audioMessage));
}

var onSharedDataListener = function (message) {
  console.log("Shared Data from device : " + JSON.stringify(message.RCSMessage.sharedData));
}

var handleRichCard = function (message) {
  var reply = {
    "RCSMessage": {
      "richcardMessage": {
        "message": {
          "generalPurposeCard": {
            "layout": {
              "cardOrientation": "HORIZONTAL",
              "imageAlignment": "LEFT"
            },
            "content": {
              "title": "Hi",
              "description": "This is a sample rich card.",
              "media": {
                "mediaUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "mediaContentType": "image/png",
                "mediaFileSize": 62329,
                "thumbnailUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "thumbnailContentType": "image/png",
                "thumbnailFileSize": 62329,
                "height": "SHORT_HEIGHT",
                "contentDescription": "Textual description of media content"
              },
              "suggestions": [{
                "reply": {
                  "displayText": "Yes",
                  "postback": {
                    "data": "set_by_chatbot_reply_yes"
                  }
                }
              },
              {
                "reply": {
                  "displayText": "No",
                  "postback": {
                    "data": "set_by_chatbot_reply_no"
                  }
                }
              },
              {
                "action": {
                  "urlAction": {
                    "openUrl": {
                      "url": "https://maap.rcscloudconnect.net"
                    }
                  },
                  "displayText": "Samsung MAAP",
                  "postback": {
                    "data": "set_by_chatbot"
                  }
                }
              },
              {
                "action": {
                  "dialerAction": {
                    "dialPhoneNumber": {
                      "phoneNumber": "+1650253000"
                    }
                  },
                  "displayText": "Call a phone number",
                  "postback": {
                    "data": "set_by_chatbot_dial_phone_number"
                  }
                }
              },
              {
                "action": {
                  "composeAction": {
                    "composeTextMessage": {
                      "phoneNumber": "+1650253000",
                      "text": "Draft to go into the send message text field."
                    }
                  },
                  "displayText": "Draft a text message",
                  "postback": {
                    "data": "set_by_chatbot_compose_text_message"
                  }
                }
              },
              {
                "action": {
                  "mapAction": {
                    "showLocation": {
                      "location": {
                        "latitude": 37.4220041,
                        "longitude": -122.0862515,
                        "label": "GooglePlex"
                      },
                      "fallbackUrl": "https://www.google.com/maps/@37.4219162,-122.078063,15z"
                    }
                  },
                  "displayText": "Show location on a map",
                  "postback": {
                    "data": "set_by_chatbot_show_location"
                  }
                }
              },
              {
                "action": {
                  "calendarAction": {
                    "createCalendarEvent": {
                      "title": "Meeting",
                      "startTime": "2017-03-14T00:00:00Z",
                      "endTime": "2017-03-14T23:59:59Z",
                      "description": "GSG review meeting"
                    }
                  },
                  "displayText": "Schedule Meeting",
                  "postback": {
                    "data": "set_by_chatbot_create_calendar_event"
                  }
                }
              },
              {
                "action": {
                  "deviceAction": {
                    "requestDeviceSpecifics": {
                      "title": "Request specifics about the user's device."
                    }
                  },
                  "displayText": "Request device specifics",
                  "postback": {
                    "data": "set_by_chatbot_request_device_specifics"
                  }
                }
              },
              {
                "action": {
                  "settingsAction": {
                    "disableAnonymization": {

                    }
                  },
                  "displayText": "Share your phone number",
                  "postback": {
                    "data": "set_by_chatbot_disable_anonymization"
                  }
                }
              },
              {
                "action": {
                  "settingsAction": {
                    "enableDisplayedNotifications": {

                    }
                  },
                  "displayText": "Send read receipts",
                  "postback": {
                    "data": "set_by_chatbot_enable_displayed_notifications"
                  }
                }
              }]
            }
          }
        }
      }
    }
  };
  ssbot.reply(message, reply, function (err, res, body) {
    if (err || res.statusCode != 200)
      console.log('Error sending reply');
    else
      console.log('Send Message response: ' + JSON.stringify(body));
  });
}

var handleCarousel = function (message) {
  var reply = {
    "RCSMessage": {
      "richcardMessage": {
        "message": {
          "generalPurposeCardCarousel": {
            "layout": {
              "cardWidth": "SMALL_WIDTH"
            },
            "content": [{
              "title": "Hi",
              "description": "This is a rich card carousel.",
              "media": {
                "mediaUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "mediaContentType": "image/png",
                "mediaFileSize": 62329,
                "thumbnailUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "thumbnailContentType": "image/png",
                "thumbnailFileSize": 62329,
                "height": "SHORT_HEIGHT",
                "contentDescription": "Textual description of media content"
              },
              "suggestions": [{
                "reply": {
                  "displayText": "Yes",
                  "postback": {
                    "data": "set_by_chatbot_reply_yes"
                  }
                }
              },
              {
                "reply": {
                  "displayText": "No",
                  "postback": {
                    "data": "set_by_chatbot_reply_no"
                  }
                }
              }]
            },
            {
              "title": "Hi",
              "description": "This is a rich card carousel.",
              "media": {
                "mediaUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "mediaContentType": "image/png",
                "mediaFileSize": 62329,
                "thumbnailUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "thumbnailContentType": "image/png",
                "thumbnailFileSize": 62329,
                "height": "SHORT_HEIGHT",
                "contentDescription": "Textual description of media content"
              },
              "suggestions": [{
                "action": {
                  "urlAction": {
                    "openUrl": {
                      "url": "https://maap.rcscloudconnect.net"
                    }
                  },
                  "displayText": "Samsung MAAP",
                  "postback": {
                    "data": "https://maap.rcscloudconnect.net"
                  }
                }
              },
              {
                "action": {
                  "dialerAction": {
                    "dialPhoneNumber": {
                      "phoneNumber": "+1650253000"
                    }
                  },
                  "displayText": "Call a phone number",
                  "postback": {
                    "data": "set_by_chatbot_dial_phone_number"
                  }
                }
              }]
            }]
          }
        }
      }
    }
  };
  ssbot.reply(message, reply, function (err, res, body) {
    if (err || res.statusCode != 200)
      console.log('Error sending reply');
    else
      console.log('Send Message response: ' + JSON.stringify(body));
  });
}

var handleChiplistMessage = function (message) {
  var reply = {
    "RCSMessage": {
      "textMessage": "sample text message",
      "suggestedChipList": {
        "suggestions": [{
          "reply": {
            "displayText": "Yes",
            "postback": {
              "data": "set_by_chatbot_reply_yes"
            }
          }
        },
        {
          "reply": {
            "displayText": "No",
            "postback": {
              "data": "set_by_chatbot_reply_no"
            }
          }
        }]
      }
    }
  };
  ssbot.reply(message, reply, function (err, res, body) {
    if (err || res.statusCode != 200)
      console.log('Error sending reply');
    else
      console.log('Send Message response: ' + JSON.stringify(body));
  });
}

var handleChiplistRichcard = function (message) {
  var reply = {
    "RCSMessage": {
      "richcardMessage": {
        "message": {
          "generalPurposeCard": {
            "layout": {
              "cardOrientation": "HORIZONTAL",
              "imageAlignment": "LEFT"
            },
            "content": {
              "title": "Hi",
              "description": "This is a sample rich card.",
              "media": {
                "mediaUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "mediaContentType": "image/png",
                "mediaFileSize": 62329,
                "thumbnailUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "thumbnailContentType": "image/png",
                "thumbnailFileSize": 62329,
                "height": "SHORT_HEIGHT",
                "contentDescription": "Textual description of media content"
              }
            }
          }
        }
      },
      "suggestedChipList": {
        "suggestions": [{
          "reply": {
            "displayText": "Yes",
            "postback": {
              "data": "set_by_chatbot_reply_yes"
            }
          }
        },
        {
          "reply": {
            "displayText": "No",
            "postback": {
              "data": "set_by_chatbot_reply_no"
            }
          }
        }]
      }
    }
  };
  ssbot.reply(message, reply, function (err, res, body) {
    if (err || res.statusCode != 200)
      console.log('Error sending reply');
    else
      console.log('Send Message response: ' + JSON.stringify(body));
  });
}

var handleChiplistCarousel = function (message) {
  var reply = {
    "RCSMessage": {
      "richcardMessage": {
        "message": {
          "generalPurposeCardCarousel": {
            "layout": {
              "cardWidth": "SMALL_WIDTH"
            },
            "content": [{
              "title": "Hi",
              "description": "This is a rich card carousel.",
              "media": {
                "mediaUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "mediaContentType": "image/png",
                "mediaFileSize": 62329,
                "thumbnailUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "thumbnailContentType": "image/png",
                "thumbnailFileSize": 62329,
                "height": "SHORT_HEIGHT",
                "contentDescription": "Textual description of media content"
              },
              "suggestions": [{
                "reply": {
                  "displayText": "Yes",
                  "postback": {
                    "data": "set_by_chatbot_reply_yes"
                  }
                }
              },
              {
                "reply": {
                  "displayText": "No",
                  "postback": {
                    "data": "set_by_chatbot_reply_no"
                  }
                }
              }]
            },
            {
              "title": "Hi",
              "description": "This is a rich card carousel.",
              "media": {
                "mediaUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "mediaContentType": "image/png",
                "mediaFileSize": 62329,
                "thumbnailUrl": "https://s3-us-west-2.amazonaws.com/samsung-chatbot-store/public/mwc-att-demo/st_demo_16x10.jpg",
                "thumbnailContentType": "image/png",
                "thumbnailFileSize": 62329,
                "height": "SHORT_HEIGHT",
                "contentDescription": "Textual description of media content"
              },
              "suggestions": [{
                "action": {
                  "urlAction": {
                    "openUrl": {
                      "url": "https://maap.rcscloudconnect.net"
                    }
                  },
                  "displayText": "Samsung MAAP",
                  "postback": {
                    "data": "https://maap.rcscloudconnect.net"
                  }
                }
              },
              {
                "action": {
                  "dialerAction": {
                    "dialPhoneNumber": {
                      "phoneNumber": "+1650253000"
                    }
                  },
                  "displayText": "Call a phone number",
                  "postback": {
                    "data": "set_by_chatbot_dial_phone_number"
                  }
                }
              }]
            }]
          }
        }
      },
      "suggestedChipList": {
        "suggestions": [{
          "reply": {
            "displayText": "Yes",
            "postback": {
              "data": "set_by_chatbot_reply_yes"
            }
          }
        },
        {
          "reply": {
            "displayText": "No",
            "postback": {
              "data": "set_by_chatbot_reply_no"
            }
          }
        }]
      }
    }
  };
  ssbot.reply(message, reply, function (err, res, body) {
    if (err || res.statusCode != 200)
      console.log('Error sending reply');
    else
      console.log('Send Message response: ' + JSON.stringify(body));
  });
}

var handleYesSuggestedDisplayText = function (message) {
  console.log("Suggested Response " + JSON.stringify(message.RCSMessage.suggestedResponse));
}

var handleSendFile = function (message) {
  var fileObject = { "fileType": "image/jpg", "filePath": "./demo.jpg" };
  ssbot.uploadFile(message, fileObject, function (err, resp, body) {
    if (err  || resp.statusCode != 202)
      console.log('Error upload file');
    else {
      console.log("File upload url: " + body);
      var uploadFileInfo = JSON.parse(body);
      var fileInfo = { "fileUrl": uploadFileInfo.file.fileUrl };
      fileInfo.fileSize = uploadFileInfo.file.fileSize;
      fileInfo.fileMIMEType = fileObject.fileType;
      ssbot.sendFile(message, fileInfo, function (err, res, body) {
        if (err || res.statusCode != 200)
          console.log('Error sending file');
        else
          console.log('Send File response: ' + JSON.stringify(body));
      })
    }
  })
}

ssbot.handle(['richcard'], 'message', handleRichCard);
ssbot.handle(['cardcarousel'], 'message', handleCarousel);
ssbot.handle(['chiplistmessage'], 'message', handleChiplistMessage);
ssbot.handle(['chiplistcard'], 'message', handleChiplistRichcard);
ssbot.handle(['chiplistcarousel'], 'message', handleChiplistCarousel);
ssbot.handle(['file'], 'message', handleSendFile);
ssbot.handle(['yes'], 'displayText', handleYesSuggestedDisplayText);

var OnUserMsg = function (message) {
  console.log("User message received \"" + JSON.stringify(message.RCSMessage));

  //send typing notification
  ssbot.typing(message, "Active", function (err, res, body) {
    if (err || res.statusCode != 200)
      console.log('Error sending IsTyping');
  });

  //send read report
  setTimeout(function () {
    ssbot.readReport(message, function (err, res, body) {
      if (err || res.statusCode != 204)
        console.log('Error sending read report');
    })
  }, 1000);

  //send response
  var response = {
    "RCSMessage": {
      "textMessage": "Hi, I received your message. This is a Reply"
    }
  }
  ssbot.reply(message, response, function (err, res, body) {
    if (err || res.statusCode != 200)
      console.log('Error sending reply');
    else
      console.log('Send Message response: ' + JSON.stringify(body));
  });
}
