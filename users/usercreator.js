function createUser(execlib,ParentUser){
  'use strict';
  var lib = execlib.lib,
      q = lib.q,
      qlib = lib.qlib,
      execSuite = execlib.execSuite;

  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  var ParentUserSession = ParentUser.prototype.getSessionCtor('.');

  function UserSession (user,session,gate) {
    ParentUserSession.call(this,user,session,gate);
  }
  ParentUserSession.inherit(UserSession,{
    bid:[{
      title: 'Bid offering',
      type: 'object'
    }],
    respond:[{
      title: 'Bid ticket',
      type: 'string', //a laarge number actually
    },{
      title: 'Response to bid challenge',
      type: 'object'
    }]
  });
  UserSession.prototype.__cleanUp = function () {
    ParentUserSession.prototype.__cleanUp.call(this);
  };
  UserSession.prototype.bid = function(offering, defer) {
    if (!(this.user && this.user.__service)) {
      defer.reject(new lib.Error('ALREADY_DESTROYED', 'This instance is already destroyed'));
    }
    this.user.__service.queue(this, offering, defer);
  };
  UserSession.prototype.runBid = function (bidticket, offering) {
    var defer = q.defer(), ret = defer.promise;
    var userbiddefer = q.defer();
    userbiddefer.promise.done(
      this.onUserBid.bind(this, bidticket, defer),
      defer.reject.bind(defer)
    );
    this.user.bid(bidticket, offering, userbiddefer);
    bidticket = null;
    defer = null;
    return ret;
  };
  UserSession.prototype.onUserBid = function (bidticket, defer, userbidresponse){
    defer.resolve(userbidresponse);
    bidticket = null;
    defer = null;
  };
  UserSession.prototype.respond = function(bidticket,response,defer){
    if (!(
      this.user &&
      this.user.destroyed &&
      this.user.__service &&
      this.user.__service.activeJob
    )){
      defer.reject(new lib.Error('ALREADY_DESTROYED'));
      return;
    }
    var bid = this.user.__service.activeJob.checkResponse(this, bidticket, response);
    if (!bid) {
      defer.reject(new lib.Error('BIDDING_MISMATCH'));
      return;
    }
    var userresponddefer = q.defer();
    userresponddefer.promise.done(
      this.onUserRespond.bind(this, bidticket, defer),
      defer.reject.bind(defer)
    );
    this.user.respond(bidticket, bid, response, userresponddefer);
    bidticket = null;
    defer = null;
  };
  UserSession.prototype.onUserRespond = function (bidticket, defer, userrespondresult) {
    defer.resolve(userrespondresult);
    bidticket = null;
    defer = null;
  };

  function User(prophash){
    ParentUser.call(this,prophash);
  }
  ParentUser.inherit(User,require('../methoddescriptors/user'));
  User.prototype.__cleanUp = function(){
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype._onChallengeProduced = function(defer,bidticket,userinput,challenge){
    var cs;
    try {
      cs = this.challengeStatus(challenge);
    } catch(e) {
      defer.reject(e);
      return;
    }
    if(cs < 0){
      //console.log('bid', userinput, 'rejected');
      defer.resolve({rejected:true});
      return;
    }
    if(cs === 0){
      //console.log('bid',challenge,'accepted');
      if (!this.__service) {
        defer.resolve({rejected:true});
        return;
      }
      this.__service.exposeBid(userinput);
      defer.resolve({a:bidticket});
      return;
    }
    //console.log('bid', userinput, 'resulted in challenge', challenge);
    defer.resolve({bid:bidticket,c:challenge});
  };
  User.prototype.bid = function(bidticket, offering,defer){
    if(!this.destroyed){
      defer.resolve({rejected:true});
      return;
    }
    var cd = q.defer();
    this.produceChallenge(offering,bidticket,cd);
    cd.promise.done(
      this._onChallengeProduced.bind(this,defer,bidticket,offering),
      defer.reject.bind(defer)
    );
    defer = null;
    bidticket = null;
    offering = null;
  };
  User.prototype.respond = function(bidticket,bid,response,defer){
    if (!this.__service) {
      defer.reject(new lib.Error('SERVICE_DYING'));
      return;
    }
    if(!bid){
      defer.reject(new lib.Error('NO_CHALLENGE_FOR_BID', 'No challenge for bidticket '+bidticket));
      return;
    }
    var rd = q.defer();
    this.checkChallengeResponse(bidticket,bid.content,response,rd);
    rd.promise.done(
      this._onChallengeProduced.bind(this,defer,bidticket,response),
      defer.reject.bind(defer)
    );
    defer = null;
    bidticket = null;
    response = null;
  };
  User.prototype.produceChallenge = function(offering,bidticket,defer){
    defer.resolve(null);
  };
  User.prototype.checkChallengeResponse = function(bidticket,challenge,response,defer){
    defer.resolve(null);
  };
  User.prototype.challengeStatus = function(challenge){
    var und;
    if(und === challenge){
      return -1;
    }else if(null === challenge){
      return 0;
    }
    return 1;
  };

  User.prototype.getSessionCtor = execSuite.userSessionFactoryCreator(UserSession);

  return User;
}

module.exports = createUser;
