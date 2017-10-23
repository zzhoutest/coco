require('log-timestamp');
var ssbot = require('./ssbotbuilder.js');
var fs = require("fs");
var simpletext = require('./res/json/textlist.json');
var options = require('./options.json');
var crypto = require("crypto");
var chips = require('./res/json/chips.json');
var postbacks = require('./res/json/postbacks.json');
var files = require('./res/json/files.json');
var layouts = require('./res/json/layouts.json');
var cardmedias = require('./res/json/cardmedias.json');

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
    reply = ssbot.newTextMessage(simpletext.hello);
  } else if (message.event == "message") {
      handle_event_message(message);
  } else if (message.event == "response") {
      handle_reply_start_over(message);
  } else if (message.event == "isTyping") {
  } else if (message.event == "messageStatus") {
  } else if (message.event == "fileStatus") {
  } else if (message.event == "alias") {
  } else if (message.RCSMessage && message.RCSMessage.msgId){
    handle_reply_start_over(message);
  } else if (message.messageContact && message.messageContact.userContact) {
    reply = ssbot.newTextMessage(simpletext.hello);
    ssbot.say(message.messageContact, reply, onResponse);
  }
}

var handle_event_message = function(message) {
  var reply;
  if (message && message.RCSMessage && (message.RCSMessage.fileMessage || message.RCSMessage.audioMessage || message.RCSMessage.geolocationPushMessage)) {
    if (message.RCSMessage.fileMessage) {
      handle_test_send_file_to_coco(message);
    }
  } else {
    handle_reply_start_over(message);
  }
}

var handle_reply_start_over = function (message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage(simpletext.default);
  var r1 = ssbot.newReply(simpletext.test_10776, postbacks.test_10776);
  var r2 = ssbot.newReply(simpletext.test_advanced, postbacks.test_advanced);
  var suggestions = ssbot.newSuggestions(r1, r2);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_advanced = function (message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  
  var reply = ssbot.newTextMessage(simpletext.what_to_test);
  var r1 = ssbot.newReply(simpletext.test_message, postbacks.test_message);
  var r2 = ssbot.newReply(simpletext.test_richcard, postbacks.test_richcard_adv);
  var r3 = ssbot.newReply(simpletext.test_api, postbacks.test_api);
  var suggestions = ssbot.newSuggestions(r1, r2, r3);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_10776 = function (message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  
  var reply = ssbot.newTextMessage(simpletext.what_to_test);
  var r1 = ssbot.newReply(simpletext.test_bot_interaction, postbacks.test_bot_interaction);
  var r2 = ssbot.newReply(simpletext.test_richcard, postbacks.test_richcard_10776);
  var r3 = ssbot.newReply(simpletext.test_chiplist, postbacks.test_chiplist);
  var suggestions = ssbot.newSuggestions(r1, r2, r3);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_bot_interaction = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage(simpletext.what_to_test);
  var r1 = ssbot.newReply(simpletext.test_send_msg_to_coco, postbacks.test_send_msg_to_coco);
  var r2 = ssbot.newReply(simpletext.test_receive_msg_from_coco, postbacks.test_receive_msg_from_coco);
  var suggestions = ssbot.newSuggestions(r1, r2);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_send_msg_to_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage(simpletext.what_msg_to_send);
  var r1 = ssbot.newReply(simpletext.test_send_text_to_coco, postbacks.test_send_text_to_coco);
  var r2 = ssbot.newReply(simpletext.test_send_file_to_coco, postbacks.test_send_file_to_coco);
  var suggestions = ssbot.newSuggestions(r1, r2);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_receive_msg_from_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage(simpletext.what_msg_to_receive);
  var r1 = ssbot.newReply(simpletext.test_receive_short_text_from_coco, postbacks.test_receive_short_text_from_coco);
  var r2 = ssbot.newReply(simpletext.test_receive_long_text_from_coco, postbacks.test_receive_long_text_from_coco);
  var r3 = ssbot.newReply(simpletext.test_receive_image_from_coco, postbacks.test_receive_image_from_coco);
  var r4 = ssbot.newReply(simpletext.test_receive_audio_from_coco, postbacks.test_receive_audio_from_coco);
  var r5 = ssbot.newReply(simpletext.test_receive_video_from_coco, postbacks.test_receive_video_from_coco);
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_send_text_to_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  var reply = ssbot.newTextMessage(simpletext.send_text_to_coco);
  ssbot.reply(message, reply, onResponse);
}

var handle_test_read_receipt = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);  
  var reply;
  if (message.RCSMessage.textMessage.length < 1024) {
    reply = ssbot.newTextMessage(simpletext.test_read_receipt);
    var r1 = ssbot.newReply(simpletext.test_send_text_to_coco, postbacks.test_send_text_to_coco);
    var r2 = ssbot.newReply(simpletext.test_send_file_to_coco, postbacks.test_send_file_to_coco);
    var r3 = chips.start_over;
    var suggestions = ssbot.newSuggestions(r1, r2, r3);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else {
    reply = ssbot.newTextMessage(simpletext.send_text_to_coco_too_long);
  }
  ssbot.reply(message, reply, onResponse);
}

var handle_test_no_read_receipt = function(message) {  
  var reply;
  if (message.RCSMessage.textMessage.length >= 1024) {
    reply = ssbot.newTextMessage(simpletext.test_no_read_receipt);
    var r1 = ssbot.newReply(simpletext.test_send_text_to_coco, postbacks.test_send_text_to_coco);
    var r2 = ssbot.newReply(simpletext.test_send_file_to_coco, postbacks.test_send_file_to_coco);
    var r3 = chips.start_over;
    var suggestions = ssbot.newSuggestions(r1, r2, r3);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else {
    reply = ssbot.newTextMessage(simpletext.send_text_to_coco_not_long_enough);
  }
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_send_file_to_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  var reply = ssbot.newTextMessage(simpletext.select_file);
  ssbot.reply(message, reply, onResponse);
}

var handle_test_send_file_to_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  var reply = ssbot.newTextMessage(simpletext.received_file);
  ssbot.reply(message, reply, onResponse);
  
  reply = {
    "RCSMessage": {
      "fileMessage": "",      
    }
  };
  
  reply.RCSMessage.fileMessage = message.RCSMessage.fileMessage;    
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_receive_text_from_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;  
  var ran;
  var str;
  if (pb == postbacks.test_receive_short_text_from_coco) {
    //ran = Math.floor(Math.random() * (512 - 1)) + 1;
    str = generateRandomString(1, 512);        
  } else if (pb == postbacks.test_receive_long_text_from_coco) {
    //ran = Math.floor(Math.random() * (1024 - 512)) + 512;    
    str = generateRandomString(512, 1024);
  }
  var reply = ssbot.newTextMessage("I am sending " + ran * 2 + " bytes text to you.");
  ssbot.reply(message, reply, onResponse);
  reply = ssbot.newTextMessage(str);
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_receive_file_from_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;  
  
  var reply; 
  if (pb == postbacks.test_receive_image_from_coco) {
    reply = ssbot.newTextMessage(simpletext.receive_image_file);
    ssbot.reply(message, reply, onResponse);
    reply = ssbot.newFileMessageByObject(files.image_coco); 
    //reply = JSON.parse(fs.readFileSync("res/json/file_image.json"));         
  } else if (pb == postbacks.test_receive_audio_from_coco) {
    reply = ssbot.newTextMessage(simpletext.receive_audio_file);
    ssbot.reply(message, reply, onResponse);
    reply = ssbot.newFileMessageByObject(files.audio_coco);          
  } else if (pb == postbacks.test_receive_video_from_coco) {
    reply = ssbot.newTextMessage(simpletext.receive_video_file);
    ssbot.reply(message, reply, onResponse);
    reply = ssbot.newFileMessageByObject(files.video_coco);          
  }
  
  ssbot.reply(message, reply, onResponse);
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

var handle_reply_richcard_10776 = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage(simpletext.what_media_type_richcard);
  var r1 = ssbot.newReply(simpletext.test_receive_image_richcard, postbacks.test_receive_image_richcard);
  var r2 = ssbot.newReply(simpletext.test_receive_audio_richcard, postbacks.test_receive_audio_richcard);
  var r3 = ssbot.newReply(simpletext.test_receive_video_richcard, postbacks.test_receive_video_richcard);
  var r4 = ssbot.newReply(simpletext.test_receive_gif_richcard, postbacks.test_receive_gif_richcard);
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_select_richcard_media_type = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;
  var type = "?type="+ message.RCSMessage.suggestedResponse.response.reply.displayText;
  
  var reply = ssbot.newTextMessage(simpletext.what_to_test);
  var r1 = ssbot.newReply(simpletext.test_receive_normal_richcard, postbacks.test_receive_normal_richcard+type);
  var r2 = ssbot.newReply(simpletext.test_receive_no_thumbnail_richcard, postbacks.test_receive_no_thumbnail_richcard+type);
  var r3 = ssbot.newReply(simpletext.test_receive_broken_thumbnail_richcard, postbacks.test_receive_broken_thumbnail_richcard+type);
  var r4 = ssbot.newReply(simpletext.test_receive_broken_file_richcard, postbacks.test_receive_broken_file_richcard+type);
  var r5 = ssbot.newReply(simpletext.test_receive_all_broken_richcard, postbacks.test_receive_all_broken_richcard+type);
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_receive_richcard_from_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  
  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;  
  var type = pb.substring(pb.indexOf("=") + 1);
  pb = pb.substring(0, pb.indexOf("?"));

  var reply, layout, content, media, title, description;
  layout = layouts.general_vertical;
  title = "Rich Card Test";  
  cardmedias = JSON.parse(fs.readFileSync("res/json/cardmedias.json"));

  if (type == simpletext.test_receive_image_richcard) {
    media = cardmedias.image_coco_medium;
  } else if (type == simpletext.test_receive_audio_richcard) {
    media = cardmedias.audio_coco_medium;
  } else if (type == simpletext.test_receive_video_richcard) {
    media = cardmedias.video_coco_medium;
  } else if (type == simpletext.test_receive_gif_richcard) {
    media = cardmedias.gif_coco_medium;
  }
  
  if (pb == postbacks.test_receive_normal_richcard) {
    reply = ssbot.newTextMessage(simpletext.normal_richcard);
    ssbot.reply(message, reply, onResponse);

    description = simpletext.normal_richcard;
  } else if (pb == postbacks.test_receive_no_thumbnail_richcard) {
    reply = ssbot.newTextMessage(simpletext.no_thumbnail_richcard);
    ssbot.reply(message, reply, onResponse);
    
    description = simpletext.no_thumbnail_richcard;    
    delete media.thumbnailUrl;
    delete media.thumbnailContentType;
    delete media.thumbnailFileSize;                   
  } else if (pb == postbacks.test_receive_broken_thumbnail_richcard) {
    reply = ssbot.newTextMessage(simpletext.broken_thumbnail_richcard);
    ssbot.reply(message, reply, onResponse);
    
    description = simpletext.broken_thumbnail_richcard;
    var str = media.thumbnailUrl;
    media.thumbnailUrl = str.substring(0,10);
  } else if (pb == postbacks.test_receive_broken_file_richcard) {
    reply = ssbot.newTextMessage(simpletext.broken_file_richcard);
    ssbot.reply(message, reply, onResponse);
    reply = ssbot.newFileMessageByObject(files.video_coco); 
    
    description = simpletext.broken_file_richcard;    
    var str = media.mediaUrl; 
    media.mediaUrl = str.substring(0,10);
  } else if (pb == postbacks.test_receive_all_broken_richcard) {
    reply = ssbot.newTextMessage(simpletext.all_broken_richcard);
    ssbot.reply(message, reply, onResponse);
    
    description = simpletext.all_broken_richcard;
    var str = media.thumbnailUrl;
    media.thumbnailUrl = str.substring(0,10);
    str = media.mediaUrl; 
    media.mediaUrl = str.substring(0,10);          
  }
  
  content = ssbot.newGeneralRichCardContent(media, title, description);    
  reply = ssbot.newGeneralRichCard(layout, content);
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_chiplist_10776 = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage(simpletext.what_message_type_chiplist);
  var r1 = ssbot.newReply(simpletext.test_text_with_chiplist, postbacks.test_text_with_chiplist);
  var r2 = ssbot.newReply(simpletext.test_file_with_chiplist, postbacks.test_file_with_chiplist);
  var r3 = ssbot.newReply(simpletext.test_richcard_with_chiplist, postbacks.test_richcard_with_chiplist);
  
  var suggestions = ssbot.newSuggestions(r1, r2, r3);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_select_message_type_with_chiplist = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;
  var type = "?type="+ message.RCSMessage.suggestedResponse.response.reply.displayText;
  
  var reply = ssbot.newTextMessage(simpletext.what_action_type_chiplist);
  var r1 = ssbot.newReply(simpletext.test_url_action, postbacks.test_url_action+type);
  var r2 = ssbot.newReply(simpletext.test_dialer_action, postbacks.test_dialer_action+type);
  var r3 = ssbot.newReply(simpletext.test_map_action, postbacks.test_map_action+type);
  var r4 = ssbot.newReply(simpletext.test_calendar_action, postbacks.test_calendar_action+type);
  var r5 = ssbot.newReply(simpletext.test_compose_action, postbacks.test_compose_action+type);
  var r6 = ssbot.newReply(simpletext.test_device_action, postbacks.test_device_action+type);
  var r7 = ssbot.newReply(simpletext.test_settings_action, postbacks.test_settings_action+type);
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5, r6, r7);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_select_action_type_chiplist = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  
  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;  
  var type = pb.substring(pb.indexOf("=") + 1);
  pb = pb.substring(0, pb.indexOf("?"));

  var reply = ssbot.newTextMessage(simpletext.what_to_test);
  if (pb == postbacks.test_url_action) {
    var r1 = ssbot.newReply(simpletext.test_openUrl_action, postbacks.test_openUrl_action+type);
    var suggestions = ssbot.newSuggestions(r1);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_dialer_action) {
    var r1 = ssbot.newReply(simpletext.test_dialPhoneNumber_action, postbacks.test_dialPhoneNumber_action+type);
    var r2 = ssbot.newReply(simpletext.test_dialEnrichedCall_action, postbacks.test_dialEnrichedCall_action+type);
    var r3 = ssbot.newReply(simpletext.test_dialVideoCall_action, postbacks.test_dialVideoCall_action+type);
    var suggestions = ssbot.newSuggestions(r1, r2, r3);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_map_action) {
    var r1 = ssbot.newReply(simpletext.test_showLocation_action, postbacks.test_showLocation_action+type);
    var r2 = ssbot.newReply(simpletext.test_showLocationWithQuery_action, postbacks.test_showLocationWithQuery_action+type);
    var r3 = ssbot.newReply(simpletext.test_requestLocationPush_action, postbacks.test_requestLocationPush_action+type);
    var suggestions = ssbot.newSuggestions(r1, r2, r3);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_calendar_action) {
    var r1 = ssbot.newReply(simpletext.test_createCalendarEvent_action, postbacks.test_createCalendarEvent_action+type);    
    var suggestions = ssbot.newSuggestions(r1);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_compose_action) {
    var r1 = ssbot.newReply(simpletext.test_composeTextMessage_action, postbacks.test_composeTextMessage_action+type);
    var r2 = ssbot.newReply(simpletext.test_composeRecordingMessage_action, postbacks.test_composeRecordingMessage_action+type);    
    var suggestions = ssbot.newSuggestions(r1, r2);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_device_action) {
    var r1 = ssbot.newReply(simpletext.test_requestDeviceSpecifics_action, postbacks.test_requestDeviceSpecifics_action+type);    
    var suggestions = ssbot.newSuggestions(r1);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_settings_action) {
    var r1 = ssbot.newReply(simpletext.test_disableAnonymization_action, postbacks.test_disableAnonymization_action+type);
    var r2 = ssbot.newReply(simpletext.test_enableDisplayedNotifications_action, postbacks.test_enableDisplayedNotifications_action+type);    
    var suggestions = ssbot.newSuggestions(r1, r2);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } 

  ssbot.reply(message, reply, onResponse);
  
}


ssbot.handle(['reply_start_over'], 'postback', handle_reply_start_over);
ssbot.handle(['reply_test_advanced'], 'postback', handle_reply_advanced);
ssbot.handle(['reply_test_10776'], 'postback', handle_reply_10776);
ssbot.handle(['reply_bot_interaction'], 'postback', handle_reply_bot_interaction);
ssbot.handle(['reply_send_msg_to_coco'], 'postback', handle_reply_send_msg_to_coco);
ssbot.handle(['reply_send_text_to_coco'], 'postback', handle_reply_send_text_to_coco);
ssbot.handle(['10776 read receipt'], 'textMessage', handle_test_read_receipt);
ssbot.handle(['10776 no read receipt'], 'textMessage', handle_test_no_read_receipt);
ssbot.handle(['reply_send_file_to_coco'], 'postback', handle_reply_send_file_to_coco);
ssbot.handle(['reply_receive_msg_from_coco'], 'postback', handle_reply_receive_msg_from_coco);
ssbot.handle(['reply_receive_short_text_from_coco', 'reply_receive_long_text_from_coco'], 'postback', handle_reply_receive_text_from_coco);
ssbot.handle(['reply_receive_image_from_coco', 'reply_receive_audio_from_coco', 'reply_receive_video_from_coco'], 'postback', handle_reply_receive_file_from_coco);
ssbot.handle(['reply_richcard_10776'], 'postback', handle_reply_richcard_10776);
ssbot.handle(['reply_receive_image_richcard','reply_receive_audio_richcard','reply_receive_video_richcard','reply_receive_gif_richcard'], 'postback', handle_reply_select_richcard_media_type);
ssbot.handle(['reply_receive_normal_richcard','reply_receive_no_thumbnail_richcard','reply_receive_broken_thumbnail_richcard','reply_receive_broken_file_richcard','reply_receive_all_broken_richcard'], 'postback', handle_reply_receive_richcard_from_coco);
ssbot.handle(['reply_chiplist_10776'], 'postback', handle_reply_chiplist_10776);
ssbot.handle(['test_text_with_chiplist','test_file_with_chiplist','test_richcard_with_chiplist'], 'postback', handle_reply_select_message_type_with_chiplist);
ssbot.handle(['reply_url_action','reply_dialer_action','reply_map_action','test_calendar_action','test_compose_action','test_device_action', 'test_settings_action'], 'postback', handle_reply_select_action_type_chiplist);

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

var generateRandomString = function (min, max) {
  var ran = Math.floor(Math.random() * (max - min)) + min;
  return crypto.randomBytes(ran).toString('hex');
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
