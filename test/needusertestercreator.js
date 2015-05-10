function createNeedUserTester(execlib,Tester){
  var lib = execlib.lib,
      q = lib.q;

  function NeedUserTester(prophash,client){
    Tester.call(this,prophash,client);
    console.log('runNext finish');
    lib.runNext(this.finish.bind(this,0));
  }
  lib.inherit(NeedUserTester,Tester);

  return NeedUserTester;
}

module.exports = createNeedUserTester;
