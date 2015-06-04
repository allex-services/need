function createNeedService(execlib,ParentServicePack){
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
    var state = this.state;
    this.needFields.forEach(function(need){
      state.set(need,prophash[need]);
    });
  }
  ParentService.inherit(NeedService,factoryCreator);
  NeedService.prototype.__cleanUp = function(){
    this.bids.destroy();
    this.bids = null;
    ParentService.prototype.__cleanUp.call(this);
  };
  NeedService.prototype.needFields = [];
  
  return NeedService;
}

module.exports = createNeedService;
