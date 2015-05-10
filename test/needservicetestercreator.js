function createNeedServiceTester(execlib,Tester){
  var lib = execlib.lib,
      q = lib.q;

  function NeedServiceTester(prophash,client){
    Tester.call(this,prophash,client);
    console.log('runNext finish');
    lib.runNext(this.finish.bind(this,0));
  }
  lib.inherit(NeedServiceTester,Tester);

  return NeedServiceTester;
}

module.exports = createNeedServiceTester;
