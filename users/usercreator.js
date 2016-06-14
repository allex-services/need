function createUser(execlib,ParentUser){
  'use strict';
  var lib = execlib.lib,
      q = lib.q;

  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function Bid(user,bidticket,content){
    this.username = user.get('name');
    console.log('new Bid from user',this.username);
    this.content = content;
    this.timeout = content.timeout ? 
      lib.runNext(this.removeBid.bind(this,true,user,bidticket),content.timeout*1000)
      :
      null; 
  }
  Bid.prototype.destroy = function(){
    if(this.timeout){
      lib.clearTimeout(this.timeout);
    }
    this.username = null;
    this.content = null;
  };
  Bid.prototype.removeBid = function(docleartimeout,user,bidticket){
    if(docleartimeout){
      this.timeout = null;
    }
    user.removeBid(bidticket);
  };

  function User(prophash){
    ParentUser.call(this,prophash);
  }
  ParentUser.inherit(User,require('../methoddescriptors/user'));
  User.prototype.onAboutToDie = function(){
    this.__service.bids.traverse(this.removeMyBid.bind(this,this.get('name')));
  };
  User.prototype.__cleanUp = function(){
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype._onChallengeProduced = function(defer,bidticket,userinput,challenge){
    var cs = this.challengeStatus(challenge);
    if(cs < 0){
      console.log('bid', userinput, 'rejected');
      this.removeBid(bidticket);
      defer.resolve({rejected:true});
    }else if(cs === 0){
      console.log('bid',challenge,'accepted');
      this.removeBid(bidticket);
      this.__service.exposeBid(userinput);
      defer.resolve({a:bidticket});
    }else{
      console.log('bid', userinput, 'resulted in challenge', challenge);
      this.replaceBid(bidticket,challenge);
      defer.resolve({bid:bidticket,c:challenge});
    }
  };
  User.prototype.bid = function(offering,defer){
    if(!this.destroyed){
      defer.resove({rejected:true});
      return;
    }
    if(!this.canAcceptMoreBids()){
      defer.reject('Cannot accept more bids');
      return;
    }
    var bidticket = lib.uid();
    try{
      this.addBid(bidticket,offering);
    }
    catch(e){
      defer.reject('Internal error: duplicate bid ticket');
      return;
    }
    var cd = q.defer();
    this.produceChallenge(offering,bidticket,cd);
    cd.promise.done(
      this._onChallengeProduced.bind(this,defer,bidticket,offering),
      defer.reject.bind(defer)
    );
  };
  User.prototype.respond = function(bidticket,response,defer){
    if (!this.__service) {
      defer.reject(new lib.Error('SERVICE_DYING'));
      return;
    }
    var bid = this.__service.bids.get(bidticket);
    if(!bid){
      defer.reject('No challenge for bidticket '+bidticket);
      return;
    }
    var rd = q.defer();
    this.checkChallengeResponse(bidticket,bid.content,response,rd);
    rd.promise.done(
      this._onChallengeProduced.bind(this,defer,bidticket,response),
      defer.reject.bind(rd)
    );
  };
  User.prototype.canAcceptMoreBids = function(){
    return true;
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
  User.prototype.addBid = function(bidticket,content){
    if (!this.__service) {
      return;
    }
    this.__service.bids.add(bidticket,new Bid(this,bidticket,content));
  };
  User.prototype.removeBid = function(bidticket){
    if (!this.__service) {
      return;
    }
    var b = this.__service.bids.remove(bidticket);
    if(b){
      b.destroy();
    }
  };
  User.prototype.replaceBid = function(bidticket,newcontent){
    var b = this.__service.bids.replace(bidticket,new Bid(this,bidticket,newcontent));
    if(b){
      b.destroy();
    }
  };
  User.prototype.removeMyBid = function(myname,bid,bidticket){
    console.log(myname,'checking',bid,'with',bidticket);
    if(bid.username===myname){
      bid.removeBid(false,this,bidticket);
      bid.destroy();
    }
  };

  return User;
}

module.exports = createUser;
