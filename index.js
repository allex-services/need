function createServicePack(execlib){
  var execSuite = execlib.execSuite,
      ParentServicePack = execSuite.registry.get('.');

  return {
    Service: require('./servicecreator')(execlib,ParentServicePack),
    SinkMap: require('./sinkmapcreator')(execlib,ParentServicePack),
    Tasks: [{
      name: 'doBidCycle',
      klass: require('./tasks/doBidCycle')(execlib)
    }]
  };
}

module.exports = createServicePack;
