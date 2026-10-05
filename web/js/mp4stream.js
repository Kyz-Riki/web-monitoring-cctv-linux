/**
 * mp4stream.js — Direct MP4 Stream Player for go2rtc
 *
 * Drop-in replacement for WebRTCPlayer.
 * Uses go2rtc's /api/stream.mp4 endpoint — zero JS overhead for streaming.
 * The browser handles all buffering and decoding natively.
 *
 * Usage:
 *   var player = new MP4StreamPlayer(videoEl, 'cam-001');
 *   player.connect();
 *   // later: player.destroy();
 */
window.MP4StreamPlayer = (function () {

  var MAX_BACKOFF = 30000; // 30s

  function MP4StreamPlayer(videoElement, streamId, options) {
    this.video = videoElement;
    this.streamId = streamId;
    this.onStateChange = (options && options.onStateChange) || null;
    this._state = 'new';
    this._backoff = 1000;
    this._reconnectTimer = null;
    this._destroyed = false;

    // Freeze detection — health check
    this._healthInterval = null;
    this._lastTime = -1;
    this._frozenCount = 0;

    // Track event listeners for clean removal
    this._onPlaying = null;
    this._onError = null;
    this._onStalled = null;
    this._onAbort = null;
  }

  MP4StreamPlayer.prototype._setState = function (s) {
    if (this._state === s) return;
    this._state = s;
    if (s === 'connected') {
      this._startHealthCheck();
    } else {
      this._stopHealthCheck();
    }
    if (this.onStateChange) this.onStateChange(s);
  };

  MP4StreamPlayer.prototype.getState = function () {
    return this._state;
  };

  // ---- Freeze Detection (Health Check) ----
  // Checks video.currentTime every 10s. If it hasn't advanced for
  // 2 consecutive checks (~20s) while state is 'connected', the stream
  // is considered frozen and will be automatically reconnected.

  MP4StreamPlayer.prototype._startHealthCheck = function () {
    this._stopHealthCheck();
    this._lastTime = -1;
    this._frozenCount = 0;
    var self = this;

    this._healthInterval = setInterval(function () {
      if (self._destroyed || self._state !== 'connected') return;

      var now = self.video.currentTime;

      if (self._lastTime >= 0 && now === self._lastTime) {
        self._frozenCount++;
        console.warn('[MP4Stream] ' + self.streamId +
          ' freeze detected (' + self._frozenCount + '/2)');

        if (self._frozenCount >= 2) {
          console.warn('[MP4Stream] ' + self.streamId +
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

  MP4StreamPlayer.prototype._stopHealthCheck = function () {
    if (this._healthInterval) {
      clearInterval(this._healthInterval);
      this._healthInterval = null;
    }
    this._frozenCount = 0;
    this._lastTime = -1;
  };

  MP4StreamPlayer.prototype.connect = function () {
    if (this._destroyed) return;
    this.disconnect();
    this._setState('connecting');

    var self = this;
    var video = this.video;

    // Build MP4 stream URL from go2rtc
    var streamUrl = '/api/stream.mp4?src=' + encodeURIComponent(this.streamId);

    // Event: video starts playing → connected
    this._onPlaying = function () {
      if (self._destroyed) return;
      self._setState('connected');
      self._backoff = 1000; // reset backoff on success
    };

    // Event: video error → reconnect
    this._onError = function () {
      if (self._destroyed) return;
      var err = video.error;
      console.error('[MP4Stream] ' + self.streamId + ' error:',
        err ? err.message : 'unknown');
      self._setState('failed');
      self._scheduleReconnect();
    };

    // Event: stalled (network issues) — let health check handle it
    this._onStalled = function () {
      if (self._destroyed) return;
      console.warn('[MP4Stream] ' + self.streamId + ' stalled');
    };

    // Attach listeners
    video.addEventListener('playing', this._onPlaying);
    video.addEventListener('error', this._onError);
    video.addEventListener('stalled', this._onStalled);

    // Set source and play — the browser handles everything
    video.src = streamUrl;
    video.load();

    var playPromise = video.play();
    if (playPromise) {
      playPromise.catch(function (err) {
        // Autoplay blocked or load error
        if (self._destroyed) return;
        console.warn('[MP4Stream] ' + self.streamId + ' play() rejected:', err.message);
        // Don't treat autoplay block as fatal — video might still play when visible
      });
    }
  };

  MP4StreamPlayer.prototype.disconnect = function () {
    this._stopHealthCheck();

    // Remove event listeners
    if (this._onPlaying) {
      this.video.removeEventListener('playing', this._onPlaying);
      this._onPlaying = null;
    }
    if (this._onError) {
      this.video.removeEventListener('error', this._onError);
      this._onError = null;
    }
    if (this._onStalled) {
      this.video.removeEventListener('stalled', this._onStalled);
      this._onStalled = null;
    }

    // Stop video and release source
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load(); // reset the video element
  };

  MP4StreamPlayer.prototype._scheduleReconnect = function () {
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

  MP4StreamPlayer.prototype.reconnect = function () {
    this._backoff = 1000;
    this.connect();
  };

  MP4StreamPlayer.prototype.destroy = function () {
    this._destroyed = true;
    this._stopHealthCheck();
    clearTimeout(this._reconnectTimer);
    this.disconnect();
    this._setState('disconnected');
  };

  return MP4StreamPlayer;
})();
