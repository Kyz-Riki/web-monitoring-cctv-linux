/**
 * webrtc.js — WebRTC Player for go2rtc
 *
 * Usage:
 *   var player = new WebRTCPlayer(videoEl, 'cam-001');
 *   player.connect();
 *   // later: player.destroy();
 */
window.WebRTCPlayer = (function () {

  var STUN = { urls: 'stun:stun.l.google.com:19302' };
  var MAX_BACKOFF = 30000; // 30s

  function WebRTCPlayer(videoElement, streamId, options) {
    this.video = videoElement;
    this.streamId = streamId;
    this.onStateChange = (options && options.onStateChange) || null;
    this._pc = null;
    this._state = 'new';
    this._backoff = 1000;
    this._reconnectTimer = null;
    this._destroyed = false;

    // Freeze detection — health check
    this._healthInterval = null;
    this._lastTime = -1;
    this._frozenCount = 0;
  }

  WebRTCPlayer.prototype._setState = function (s) {
    if (this._state === s) return;
    this._state = s;
    if (s === 'connected') {
      this._startHealthCheck();
    } else {
      this._stopHealthCheck();
    }
    if (this.onStateChange) this.onStateChange(s);
  };

  WebRTCPlayer.prototype.getState = function () {
    return this._state;
  };

  // ---- Freeze Detection (Health Check) ----
  // Checks video.currentTime every 10s. If it hasn't advanced for
  // 2 consecutive checks (~20s) while state is 'connected', the stream
  // is considered frozen and will be automatically reconnected.

  WebRTCPlayer.prototype._startHealthCheck = function () {
    this._stopHealthCheck();
    this._lastTime = -1;
    this._frozenCount = 0;
    var self = this;

    this._healthInterval = setInterval(function () {
      if (self._destroyed || self._state !== 'connected') return;

      var now = self.video.currentTime;

      if (self._lastTime >= 0 && now === self._lastTime) {
        self._frozenCount++;
        console.warn('[WebRTC] ' + self.streamId +
          ' freeze detected (' + self._frozenCount + '/2)');

        if (self._frozenCount >= 2) {
          console.warn('[WebRTC] ' + self.streamId +
            ' confirmed frozen — auto reconnecting');
          self._frozenCount = 0;
          self._backoff = 1000;
          self.connect();       // reconnect this stream only
        }
      } else {
        self._frozenCount = 0;  // playing normally, reset counter
      }

      self._lastTime = now;
    }, 10000); // every 10 seconds
  };

  WebRTCPlayer.prototype._stopHealthCheck = function () {
    if (this._healthInterval) {
      clearInterval(this._healthInterval);
      this._healthInterval = null;
    }
    this._frozenCount = 0;
    this._lastTime = -1;
  };

  WebRTCPlayer.prototype.connect = async function () {
    if (this._destroyed) return;
    this.disconnect();
    this._setState('connecting');

    try {
      var pc = new RTCPeerConnection({ iceServers: [STUN] });
      this._pc = pc;
      var self = this;

      // Receive video only (no audio — save resources)
      pc.addTransceiver('video', { direction: 'recvonly' });

      // Attach stream to video element
      pc.ontrack = function (ev) {
        if (ev.streams && ev.streams[0]) {
          self.video.srcObject = ev.streams[0];
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = function () {
        if (self._destroyed) return;
        var cs = pc.connectionState;
        if (cs === 'connected') {
          self._setState('connected');
          self._backoff = 1000; // reset backoff on success
        } else if (cs === 'disconnected' || cs === 'failed' || cs === 'closed') {
          self._setState('disconnected');
          self._scheduleReconnect();
        }
      };

      // Create offer and wait for ICE gathering to complete
      var offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to finish
      await new Promise(function (resolve) {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = function () {
            if (pc.iceGatheringState === 'complete') resolve();
          };
        }
      });

      if (this._destroyed) { pc.close(); return; }

      // Send offer to go2rtc API
      var resp = await fetch('/api/webrtc?src=' + encodeURIComponent(this.streamId), {
        method: 'POST',
        body: pc.localDescription.sdp
      });

      if (!resp.ok) throw new Error('go2rtc responded ' + resp.status);

      var answerSdp = await resp.text();
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));

    } catch (err) {
      console.error('[WebRTC] ' + this.streamId + ' error:', err);
      this._setState('failed');
      this._scheduleReconnect();
    }
  };

  WebRTCPlayer.prototype.disconnect = function () {
    this._stopHealthCheck();
    if (this._pc) {
      this._pc.ontrack = null;
      this._pc.onconnectionstatechange = null;
      this._pc.onicegatheringstatechange = null;
      this._pc.close();
      this._pc = null;
    }
    this.video.srcObject = null;
  };

  WebRTCPlayer.prototype._scheduleReconnect = function () {
    if (this._destroyed) return;
    var self = this;
    clearTimeout(this._reconnectTimer);
    this._setState('reconnecting');
    this._reconnectTimer = setTimeout(function () {
      self.connect();
    }, this._backoff);
    // Exponential backoff
    this._backoff = Math.min(this._backoff * 2, MAX_BACKOFF);
  };

  WebRTCPlayer.prototype.reconnect = function () {
    this._backoff = 1000;
    this.connect();
  };

  WebRTCPlayer.prototype.destroy = function () {
    this._destroyed = true;
    this._stopHealthCheck();
    clearTimeout(this._reconnectTimer);
    this.disconnect();
    this._setState('disconnected');
  };

  return WebRTCPlayer;
})();
