function createServicePack(execlib){
  'use strict';
  return {
    service: {
      dependencies: ['.']
    },
    sinkmap: {
      dependencies: ['.']
    },
    tasks: {
      dependencies: []
    }
  };
}

module.exports = createServicePack;
