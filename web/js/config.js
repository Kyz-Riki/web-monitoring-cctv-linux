/**
 * config.js — Configuration Loader
 * Loads cameras.json and presets.json, provides lookup helpers.
 */
window.ConfigManager = (function () {
  let _cameras = [];
  let _defaultPresets = [];

  async function init() {
    const [camRes, preRes] = await Promise.all([
      fetch('config/cameras.json'),
      fetch('config/presets.json')
    ]);
    const camData = await camRes.json();
    const preData = await preRes.json();
    _cameras = camData.cameras || [];
    _defaultPresets = preData.presets || [];
  }

  function getCameras() {
    return _cameras;
  }

  function getEnabledCameras() {
    return _cameras.filter(function (c) { return c.enabled; });
  }

  function getCameraById(id) {
    return _cameras.find(function (c) { return c.id === id; }) || null;
  }

  function getAreas() {
    var set = {};
    _cameras.forEach(function (c) { if (c.area) set[c.area] = true; });
    return Object.keys(set).sort();
  }

  function getCamerasByArea(area) {
    return _cameras.filter(function (c) { return c.area === area; });
  }

  function getDefaultPresets() {
    return _defaultPresets;
  }

  return {
    init: init,
    getCameras: getCameras,
    getEnabledCameras: getEnabledCameras,
    getCameraById: getCameraById,
    getAreas: getAreas,
    getCamerasByArea: getCamerasByArea,
    getDefaultPresets: getDefaultPresets
  };
})();
