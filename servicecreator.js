function createNeedService(execlib,ParentServicePack){
  var ParentService = ParentServicePack.Service;

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function NeedService(prophash){
    ParentService.call(this,prophash);
    this.needFields.forEach(function(need){
      this.data.set(need,prophash[need]);
    });
  }
  ParentService.inherit(NeedService,factoryCreator);
  NeedService.prototype.__cleanUp = function(){
    ParentService.prototype.__cleanUp.call(this);
  };
  NeedService.prototype.needFields = [];
  
  return NeedService;
}

module.exports = createNeedService;
