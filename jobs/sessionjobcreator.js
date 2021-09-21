function createSessionJob (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    qlib = lib.qlib,
    JobOnDestroyable = qlib.JobOnDestroyable;

  function SessionJob (session, defer) {
    JobOnDestroyable.call(this, session, defer);
    this.destroyedListener = null;
    if (!(session && session.destroyed)) {
      this.reject(new lib.Error('SESSION_DESTROYED', 'This session is destroyed'));
      return;
    }
    this.destroyedListener = session.destroyed.attach(this.onSessionDestroyed.bind(this));
  }
  lib.inherit(SessionJob, JobOnDestroyable);
  SessionJob.prototype.destroy = function () {
    if (this.destroyable &&
      this.destroyable.user &&
      this.destroyable.user.__service &&
      this.destroyable.user.__service.activeJob
    ) {
      this.destroyable.user.__service.activeJob = null;
    }
    if (this.destroyedListener) {
      this.destroyedListener.destroy();
    }
    this.destroyedListener = null;
    JobOnDestroyable.prototype.destroy.call(this);
  };
  SessionJob.prototype.onSessionDestroyed = function (exception) {
    this.reject(exception || new lib.Error('SESSION_DESTROYED', 'This session is destroyed'));
  };
  SessionJob.prototype._isDestroyableOk = function () {
    var ret = JobOnDestroyable.prototype._isDestroyableOk.call(this);
    if (!ret) {
      return ret;
    }
    return (
      this.destroyable.user && 
      this.destroyable.user.destroyed &&
      this.destroyable.user.__service &&
      this.destroyable.user.__service.destroyed
    );
  };

  SessionJob.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    this.getService().activeJob = this;
    this.useSession();
    return ok.val;
  };

  SessionJob.prototype.getUser = function () {
    if (!this.okToProceed()) {
      return null;
    }
    return this.destroyable.user;
  };
  SessionJob.prototype.getService = function () {
    if (!this.okToProceed()) {
      return null;
    }
    return this.destroyable.user.__service;
  };

  mylib.SessionJob = SessionJob;
}
module.exports = createSessionJob;