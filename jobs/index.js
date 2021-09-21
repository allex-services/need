function createJobsLib (execlib) {
  'use strict';
  
  var mylib = {};

  require('./sessionjobcreator')(execlib, mylib);
  require('./bidhandlercreator')(execlib, mylib);

  return mylib;
}
module.exports = createJobsLib;