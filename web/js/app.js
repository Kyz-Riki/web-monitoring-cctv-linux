/**
 * app.js — Dashboard Main Logic
 * Handles tabs, preset list, monitor control, camera table, toasts, modals.
 */

/* ---- Toast ---- */
function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

/* ---- Modal ---- */
function showConfirm(message) {
  return new Promise(function (resolve) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
        '<h3>Konfirmasi</h3>' +
        '<p>' + message + '</p>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-secondary" id="modal-cancel">Batal</button>' +
          '<button class="btn btn-danger" id="modal-ok">Ya, Lanjutkan</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#modal-cancel').onclick = function () { overlay.remove(); resolve(false); };
    overlay.querySelector('#modal-ok').onclick = function () { overlay.remove(); resolve(true); };
  });
}

function showPrompt(message, defaultValue) {
  return new Promise(function (resolve) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
        '<h3>' + message + '</h3>' +
        '<input type="text" id="modal-input" value="' + (defaultValue || '') + '">' +
        '<div class="modal-actions">' +
          '<button class="btn btn-secondary" id="modal-cancel">Batal</button>' +
          '<button class="btn btn-primary" id="modal-ok">OK</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    var input = overlay.querySelector('#modal-input');
    input.focus();
    input.select();
    overlay.querySelector('#modal-cancel').onclick = function () { overlay.remove(); resolve(null); };
    overlay.querySelector('#modal-ok').onclick = function () { overlay.remove(); resolve(input.value); };
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { overlay.remove(); resolve(input.value); }
    });
  });
}

/* ---- Broadcast Channel ---- */
var bc = null;
try { bc = new BroadcastChannel('cctv-monitor'); } catch (e) {}

/* ---- Tab Management ---- */
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(function (panel) {
    panel.classList.toggle('active', panel.id === 'tab-' + tabName);
  });

  // Render tab content on activation
  if (tabName === 'presets') renderPresetList();
  if (tabName === 'monitors') renderMonitorControl();
  if (tabName === 'cameras') renderCameraList();
}

/* ---- Preset List ---- */
function renderPresetList() {
  var container = document.getElementById('preset-list');
  container.innerHTML = '';

  var presets = PresetManager.getPresets();
  var m1 = PresetManager.getMonitorPresetId('1');
  var m2 = PresetManager.getMonitorPresetId('2');

  presets.forEach(function (preset) {
    var card = document.createElement('div');
    card.className = 'preset-card';

    var camCount = (preset.slots || []).length;

    var badgesHtml = '';
    if (preset.id === m1) badgesHtml += '<span class="badge badge-blue">Monitor 1</span>';
    if (preset.id === m2) badgesHtml += '<span class="badge badge-green">Monitor 2</span>';

    card.innerHTML =
      '<div class="preset-title">' + escHtml(preset.name) + '</div>' +
      '<div class="preset-info">' + preset.columns + '×' + preset.rows + ' grid · ' + camCount + ' kamera</div>' +
      '<div class="preset-badges">' + badgesHtml + '</div>' +
      '<div class="preset-actions">' +
        '<button class="btn btn-secondary btn-sm btn-edit" title="Edit di Layout Designer">Edit</button>' +
        '<button class="btn btn-secondary btn-sm btn-dup" title="Duplikasi">Duplikat</button>' +
        '<button class="btn btn-danger btn-sm btn-del" title="Hapus">Hapus</button>' +
        '<button class="btn btn-monitor btn-sm btn-m1" title="Terapkan ke Monitor 1">→ M1</button>' +
        '<button class="btn btn-monitor btn-sm btn-m2" title="Terapkan ke Monitor 2">→ M2</button>' +
      '</div>';

    // Edit
    card.querySelector('.btn-edit').addEventListener('click', function () {
      LayoutDesigner.loadPreset(preset);
      switchTab('designer');
    });

    // Duplicate
    card.querySelector('.btn-dup').addEventListener('click', async function () {
      var name = await showPrompt('Nama preset baru:', preset.name + ' (copy)');
      if (name) {
        PresetManager.duplicatePreset(preset.id, name);
        renderPresetList();
        showToast('Preset diduplikasi', 'success');
      }
    });

    // Delete
    card.querySelector('.btn-del').addEventListener('click', async function () {
      var ok = await showConfirm('Hapus preset "' + preset.name + '"?');
      if (ok) {
        // If this preset is active on any monitor, clear it
        if (PresetManager.getMonitorPresetId('1') === preset.id) {
          PresetManager.setMonitorPresetId('1', '');
          if (bc) bc.postMessage({ type: 'preset-deleted', monitorId: '1' });
        }
        if (PresetManager.getMonitorPresetId('2') === preset.id) {
          PresetManager.setMonitorPresetId('2', '');
          if (bc) bc.postMessage({ type: 'preset-deleted', monitorId: '2' });
        }
        
        PresetManager.deletePreset(preset.id);
        renderPresetList();
        showToast('Preset dihapus', 'success');
      }
    });

    // Apply to Monitor 1
    card.querySelector('.btn-m1').addEventListener('click', function () {
      PresetManager.setMonitorPresetId('1', preset.id);
      if (bc) bc.postMessage({ type: 'preset-change', monitorId: '1', presetId: preset.id });
      renderPresetList();
      showToast('"' + preset.name + '" diterapkan ke Monitor 1', 'success');
    });

    // Apply to Monitor 2
    card.querySelector('.btn-m2').addEventListener('click', function () {
      PresetManager.setMonitorPresetId('2', preset.id);
      if (bc) bc.postMessage({ type: 'preset-change', monitorId: '2', presetId: preset.id });
      renderPresetList();
      showToast('"' + preset.name + '" diterapkan ke Monitor 2', 'success');
    });

    container.appendChild(card);
  });
}

/* ---- Monitor Control ---- */
function renderMonitorControl() {
  renderMonitorCard('1');
  renderMonitorCard('2');
}

function renderMonitorCard(mId) {
  var select = document.getElementById('monitor-' + mId + '-select');
  var label = document.getElementById('monitor-' + mId + '-preset');

  // Populate select
  select.innerHTML = '<option value="">— Pilih Preset —</option>';
  PresetManager.getPresets().forEach(function (p) {
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name + ' (' + p.columns + '×' + p.rows + ')';
    select.appendChild(opt);
  });

  var currentId = PresetManager.getMonitorPresetId(mId);
  if (currentId) {
    select.value = currentId;
    var preset = PresetManager.getPresetById(currentId);
    label.textContent = preset ? preset.name : 'Preset tidak ditemukan';
  } else {
    label.textContent = 'Belum dipilih';
  }
}

function applyMonitor(mId) {
  var select = document.getElementById('monitor-' + mId + '-select');
  var presetId = select.value;
  if (!presetId) {
    showToast('Pilih preset terlebih dahulu', 'error');
    return;
  }
  PresetManager.setMonitorPresetId(mId, presetId);
  if (bc) bc.postMessage({ type: 'preset-change', monitorId: mId, presetId: presetId });
  renderMonitorControl();
  showToast('Preset diterapkan ke Monitor ' + mId, 'success');
}

function openMonitor(mId) {
  window.open('monitor.html?id=' + mId, 'cctv_monitor_' + mId,
    'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
}

/* ---- Camera List ---- */
function renderCameraList() {
  var tbody = document.getElementById('camera-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  var areaFilter = document.getElementById('camera-area-filter');
  var searchInput = document.getElementById('camera-search');
  var area = areaFilter ? areaFilter.value : '';
  var search = searchInput ? searchInput.value.toLowerCase() : '';

  var cameras = ConfigManager.getCameras();
  if (area) cameras = cameras.filter(function (c) { return c.area === area; });
  if (search) cameras = cameras.filter(function (c) {
    return c.name.toLowerCase().includes(search) ||
           c.area.toLowerCase().includes(search) ||
           c.id.toLowerCase().includes(search);
  });

  cameras.forEach(function (cam, idx) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + (idx + 1) + '</td>' +
      '<td>' + escHtml(cam.name) + '</td>' +
      '<td><span class="badge badge-gray">' + escHtml(cam.area) + '</span></td>' +
      '<td>' + cam.channel + '</td>' +
      '<td><code>' + escHtml(cam.stream_id) + '</code></td>' +
      '<td>' + (cam.enabled
        ? '<span class="badge badge-green">Aktif</span>'
        : '<span class="badge badge-red">Nonaktif</span>') +
      '</td>';
    tbody.appendChild(tr);
  });
}

function populateCameraAreaFilter() {
  var select = document.getElementById('camera-area-filter');
  if (!select) return;
  select.innerHTML = '<option value="">Semua Area</option>';
  ConfigManager.getAreas().forEach(function (area) {
    var opt = document.createElement('option');
    opt.value = area;
    opt.textContent = area;
    select.appendChild(opt);
  });
  select.addEventListener('change', renderCameraList);
  var searchInput = document.getElementById('camera-search');
  if (searchInput) searchInput.addEventListener('input', renderCameraList);
}

/* ---- Import / Export ---- */
function handleExport() {
  PresetManager.exportPresets();
  showToast('Preset berhasil diexport', 'success');
}

function handleImport() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', function () {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        PresetManager.importPresets(reader.result);
        renderPresetList();
        showToast('Preset berhasil diimport', 'success');
      } catch (e) {
        showToast('Gagal import: ' + e.message, 'error');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

/* ---- Utility ---- */
function escHtml(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* ---- App Init ---- */
document.addEventListener('DOMContentLoaded', async function () {
  try {
    await ConfigManager.init();
    await PresetManager.init();
  } catch (err) {
    console.error('Failed to load config:', err);
    showToast('Gagal memuat konfigurasi: ' + err.message, 'error');
    return;
  }

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });

  // Init layout designer
  LayoutDesigner.init();

  // Populate camera area filter
  populateCameraAreaFilter();

  // Monitor control buttons
  document.getElementById('btn-apply-m1').addEventListener('click', function () { applyMonitor('1'); });
  document.getElementById('btn-apply-m2').addEventListener('click', function () { applyMonitor('2'); });
  document.getElementById('btn-open-m1').addEventListener('click', function () { openMonitor('1'); });
  document.getElementById('btn-open-m2').addEventListener('click', function () { openMonitor('2'); });
  document.getElementById('btn-open-all').addEventListener('click', function () { openMonitor('1'); openMonitor('2'); });

  // Export / Import
  document.getElementById('btn-export').addEventListener('click', handleExport);
  document.getElementById('btn-import').addEventListener('click', handleImport);

  // Load first tab
  switchTab('presets');
});
