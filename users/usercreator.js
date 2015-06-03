function createUser(execlib,ParentUser){
  var lib = execlib.lib,
      q = lib.q;

  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function Challenge(user,challenge){
    this.username = user.get('name');
    console.log('new Challenge from user',this.username);
    this.challenge = challenge;
  }
  Challenge.prototype.destroy = function(){
    this.username = null;
    this.challenge = null;
  };

  function User(prophash){
    ParentUser.call(this,prophash);
  }
  ParentUser.inherit(User,require('../methoddescriptors/user'));
  User.prototype.__cleanUp = function(){
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype._onChallengeProduced = function(defer,bidticket,challenge){
    var cs = this.challengeStatus(challenge);
    if(cs < 0){
      this.removeChallenge(bidticket);
      defer.resolve({rejected:true});
    }else if(cs === 0){
      this.removeChallenge(bidticket);
      defer.resolve({ok:bidticket});
    }else{
      this.replaceChallenge(bidticket,challenge);
      if(challenge.timeout){
        lib.runNext(this.__service.challenges.remove.bind(this.__service.challenges,bidticket),challenge.timeout*1000);
      }
      defer.resolve({bid:bidticket,c:challenge});
    }
  };
  User.prototype._onResponseChecked = function(defer,bidticket,newchallenge){
    if(this.challengeStatus(newchallenge)>0){
      this.replaceChallenge(bidticket,newchallenge);
      defer.resolve({c:newchallenge});
      return;
    }
    this.removeChallenge(bidticket);
    defer.resolve({a:bidticket});
  };
  User.prototype.bid = function(offering,defer){
    if(!this.canAcceptMoreBids()){
      defer.reject('Cannot accept more bids');
      return;
    }
    var bidticket = lib.uid();
    try{
      this.addChallenge(bidticket,offering);
    }
    catch(e){
      defer.reject('Internal error: duplicate bid ticket');
      return;
    }
    var cd = q.defer();
    this.produceChallenge(offering,bidticket,cd);
    cd.promise.done(
      this._onChallengeProduced.bind(this,defer,bidticket),
      defer.reject.bind(defer)
    );
  };
  User.prototype.respond = function(bidticket,response,defer){
    var challenge = this.__service.challenges.get(bidticket);
    if(!challenge){
      defer.reject('No challenge for bidticket '+bidticket);
      return;
    }
    var rd = q.defer();
    this.checkChallengeResponse(bidticket,challenge.challenge,response,rd);
    rd.promise.done(
      this._onResponseChecked.bind(this,defer,bidticket),
      defer.reject.bind(rd)
    );
  };
  User.prototype.canAcceptMoreBids = function(){
    return true;
  };
  User.prototype.produceChallenge = function(offering,bidticket,defer){
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
  User.prototype.addChallenge = function(challenge){
    this.__service.challenges.add(new Challenge(this,challenge));
  };
  User.prototype.removeChallenge = function(bidticket){
    var c = this.__service.challenges.remove(bidticket);
    if(c){
      c.destroy();
    }
  };
  User.prototype.replaceChallenge = function(bidticket,newchallenge){
    var c = this.__service.challenges.replace(bidticket,new Challenge(this,newchallenge));
    if(c){
      c.destroy();
    }
  };

  return User;
}

module.exports = createUser;
