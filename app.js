require('log-timestamp');
var log = require('loglevel');
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

// Set custom logging level for sdk modules ("TRACE", "DEBUG", "INFO", "WARN", "ERROR")
log.getLogger("authtoken").setLevel("DEBUG");
log.getLogger("ssbotbuilder").setLevel("DEBUG");

// Set logging level for app
log.setLevel("DEBUG");

ssbot.createService(options, function (err, webserver) {
  if (!err) {
    ssbot.listen('state', onStateListener);
    //ssbot.listen('follow',OnSubscribeMsg);
    ssbot.listen('webhook', onWebhookMessage);
  }
});

var onWebhookMessage = function (message) {
  var reply;  
  
  if (!message) {
    log.warn("!!!empty message!!!");
    return;
  }

  if (message.event == "newUser") {
    reply = ssbot.newTextMessage(simpletext.hello);
    ssbot.say(message.messageContact, reply, onResponse);
  } else if (message.event == "message") {
      handle_event_message(message);
  } else if (message.event == "response") {
    if (message.RCSMessage.sharedData) {
      handle_response_device_specifics(message);
    } else {
      handle_reply_start_over(message);
    }
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
  var r2 = ssbot.newReply(simpletext.test_richcard_adv, postbacks.test_richcard_adv);
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
  var r2 = ssbot.newReply(simpletext.test_richcard_10776, postbacks.test_richcard_10776);
  var r3 = ssbot.newReply(simpletext.test_chiplist_10776, postbacks.test_chiplist_10776);
  var r4 = ssbot.newReply(simpletext.test_carousel_10776, postbacks.test_carousel_10776);
  
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4);
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
  } else {
    reply = ssbot.newTextMessage(simpletext.send_text_to_coco_too_long);
  }
  var r1 = ssbot.newReply(simpletext.test_send_text_to_coco, postbacks.test_send_text_to_coco);
  var r2 = ssbot.newReply(simpletext.test_send_file_to_coco, postbacks.test_send_file_to_coco);
  var r3 = chips.start_over;
  var suggestions = ssbot.newSuggestions(r1, r2, r3);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  ssbot.reply(message, reply, onResponse);
}

var handle_test_no_read_receipt = function(message) {  
  var reply;
  if (message.RCSMessage.textMessage.length >= 1024) {
    reply = ssbot.newTextMessage(simpletext.test_no_read_receipt);    
  } else {
    reply = ssbot.newTextMessage(simpletext.send_text_to_coco_not_long_enough);
  }
  var r1 = ssbot.newReply(simpletext.test_send_text_to_coco, postbacks.test_send_text_to_coco);
  var r2 = ssbot.newReply(simpletext.test_send_file_to_coco, postbacks.test_send_file_to_coco);
  var r3 = chips.start_over;
  var suggestions = ssbot.newSuggestions(r1, r2, r3);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_send_file_to_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  var reply = ssbot.newTextMessage(simpletext.select_file);
  ssbot.reply(message, reply, onResponse);
}

var handle_test_send_file_to_coco = function(message) {
  var isImage = message.RCSMessage.fileMessage.fileMIMEType.includes("image");
  if (isImage) {
    ssbot.read(message.RCSMessage.msgId, onResponse);
  }
  ssbot.typing(message.messageContact, "active", onResponse);
  var reply = ssbot.newTextMessage(simpletext.received_file);
  ssbot.reply(message, reply, onResponse);
  
  reply = {
    "RCSMessage": {
      "fileMessage": "",      
    }
  };
  reply.RCSMessage.fileMessage = message.RCSMessage.fileMessage;    

  var r1 = ssbot.newReply(simpletext.test_send_text_to_coco, postbacks.test_send_text_to_coco);
  var r2 = ssbot.newReply(simpletext.test_send_file_to_coco, postbacks.test_send_file_to_coco);
  var r3 = chips.start_over;
  var suggestions = ssbot.newSuggestions(r1, r2, r3);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_receive_text_from_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;  
  var ran;
  var str;
  if (pb == postbacks.test_receive_short_text_from_coco) {    
    str = generateRandomString(1, 512);        
  } else if (pb == postbacks.test_receive_long_text_from_coco) {        
    str = generateRandomString(512, 1024);
  }
  var reply = ssbot.newTextMessage("I am sending " + str.length + " bytes text to you. \r\n\u26D4Please report the issue if you don't receive it.");
  ssbot.reply(message, reply, onResponse);

  reply = ssbot.newTextMessage(str);
  var r1 = ssbot.newReply(simpletext.test_receive_short_text_from_coco, postbacks.test_receive_short_text_from_coco);
  var r2 = ssbot.newReply(simpletext.test_receive_long_text_from_coco, postbacks.test_receive_long_text_from_coco);
  var r3 = ssbot.newReply(simpletext.test_receive_image_from_coco, postbacks.test_receive_image_from_coco);
  var r4 = ssbot.newReply(simpletext.test_receive_audio_from_coco, postbacks.test_receive_audio_from_coco);
  var r5 = ssbot.newReply(simpletext.test_receive_video_from_coco, postbacks.test_receive_video_from_coco);
  var r6 = chips.start_over;
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5, r6);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

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
  ssbot.typing(message.messageContact, "active", onResponse);

  var r1 = ssbot.newReply(simpletext.test_receive_short_text_from_coco, postbacks.test_receive_short_text_from_coco);
  var r2 = ssbot.newReply(simpletext.test_receive_long_text_from_coco, postbacks.test_receive_long_text_from_coco);
  var r3 = ssbot.newReply(simpletext.test_receive_image_from_coco, postbacks.test_receive_image_from_coco);
  var r4 = ssbot.newReply(simpletext.test_receive_audio_from_coco, postbacks.test_receive_audio_from_coco);
  var r5 = ssbot.newReply(simpletext.test_receive_video_from_coco, postbacks.test_receive_video_from_coco);
  var r6 = chips.start_over;
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5, r6);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  
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
  var r5 = ssbot.newReply(simpletext.test_richcard_learn, postbacks.test_richcard_learn);
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_select_richcard_media_type = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;
  var type = "?type="+ message.RCSMessage.suggestedResponse.response.reply.displayText;
  
  var reply, suggestions;
   
  if (pb == postbacks.test_richcard_learn) {
    reply = ssbot.newTextMessage(simpletext.richcard_basic);
    var r1 = ssbot.newReply(simpletext.test_richcard_back, postbacks.test_richcard_back);
    suggestions = ssbot.newSuggestions(r1);
  } else {
    reply = ssbot.newTextMessage(simpletext.what_to_test);
    var r1 = ssbot.newReply(simpletext.test_receive_normal_richcard, postbacks.test_receive_normal_richcard+type);
    var r2 = ssbot.newReply(simpletext.test_receive_no_thumbnail_richcard, postbacks.test_receive_no_thumbnail_richcard+type);
    var r3 = ssbot.newReply(simpletext.test_receive_broken_thumbnail_richcard, postbacks.test_receive_broken_thumbnail_richcard+type);
    var r4 = ssbot.newReply(simpletext.test_receive_broken_file_richcard, postbacks.test_receive_broken_file_richcard+type);
    var r5 = ssbot.newReply(simpletext.test_receive_all_broken_richcard, postbacks.test_receive_all_broken_richcard+type);
    suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5);
  }
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  ssbot.reply(message, reply, onResponse);
}

var handle_reply_receive_richcard_from_coco = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  
  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;  
  if (pb == postbacks.test_richcard_back) {
    handle_reply_richcard_10776(message);
    return;
  }

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

  ssbot.typing(message.messageContact, "active", onResponse);
  content = ssbot.newGeneralRichCardContent(media, title, description);    
  reply = ssbot.newGeneralRichCard(layout, content);

  type = "?type=" + type;
  var r1 = ssbot.newReply(simpletext.test_receive_normal_richcard, postbacks.test_receive_normal_richcard+type);
  var r2 = ssbot.newReply(simpletext.test_receive_no_thumbnail_richcard, postbacks.test_receive_no_thumbnail_richcard+type);
  var r3 = ssbot.newReply(simpletext.test_receive_broken_thumbnail_richcard, postbacks.test_receive_broken_thumbnail_richcard+type);
  var r4 = ssbot.newReply(simpletext.test_receive_broken_file_richcard, postbacks.test_receive_broken_file_richcard+type);
  var r5 = ssbot.newReply(simpletext.test_receive_all_broken_richcard, postbacks.test_receive_all_broken_richcard+type);
  var r6 = chips.start_over;
  suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5, r6);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_chiplist_10776 = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage(simpletext.what_message_type_chiplist);
  var r1 = ssbot.newReply(simpletext.test_text_with_chiplist, postbacks.test_text_with_chiplist);
  var r2 = ssbot.newReply(simpletext.test_file_with_chiplist, postbacks.test_file_with_chiplist);
  var r3 = ssbot.newReply(simpletext.test_richcard_with_chiplist, postbacks.test_richcard_with_chiplist);
  var r4 = ssbot.newReply(simpletext.test_chiplist_learn, postbacks.test_chiplist_learn);
  
  var suggestions = ssbot.newSuggestions(r1, r2, r3, r4);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_select_message_type_with_chiplist = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;
  var dt = message.RCSMessage.suggestedResponse.response.reply.displayText;
  var type = "?type=" + dt; 
  
  var reply, suggestions;
  if (pb == postbacks.test_chiplist_learn) {
    reply = ssbot.newTextMessage(simpletext.chip_list_basic);
    var r1 = ssbot.newReply(simpletext.test_chiplist_back, postbacks.test_chiplist_back);
    suggestions = ssbot.newSuggestions(r1);
  } else {
    if (dt == simpletext.test_text_with_chiplist) {
      reply = ssbot.newTextMessage(simpletext.what_action_type_chiplist);
    } else if (dt == simpletext.test_file_with_chiplist) {
      reply = ssbot.newFileMessageByObject(files.image_coco);
    } else if (dt == simpletext.test_richcard_with_chiplist) {
      var layout, content, media, title, description;
      layout = layouts.general_vertical;
      title = "Rich Card Test";  
      cardmedias = JSON.parse(fs.readFileSync("res/json/cardmedias.json"));
      description = simpletext.normal_richcard;
      media = cardmedias.image_coco_medium;
      content = ssbot.newGeneralRichCardContent(media, title, description);    
      reply = ssbot.newGeneralRichCard(layout, content);
    }
    var r1 = ssbot.newReply(simpletext.test_url_action, postbacks.test_url_action+type);
    var r2 = ssbot.newReply(simpletext.test_dialer_action, postbacks.test_dialer_action+type);
    var r3 = ssbot.newReply(simpletext.test_map_action, postbacks.test_map_action+type);
    var r4 = ssbot.newReply(simpletext.test_calendar_action, postbacks.test_calendar_action+type);
    var r5 = ssbot.newReply(simpletext.test_compose_action, postbacks.test_compose_action+type);
    var r6 = ssbot.newReply(simpletext.test_device_action, postbacks.test_device_action+type);
    var r7 = ssbot.newReply(simpletext.test_settings_action, postbacks.test_settings_action+type);
    suggestions = ssbot.newSuggestions(r1, r2, r3, r4, r5, r6, r7);
  }
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_select_action_type_chiplist = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);
  
  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;  
  if (pb == postbacks.test_chiplist_back) {
    handle_reply_chiplist_10776(message);
    return;
  }
  
  var type = pb.substring(pb.indexOf("=") + 1);
  pb = pb.substring(0, pb.indexOf("?"));

  var reply;
  if (type == simpletext.test_text_with_chiplist) {
    if (pb == postbacks.test_url_action) {
      reply = ssbot.newTextMessage(simpletext.test_text_with_url_action_in_chiplist);
    } else if (pb == postbacks.test_dialer_action) {
      reply = ssbot.newTextMessage(simpletext.test_text_with_dialer_action_in_chiplist);
    } else if (pb == postbacks.test_map_action) {
      reply = ssbot.newTextMessage(simpletext.test_text_with_map_action_in_chiplist);
    } else if (pb == postbacks.test_calendar_action) {
      reply = ssbot.newTextMessage(simpletext.test_text_with_calendar_action_in_chiplist);
    } else if (pb == postbacks.test_compose_action) {
      reply = ssbot.newTextMessage(simpletext.test_text_with_compose_action_in_chiplist);
    } else if (pb == postbacks.test_device_action) {
      reply = ssbot.newTextMessage(simpletext.test_text_with_device_action_in_chiplist);
    } else if (pb == postbacks.test_settings_action) {
      reply = ssbot.newTextMessage(simpletext.test_text_with_settings_action_in_chiplist);
    } else {
      reply = ssbot.newTextMessage(simpletext.test_chiplist_10776_with_text);
    }
  } else if (type == simpletext.test_file_with_chiplist) {
    reply = ssbot.newFileMessageByObject(files.image_coco);
  } else if (type == simpletext.test_richcard_with_chiplist) {
    var layout, content, media, title, description;
    layout = layouts.general_vertical;
    title = "Suggested Chip List Test";  
    cardmedias = JSON.parse(fs.readFileSync("res/json/cardmedias.json"));
    description = simpletext.normal_richcard;
    media = cardmedias.image_coco_medium;
    content = ssbot.newGeneralRichCardContent(media, title, description);    
    reply = ssbot.newGeneralRichCard(layout, content);
  }

  if (pb == postbacks.test_url_action) {    
    var r1 = chips.open_url;
    var suggestions = ssbot.newSuggestions(r1);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_dialer_action) {
    var r1 = chips.dial_PhoneNumber;
    var r2 = chips.dial_EnrichedCall;
    var r3 = chips.dial_VideoCall;
    var suggestions = ssbot.newSuggestions(r1, r2, r3);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_map_action) {
    var r1 = chips.show_Location;
    var r2 = chips.show_Location_with_Query;
    var r3 = chips.request_Location_Push;
    var suggestions = ssbot.newSuggestions(r1, r2, r3);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_calendar_action) {
    var r1 = chips.create_Calendar_Event;
    var suggestions = ssbot.newSuggestions(r1);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_compose_action) {
    var r1 = chips.compose_Text_Message;
    var r2 = chips.compose_Recording_Video_Message;
    var r3 = chips.compose_Recording_Audio_Message;
    var suggestions = ssbot.newSuggestions(r1, r2, r3);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_device_action) {
    var r1 = chips.request_Device_Specifics;
    var suggestions = ssbot.newSuggestions(r1);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_settings_action) {
    var r1 = chips.disable_Anonymization;
    var r2 = chips.enable_Displayed_Notifications;
    var suggestions = ssbot.newSuggestions(r1, r2);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } 

  ssbot.reply(message, reply, onResponse);
  
}

var handle_reply_carousel_10776 = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage(simpletext.what_to_test);
  var r1 = ssbot.newReply(simpletext.test_carousel_full, postbacks.test_carousel_full);
  var r2 = ssbot.newReply(simpletext.test_carousel_learn, postbacks.test_carousel_learn);
  
  var suggestions = ssbot.newSuggestions(r1, r2);
  reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);

  ssbot.reply(message, reply, onResponse);
}

var handle_reply_select_test_full_carousel = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var pb = message.RCSMessage.suggestedResponse.response.reply.postback.data;
  var dt = message.RCSMessage.suggestedResponse.response.reply.displayText;  
  
  var reply, suggestions;
  if (pb == postbacks.test_carousel_learn) {
    reply = ssbot.newTextMessage(simpletext.carousel_basic);
    var r1 = ssbot.newReply(simpletext.test_carousel_back, postbacks.test_carousel_back);
    suggestions = ssbot.newSuggestions(r1);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  } else if (pb == postbacks.test_carousel_back) {
    handle_reply_carousel_10776(message);
    return;
  } else if (pb == postbacks.test_carousel_full) {        
    reply = ssbot.newTextMessage(simpletext.test_carousel_send_full);
    ssbot.reply(message, reply, onResponse);

    cardmedias = JSON.parse(fs.readFileSync("res/json/cardmedias.json"));  
    
    var m1 = cardmedias.image_coco_medium;  
    var m2 = cardmedias.audio_coco_medium;
    var m3 = cardmedias.video_coco_medium;      
    var m4 = cardmedias.gif_coco_medium;

    var t1 = simpletext.test_url_action;
    var t2 = simpletext.test_dialer_action;
    var t3 = simpletext.test_map_action;
    var t4 = simpletext.test_calendar_action;
    var t5 = simpletext.test_compose_action;
    var t6 = simpletext.test_device_action;
    var t7 = simpletext.test_settings_action;
    var t8 = "Carousel Test";
    
    var d1 = simpletext.test_carousel_card_url;
    var d2 = simpletext.test_carousel_card_dialer;
    var d3 = simpletext.test_carousel_card_map;
    var d4 = simpletext.test_carousel_card_calendar;
    var d5 = simpletext.test_carousel_card_compose;
    var d6 = simpletext.test_carousel_card_device;
    var d7 = simpletext.test_carousel_card_settings;
    var d8 = simpletext.test_carousel_card_none;
    
    var r1 = chips.start_over;
    var r2 = ssbot.newReply(simpletext.test_carousel_learn, postbacks.test_carousel_learn);

    var a11 = chips.open_url;
    
    var a21 = chips.dial_PhoneNumber;
    var a22 = chips.dial_EnrichedCall;
    var a23 = chips.dial_VideoCall;
    
    var a31 = chips.show_Location;
    var a32 = chips.show_Location_with_Query;
    var a33 = chips.request_Location_Push;
    
    var a41 = chips.create_Calendar_Event;
    
    var a51 = chips.compose_Text_Message;
    var a52 = chips.compose_Recording_Video_Message;
    var a53 = chips.compose_Recording_Audio_Message;
    
    var a61 = chips.request_Device_Specifics;
    
    var a71 = chips.disable_Anonymization;
    var a72 = chips.enable_Displayed_Notifications;

    var s1 = ssbot.newSuggestions(r1, r2, a11);
    var s2 = ssbot.newSuggestions(r1, r2, a21, a22, a23);
    var s3 = ssbot.newSuggestions(r1, r2, a31, a32, a33);
    var s4 = ssbot.newSuggestions(r1, r2, a41);
    var s5 = ssbot.newSuggestions(r1, r2, a51, a52, a53);
    var s6 = ssbot.newSuggestions(r1, r2, a61);
    var s7 = ssbot.newSuggestions(r1, r2, a71, a72);
    var s8 = ssbot.newSuggestions(r1, r2);

    var c1 = ssbot.newGeneralRichCardContent(m1, t1, d1, s1);    
    var c2 = ssbot.newGeneralRichCardContent(m2, t2, d2, s2);
    var c3 = ssbot.newGeneralRichCardContent(m3, t3, d3, s3);
    var c4 = ssbot.newGeneralRichCardContent(m4, t4, d4, s4);
    var c5 = ssbot.newGeneralRichCardContent(m1, t5, d5, s5);
    var c6 = ssbot.newGeneralRichCardContent(m2, t6, d6, s6);
    var c7 = ssbot.newGeneralRichCardContent(m3, t7, d7, s7);
    var c8 = ssbot.newGeneralRichCardContent(m4, t8, d8, s8);

    var content = ssbot.newGeneralCarouselContent(c1, c2, c3, c4, c5, c6, c7, c8);
    var layout = layouts.general_medium_width;
    reply = ssbot.newGeneralCarousel(layout, content);

    var suggestions = ssbot.newSuggestions(r1, r2, a11, a21, a31, a33, a41, a51, a52, a61, a72);
    reply.RCSMessage.suggestedChipList = ssbot.newSuggestedChipList(suggestions);
  }

  ssbot.reply(message, reply, onResponse);

}

var handle_response_device_specifics = function(message) {
  ssbot.read(message.RCSMessage.msgId, onResponse);
  ssbot.typing(message.messageContact, "active", onResponse);

  var reply = ssbot.newTextMessage("I received this: " + message.RCSMessage.sharedData);

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
ssbot.handle(['reply_receive_image_richcard','reply_receive_audio_richcard','reply_receive_video_richcard','reply_receive_gif_richcard', 'reply_learnmore_richcard'], 'postback', handle_reply_select_richcard_media_type);
ssbot.handle(['reply_receive_normal_richcard','reply_receive_no_thumbnail_richcard','reply_receive_broken_thumbnail_richcard','reply_receive_broken_file_richcard','reply_receive_all_broken_richcard', 'reply_back_to_chiplist_10776'], 'postback', handle_reply_receive_richcard_from_coco);
ssbot.handle(['reply_chiplist_10776'], 'postback', handle_reply_chiplist_10776);
ssbot.handle(['reply_text_with_chiplist','reply_file_with_chiplist','reply_richcard_with_chiplist','reply_learnmore_action'], 'postback', handle_reply_select_message_type_with_chiplist);
ssbot.handle(['reply_url_action','reply_dialer_action','reply_map_action','reply_calendar_action','reply_compose_action','reply_device_action', 'reply_settings_action', 'reply_back_to_chiplist_10776'], 'postback', handle_reply_select_action_type_chiplist);
ssbot.handle(['reply_carousel_10776'], 'postback', handle_reply_carousel_10776);
ssbot.handle(['reply_learnmore_carousel','reply_full_carousel','reply_back_to_carousel_10776'], 'postback', handle_reply_select_test_full_carousel);


var onResponse = function (err, res, body) {
  if (err) {
    //console.log("err:"+err.message);
  }
  if (res) {
    //console.log("statusCode:"+res.statusCode);
    //console.log("statusMessage:"+res.statusMessage);
  }
  if (body) {
    //console.log("body:"+JSON.stringify(body));
  }
}

var onStateListener = function (state, reason) {
  if (!state) {
    log.error('Cannot send any message all messages should be buffered now ' + reason);
  } else {
    log.info("Bot is working correctly");
  }
}

var generateRandomString = function (min, max) {
  var ran = Math.floor(Math.random() * (max - min)) + min;
  return crypto.randomBytes(ran).toString('hex');
}
