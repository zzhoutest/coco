const machina = require('machina');
const request = require('request');
var backoff = require('backoff');

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

function authtoken(botid, botsecret, botservice, authclientconfig, tokenmngr) {
  console.log('clientconfig:' + authclientconfig)
  var self;
  var scheme = authclientconfig.scheme;
  var ca_path = authclientconfig.ca;
  var accesstoken;
  var basictoken = new Buffer(botid + ":" + botsecret).toString('base64');
  var expirationtime;
  var refreshtoken;
  var timer = false;
  var BotServiceAgent;
  var retry = false;
  if(authclientconfig.connpoolsize != null) {
    BotServiceAgent = new require('http').Agent({ keepAlive: true,maxSockets: authclientconfig.connpoolsize });
  }
  var authtoken = new machina.Fsm( {
    initialize : function(options) {
        self = this;
    },

    namespace: "authtoken",

    initialState: "initialized",

    states: {
      initialized: {
        "*": function() {
          accesstoken = '';
          refreshtoken = '';
          expiration_time = '';
          console.log(this.state);
          this.transition("fetching");
        },
      },
      fetching: {
        _onEnter: function() {
          console.log(this.state + " _onEnter");
          this.handle("event_fetch_access_token")
        },
        event_fetch_access_token: function() {
          var url = scheme + ':\/\/' + botservice + "\/oauth2\/v1\/token"
          var clientOptions = {
              url: url,
              method: 'POST',
              headers: {
            "Authorization": "Basic " + basictoken
            },
              form: {
                grant_type: 'client_credentials',
                scope: 'botmessage'
              }
          };
          console.log('scheme' + scheme);
          if(BotServiceAgent){
            clientOptions.agent = BotServiceAgent;
          }
          if (scheme == 'https' && ca_path != null) {
            clientOptions.agentOptions = {};
            clientOptions.agentOptions.ca = require('fs').readFileSync(ca_path);
          }
          console.log("botid: " + botid + " secret: " + botsecret);
          console.log("basictoken: " + basictoken + "url "+ url);

          attemptrequest(clientOptions,function(err,httpResponse,body){
              if(err || httpResponse.statusCode != 200){
                console.log('error happened:' + err + " respcode :" + httpResponse.statusCode );
                retry = (httpResponse.statusCode == 500 || httpResponse.statusCode == 502)
                self.transition("tokenFetchFailed");
              } else {
	              console.log("response code: " + httpResponse.statusCode);
                console.log("body: " + body);
                self.transition("tokenFetchSucceeded", body);
	            }
            }
          );

        },
        _onExit: function() {
          console.log(this.state + " _onExit");
        }
      },
      refreshing: {
        _onEnter: function() {
          console.log(this.state + " _onEnter");
          expiration_time = '';
          this.handle("event_fetch_refresh_token")
        },
        event_fetch_refresh_token: function() {
          var url = scheme + ':\/\/' + botservice + "\/oauth2\/v1\/token"
          var clientOptions = {
              url: url,
              method: 'POST',
              headers: {
            "Authorization": "Basic " + basictoken
              },
              form: {
                grant_type: 'refresh_token',
                refresh_token: refreshtoken,
                scope: 'botmessage'
              }
            };
            if(BotServiceAgent){
              clientOptions.agent = BotServiceAgent;
            }
          if (scheme == 'https'  && ca_path != null) {
            clientOptions.agentOptions = {};
            clientOptions.agentOptions.ca = require('fs').readFileSync(ca_path);
          }
          console.log("botid: " + botid + " secret: " + botsecret);
          console.log("basictoken: " + basictoken + "url "+ url);
          attemptrequest(clientOptions,
            function(err,httpResponse,body){
              if(err || httpResponse.statusCode != 200){
                console.log('error happened:' + err + " respcode :" + httpResponse.statusCode );
                retry = (httpResponse.statusCode == 500 || httpResponse.statusCode == 502)
                self.transition("tokenFetchFailed");
              } else {
              	console.log("response code: " + httpResponse.statusCode);
              	console.log("body: " + body);
              	self.transition("tokenFetchSucceeded", body);
	            }
            }
          );

        },
        _onExit: function() {
          console.log(this.state + " _onExit");
        }
      },
      tokenFetchFailed: {
        _onEnter: function () {
          console.log(this.state + " _onEnter");
          clearTimeout(timer);
          if (tokenmngr)
            tokenmngr.onNotReady();
          timer = false;
          //TODO: This should always not moved to fetching state ,It should do exponential retry with max limits.
          console.log('post the not ready indication to app');
          if (retry) {
            self.transition("fetching");
          }
        },
        _onExit: function () {
          console.log(this.state + " _onExit");
        }
      },
      tokenFetchSucceeded: {
        _onEnter: function (body) {
          console.log(this.state + " _onEnter");
          var jsonResp = JSON.parse(body);
          accesstoken = jsonResp.access_token;
          refreshtoken = jsonResp.refresh_token;
          expirationtime = jsonResp.expires_in;
          if (timer == false) {
            timer = setInterval(self.refresh, ((expirationtime * 1000) - 5000));
            console.log('event has to be emitted on intial succeed');
            if (tokenmngr)
              tokenmngr.onReady();
          } else {
            console.log('event has only to be sent once');
          }
          console.log('token: ' + accesstoken);
          console.log('expiry: ' + expirationtime);
          console.log('refresh string : ' + refreshtoken);

        },
        _onExit: function () {
          console.log(this.state + " _onExit");
        }
      }
    },

    start: function() {
      this.handle("initialized");
    },
    refresh: function () {
      authtoken.transition("refreshing");
    }
  });

  return {
    fetchAccessToken: function(){
      console.log('fetchtoken');
      authtoken.start();
    },
    getAccessToken: function() {
      console.log("accesstoken: "+ accesstoken);
      return accesstoken;
    },
  }
}

module.exports = authtoken;
