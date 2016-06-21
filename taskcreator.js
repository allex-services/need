function createTasks(execlib) {
  'use strict';

  return [{
    name: 'doBidCycle',
    klass: require('./tasks/doBidCycle')(execlib)
  }];
}

module.exports = createTasks;
