/**
 * monitor.js — Monitor Page Logic
 * Reads ?id=1 or ?id=2, loads the assigned preset, builds the video grid,
 * and connects MSE streams via go2rtc WebSocket.
 */
(function () {
  /* ---- State ---- */
  var monitorId = '1';
  var players = [];       // MSEPlayer instances
  var zoomedTile = null;  // currently zoomed tile element
  var idleTimer = null;
  var bc = null;          // BroadcastChannel

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', async function () {
    // Parse monitor ID from URL
    var params = new URLSearchParams(window.location.search);
    monitorId = params.get('id') || '1';

    document.getElementById('monitor-label').textContent = 'Monitor ' + monitorId;

    try {
      await ConfigManager.init();
      await PresetManager.init();
    } catch (err) {
      console.error('Failed to load config:', err);
      document.getElementById('monitor-label').textContent = 'Error loading config';
      return;
    }

    loadActivePreset();

    // Cross-tab sync via localStorage
    window.addEventListener('storage', function (e) {
      if (e.key === 'cctv_monitor_' + monitorId) {
        loadActivePreset();
      }
    });

    // Cross-tab sync via BroadcastChannel
    try {
      bc = new BroadcastChannel('cctv-monitor');
      bc.onmessage = function (e) {
        if (!e.data) return;
        
        if (e.data.type === 'preset-change' && String(e.data.monitorId) === monitorId) {
          loadActivePreset();
        } else if (e.data.type === 'preset-updated') {
          // If the preset we are currently showing was updated, reload it
          var currentPresetId = PresetManager.getMonitorPresetId(monitorId);
          if (currentPresetId === e.data.presetId) {
            loadActivePreset();
          }
        } else if (e.data.type === 'preset-deleted' && String(e.data.monitorId) === monitorId) {
           loadActivePreset();
        }
      };
    } catch (err) { /* BroadcastChannel not supported */ }

    // Fullscreen button
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

    // Fullscreen change event
    document.addEventListener('fullscreenchange', function () {
      document.body.classList.toggle('is-fullscreen', !!document.fullscreenElement);
      setupIdleHide();
    });

    // Escape to exit zoom
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && zoomedTile) {
        exitZoom();
      }
    });
  });

  /* ---- Preset Loading ---- */
  function loadActivePreset() {
    var presetId = PresetManager.getMonitorPresetId(monitorId);
    var preset = presetId ? PresetManager.getPresetById(presetId) : null;

    // Fallback: use first available preset
    if (!preset) {
      var all = PresetManager.getPresets();
      if (all.length > 0) {
        preset = all[0];
        PresetManager.setMonitorPresetId(monitorId, preset.id);
      }
    }

    // Update UI
    document.getElementById('preset-name').textContent = preset ? preset.name : 'Tidak ada preset';

    disconnectAllStreams();
    if (preset) {
      buildGrid(preset);
      connectAllStreams(preset);
    }
  }

  /* ---- Grid Building ---- */
  function buildGrid(preset) {
    var grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(' + preset.columns + ', 1fr)';
    grid.style.gridTemplateRows = 'repeat(' + preset.rows + ', 1fr)';

    var totalSlots = preset.rows * preset.columns;
    // Build slot map
    var slotMap = {};
    (preset.slots || []).forEach(function (s) { slotMap[s.position] = s.camera_id; });

    for (var i = 0; i < totalSlots; i++) {
      var camId = slotMap[i];
      if (camId) {
        var camera = ConfigManager.getCameraById(camId);
        grid.appendChild(createTile(i, camId, camera));
      } else {
        grid.appendChild(createEmptyTile(i));
      }
    }
    zoomedTile = null;
  }

  function createTile(position, camId, camera) {
    var tile = document.createElement('div');
    tile.className = 'video-tile show-status';
    tile.dataset.position = position;
    tile.dataset.camId = camId;

    var video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    // Optimasi performa render di sisi client
    video.setAttribute('decoding', 'async');
    video.style.transform = 'translateZ(0)';
    video.style.willChange = 'contents';
    tile.appendChild(video);

    var name = document.createElement('div');
    name.className = 'tile-name';
    name.textContent = camera ? camera.name : camId;
    tile.appendChild(name);

    var dot = document.createElement('div');
    dot.className = 'tile-status-dot connecting';
    tile.appendChild(dot);

    var statusText = document.createElement('div');
    statusText.className = 'tile-status-text';
    statusText.textContent = 'Menghubungkan...';
    tile.appendChild(statusText);

    var reconnectBtn = document.createElement('button');
    reconnectBtn.className = 'tile-reconnect';
    reconnectBtn.textContent = 'Reconnect';
    reconnectBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var player = players.find(function (p) { return p.streamId === camId; });
      if (player) player.reconnect();
    });
    tile.appendChild(reconnectBtn);

    // Click to zoom
    tile.addEventListener('click', function () {
      if (zoomedTile === tile) {
        exitZoom();
      } else {
        enterZoom(tile);
      }
    });

    return tile;
  }

  function createEmptyTile(position) {
    var tile = document.createElement('div');
    tile.className = 'video-tile empty';
    tile.dataset.position = position;

    var label = document.createElement('span');
    label.className = 'empty-label';
    label.textContent = 'Kosong';
    tile.appendChild(label);
    return tile;
  }

  /* ---- Stream Connection ---- */
  function connectAllStreams(preset) {
    var slotMap = {};
    (preset.slots || []).forEach(function (s) { slotMap[s.position] = s.camera_id; });

    var tiles = document.querySelectorAll('.video-tile[data-cam-id]');
    tiles.forEach(function (tile) {
      var camId = tile.dataset.camId;
      var video = tile.querySelector('video');
      if (!video || !camId) return;

      var player = new MSEPlayer(video, camId, {
        onStateChange: function (state) {
          updateTileStatus(tile, state);
        }
      });
      players.push(player);
      player.connect();
    });
  }

  function disconnectAllStreams() {
    players.forEach(function (p) { p.destroy(); });
    players = [];
  }

  function updateTileStatus(tile, state) {
    var dot = tile.querySelector('.tile-status-dot');
    var text = tile.querySelector('.tile-status-text');
    var reconnectBtn = tile.querySelector('.tile-reconnect');

    // Reset classes
    dot.className = 'tile-status-dot';

    switch (state) {
      case 'connected':
        dot.classList.add('online');
        tile.classList.remove('show-status');
        break;
      case 'connecting':
        dot.classList.add('connecting');
        text.textContent = 'Menghubungkan...';
        tile.classList.add('show-status');
        if (reconnectBtn) reconnectBtn.style.display = 'none';
        break;
      case 'reconnecting':
        dot.classList.add('reconnecting');
        text.textContent = 'Reconnecting...';
        tile.classList.add('show-status');
        if (reconnectBtn) reconnectBtn.style.display = 'block';
        break;
      case 'failed':
      case 'disconnected':
        dot.classList.add('offline');
        text.textContent = 'Offline';
        tile.classList.add('show-status');
        if (reconnectBtn) reconnectBtn.style.display = 'block';
        break;
      default:
        dot.classList.add('connecting');
        text.textContent = 'Memuat...';
        tile.classList.add('show-status');
    }
  }

  /* ---- Zoom ---- */
  function enterZoom(tile) {
    // Hide all tiles except the zoomed one
    var allTiles = document.querySelectorAll('.video-tile');
    allTiles.forEach(function (t) {
      if (t !== tile) t.style.display = 'none';
    });
    tile.classList.add('zoomed');
    zoomedTile = tile;

    // Update grid to 1×1
    var grid = document.getElementById('video-grid');
    grid.style.gridTemplateColumns = '1fr';
    grid.style.gridTemplateRows = '1fr';
  }

  function exitZoom() {
    if (!zoomedTile) return;
    // Restore all tiles
    var allTiles = document.querySelectorAll('.video-tile');
    allTiles.forEach(function (t) { t.style.display = ''; });
    zoomedTile.classList.remove('zoomed');
    zoomedTile = null;

    // Rebuild grid size from current preset
    var presetId = PresetManager.getMonitorPresetId(monitorId);
    var preset = PresetManager.getPresetById(presetId);
    if (preset) {
      var grid = document.getElementById('video-grid');
      grid.style.gridTemplateColumns = 'repeat(' + preset.columns + ', 1fr)';
      grid.style.gridTemplateRows = 'repeat(' + preset.rows + ', 1fr)';
    }
  }

  /* ---- Fullscreen ---- */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else {
      document.exitFullscreen();
    }
  }

  /* ---- Idle hide top bar in fullscreen ---- */
  function setupIdleHide() {
    if (!document.fullscreenElement) {
      document.body.classList.remove('is-fullscreen');
      clearTimeout(idleTimer);
      return;
    }
    resetIdleTimer();
    document.addEventListener('mousemove', resetIdleTimer);
  }

  function resetIdleTimer() {
    document.body.classList.add('show-bar');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      document.body.classList.remove('show-bar');
    }, 3000);
  }
})();
