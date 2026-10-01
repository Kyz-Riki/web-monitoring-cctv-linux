/**
 * layout.js — Layout Designer
 * Grid editor for creating/editing layout presets.
 */
window.LayoutDesigner = (function () {
  /* ---- State ---- */
  var currentRows = 4;
  var currentColumns = 4;
  var slots = {};            // { position: cameraId }
  var selectedSlot = null;   // position number or null
  var editingPresetId = null;

  /* ---- DOM refs (set on init) ---- */
  var gridPreview, cameraList, rowsInput, colsInput, presetNameInput;

  function init() {
    gridPreview = document.getElementById('grid-preview');
    cameraList = document.getElementById('camera-list');
    rowsInput = document.getElementById('designer-rows');
    colsInput = document.getElementById('designer-cols');
    presetNameInput = document.getElementById('preset-name-input');

    // Grid size inputs
    rowsInput.addEventListener('change', function () {
      setGridSize(parseInt(this.value) || 1, currentColumns);
    });
    colsInput.addEventListener('change', function () {
      setGridSize(currentRows, parseInt(this.value) || 1);
    });

    // Quick size buttons
    document.querySelectorAll('[data-grid-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = this.dataset.gridSize.split('x');
        setGridSize(parseInt(parts[0]), parseInt(parts[1]));
      });
    });

    // Save button
    document.getElementById('btn-save-preset').addEventListener('click', handleSave);
    document.getElementById('btn-save-new').addEventListener('click', handleSaveAsNew);
    document.getElementById('btn-reset-designer').addEventListener('click', reset);

    // Camera filter
    var areaFilter = document.getElementById('designer-area-filter');
    var searchInput = document.getElementById('designer-search');
    areaFilter.addEventListener('change', function () { renderCameraList(); });
    searchInput.addEventListener('input', function () { renderCameraList(); });

    // Populate area filter
    populateAreaFilter();

    // Initial render
    renderGrid();
    renderCameraList();
  }

  function populateAreaFilter() {
    var select = document.getElementById('designer-area-filter');
    select.innerHTML = '<option value="">Semua Area</option>';
    ConfigManager.getAreas().forEach(function (area) {
      var opt = document.createElement('option');
      opt.value = area;
      opt.textContent = area;
      select.appendChild(opt);
    });
  }

  /* ---- Grid ---- */
  function setGridSize(rows, cols) {
    rows = Math.max(1, Math.min(8, rows));
    cols = Math.max(1, Math.min(8, cols));
    var newTotal = rows * cols;
    var oldTotal = currentRows * currentColumns;

    // Remove cameras from slots that are beyond new size
    if (newTotal < oldTotal) {
      for (var i = newTotal; i < oldTotal; i++) {
        delete slots[i];
      }
    }

    currentRows = rows;
    currentColumns = cols;
    rowsInput.value = rows;
    colsInput.value = cols;
    renderGrid();
    renderCameraList();
  }

  function getGridSize() {
    return { rows: currentRows, columns: currentColumns };
  }

  function renderGrid() {
    gridPreview.innerHTML = '';
    gridPreview.style.gridTemplateColumns = 'repeat(' + currentColumns + ', 1fr)';
    gridPreview.style.gridTemplateRows = 'repeat(' + currentRows + ', 1fr)';

    var total = currentRows * currentColumns;
    for (var i = 0; i < total; i++) {
      gridPreview.appendChild(createSlotElement(i));
    }
  }

  function createSlotElement(position) {
    var div = document.createElement('div');
    div.className = 'grid-slot';
    div.dataset.position = position;

    var camId = slots[position];
    if (camId) {
      var cam = ConfigManager.getCameraById(camId);
      div.textContent = cam ? cam.name : camId;
      div.classList.add('occupied');
      div.draggable = true;

      var removeBtn = document.createElement('button');
      removeBtn.className = 'slot-remove';
      removeBtn.innerHTML = '✕';
      removeBtn.title = 'Hapus kamera';
      removeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        removeCamera(position);
      });
      div.appendChild(removeBtn);
    } else {
      div.textContent = 'Kosong';
      // empty slots can be drop targets but not dragged
    }

    if (selectedSlot === position) {
      div.classList.add('selected');
    }

    div.addEventListener('click', function () {
      if (selectedSlot === position) {
        selectedSlot = null;
      } else {
        selectedSlot = position;
      }
      renderGrid();
    });

    // --- Drag & Drop ---
    div.addEventListener('dragstart', function (e) {
      if (!camId) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', position.toString());
      e.dataTransfer.effectAllowed = 'move';
      // Use setTimeout so the dragging class applies after drag starts
      setTimeout(function() { div.classList.add('dragging'); }, 0);
    });

    div.addEventListener('dragover', function (e) {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'move';
      return false;
    });

    div.addEventListener('dragenter', function (e) {
      e.preventDefault();
      div.classList.add('drag-over');
    });

    div.addEventListener('dragleave', function (e) {
      // Don't remove if moving to a child element inside this div
      if (e.relatedTarget && div.contains(e.relatedTarget)) {
        return;
      }
      div.classList.remove('drag-over');
    });

    div.addEventListener('drop', function (e) {
      e.stopPropagation();
      e.preventDefault();
      div.classList.remove('drag-over');
      var sourcePosStr = e.dataTransfer.getData('text/plain');
      if (!sourcePosStr) return false;
      
      var sourcePos = parseInt(sourcePosStr, 10);
      if (!isNaN(sourcePos) && sourcePos !== position) {
        swapSlots(sourcePos, position);
      }
      return false;
    });

    div.addEventListener('dragend', function (e) {
      div.classList.remove('dragging');
    });

    return div;
  }

  /* ---- Camera List ---- */
  function renderCameraList() {
    cameraList.innerHTML = '';
    var areaFilter = document.getElementById('designer-area-filter').value;
    var searchTerm = (document.getElementById('designer-search').value || '').toLowerCase();

    var cameras = ConfigManager.getEnabledCameras();
    if (areaFilter) {
      cameras = cameras.filter(function (c) { return c.area === areaFilter; });
    }
    if (searchTerm) {
      cameras = cameras.filter(function (c) {
        return c.name.toLowerCase().includes(searchTerm) ||
               c.area.toLowerCase().includes(searchTerm);
      });
    }

    // Track which cameras are used in current layout
    var usedCamIds = {};
    Object.values(slots).forEach(function (id) { usedCamIds[id] = true; });

    cameras.forEach(function (cam) {
      var item = document.createElement('div');
      item.className = 'camera-item';
      if (usedCamIds[cam.id]) item.classList.add('used');

      var nameSpan = document.createElement('span');
      nameSpan.className = 'cam-name';
      nameSpan.textContent = cam.name;
      item.appendChild(nameSpan);

      var areaSpan = document.createElement('span');
      areaSpan.className = 'cam-area';
      areaSpan.textContent = cam.area;
      item.appendChild(areaSpan);

      item.addEventListener('click', function () {
        if (selectedSlot !== null) {
          // Check duplicate
          if (usedCamIds[cam.id] && slots[selectedSlot] !== cam.id) {
            if (typeof showToast === 'function') {
              showToast('Kamera sudah digunakan di slot lain', 'error');
            }
            return;
          }
          assignCamera(selectedSlot, cam.id);
          // Auto-advance to next empty slot
          var total = currentRows * currentColumns;
          var nextEmpty = null;
          for (var i = selectedSlot + 1; i < total; i++) {
            if (!slots[i]) { nextEmpty = i; break; }
          }
          selectedSlot = nextEmpty;
          renderGrid();
          renderCameraList();
        } else {
          if (typeof showToast === 'function') {
            showToast('Pilih slot pada grid terlebih dahulu', 'info');
          }
        }
      });

      cameraList.appendChild(item);
    });
  }

  /* ---- Assignment ---- */
  function assignCamera(position, cameraId) {
    slots[position] = cameraId;
  }

  function removeCamera(position) {
    delete slots[position];
    renderGrid();
    renderCameraList();
  }

  function swapSlots(pos1, pos2) {
    var tmp = slots[pos1];
    slots[pos1] = slots[pos2];
    slots[pos2] = tmp;
    
    // clean up empty slots
    if (!slots[pos1]) delete slots[pos1];
    if (!slots[pos2]) delete slots[pos2];

    renderGrid();
  }

  /* ---- Load / Reset ---- */
  function loadPreset(preset) {
    editingPresetId = preset.id;
    currentRows = preset.rows || 4;
    currentColumns = preset.columns || 4;
    rowsInput.value = currentRows;
    colsInput.value = currentColumns;
    presetNameInput.value = preset.name || '';

    slots = {};
    (preset.slots || []).forEach(function (s) {
      slots[s.position] = s.camera_id;
    });

    renderGrid();
    renderCameraList();
  }

  function reset() {
    editingPresetId = null;
    currentRows = 4;
    currentColumns = 4;
    rowsInput.value = 4;
    colsInput.value = 4;
    presetNameInput.value = '';
    slots = {};
    selectedSlot = null;
    renderGrid();
    renderCameraList();
  }

  function getCurrentLayout() {
    var slotsArr = [];
    Object.keys(slots).forEach(function (pos) {
      slotsArr.push({ position: parseInt(pos), camera_id: slots[pos] });
    });
    return {
      name: presetNameInput.value.trim() || 'Preset Baru',
      columns: currentColumns,
      rows: currentRows,
      slots: slotsArr
    };
  }

  /* ---- Save ---- */
  function handleSave() {
    var layout = getCurrentLayout();
    if (!layout.name) {
      showToast('Masukkan nama preset', 'error');
      return;
    }
    if (layout.slots.length === 0) {
      showToast('Layout kosong — tambahkan minimal satu kamera', 'error');
      return;
    }

    if (editingPresetId) {
      layout.id = editingPresetId;
    } else {
      layout.id = 'preset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    }
    PresetManager.savePreset(layout);
    showToast('Preset "' + layout.name + '" berhasil disimpan', 'success');

    // Broadcast if monitors are using this preset
    if (typeof bc !== 'undefined' && bc) {
      bc.postMessage({ type: 'preset-updated', presetId: layout.id });
    }

    // Refresh preset list if on that tab
    if (typeof renderPresetList === 'function') renderPresetList();
  }

  function handleSaveAsNew() {
    var layout = getCurrentLayout();
    if (!layout.name) {
      showToast('Masukkan nama preset', 'error');
      return;
    }
    layout.id = 'preset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    editingPresetId = layout.id;
    PresetManager.savePreset(layout);
    showToast('Preset baru "' + layout.name + '" berhasil dibuat', 'success');

    if (typeof renderPresetList === 'function') renderPresetList();
  }

  /* ---- Public API ---- */
  return {
    init: init,
    loadPreset: loadPreset,
    reset: reset,
    getGridSize: getGridSize,
    setGridSize: setGridSize,
    assignCamera: assignCamera,
    removeCamera: removeCamera,
    swapSlots: swapSlots,
    getCurrentLayout: getCurrentLayout,
    renderGrid: renderGrid,
    renderCameraList: renderCameraList
  };
})();
