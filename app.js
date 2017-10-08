var ssbot = require('./ssbotbuilder.js');

var options = {
  port: 3000,
  botID: 'K3K_cmffSn6eBh20gRdjqg',
  accesstoken: 'xIs40Zkf8OfGyn01Dx2RuSTUiSd0aTLHUBtV6rfaz20',
  botservice: 'botplatform.rcscloudconnect.net',
  clientconfig: {
    scheme: 'https',
    connpoolsize: 5
  }
};

ssbot.createService(options, function (err, webserver) {
  if (!err) {
    ssbot.listen('message', OnUserMsg);
    ssbot.listen('disposition', OnDispositionMsg);
    ssbot.listen('state', onStateListener);
    ssbot.listen('location', onLocationMessageListener);
    ssbot.listen('file', onFileMessageListener);
    ssbot.listen('audioMessage', onAudioMessageListener);
    ssbot.listen('sharedData', onSharedDataListener);
  }
});

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

ssbot.read(['richcard'], 'message', handleRichCard);
ssbot.read(['cardcarousel'], 'message', handleCarousel);
ssbot.read(['chiplistmessage'], 'message', handleChiplistMessage);
ssbot.read(['chiplistcard'], 'message', handleChiplistRichcard);
ssbot.read(['chiplistcarousel'], 'message', handleChiplistCarousel);
ssbot.read(['file'], 'message', handleSendFile);
ssbot.read(['yes'], 'displayText', handleYesSuggestedDisplayText);

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
