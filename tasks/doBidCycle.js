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
    this.instancename = prophash.instancename;
    if('function' !== typeof this.cb){
      throw new lib.Error('CB_NOT_A_FUNCTION');
    }
  }
  lib.inherit(DoBidCycleTask,SinkTask);
  DoBidCycleTask.prototype.__cleanUp = function(){
    this.instancename = null;
    this.errorcb = null;
    this.cb = null;
    this.challengeProducer = null;
    this.bidobject = null;
    this.sink = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  DoBidCycleTask.prototype.onAboutToDie = function () {
    //this.justMyLog('onAboutToDie', this.__dyingException);
    if (this.__dyingException && lib.isFunction(this.errorcb)) {
      this.errorcb(this.__dyingException);
    }
  };
  DoBidCycleTask.prototype.go = function(){
    if (!(this.sink && this.sink.destroyed)) {
      //this.justMyLog('invalid sink');
      this.onBidFailed(new lib.Error('SINK_ALREADY_DESTROYED'));
      return;
    }
    //this.justMyLog('invoking bid', this.bidobject);
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
    //this.justMyLog('onBidResult', bidresult);
    if (!bidresult) {
      this.onBidFailed(new lib.Error('NO_BIDRESULT'));
      return;
    }
    if(!bidresult.bid){
      this.onBidFailed(new lib.Error('NO_BIDRESULT_BID'));
      return;
    }
    if(bidresult.c){
      if (!lib.isFunction(this.challengeProducer)) {
        this.onBidFailed(new lib.Error('NO_CHALLENGEPRODUCER_FUNCTION'));
        return;
      }
      defer = q.defer();
      this.challengeProducer(bidresult.c,defer);
      defer.promise.done(
        this.respondToChallenge.bind(this,bidresult.bid),
        this.onBidFailed.bind(this)
      );
    }else if(bidresult.ok){
      this.cb(bidresult.ok);
      this.errorcb = null;
      this.destroy();
    }
  };
  DoBidCycleTask.prototype.onBidFailed = function(reason){
    /*
    if (!reason) {
      myTrace();
    }
    console.error('While sending bid, Error was thrown',reason);
    */
    //this.justMyLog('onBidFailed', reason);
    if (this.log) {
      this.log('For bid object',this.bidobject,'bid failed',reason);
    }
    this.destroy(reason);
  };
  DoBidCycleTask.prototype.respondToChallenge = function(bidticket,response){
    if (!this.sink) {
      return;
    }
    if(response === null){
      this.onResponseFailed(new lib.Error('NULL_CHALLENGE_RESPONSE'));
      return;
    }
    //this.justMyLog('invoke respond', bidticket, response);
    taskRegistry.run('invokeSessionMethod',{
      sink: this.sink,
      methodname: 'respond',
      params: [bidticket, response],
      onSuccess: this.onResponseResult.bind(this),
      onError: this.onResponseFailed.bind(this,response)
    });
    response = null;
  };
  DoBidCycleTask.prototype.onResponseResult = function(responseresult){
    //this.justMyLog('onResponseResult', responseresult);
    if (!responseresult) {
      this.onResponseFailed(new lib.Error('NO_RESPONSE_RESULT'));
    }
    if(responseresult.c){
      if (this.onBidResult) {
        this.onBidResult(responseresult);
      }
      return;
    }
    if(responseresult.a){
      if (this.cb) {
        this.cb(responseresult.a);
      }
      this.errorcb = null;
      this.destroy();
      return;
    }
    this.onResponseFailed(new lib.Error('UNSUPPORTED_STRUCTURE_OF_RESPONSE_RESULT'));
  };
  DoBidCycleTask.prototype.onResponseFailed = function(response,reason){
    /*
    if (!reason) {
      myTrace();
    }
    console.error('For original response',response,'Error was thrown',reason);
    */
    //this.justMyLog('onResponseFailed', reason);
    this.destroy(reason);
  };

  /*
  DoBidCycleTask.prototype.justMyLog = function () {
    var args = [new Date(), this.instancename];
    Array.prototype.push.apply(args, arguments);
    console.log.apply(console, args);
  };
  */
  DoBidCycleTask.prototype.compulsoryConstructionProperties = ['sink','bidobject','challengeProducer','cb'];

  /*
  function myTrace () {
    var ol = Error.stackTraceLimit;
    Error.stackTraceLimit = Infinity;
    console.trace();
    Error.stackTraceLimit = ol;
  }
  */
  return DoBidCycleTask;
}

module.exports = createDoBidCycleTask;
