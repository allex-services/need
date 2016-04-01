function createNeedService(execlib,ParentServicePack){
  'use strict';
  var ParentService = ParentServicePack.Service,
      lib = execlib.lib;

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function NeedService(prophash){
    ParentService.call(this,prophash);
    this.bids = new lib.Map();
    this.exposeBid(prophash);
  }
  ParentService.inherit(NeedService,factoryCreator);
  NeedService.prototype.__cleanUp = function(){
    this.bids.destroy();
    this.bids = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  function exposeBidField(needservice, bid, fieldname) {
    needservice.state.set(fieldname, bid[fieldname]);
  };
  NeedService.prototype.exposeBid = function (bid) {
    this.needFields.forEach(exposeBidField.bind(null, this, bid));
  };
  NeedService.prototype.needFields = [];
  
  return NeedService;
}

module.exports = createNeedService;
