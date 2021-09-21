function createDoBidCycleTask(execlib){
  'use strict';
  var lib = execlib.lib,
      q = lib.q,
      execSuite = execlib.execSuite,
      taskRegistry = execSuite.taskRegistry,
      SinkTask = execSuite.SinkTask;
  function DoBidCycleTask(prophash){
    SinkTask.call(this,prophash);
    this.sink = prophash.sink;
    this.bidobject = prophash.bidobject;
    this.challengeProducer = prophash.challengeProducer;
    this.cb = prophash.cb;
    this.errorcb = prophash.errorcb;
    if('function' !== typeof this.cb){
      throw new lib.Error('CB_NOT_A_FUNCTION');
    }
  }
  lib.inherit(DoBidCycleTask,SinkTask);
  DoBidCycleTask.prototype.__cleanUp = function(){
    this.errorcb = null;
    this.cb = null;
    this.challengeProducer = null;
    this.bidobject = null;
    this.sink = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  DoBidCycleTask.prototype.go = function(){
    taskRegistry.run('invokeSessionMethod',{
      sink: this.sink,
      methodname: 'bid',
      params: [this.bidobject],
      onSuccess: this.onBidResult.bind(this),
      onError: this.onBidFailed.bind(this)
    });
    /*
    this.sink.call('bid',this.bidobject).done(
      this.onBidResult.bind(this),
      this.onBidFailed.bind(this)
    );
    */
  };
  DoBidCycleTask.prototype.onBidResult = function(bidresult){
    var defer;
    if(!bidresult.bid){
      this.destroy();
      return;
    }
    if(bidresult.c){
      if (!lib.isFunction(this.challengeProducer)) {
        this.destroy();
        return;
      }
      defer = q.defer();
      this.challengeProducer(bidresult.c,defer);
      defer.promise.done(
        this.respondToChallenge.bind(this,bidresult.bid),
        this.destroy.bind(this)
      );
    }else if(bidresult.ok){
      this.cb(bidresult.ok);
      this.destroy();
    }
  };
  DoBidCycleTask.prototype.onBidFailed = function(reason){
    var errorcb = this.errorcb;
    if (this.log) {
      this.log('For bid object',this.bidobject,'bid failed',reason);
    }
    this.destroy();
    if (errorcb) {
      errorcb();
    }
  };
  DoBidCycleTask.prototype.respondToChallenge = function(bidticket,response){
    if (!this.sink) {
      return;
    }
    if(response === null){
      this.destroy();
      return;
    }
    taskRegistry.run('invokeSessionMethod',{
      sink: this.sink,
      methodname: 'respond',
      params: [bidticket, response],
      onSuccess: this.onResponseResult.bind(this),
      onError: this.onResponseFailed.bind(this,response)
    });
    /*
    this.sink.call('respond',bidticket,response).done(
      this.onResponseResult.bind(this),
      this.onResponseFailed.bind(this,response)
    );
    */
  };
  DoBidCycleTask.prototype.onResponseResult = function(responseresult){
    if(responseresult.c){
      if (this.onBidResult) {
        this.onBidResult(responseresult);
      }
    }else if(responseresult.a){
      if (this.cb) {
        this.cb(responseresult.a);
      }
      this.destroy();
    }
  };
  DoBidCycleTask.prototype.onResponseFailed = function(response,reason){
    console.error('For original response',response,'Error was thrown',reason);
    this.destroy();
  };
  DoBidCycleTask.prototype.compulsoryConstructionProperties = ['sink','bidobject','challengeProducer','cb'];
  return DoBidCycleTask;
}

module.exports = createDoBidCycleTask;
