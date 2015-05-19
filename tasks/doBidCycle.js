function createDoBidCycleTask(execlib){
  var lib = execlib.lib,
      q = lib.q,
      execSuite = execlib.execSuite,
      Task = execSuite.Task;
  function DoBidCycleTask(prophash){
    Task.call(this,prophash);
    this.sink = prophash.sink;
    this.bidobject = prophash.bidobject;
    this.challengeProducer = prophash.challengeProducer;
    this.cb = prophash.cb;
    if('function' !== typeof this.cb){
      throw new lib.Error('CB_NOT_A_FUNCTION');
    }
    this.sink.destroyed.attachForSingleShot(this.destroy.bind(this));
  }
  DoBidCycleTask.prototype.destroy = function(){
    this.challengeProducer = null;
    this.bidobject = null;
    this.sink = null;
    Task.prototype.destroy.call(this);
  };
  DoBidCycleTask.prototype.go = function(){
    this.sink.call('bid',this.bidobject).done(
      this.onBidResult.bind(this),
      this.onBidFailed.bind(this)
    );
  };
  DoBidCycleTask.prototype.onBidResult = function(bidresult){
    if(bidresult.c){
      var defer = q.defer();
      this.challengeProducer(bidresult.c,defer);
      defer.done(
        this.respondToChallenge.bind(this,bidresult.bid),
        this.destroy.bind(this)
      );
    }else if(bidresult.ok){
      this.cb(bidresult.ok);
      this.destroy();
    }
  };
  DoBidCycleTask.prototype.onBidFailed = function(reason){
    console.log('bid failed',reason);
    this.destroy();
  };
  DoBidCycleTask.prototype.respondToChallenge = function(bidticket,response){
    if(response === null){
      this.destroy();
      return;
    }
    this.sink.call('respond',bidticket,response).done(
      this.onResponseResult.bind(this),
      this.onResponseFailed.bind(this,response)
    );
  };
  DoBidCycleTask.prototype.onResponseResult = function(responseresult){
    if(responseresult.c){
      this.onBidResult(responseresult);
    }else if(responseresult.a){
      this.cb(responseresult.a);
      this.destroy();
    }
  };
  DoBidCycleTask.prototype.compulsoryConstructionProperties = ['sink','bidobject','challengeProducer','cb'];
  return DoBidCycleTask;
}

module.exports = createDoBidCycleTask;
