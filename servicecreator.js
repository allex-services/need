function createNeedService(execlib,ParentService){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    jobslib = require('./jobs')(execlib);

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function NeedService(prophash){
    ParentService.call(this,prophash);
    this.jobs = new lib.qlib.JobCollection();
    this.activeJob = null;
    this.exposeBid(prophash);
  }
  ParentService.inherit(NeedService,factoryCreator);
  NeedService.prototype.__cleanUp = function(){
    this.activeJob = null;
    if (this.jobs) {
      this.jobs.destroy();
    }
    this.jobs = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  function exposeBidField(needservice, bid, fieldname) {
    needservice.state.set(fieldname, bid[fieldname]);
  };
  NeedService.prototype.exposeBid = function (bid) {
    this.needFields.forEach(exposeBidField.bind(null, this, bid));
  };

  NeedService.prototype.queue = function (session, bid, challengedefer) {
    if (!this.jobs) {
      return q.reject(new lib.Error('ALREADY_DESTROYED', 'This instance is already destroyed'));
    }
    return this.jobs.run('.', new jobslib.BidHandler(session, bid, challengedefer));
  };

  NeedService.prototype.needFields = [];
  
  return NeedService;
}

module.exports = createNeedService;
