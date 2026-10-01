/**
 * presets.js — Preset Manager
 * Manages layout presets: merge defaults + user presets from localStorage.
 *
 * localStorage keys:
 *   cctv_user_presets  — JSON array of user-created/edited presets
 *   cctv_monitor_1     — preset ID active on Monitor 1
 *   cctv_monitor_2     — preset ID active on Monitor 2
 */
window.PresetManager = (function () {
  var STORAGE_KEY = 'cctv_user_presets';
  var HIDDEN_KEY = 'cctv_hidden_defaults';
  var _presets = []; // merged list

  /* ---- helpers ---- */
  function _generateId() {
    return 'preset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function _readUserPresets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function _readHiddenDefaults() {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function _writeUserPresets(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  
  function _writeHiddenDefaults(arr) {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr));
  }

  function _merge() {
    var defaults = ConfigManager.getDefaultPresets();
    var userArr = _readUserPresets();
    var hiddenArr = _readHiddenDefaults();
    
    var userMap = {};
    userArr.forEach(function (p) { userMap[p.id] = p; });
    
    var hiddenMap = {};
    hiddenArr.forEach(function (id) { hiddenMap[id] = true; });

    // Start with defaults, override with user version if exists, skip if hidden
    var merged = [];
    defaults.forEach(function (d) {
      if (userMap[d.id]) {
         merged.push(userMap[d.id]);
      } else if (!hiddenMap[d.id]) {
         merged.push(d);
      }
    });
    
    // Add user-only presets (not in defaults)
    var defaultIds = {};
    defaults.forEach(function (d) { defaultIds[d.id] = true; });
    userArr.forEach(function (p) {
      if (!defaultIds[p.id]) merged.push(p);
    });
    _presets = merged;
  }

  /* ---- public API ---- */
  async function init() {
    _merge();
  }

  function getPresets() {
    _merge(); // always re-merge to catch localStorage changes from other tabs
    return _presets;
  }

  function getPresetById(id) {
    return getPresets().find(function (p) { return p.id === id; }) || null;
  }

  function savePreset(preset) {
    var userArr = _readUserPresets();
    var idx = userArr.findIndex(function (p) { return p.id === preset.id; });
    preset.updated_at = new Date().toISOString();
    if (!preset.created_at) preset.created_at = preset.updated_at;
    if (idx >= 0) {
      userArr[idx] = preset;
    } else {
      userArr.push(preset);
    }
    _writeUserPresets(userArr);
    
    // If it was hidden, un-hide it
    var hiddenArr = _readHiddenDefaults();
    if (hiddenArr.includes(preset.id)) {
       _writeHiddenDefaults(hiddenArr.filter(function(hid) { return hid !== preset.id; }));
    }
    
    _merge();
  }

  function deletePreset(id) {
    // 1. Remove from user presets if it exists
    var userArr = _readUserPresets();
    var filteredUserArr = userArr.filter(function (p) { return p.id !== id; });
    
    if (filteredUserArr.length !== userArr.length) {
       _writeUserPresets(filteredUserArr);
    }
    
    // 2. Mark as hidden in case it was a default preset
    var defaults = ConfigManager.getDefaultPresets();
    var isDefault = defaults.find(function(d) { return d.id === id; });
    
    if (isDefault) {
       var hiddenArr = _readHiddenDefaults();
       if (!hiddenArr.includes(id)) {
          hiddenArr.push(id);
          _writeHiddenDefaults(hiddenArr);
       }
    }
    
    _merge();
  }

  function duplicatePreset(id, newName) {
    var src = getPresetById(id);
    if (!src) return null;
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = _generateId();
    copy.name = newName || src.name + ' (copy)';
    copy.created_at = new Date().toISOString();
    copy.updated_at = copy.created_at;
    savePreset(copy);
    return copy;
  }

  function exportPresets() {
    var data = JSON.stringify(getPresets(), null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cctv-presets-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  function importPresets(jsonString) {
    var arr = JSON.parse(jsonString);
    if (!Array.isArray(arr)) throw new Error('Format JSON tidak valid');
    // If wrapped in { presets: [] }
    if (arr.presets) arr = arr.presets;
    arr.forEach(function (p) { savePreset(p); });
  }

  function getMonitorPresetId(monitorId) {
    return localStorage.getItem('cctv_monitor_' + monitorId) || null;
  }

  function setMonitorPresetId(monitorId, presetId) {
    localStorage.setItem('cctv_monitor_' + monitorId, presetId);
  }

  return {
    init: init,
    getPresets: getPresets,
    getPresetById: getPresetById,
    savePreset: savePreset,
    deletePreset: deletePreset,
    duplicatePreset: duplicatePreset,
    exportPresets: exportPresets,
    importPresets: importPresets,
    getMonitorPresetId: getMonitorPresetId,
    setMonitorPresetId: setMonitorPresetId
  };
})();
