function createUser(execlib,ParentUser){
  var lib = execlib.lib,
      q = lib.q;

  if(!ParentUser){
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function User(prophash){
    ParentUser.call(this,prophash);
  }
  ParentUser.inherit(User,require('../methoddescriptors/user'));
  User.prototype.__cleanUp = function(){
    ParentUser.prototype.__cleanUp.call(this);
  };
  User.prototype._onChallengeProduced = function(defer,bidticket,challenge){
    var und;
    if(und === challenge){
      this.__service.bids.remove(bidticket);
      defer.resolve({rejected:true});
    }else if(und === null){
      this.__service.bids.remove(bidticket);
      defer.resolve({ok:bidticket});
    }else{
      this.__service.bids.replace(bidticket,challenge);
      if(challenge.timeout){
        lib.runNext(this.__service.bids.remove.bind(this.__service.bids,bidticket),challenge.timeout*1000);
      }
      defer.resolve({bid:bidticket,c:challenge});
    }
  };
  User.prototype._onResponseChecked = function(defer,bidticket,newchallenge){
    if(!newchallenge){
      this.__service.bids.remove(bidticket);
      defer.resolve({a:bidticket});
      return;
    }
    this.__service.bids.replace(bidticket,newchallenge);
    defer.resolve({c:newchallenge});
  };
  User.prototype.bid = function(offering,defer){
    if(!this.canAcceptMoreBids()){
      defer.reject('Cannot accept more bids');
      return;
    }
    var bidticket = lib.uid();
    try{
      this.__service.bids.add(bidticket,offering);
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
    var challenge = this.__service.bids.get(bidticket);
    if(!challenge){
      defer.reject('No challenge for bidticket '+bidticket);
      return;
    }
    var rd = q.defer();
    this.checkChallengeResponse(bidticket,challenge,response,rd);
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

  return User;
}

module.exports = createUser;
