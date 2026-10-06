/**
 * mse.js — MSE (Media Source Extensions) Player for go2rtc
 *
 * Drop-in replacement for WebRTCPlayer.
 * Uses go2rtc's /api/ws WebSocket endpoint with MSE SourceBuffer.
 * - Hardware-accelerated H.264 decoding via native browser SourceBuffer
 * - Low-latency catch-up logic: auto-seeks to live edge when buffer grows
 * - Lightweight batching: reduces appendBuffer() calls for multi-cam grids
 *
 * Usage:
 *   var player = new MSEPlayer(videoEl, 'cam-001');
 *   player.connect();
 *   // later: player.destroy();
 */
window.MSEPlayer = (function () {

  var MAX_BACKOFF = 30000;        // 30s max reconnect delay
  var CATCH_UP_THRESHOLD = 1.5;   // seconds behind live edge before auto-seek
  var CATCH_UP_TARGET = 0.1;      // seek to this many seconds before live edge
  var CATCH_UP_INTERVAL = 2000;   // check catch-up every 2 seconds
  var BUFFER_CLEANUP_KEEP = 10;   // keep last 10s of buffer, remove older
  var BATCH_INTERVAL = 200;       // batch append every 200ms (5 appends/sec per stream)

  function MSEPlayer(videoElement, streamId, options) {
    this.video = videoElement;
    this.streamId = streamId;
    this.onStateChange = (options && options.onStateChange) || null;
    this._state = 'new';
    this._backoff = 1000;
    this._reconnectTimer = null;
    this._destroyed = false;

    // MSE objects
    this._ws = null;
    this._mediaSource = null;
    this._sourceBuffer = null;
    this._objectUrl = null;

    // Batching queue
    this._batchQueue = [];
    this._batchTimer = null;
    this._appending = false;

    // Catch-up (low-latency) timer
    this._catchUpInterval = null;

    // Freeze detection — health check
    this._healthInterval = null;
    this._lastTime = -1;
    this._frozenCount = 0;

    // Track if first data received (for state transition)
    this._firstDataReceived = false;
  }

  // ---- State Management ----

  MSEPlayer.prototype._setState = function (s) {
    if (this._state === s) return;
    this._state = s;
    if (s === 'connected') {
      this._startHealthCheck();
      this._startCatchUp();
    } else {
      this._stopHealthCheck();
      this._stopCatchUp();
    }
    if (this.onStateChange) this.onStateChange(s);
  };

  MSEPlayer.prototype.getState = function () {
    return this._state;
  };

  // ---- Freeze Detection (Health Check) ----

  MSEPlayer.prototype._startHealthCheck = function () {
    this._stopHealthCheck();
    this._lastTime = -1;
    this._frozenCount = 0;
    var self = this;

    this._healthInterval = setInterval(function () {
      if (self._destroyed || self._state !== 'connected') return;

      var now = self.video.currentTime;

      if (self._lastTime >= 0 && now === self._lastTime) {
        self._frozenCount++;
        console.warn('[MSE] ' + self.streamId +
          ' freeze detected (' + self._frozenCount + '/2)');

        if (self._frozenCount >= 2) {
          console.warn('[MSE] ' + self.streamId +
            ' confirmed frozen — auto reconnecting');
          self._frozenCount = 0;
          self._backoff = 1000;
          self.connect();
        }
      } else {
        self._frozenCount = 0;
      }

      self._lastTime = now;
    }, 10000);
  };

  MSEPlayer.prototype._stopHealthCheck = function () {
    if (this._healthInterval) {
      clearInterval(this._healthInterval);
      this._healthInterval = null;
    }
    this._frozenCount = 0;
    this._lastTime = -1;
  };

  // ---- Catch-Up Logic (Low Latency) ----
  // If the playback position falls behind the live edge by more than
  // CATCH_UP_THRESHOLD seconds, auto-seek to near the live edge.
  // This keeps latency close to <1 second.

  MSEPlayer.prototype._startCatchUp = function () {
    this._stopCatchUp();
    var self = this;

    this._catchUpInterval = setInterval(function () {
      if (self._destroyed || self._state !== 'connected') return;
      var video = self.video;

      if (!video.buffered || video.buffered.length === 0) return;

      var liveEdge = video.buffered.end(video.buffered.length - 1);
      var behind = liveEdge - video.currentTime;

      if (behind > CATCH_UP_THRESHOLD) {
        var seekTarget = liveEdge - CATCH_UP_TARGET;
        video.currentTime = seekTarget;
      }
    }, CATCH_UP_INTERVAL);
  };

  MSEPlayer.prototype._stopCatchUp = function () {
    if (this._catchUpInterval) {
      clearInterval(this._catchUpInterval);
      this._catchUpInterval = null;
    }
  };

  // ---- Buffer Cleanup ----
  // Remove old buffered data to prevent memory bloat.

  MSEPlayer.prototype._cleanupBuffer = function () {
    if (!this._sourceBuffer || this._sourceBuffer.updating) return;
    if (!this.video.buffered || this.video.buffered.length === 0) return;

    var start = this.video.buffered.start(0);
    var cleanTo = this.video.currentTime - BUFFER_CLEANUP_KEEP;

    if (cleanTo > start) {
      try {
        this._sourceBuffer.remove(start, cleanTo);
      } catch (e) {
        // Ignore — buffer may be in use
      }
    }
  };

  // ---- Batching ----
  // Collect WebSocket messages and append in batches to reduce
  // appendBuffer() call frequency.

  MSEPlayer.prototype._enqueueData = function (data) {
    this._batchQueue.push(data);

    if (!this._batchTimer && !this._appending) {
      var self = this;
      this._batchTimer = setTimeout(function () {
        self._batchTimer = null;
        self._flushBatch();
      }, BATCH_INTERVAL);
    }
  };

  MSEPlayer.prototype._flushBatch = function () {
    if (this._destroyed || !this._sourceBuffer || this._appending) return;
    if (this._batchQueue.length === 0) return;
    if (this._sourceBuffer.updating) {
      // Retry after a short delay
      var self = this;
      this._batchTimer = setTimeout(function () {
        self._batchTimer = null;
        self._flushBatch();
      }, 50);
      return;
    }

    // Merge all queued chunks into a single Uint8Array
    var totalLen = 0;
    for (var i = 0; i < this._batchQueue.length; i++) {
      totalLen += this._batchQueue[i].byteLength;
    }
    var merged = new Uint8Array(totalLen);
    var offset = 0;
    for (var j = 0; j < this._batchQueue.length; j++) {
      merged.set(new Uint8Array(this._batchQueue[j]), offset);
      offset += this._batchQueue[j].byteLength;
    }
    this._batchQueue = [];

    this._appending = true;
    var self = this;

    try {
      this._sourceBuffer.appendBuffer(merged);
    } catch (e) {
      console.error('[MSE] ' + this.streamId + ' appendBuffer error:', e.message);
      this._appending = false;
      this._setState('failed');
      this._scheduleReconnect();
      return;
    }

    // Wait for updateend before allowing next append
    var onUpdateEnd = function () {
      self._sourceBuffer.removeEventListener('updateend', onUpdateEnd);
      self._appending = false;

      // Transition to connected on first successful append
      if (!self._firstDataReceived) {
        self._firstDataReceived = true;
        self._setState('connected');
        self._backoff = 1000;

        // Ensure video is playing
        var playPromise = self.video.play();
        if (playPromise) {
          playPromise.catch(function () {});
        }
      }

      // Periodic buffer cleanup
      self._cleanupBuffer();

      // If more data queued during append, flush again
      if (self._batchQueue.length > 0) {
        self._flushBatch();
      }
    };

    this._sourceBuffer.addEventListener('updateend', onUpdateEnd);
  };

  // ---- Connect ----

  MSEPlayer.prototype.connect = function () {
    if (this._destroyed) return;
    this.disconnect();
    this._setState('connecting');
    this._firstDataReceived = false;

    var self = this;

    // Check MSE support
    if (typeof MediaSource === 'undefined') {
      console.error('[MSE] ' + this.streamId + ' MediaSource API not supported');
      this._setState('failed');
      return;
    }

    // Create MediaSource
    var mediaSource = new MediaSource();
    this._mediaSource = mediaSource;

    this._objectUrl = URL.createObjectURL(mediaSource);
    this.video.src = this._objectUrl;

    mediaSource.addEventListener('sourceopen', function () {
      if (self._destroyed) return;

      // Add SourceBuffer for H.264 video
      var mimeCodec = 'video/mp4; codecs="avc1.640029"';

      if (!MediaSource.isTypeSupported(mimeCodec)) {
        // Fallback to baseline profile
        mimeCodec = 'video/mp4; codecs="avc1.42E01E"';
      }

      if (!MediaSource.isTypeSupported(mimeCodec)) {
        console.error('[MSE] ' + self.streamId + ' no supported codec found');
        self._setState('failed');
        self._scheduleReconnect();
        return;
      }

      try {
        var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
        self._sourceBuffer = sourceBuffer;
        sourceBuffer.mode = 'segments';
      } catch (e) {
        console.error('[MSE] ' + self.streamId + ' addSourceBuffer error:', e.message);
        self._setState('failed');
        self._scheduleReconnect();
        return;
      }

      // Now open WebSocket to go2rtc
      self._connectWebSocket();
    });
  };

  MSEPlayer.prototype._connectWebSocket = function () {
    if (this._destroyed) return;

    var wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    var wsUrl = wsProtocol + '//' + window.location.host +
      '/api/ws?src=' + encodeURIComponent(this.streamId);

    var ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    this._ws = ws;

    var self = this;

    ws.onmessage = function (ev) {
      if (self._destroyed) return;
      if (ev.data instanceof ArrayBuffer) {
        self._enqueueData(ev.data);
      }
    };

    ws.onerror = function () {
      if (self._destroyed) return;
      console.error('[MSE] ' + self.streamId + ' WebSocket error');
    };

    ws.onclose = function () {
      if (self._destroyed) return;
      console.warn('[MSE] ' + self.streamId + ' WebSocket closed');
      self._setState('failed');
      self._scheduleReconnect();
    };
  };

  // ---- Disconnect ----

  MSEPlayer.prototype.disconnect = function () {
    this._stopHealthCheck();
    this._stopCatchUp();

    // Clear batch queue & timer
    this._batchQueue = [];
    this._appending = false;
    if (this._batchTimer) {
      clearTimeout(this._batchTimer);
      this._batchTimer = null;
    }

    // Close WebSocket
    if (this._ws) {
      this._ws.onmessage = null;
      this._ws.onerror = null;
      this._ws.onclose = null;
      if (this._ws.readyState < 2) this._ws.close();
      this._ws = null;
    }

    // Clean up SourceBuffer
    this._sourceBuffer = null;

    // Close MediaSource
    if (this._mediaSource) {
      if (this._mediaSource.readyState === 'open') {
        try { this._mediaSource.endOfStream(); } catch (e) {}
      }
      this._mediaSource = null;
    }

    // Revoke Object URL & reset video
    if (this._objectUrl) {
      URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = null;
    }
    this.video.removeAttribute('src');
    this.video.load();
  };

  // ---- Reconnect ----

  MSEPlayer.prototype._scheduleReconnect = function () {
    if (this._destroyed) return;
    var self = this;
    clearTimeout(this._reconnectTimer);
    this._setState('reconnecting');
    this._reconnectTimer = setTimeout(function () {
      self.connect();
    }, this._backoff);
    this._backoff = Math.min(this._backoff * 2, MAX_BACKOFF);
  };

  MSEPlayer.prototype.reconnect = function () {
    this._backoff = 1000;
    this.connect();
  };

  // ---- Destroy ----

  MSEPlayer.prototype.destroy = function () {
    this._destroyed = true;
    this._stopHealthCheck();
    this._stopCatchUp();
    clearTimeout(this._reconnectTimer);
    this.disconnect();
    this._setState('disconnected');
  };

  return MSEPlayer;
})();
