function createBidHandlerJob (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    qlib = lib.qlib,
    SessionJob = mylib.SessionJob;
  
  function BidHandlerJob (session, bid, challengedefer, defer) {
    SessionJob.call(this, session, defer);
    this.bidticket = lib.uid();
    this.bid = bid;
    this.challengedefer = challengedefer;
    this.bidActivated = false;
    this.oobError = null;
    if (this.bid && this.bid.content && this.bid.content.timeout) {
      lib.runNext(this.onTimeout.bind(this), this.bid.content.timeout*lib.intervals.Second);
    }
  }
  lib.inherit(BidHandlerJob, SessionJob);
  BidHandlerJob.prototype.destroy = function () {
    this.oobError = null;
    this.bidActivated = null;
    if (this.challengedefer) {
      this.challengedefer.reject(new lib.Error('DESTROYED', 'This bidding cycle is closed'));
    }
    this.challengedefer = null;
    this.bid = null;
    this.bidticket = null;
    SessionJob.prototype.destroy.call(this);
  };
  BidHandlerJob.prototype.onTimeout = function () {
    var error;
    if (!this.okToProceed()) {
      return;
    }
    error = new lib.Error('BID_TIMEOUT', this.bidticket);
    if (this.bidActivated) {
      this.reject(error);
      return;
    }
    this.oobError = error;
  };
  BidHandlerJob.prototype.useSession = function () {
    if (!this.okToProceed()) {
      return;
    }
    if (this.oobError) {
      this.reject(this.oobError);
      return;
    }
    try {
      qlib.promise2defer(
        this.destroyable.runBid(this.bidticket, this.bid),
        this.challengedefer
      );
    } catch (e) {
      this.reject(e);
    }
  };
  BidHandlerJob.prototype.checkResponse = function (session, bidticket, response) {
    if (!this.okToProceed()){
      return null;
    }
    if (this.destroyable !== session) {
      this.reject(new lib.Error('SESSION_MISMATCH', 'Wrong session responding to bid'));
      return null;
    }
    if (this.bidticket !== this.bidticket) {
      this.reject(new lib.Error('BID_TICKET_MISMATCH', 'Wrong bidticket responding to bid'));
      return null;
    }
    return this.bid;
  };

  mylib.BidHandler = BidHandlerJob;
}
module.exports = createBidHandlerJob;