// ============================================================================
// PMATH EDUCATION TOOLS — Multi-Object 2D/3D CAD, Equation & Interaction Engine
// Đồng bộ thiết kế & bảng màu chuẩn Template_PMATH.tex (v2.1)
// ============================================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
window.escapeHtml = escapeHtml;

const COLORS_PALETTE = ["#1e64b4", "#148250", "#008c96", "#b45a14", "#6a1b9a", "#c62828"];

const ENABLE_3D_OXYZ = false; // Feature flag: temporarily disable 3D Oxyz

const state = {
  spaceMode: "2d", // "2d" | "3d"
  searchQuery: "",
  sidebarTab: "scene", // "scene" | "library"
  libraryFilter: "all", // "all" | "2d" | "3d" | "special" | "motion"
  knowledgeOpen: false, // Right drawer is closed by default to maximize canvas space
  activeKnowledgeId: "triangle",
  activeInfoTab: "interactions", // "interactions" | "theory" | "practice"

  // Multi-tab sync & change tracking
  isDirty: false,
  lastModifiedAt: 0,
  lastLoadedAt: Date.now(),

  // Multi-object scenes
  objects2D: [],
  objects3D: [],
  selectedIds: [], // Array of selected object IDs
  clipboard: [],
  nextIdCounter: 1,

  // Undo / Redo Stacks
  undoStack: [],
  redoStack: [],

  // Default drawing style (PMATH excolor #1e64b4, TikZ 2.2pt)
  currentStyle: {
    color: "#1e64b4",
    lineWidth: 2.2,
    dash: "solid" // "solid" | "dashed" | "dotted"
  },

  // Viewport & Display Toggles
  showGrid: true,
  showAxes: true,
  isFullscreen: false,

  // 2D Viewport (Math units: 1 unit = view2D.scale pixels, y points UP)
  view2D: {
    offsetX: 0,
    offsetY: 0,
    scale: 38 // px per 1 math unit
  },

  // 3D Viewport (Oxyz: x right, y depth, z UP)
  cam3D: {
    yaw: -0.65,
    pitch: 0.42,
    zoom: 1.0,
    panX: 0,
    panY: 0
  },
  show3DBox: true,
  show3DFloor: true,
  show3DTriad: true,
  inertia3D: {
    vx: 0,
    vy: 0,
    animId: null
  },

  // Pointer interaction state
  interaction: {
    mode: "none", // "none" | "pan" | "drag_vertex" | "drag_object" | "marquee" | "orbit3d"
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    targetObjId: null,
    targetVertexIdx: -1,
    marqueeRect: null, // { x1, y1, x2, y2 } in screen coords
    hasMoved: false
  },
  hoverTarget: null, // { objId, vertexIdx }
  cursorMathPos: { x: 0, y: 0 },
  quiz: null,

  // m-parameter horizontal line for equation root analysis
  mParam: {
    show: true,
    val: 0.0
  },
  currentSurveyAnalysis: null
};
window.state = state;

const canvas = document.getElementById("geoCanvas");
const ctx = canvas.getContext("2d");

// ============================================================================
// INITIALIZATION & DEFAULT INTERACTIVE SCENES
// ============================================================================

function genId(prefix = "obj") {
  return `${prefix}_${state.nextIdCounter++}`;
}

function cloneDeep(val) {
  return JSON.parse(JSON.stringify(val));
}

function saveHistory() {
  const snapshot = {
    spaceMode: state.spaceMode,
    objects2D: cloneDeep(state.objects2D),
    objects3D: cloneDeep(state.objects3D),
    selectedIds: [...state.selectedIds]
  };
  state.undoStack.push(snapshot);
  if (state.undoStack.length > 50) state.undoStack.shift();
  state.redoStack = [];
  state.isDirty = true;
  state.lastModifiedAt = Date.now();
  updateUndoRedoButtons();
}

function undo() {
  if (state.undoStack.length === 0) return;
  const current = {
    spaceMode: state.spaceMode,
    objects2D: cloneDeep(state.objects2D),
    objects3D: cloneDeep(state.objects3D),
    selectedIds: [...state.selectedIds]
  };
  state.redoStack.push(current);
  const prev = state.undoStack.pop();
  state.spaceMode = prev.spaceMode;
  state.objects2D = prev.objects2D;
  state.objects3D = prev.objects3D;
  state.selectedIds = prev.selectedIds;
  state.isDirty = true;
  state.lastModifiedAt = Date.now();
  syncSpaceModeUI();
  updateUndoRedoButtons();
  refreshAllUI();
}

function redo() {
  if (state.redoStack.length === 0) return;
  const current = {
    spaceMode: state.spaceMode,
    objects2D: cloneDeep(state.objects2D),
    objects3D: cloneDeep(state.objects3D),
    selectedIds: [...state.selectedIds]
  };
  state.undoStack.push(current);
  const next = state.redoStack.pop();
  state.spaceMode = next.spaceMode;
  state.objects2D = next.objects2D;
  state.objects3D = next.objects3D;
  state.selectedIds = next.selectedIds;
  state.isDirty = true;
  state.lastModifiedAt = Date.now();
  syncSpaceModeUI();
  updateUndoRedoButtons();
  refreshAllUI();
}

function updateUndoRedoButtons() {
  document.getElementById("undoBtn").disabled = state.undoStack.length === 0;
  document.getElementById("redoBtn").disabled = state.redoStack.length === 0;
}

function getActiveSceneList() {
  return state.spaceMode === "2d" ? state.objects2D : state.objects3D;
}

function initDefaultScenes(loadDemo = false) {
  if (!loadDemo) {
    // Blank, clean canvas ready for user drawing without pre-drawn clutter
    state.objects2D = [];
    state.objects3D = [];
    state.selectedIds = [];
    return;
  }

  // Demo 2D Scene: A Triangle ABC + A Circle (C1) + A Secant Line d1
  state.objects2D = [
    {
      id: genId("tri"),
      space: "2d",
      type: "polygon2d",
      subType: "triangle",
      name: "△ABC",
      visible: true,
      color: "#1e64b4",
      lineWidth: 2.2,
      dash: "solid",
      pts: [
        { x: -1.5, y: 3.2, label: "A" },
        { x: -4.5, y: -2.2, label: "B" },
        { x: 3.5, y: -2.2, label: "C" }
      ],
      overlays: { G: true, H: false, O: false, I: false, E: false },
      knowledgeId: "triangle"
    },
    {
      id: genId("cir"),
      space: "2d",
      type: "circle2d",
      name: "(C₁)",
      centerLabel: "O₁",
      visible: true,
      color: "#148250",
      lineWidth: 2.2,
      dash: "solid",
      cx: 1.5,
      cy: 0.5,
      r: 3.2,
      equationText: "(x - 1.5)² + (y - 0.5)² = 3.2²",
      knowledgeId: "circle"
    },
    {
      id: genId("line"),
      space: "2d",
      type: "line2d",
      name: "d₁",
      visible: true,
      color: "#b45a14",
      lineWidth: 2.2,
      dash: "solid",
      a: 1,
      b: -2,
      c: 1,
      equationText: "x - 2y + 1 = 0",
      knowledgeId: "circle_lines_angles"
    }
  ];

  // Demo 3D Scene: Sphere (S) intersected by a Plane (α) and a 3D Line (Δ)
  state.objects3D = [
    {
      id: genId("sph"),
      space: "3d",
      type: "sphere3d",
      name: "(S)",
      centerLabel: "I",
      visible: true,
      color: "#1e64b4",
      lineWidth: 2.2,
      dash: "solid",
      cx: 0,
      cy: 0,
      cz: 0,
      r: 4,
      equationText: "x² + y² + z² = 16",
      knowledgeId: "sphere"
    },
    {
      id: genId("pln"),
      space: "3d",
      type: "plane3d",
      name: "(α)",
      visible: true,
      color: "#148250",
      lineWidth: 2,
      dash: "solid",
      a: 0,
      b: 0,
      c: 1,
      d: -1.8,
      equationText: "z - 1.8 = 0",
      knowledgeId: "sphere"
    },
    {
      id: genId("ln3"),
      space: "3d",
      type: "line3d",
      name: "r⃗(t)",
      visible: true,
      color: "#c62828",
      lineWidth: 2.5,
      dash: "solid",
      x0: -2.5,
      y0: -1.8,
      z0: 0.5,
      ux: 1.6,
      uy: 1.2,
      uz: 0.8,
      hasVelocity: true,
      vx: 1.6,
      vy: 1.2,
      vz: 0.8,
      t: 0,
      isPlaying: true,
      equationText: "r⃗(t) = (-2.5;-1.8;0.5) + (1.6;1.2;0.8)t",
      knowledgeId: "line3d_velocity"
    }
  ];

  state.selectedIds = state.objects2D.length > 0 ? [state.objects2D[0].id] : [];
}

window.loadDefaultDemoScenes = function() {
  saveHistory();
  initDefaultScenes(true);
  refreshAllUI();
};

function initApp() {
  initDefaultScenes();
  restoreStudioWorkspace();
  initApplePencilAndTouchGuard();
  bindUIEvents();
  bindCanvasEvents();
  bindKeyboardShortcuts();
  initStorageLocationEvents();
  initAutoSaveEngine();
  syncSpaceModeUI();
  refreshAllUI();
}

// ============================================================================
// COORDINATE TRANSFORMATIONS (2D MATH <-> SCREEN, 3D MATH <-> SCREEN)
// ============================================================================

function mathToScreen2D(mx, my) {
  return {
    x: state.view2D.offsetX + mx * state.view2D.scale,
    y: state.view2D.offsetY - my * state.view2D.scale
  };
}

function screenToMath2D(sx, sy) {
  return {
    x: (sx - state.view2D.offsetX) / state.view2D.scale,
    y: -(sy - state.view2D.offsetY) / state.view2D.scale
  };
}

// Project 3D math point (x, y, z where z is UP) to canvas center-relative screen coords
// Uses true orthographic projection (R in SO(3)) so spheres, planes, cross-section circles,
// and intersection points never distort or drift apart when rotating yaw/pitch.
function project3D(pt3) {
  const { yaw, pitch, zoom, panX, panY, target, unitScale } = state.cam3D;
  const uScale = unitScale || 1.0;
  const tx = target ? target.x : 0;
  const ty = target ? target.y : 0;
  const tz = target ? target.z : 0;
  const px = (pt3.x - tx) / uScale;
  const py = (pt3.y - ty) / uScale;
  const pz = (pt3.z - tz) / uScale;

  const scale = 34 * zoom;

  // Rotate in XY plane by yaw
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = px * cosY - py * sinY;
  const y1 = px * sinY + py * cosY;
  const z1 = pz;

  // Tilt by pitch
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const z2 = z1 * cosP - y1 * sinP;
  const depth = z1 * sinP + y1 * cosP;

  return {
    x: panX + x1 * scale,
    y: panY - z2 * scale,
    z: depth
  };
}

// ============================================================================
// UI EVENTS, TOOLBARS & PRESETS
// ============================================================================

function bindUIEvents() {
  // Space Switcher (2D vs 3D)
  document.querySelectorAll(".space-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!ENABLE_3D_OXYZ && btn.dataset.space === "3d") {
        showToast("Tính năng không gian 3D (Oxyz) đang tạm thời tắt để bảo trì nâng cấp.");
        return;
      }
      state.spaceMode = btn.dataset.space;
      const list = getActiveSceneList();
      state.selectedIds = list.length > 0 ? [list[0].id] : [];
      syncSpaceModeUI();
      refreshAllUI();
    });
  });

  // Equation Form Submit
  document.getElementById("equationForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("equationInput");
    handleAddEquation(input.value);
  });

  // Clear Scene Button
  document.getElementById("clearSceneBtn").addEventListener("click", () => {
    const totalObjs = state.spaceMode === "2d" ? state.objects2D.length : state.objects3D.length;
    if (totalObjs === 0) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xóa toàn bộ ${totalObjs} đối tượng trên khung vẽ? (Có thể bấm Hoàn tác sau khi xóa)`);
    if (!confirmed) return;
    saveHistory();
    if (state.spaceMode === "2d") state.objects2D = [];
    else state.objects3D = [];
    state.selectedIds = [];
    refreshAllUI();
    showToast("Đã xóa các đối tượng trên khung vẽ (Nhấn Hoàn tác để khôi phục)");
  });

  // CAD Toolbar Buttons
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);
  const copyBtnEl = document.getElementById("copyBtn");
  if (copyBtnEl) copyBtnEl.addEventListener("click", copySelected);
  const pasteBtnEl = document.getElementById("pasteBtn");
  if (pasteBtnEl) pasteBtnEl.addEventListener("click", pasteClipboard);
  document.getElementById("editObjBtn").addEventListener("click", () => openEditModal());
  const renameBtnEl = document.getElementById("renameBtn");
  if (renameBtnEl) renameBtnEl.addEventListener("click", openRenameModal);
  const toggleVisBtnEl = document.getElementById("toggleVisBtn");
  if (toggleVisBtnEl) toggleVisBtnEl.addEventListener("click", toggleSelectedVisibility);
  document.getElementById("deleteBtn").addEventListener("click", deleteSelected);
  document.getElementById("zoomFitBtn").addEventListener("click", zoomToFit);

  // Progressive disclosure toggle for advanced style & overlay toolbar
  const advStyleBtn = document.getElementById("toggleAdvancedStyleBtn");
  const advStyleBar = document.getElementById("advancedStyleToolbar");
  if (advStyleBtn && advStyleBar) {
    advStyleBtn.addEventListener("click", () => {
      const isHidden = advStyleBar.style.display === "none" || !advStyleBar.style.display;
      advStyleBar.style.display = isHidden ? "flex" : "none";
      advStyleBtn.classList.toggle("active", isHidden);
      advStyleBtn.textContent = isHidden ? "Tùy chỉnh hiển thị ▴" : "Tùy chỉnh hiển thị ▾";
    });
  }

  // Sidebar Tab Switcher (Scene Objects vs Geometry Library)
  document.querySelectorAll(".sidebar-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchSidebarTab(btn.dataset.stab);
    });
  });

  const quickPtBtn = document.getElementById("quickAddPointBtn");
  if (quickPtBtn) {
    quickPtBtn.addEventListener("click", () => quickAddShape("point2d"));
  }

  // Category Filter Pills inside Geometry Library
  document.querySelectorAll("#libraryFilterPills .filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#libraryFilterPills .filter-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      state.libraryFilter = pill.dataset.filter;
      renderLibraryList();
    });
  });

  // Studio Side Drawer Toggle (Live Canvas Interactions & Topic Quick View)
  const bindKnowledgeToggle = (btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener("click", () => toggleKnowledgeDrawer());
  };
  bindKnowledgeToggle("studioToggleKnowledgeBtn");
  const closeKnBtn = document.getElementById("closeKnowledgeBtn");
  if (closeKnBtn) closeKnBtn.addEventListener("click", () => toggleKnowledgeDrawer(false));

  // 3D Motion Simulation Controls
  const playMotBtn = document.getElementById("playMotionBtn");
  if (playMotBtn) {
    playMotBtn.addEventListener("click", () => {
      const anyMoving = state.objects3D.some((o) => o.type === "line3d" && o.hasVelocity && o.isPlaying);
      state.objects3D.forEach((o) => {
        if (o.type === "line3d" && o.hasVelocity) {
          o.isPlaying = !anyMoving;
        }
      });
      playMotBtn.textContent = anyMoving ? "▶ Chạy" : "⏸ Dừng";
      playMotBtn.classList.toggle("active", !anyMoving);
    });
  }

  const resetMotBtn = document.getElementById("resetMotionBtn");
  if (resetMotBtn) {
    resetMotBtn.addEventListener("click", () => {
      state.objects3D.forEach((o) => {
        if (o.type === "line3d" && o.hasVelocity) {
          o.t = 0;
        }
      });
      drawScene();
      const timeDisp = document.getElementById("motionTimeDisplay");
      if (timeDisp) timeDisp.textContent = "t = 0.0s";
    });
  }

  document.getElementById("gridToggleBtn").addEventListener("click", () => {
    state.showGrid = !state.showGrid;
    document.getElementById("gridToggleBtn").classList.toggle("active", state.showGrid);
    drawScene();
  });

  document.getElementById("axesToggleBtn").addEventListener("click", () => {
    state.showAxes = !state.showAxes;
    document.getElementById("axesToggleBtn").classList.toggle("active", state.showAxes);
    drawScene();
  });

  document.getElementById("fullscreenBtn").addEventListener("click", toggleFullscreenCanvas);

  // Style Controls (Color, Width, Dash)
  document.querySelectorAll(".color-swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
      applyStyleToSelected({ color: sw.dataset.color });
      document.getElementById("customColorPicker").value = sw.dataset.color;
    });
  });

  document.getElementById("customColorPicker").addEventListener("input", (e) => {
    applyStyleToSelected({ color: e.target.value });
  });

  document.getElementById("lineWidthSelect").addEventListener("change", (e) => {
    applyStyleToSelected({ lineWidth: parseFloat(e.target.value) });
  });

  document.getElementById("lineDashSelect").addEventListener("change", (e) => {
    applyStyleToSelected({ dash: e.target.value });
  });

  // Special Triangle Overlays (G, H, O, I, Euler)
  document.querySelectorAll("#specialOverlayBar .cad-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.overlay;
      const selObjs = getSelectedObjects();
      const tris = selObjs.filter((o) => o.type === "polygon2d" && o.pts && o.pts.length === 3);
      if (tris.length === 0) return;
      saveHistory();
      tris.forEach((tr) => {
        if (!tr.overlays) tr.overlays = { G: false, H: false, O: false, I: false, E: false };
        tr.overlays[key] = !tr.overlays[key];
      });
      refreshAllUI();
    });
  });

  // Search Library
  document.getElementById("shapeSearch").addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderLibraryList();
  });

  // Right Panel Tabs
  document.querySelectorAll(".info-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".info-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      state.activeInfoTab = tab.dataset.tab;
      renderKnowledgePanel();
    });
  });

  // Theme Toggle (Default is data-theme="light" matching Template_PMATH.tex)
  const themeBtn = document.getElementById("themeToggleBtn");
  const updateThemeUI = (isDark) => {
    if (!themeBtn) return;
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.setAttribute("data-theme", "dark");
      document.body.classList.add("dark-theme");
      themeBtn.innerHTML = `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg><span id="themeToggleLabel">Giao diện Sáng</span>`;
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.setAttribute("data-theme", "light");
      document.body.classList.remove("dark-theme");
      themeBtn.innerHTML = `<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><span id="themeToggleLabel">Giao diện Tối</span>`;
    }
  };

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      updateThemeUI(!isDark);
      drawScene();
    });
  }

  // Modals (Shortcuts, Rename, Edit Object; Formula Hub & Knowledge Handbook are managed by knowledge-handbook.js)
  bindModal("openShortcutsBtn", "closeShortcutsBtn", "shortcutsDialog");

  const renameDialog = document.getElementById("renameDialog");
  document.getElementById("closeRenameBtn").addEventListener("click", () => renameDialog.close());
  document.getElementById("cancelRenameBtn").addEventListener("click", () => renameDialog.close());
  document.getElementById("renameForm").addEventListener("submit", (e) => {
    e.preventDefault();
    applyRenameFromModal();
    renameDialog.close();
  });

  const editDialog = document.getElementById("editObjectDialog");
  if (editDialog) {
    document.getElementById("closeEditDialogBtn").addEventListener("click", () => editDialog.close());
    document.getElementById("saveEditBtn").addEventListener("click", () => saveEditModalChanges());
    document.getElementById("editDeleteBtn").addEventListener("click", () => {
      deleteSelected();
      editDialog.close();
    });
    document.getElementById("editDuplicateBtn").addEventListener("click", () => {
      duplicateSelectedObject();
      editDialog.close();
    });
  }

  // 3D Camera Viewpoint Presets
  const camPresetIsoBtn = document.getElementById("camPresetIsoBtn");
  if (camPresetIsoBtn) {
    camPresetIsoBtn.addEventListener("click", () => {
      state.cam3D.yaw = -0.65;
      state.cam3D.pitch = 0.42;
      drawScene();
      showToast("Góc nhìn 3D: Phối cảnh chuẩn (Isometric 35°/45°)");
    });
  }

  const camPresetTopBtn = document.getElementById("camPresetTopBtn");
  if (camPresetTopBtn) {
    camPresetTopBtn.addEventListener("click", () => {
      state.cam3D.yaw = 0;
      state.cam3D.pitch = 1.35;
      drawScene();
      showToast("Góc nhìn 3D: Nhìn từ trên xuống mặt phẳng Oxy");
    });
  }

  const camPresetFrontBtn = document.getElementById("camPresetFrontBtn");
  if (camPresetFrontBtn) {
    camPresetFrontBtn.addEventListener("click", () => {
      state.cam3D.yaw = 0;
      state.cam3D.pitch = 0;
      drawScene();
      showToast("Góc nhìn 3D: Nhìn chính diện mặt phẳng Oxz");
    });
  }

  const camPresetSideBtn = document.getElementById("camPresetSideBtn");
  if (camPresetSideBtn) {
    camPresetSideBtn.addEventListener("click", () => {
      state.cam3D.yaw = Math.PI / 2;
      state.cam3D.pitch = 0;
      drawScene();
      showToast("Góc nhìn 3D: Nhìn từ cạnh bên mặt phẳng Oyz");
    });
  }

  const camResetBtn = document.getElementById("camResetBtn");
  if (camResetBtn) {
    camResetBtn.addEventListener("click", () => {
      state.cam3D = { yaw: -0.65, pitch: 0.42, zoom: 1.0, panX: 0, panY: 0, target: { x: 0, y: 0, z: 0 }, unitScale: 1.0 };
      drawScene();
      updateCursorStatusPill();
      showToast("Đã đặt lại góc nhìn và phóng to ban đầu (100%)");
    });
  }

  // Desmos 3D Bounding Box & Floor Toggles
  const boxCheck = document.getElementById("toggle3DBoxCheck");
  if (boxCheck) {
    boxCheck.checked = state.show3DBox !== false;
    boxCheck.addEventListener("change", (e) => {
      state.show3DBox = e.target.checked;
      drawScene();
    });
  }

  const floorCheck = document.getElementById("toggle3DFloorCheck");
  if (floorCheck) {
    floorCheck.checked = state.show3DFloor !== false;
    floorCheck.addEventListener("change", (e) => {
      state.show3DFloor = e.target.checked;
      drawScene();
    });
  }

  // Desmos 3D Presets Menu Items
  document.querySelectorAll(".desmos-preset-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const presetKey = btn.dataset.preset;
      if (presetKey) {
        loadDesmos3DPreset(presetKey);
        const menu = document.getElementById("desmos3DPresetsMenu");
        if (menu) menu.style.display = "none";
      }
    });
  });

  // 2D Parameter m Slider & Line
  const mSlider = document.getElementById("mParamSlider");
  const mCheck = document.getElementById("toggleMLineCheck");
  const mValDisp = document.getElementById("mSliderValueDisp");

  if (mSlider) {
    mSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      state.mParam.val = val;
      if (mValDisp) mValDisp.textContent = val.toFixed(1).replace(".", ",");
      drawScene();
    });
  }

  if (mCheck) {
    mCheck.addEventListener("change", (e) => {
      state.mParam.show = e.target.checked;
      drawScene();
    });
  }

  // Survey Dialog Triggers
  const openSurveyBtn = document.getElementById("openSurveyDialogBtn");
  if (openSurveyBtn) {
    openSurveyBtn.addEventListener("click", () => openSurveyDialog());
  }

  const closeSurveyBtn = document.getElementById("closeSurveyDialogBtn");
  const surveyDialog = document.getElementById("surveyDialog");
  if (closeSurveyBtn && surveyDialog) {
    closeSurveyBtn.addEventListener("click", () => surveyDialog.close());
  }
  const closeSurveyBottomBtn = document.getElementById("closeSurveyDialogBottomBtn");
  if (closeSurveyBottomBtn && surveyDialog) {
    closeSurveyBottomBtn.addEventListener("click", () => surveyDialog.close());
  }

  // LaTeX Export Buttons
  const copyTkzTabBtn = document.getElementById("copyTkzTabBtn");
  if (copyTkzTabBtn) {
    copyTkzTabBtn.addEventListener("click", () => {
      if (!state.currentSurveyAnalysis || !window.MathSurveyEngine) {
        showToast("Chưa có dữ liệu khảo sát hàm số để xuất tkz-tab!");
        return;
      }
      const code = window.MathSurveyEngine.generateTkzTabLaTeX(state.currentSurveyAnalysis);
      navigator.clipboard.writeText(code).then(() => {
        showToast("Đã sao chép mã LaTeX (tkz-tab) vào bộ nhớ tạm!");
      }).catch(() => {
        showToast("Không thể sao chép vào bộ nhớ tạm");
      });
    });
  }

  const copyTikzPlotBtn = document.getElementById("copyTikzPlotBtn");
  if (copyTikzPlotBtn) {
    copyTikzPlotBtn.addEventListener("click", () => {
      if (!state.currentSurveyAnalysis || !window.MathSurveyEngine) {
        showToast("Chưa có dữ liệu khảo sát để xuất TikZ!");
        return;
      }
      const code = window.MathSurveyEngine.generateTikzPlotLaTeX(state.currentSurveyAnalysis);
      navigator.clipboard.writeText(code).then(() => {
        showToast("Đã sao chép mã TikZ (pgfplots) vào bộ nhớ tạm!");
      }).catch(() => {
        showToast("Không thể sao chép vào bộ nhớ tạm");
      });
    });
  }

  startMotionLoop();
}

function switchSidebarTab(tabName) {
  state.sidebarTab = tabName;
  const tabSceneBtn = document.getElementById("tabSceneBtn");
  const tabLibBtn = document.getElementById("tabLibraryBtn");
  const scenePanel = document.getElementById("scenePanel");
  const libPanel = document.getElementById("libraryPanel");

  if (tabSceneBtn && tabLibBtn && scenePanel && libPanel) {
    const isScene = tabName === "scene";
    tabSceneBtn.classList.toggle("active", isScene);
    tabLibBtn.classList.toggle("active", !isScene);
    scenePanel.style.display = isScene ? "flex" : "none";
    libPanel.style.display = isScene ? "none" : "flex";
  }
}

function toggleKnowledgeDrawer(forceState) {
  const panel = document.getElementById("knowledgePanel");
  const ws = document.getElementById("mainWorkspace");
  const topBtn = document.getElementById("toggleKnowledgeBtn");
  const subBtn = document.getElementById("studioToggleKnowledgeBtn");
  if (!panel || !ws) return;

  const isCurrentlyOpen = panel.style.display !== "none";
  const nextOpen = forceState !== undefined ? forceState : !isCurrentlyOpen;
  state.knowledgeOpen = nextOpen;

  panel.style.display = nextOpen ? "flex" : "none";
  ws.classList.toggle("knowledge-open", nextOpen);
  if (topBtn) topBtn.classList.toggle("active", nextOpen);
  if (subBtn) subBtn.classList.toggle("active", nextOpen);

  setTimeout(() => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    drawScene();
  }, 60);
}

function bindModal(openId, closeId, dialogId) {
  const dlg = document.getElementById(dialogId);
  document.getElementById(openId).addEventListener("click", () => dlg.showModal());
  document.getElementById(closeId).addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
}

function syncSpaceModeUI() {
  if (!ENABLE_3D_OXYZ) {
    state.spaceMode = "2d";
  }
  const mode2DBtn = document.getElementById("mode2DBtn");
  const mode3DBtn = document.getElementById("mode3DBtn");
  if (mode2DBtn) mode2DBtn.classList.toggle("active", state.spaceMode === "2d");
  if (mode3DBtn) {
    if (!ENABLE_3D_OXYZ) {
      mode3DBtn.style.display = "none";
    } else {
      mode3DBtn.classList.toggle("active", state.spaceMode === "3d");
    }
  }
  const eqModeEl = document.getElementById("eqModeBadge");
  if (eqModeEl) eqModeEl.textContent = "ƒ(x) Oxy";
  const ovBar = document.getElementById("specialOverlayBar");
  if (ovBar) ovBar.style.display = state.spaceMode === "2d" ? "flex" : "none";

  const g2dBar = document.getElementById("graph2dToolbar");
  if (g2dBar) g2dBar.style.display = "flex";

  const c3dBar = document.getElementById("camera3dToolbar");
  if (c3dBar) c3dBar.style.display = (!ENABLE_3D_OXYZ || state.spaceMode !== "3d") ? "none" : "flex";

  const motBar = document.getElementById("motionQuickBar");
  if (motBar) {
    const hasMot = ENABLE_3D_OXYZ && state.spaceMode === "3d" && state.objects3D.some((o) => o.type === "line3d" && o.hasVelocity);
    motBar.style.display = (state.spaceMode === "3d" && hasMot) ? "flex" : "none";
  }

  renderQuickAddToolbar();
  renderEquationPresets();
}

function renderQuickAddToolbar() {
  const container = document.getElementById("quickAddTools");
  container.innerHTML = "";

  if (state.spaceMode === "2d") {
    const tools2D = [
      { label: "+ Điểm", action: () => quickAddShape("point2d") },
      { label: "+ Đường thẳng", action: () => quickAddShape("line2d") },
      { label: "+ Đường tròn", action: () => quickAddShape("circle") },
      { label: "+ Tam giác", action: () => quickAddShape("triangle") },
      { label: "+ Hình vuông", action: () => quickAddShape("square") },
      { label: "+ Hình chữ nhật", action: () => quickAddShape("rectangle") }
    ];
    tools2D.forEach((t) => {
      const b = document.createElement("button");
      b.className = "cad-btn";
      b.textContent = t.label;
      b.addEventListener("click", t.action);
      container.appendChild(b);
    });
  } else {
    const tools3D = [
      { label: "+ Chuyển động Oxyz", action: () => quickAddShape("line3d_velocity") },
      { label: "+ Mặt cầu", action: () => quickAddShape("sphere") },
      { label: "+ Mặt phẳng", action: () => quickAddShape("plane3d") },
      { label: "+ Đường 3D", action: () => quickAddShape("line3d") },
      { label: "+ Hình chóp", action: () => quickAddShape("pyramid_square") },
      { label: "+ Lập phương", action: () => quickAddShape("cube") }
    ];
    tools3D.forEach((t) => {
      const b = document.createElement("button");
      b.className = "cad-btn";
      b.textContent = t.label;
      b.addEventListener("click", t.action);
      container.appendChild(b);
    });
  }
}

function renderEquationPresets() {
  const row = document.getElementById("eqPresetsRow");
  row.innerHTML = `<span style="color:var(--text-muted); font-weight:600;">Mẫu hàm số và phương trình:</span>`;

  const presets =
    state.spaceMode === "2d"
      ? [
          { label: "Bậc 3: y = x^3 - 3x + 1", eq: "y = x^3 - 3x + 1" },
          { label: "Trùng phương: y = x^4 - 2x^2 - 1", eq: "y = x^4 - 2x^2 - 1" },
          { label: "Phân thức: y = (2x-1)/(x+1)", eq: "y = (2x-1)/(x+1)" },
          { label: "Phân thức 2/1: y = (x^2+x+1)/(x-1)", eq: "y = (x^2+x+1)/(x-1)" },
          { label: "Tổ hợp: Diện tích S = 0.5 (f(x)=x & g(x)=x³)", combo: "area_between_curves" },
          { label: "Lượng giác: y = 2*sin(x)", eq: "y = 2*sin(x)" },
          { label: "Trị tuyệt đối: y = |x^2 - 4|", eq: "y = |x^2 - 4|" },
          { label: "Đường tròn: (x-1)^2 + (y+1)^2 = 16", eq: "(x-1)^2 + (y+1)^2 = 16" },
          { label: "Elip: x^2/25 + y^2/9 = 1", eq: "x^2/25 + y^2/9 = 1" },
          { label: "Tổ hợp: Bậc 3 & Cát tuyến", combo: "cubic_secant" },
          { label: "Tổ hợp: 2 Đường tròn cắt nhau", combo: "circles_secant" }
        ]
      : [
          { label: "Tổ hợp: 2 Máy bay & Khoảng cách tiếp cận Oxyz", combo: "airplanes_motion" },
          { label: "Mẫu: Khối nón r=3, h=4 (Trải phẳng 2D)", combo: "cone_survey" },
          { label: "Mặt phẳng: x + y + z - 3 = 0", eq: "x + y + z - 3 = 0" },
          { label: "Mặt cầu: (x-1)^2 + (y-1)^2 + (z-1)^2 = 16", eq: "(x-1)^2 + (y-1)^2 + (z-1)^2 = 16" },
          { label: "Đường 3D: (x-1)/2 = (y+1)/1 = z/3", eq: "(x-1)/2 = (y+1)/1 = z/3" },
          { label: "Mặt bậc 2: z = 0.25*(x^2 - y^2)", eq: "z = 0.25*(x^2 - y^2)" },
          { label: "Tổ hợp: Mặt phẳng cắt Mặt cầu & Đường 3D", combo: "sphere_plane_line" }
        ];

  presets.forEach((p) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `eq-chip ${p.combo ? "combo" : ""}`;
    chip.textContent = p.label;
    chip.addEventListener("click", () => {
      if (p.combo) {
        loadInteractionCombo(p.combo);
      } else {
        document.getElementById("equationInput").value = p.eq;
        handleAddEquation(p.eq);
      }
    });
    row.appendChild(chip);
  });
}

function loadInteractionCombo(comboName) {
  saveHistory();
  if (!ENABLE_3D_OXYZ && (comboName === "airplanes_motion" || comboName === "sphere_plane_line")) {
    state.spaceMode = "2d";
    showToast("Tính năng 3D Oxyz tạm thời tắt để bảo trì. Đang mở Khảo sát đồ thị bậc ba.");
    loadInteractionCombo("cubic_secant");
    return;
  }
  if (comboName === "airplanes_motion") {
    state.spaceMode = "3d";
    state.objects3D = [
      {
        id: genId("plane1"),
        space: "3d",
        type: "line3d",
        name: "✈️ Máy bay A",
        visible: true,
        color: "#dc2626",
        lineWidth: 2.8,
        dash: "solid",
        x0: 0,
        y0: 0,
        z0: 0,
        ux: 100,
        uy: 0,
        uz: 0,
        hasVelocity: true,
        vx: 100,
        vy: 0,
        vz: 0,
        t: 0,
        isPlaying: true,
        equationText: "r⃗_A(t) = (0; 0; 0) + (100; 0; 0)t (m)",
        knowledgeId: "line3d_velocity"
      },
      {
        id: genId("plane2"),
        space: "3d",
        type: "line3d",
        name: "✈️ Máy bay B",
        visible: true,
        color: "#2563eb",
        lineWidth: 2.8,
        dash: "solid",
        x0: 10000,
        y0: 500,
        z0: 0,
        ux: -100,
        uy: 0,
        uz: 0,
        hasVelocity: true,
        vx: -100,
        vy: 0,
        vz: 0,
        t: 0,
        isPlaying: true,
        equationText: "r⃗_B(t) = (10000; 500; 0) + (-100; 0; 0)t (m)",
        knowledgeId: "line3d_velocity"
      }
    ];
    state.selectedIds = [state.objects3D[0].id];
    syncSpaceModeUI();
    zoomToFit();
    showToast("Đã nạp bài toán 2 Máy bay chuẩn SGK: d_min = 500 m tại t = 50 s");
  } else if (comboName === "cubic_secant") {
    state.spaceMode = "2d";
    state.objects2D = [
      {
        id: genId("fn"),
        space: "2d",
        type: "func2d",
        name: "(C₁)",
        expr: "x^3 - 3x + 1",
        visible: true,
        color: "#1e64b4",
        lineWidth: 2.6,
        dash: "solid",
        equationText: "y = x³ - 3x + 1"
      },
      {
        id: genId("line"),
        space: "2d",
        type: "line2d",
        name: "d₁",
        visible: true,
        color: "#148250",
        lineWidth: 2.3,
        dash: "solid",
        a: 1,
        b: -1,
        c: 1,
        equationText: "y = x + 1"
      }
    ];
    state.selectedIds = [state.objects2D[0].id];
  } else if (comboName === "circles_secant") {
    state.spaceMode = "2d";
    state.objects2D = [
      {
        id: genId("cir"),
        space: "2d",
        type: "circle2d",
        name: "(C₁)",
        centerLabel: "O₁",
        visible: true,
        color: "#1e64b4",
        lineWidth: 2.5,
        dash: "solid",
        cx: -2,
        cy: 0,
        r: 3.5,
        equationText: "(x + 2)² + y² = 3.5²",
        knowledgeId: "circle"
      },
      {
        id: genId("cir"),
        space: "2d",
        type: "circle2d",
        name: "(C₂)",
        centerLabel: "O₂",
        visible: true,
        color: "#148250",
        lineWidth: 2.5,
        dash: "solid",
        cx: 2,
        cy: 0,
        r: 3.0,
        equationText: "(x - 2)² + y² = 3²",
        knowledgeId: "circle"
      },
      {
        id: genId("line"),
        space: "2d",
        type: "line2d",
        name: "d₁",
        visible: true,
        color: "#b45a14",
        lineWidth: 2.5,
        dash: "solid",
        a: 0.4,
        b: -1,
        c: 1.5,
        equationText: "0.4x - y + 1.5 = 0",
        knowledgeId: "circle_lines_angles"
      }
    ];
    state.selectedIds = [state.objects2D[0].id];
  } else if (comboName === "sphere_plane_line") {
    state.spaceMode = "3d";
    state.objects3D = [
      {
        id: genId("sph"),
        space: "3d",
        type: "sphere3d",
        name: "(S)",
        centerLabel: "I",
        visible: true,
        color: "#1e64b4",
        lineWidth: 2.2,
        dash: "solid",
        cx: 0,
        cy: 0,
        cz: 0,
        r: 4.2,
        equationText: "x² + y² + z² = 4.2²",
        knowledgeId: "sphere"
      },
      {
        id: genId("pln"),
        space: "3d",
        type: "plane3d",
        name: "(P)",
        visible: true,
        color: "#148250",
        lineWidth: 2,
        dash: "solid",
        a: 1,
        b: 1,
        c: 2,
        d: -3.5,
        equationText: "x + y + 2z - 3.5 = 0",
        knowledgeId: "sphere"
      },
      {
        id: genId("ln3"),
        space: "3d",
        type: "line3d",
        name: "Δ",
        visible: true,
        color: "#c62828",
        lineWidth: 2.5,
        dash: "solid",
        x0: -1.5,
        y0: -1,
        z0: -3,
        ux: 1,
        uy: 1,
        uz: 2,
        equationText: "(x+1.5)/1 = (y+1)/1 = (z+3)/2",
        knowledgeId: "sphere"
      }
    ];
    state.selectedIds = [state.objects3D[0].id];
  } else if (comboName === "area_between_curves") {
    state.spaceMode = "2d";
    state.objects2D = [
      {
        id: genId("f1"),
        space: "2d",
        type: "func2d",
        name: "f(x)",
        expr: "x",
        visible: true,
        color: "#2563eb",
        lineWidth: 2.6,
        dash: "solid",
        equationText: "y = x"
      },
      {
        id: genId("f2"),
        space: "2d",
        type: "func2d",
        name: "g(x)",
        expr: "x^3",
        visible: true,
        color: "#dc2626",
        lineWidth: 2.6,
        dash: "solid",
        equationText: "y = x³"
      }
    ];
    state.selectedIds = [state.objects2D[0].id, state.objects2D[1].id];
    state.calcAreaBetweenCurves = true;
    showToast("Đã nạp tổ hợp: Diện tích hình phẳng S = 0,50 đvdt giữa f(x) = x và g(x) = x³");
  } else if (comboName === "cone_survey") {
    state.spaceMode = "3d";
    state.objects3D = [
      {
        id: genId("cone"),
        space: "3d",
        type: "solid3d",
        solidType: "cone",
        name: "Khối nón",
        r: 3,
        h: 4,
        a: 3,
        isUnfolded: true,
        visible: true,
        color: "#2563eb",
        lineWidth: 2.4,
        dash: "solid",
        equationText: "Khối nón: r = 3 cm, h = 4 cm (l = 5 cm, α = 216°)"
      }
    ];
    state.selectedIds = [state.objects3D[0].id];
    showToast("Đã nạp Khối nón r = 3 cm, h = 4 cm (đường sinh l = 5 cm, góc quạt 216°)");
  }
  syncSpaceModeUI();
  refreshAllUI();
}

window.applyEquationPreset = function(presetName) {
  if (presetName === "airplanes_motion") {
    loadInteractionCombo("airplanes_motion");
  } else if (presetName === "sphere_plane_secant" || presetName === "sphere_plane_line") {
    loadInteractionCombo("sphere_plane_line");
  } else if (presetName === "triangle_euler_line") {
    state.spaceMode = "2d";
    initDefaultScenes(true);
    syncSpaceModeUI();
    refreshAllUI();
  } else if (presetName === "cubic_extrema" || presetName === "cubic_secant") {
    state.spaceMode = "2d";
    loadInteractionCombo("cubic_secant");
  } else if (presetName === "area_between_curves") {
    loadInteractionCombo("area_between_curves");
  } else if (presetName === "cone_survey") {
    loadInteractionCombo("cone_survey");
  }
};

function handleAddEquation(rawText) {
  const errEl = document.getElementById("eqErrorMsg");
  errEl.style.display = "none";

  if (!ENABLE_3D_OXYZ && (/z\b/i.test(rawText) || /3d/i.test(rawText))) {
    errEl.textContent = "⚠️ Tính năng vẽ đồ thị và phương trình không gian 3D (Oxyz) đang tạm thời tắt để bảo trì. Vui lòng nhập hàm số 2D (VD: y = x^3 - 3x + 1) hoặc phương trình Oxy.";
    errEl.style.display = "block";
    return;
  }

  const parsed = GeoEquations.parse(rawText, state.spaceMode);
  if (parsed.error) {
    errEl.textContent = "⚠️ " + parsed.error;
    errEl.style.display = "block";
    return;
  }

  saveHistory();

  // Switch space mode if user entered a 3D equation while in 2D mode (or vice versa)
  if (parsed.space !== state.spaceMode) {
    state.spaceMode = parsed.space;
    syncSpaceModeUI();
  }

  const list = getActiveSceneList();
  const color = COLORS_PALETTE[list.length % COLORS_PALETTE.length];
  const idx = list.length + 1;

  const newObj = {
    ...parsed,
    id: genId(parsed.type),
    name: `${parsed.name}${idx}`,
    visible: true,
    color,
    lineWidth: state.currentStyle.lineWidth,
    dash: state.currentStyle.dash
  };

  if (parsed.type === "circle2d") {
    newObj.centerLabel = `O${idx}`;
    newObj.knowledgeId = "circle";
  } else if (parsed.type === "sphere3d") {
    newObj.centerLabel = `I${idx}`;
    newObj.knowledgeId = "sphere";
  }

  list.push(newObj);
  state.selectedIds = [newObj.id];
  document.getElementById("equationInput").value = "";
  refreshAllUI();
}

// ============================================================================
// ADDING SHAPES FROM LIBRARY OR QUICK TOOLBAR INTO MULTI-OBJECT SCENE
// ============================================================================

function quickAddShape(shapeKey) {
  saveHistory();
  const shapeInfo = GEOMETRY_DATA.find((s) => s.id === shapeKey);
  if (shapeInfo) {
    state.activeKnowledgeId = shapeInfo.id;
    generateQuizForShape(shapeInfo);
  }

  // Determine offset so newly added shapes don't overlap identically
  const list2D = state.objects2D;
  const off = (list2D.length % 4) * 0.8 - 0.8;
  const color = COLORS_PALETTE[(state.objects2D.length + state.objects3D.length) % COLORS_PALETTE.length];

  if (shapeKey === "point2d") {
    state.spaceMode = "2d";
    const ptIdx = state.objects2D.filter((o) => o.type === "point2d").length + 1;
    const obj = {
      id: genId("pt"),
      space: "2d",
      type: "point2d",
      name: `P${ptIdx}`,
      x: 1 + off,
      y: 1.5 - off,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid"
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "line2d") {
    state.spaceMode = "2d";
    const idx = state.objects2D.filter((o) => o.type === "line2d").length + 1;
    const obj = {
      id: genId("ln"),
      space: "2d",
      type: "line2d",
      name: `d${idx}`,
      a: 1,
      b: -1,
      c: off * 2,
      equationText: `x - y + ${(off * 2).toFixed(1)} = 0`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid"
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (
    [
      "triangle",
      "centroid_medians",
      "orthocenter_altitudes",
      "circumcenter_bisectors",
      "incenter_anglebisectors",
      "euler_ninepoint",
      "midsegment"
    ].includes(shapeKey)
  ) {
    state.spaceMode = "2d";
    const overlays = {
      G: shapeKey === "centroid_medians" || shapeKey === "euler_ninepoint",
      H: shapeKey === "orthocenter_altitudes" || shapeKey === "euler_ninepoint",
      O: shapeKey === "circumcenter_bisectors" || shapeKey === "euler_ninepoint",
      I: shapeKey === "incenter_anglebisectors",
      E: shapeKey === "euler_ninepoint",
      mid: shapeKey === "midsegment"
    };
    const obj = {
      id: genId("tri"),
      space: "2d",
      type: "polygon2d",
      subType: "triangle",
      name: `△ABC_${state.objects2D.length + 1}`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid",
      pts: [
        { x: -0.5 + off, y: 3.4, label: "A" },
        { x: -4.2 + off, y: -2.0, label: "B" },
        { x: 3.8 + off, y: -2.0, label: "C" }
      ],
      overlays,
      knowledgeId: shapeKey
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "square") {
    state.spaceMode = "2d";
    const s = 2.5;
    const obj = {
      id: genId("sq"),
      space: "2d",
      type: "polygon2d",
      subType: "square",
      name: `HìnhVuông_${state.objects2D.length + 1}`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid",
      pts: [
        { x: -s + off, y: s, label: "A" },
        { x: s + off, y: s, label: "B" },
        { x: s + off, y: -s, label: "C" },
        { x: -s + off, y: -s, label: "D" }
      ],
      knowledgeId: "square"
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "rectangle") {
    state.spaceMode = "2d";
    const obj = {
      id: genId("rect"),
      space: "2d",
      type: "polygon2d",
      subType: "rectangle",
      name: `HCN_${state.objects2D.length + 1}`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid",
      pts: [
        { x: -3.5 + off, y: 2.2, label: "A" },
        { x: 3.5 + off, y: 2.2, label: "B" },
        { x: 3.5 + off, y: -2.2, label: "C" },
        { x: -3.5 + off, y: -2.2, label: "D" }
      ],
      knowledgeId: "rectangle"
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "parallelogram") {
    state.spaceMode = "2d";
    const obj = {
      id: genId("para"),
      space: "2d",
      type: "polygon2d",
      subType: "parallelogram",
      name: `HBH_${state.objects2D.length + 1}`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid",
      pts: [
        { x: -2.2 + off, y: 2.2, label: "A" },
        { x: 3.8 + off, y: 2.2, label: "B" },
        { x: 2.2 + off, y: -2.2, label: "C" },
        { x: -3.8 + off, y: -2.2, label: "D" }
      ],
      knowledgeId: "parallelogram"
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "rhombus") {
    state.spaceMode = "2d";
    const obj = {
      id: genId("rhom"),
      space: "2d",
      type: "polygon2d",
      subType: "rhombus",
      name: `HìnhThoi_${state.objects2D.length + 1}`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid",
      pts: [
        { x: 0 + off, y: 2.8, label: "A" },
        { x: 4.2 + off, y: 0, label: "B" },
        { x: 0 + off, y: -2.8, label: "C" },
        { x: -4.2 + off, y: 0, label: "D" }
      ],
      knowledgeId: "rhombus"
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "trapezoid") {
    state.spaceMode = "2d";
    const obj = {
      id: genId("trap"),
      space: "2d",
      type: "polygon2d",
      subType: "trapezoid",
      name: `HìnhThang_${state.objects2D.length + 1}`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid",
      pts: [
        { x: -2.2 + off, y: 2.2, label: "A" },
        { x: 2.2 + off, y: 2.2, label: "B" },
        { x: 4.2 + off, y: -2.2, label: "C" },
        { x: -4.2 + off, y: -2.2, label: "D" }
      ],
      knowledgeId: "trapezoid"
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "regular_polygon") {
    state.spaceMode = "2d";
    const n = 6;
    const R = 3.2;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const ang = Math.PI / 2 + (i * 2 * Math.PI) / n;
      pts.push({
        x: off + R * Math.cos(ang),
        y: R * Math.sin(ang),
        label: `A${i + 1}`
      });
    }
    const obj = {
      id: genId("poly"),
      space: "2d",
      type: "polygon2d",
      subType: "regular_polygon",
      name: `LụcGiác_${state.objects2D.length + 1}`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid",
      pts,
      knowledgeId: "regular_polygon"
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "circle" || shapeKey === "circle_lines_angles") {
    state.spaceMode = "2d";
    const idx = state.objects2D.filter((o) => o.type === "circle2d").length + 1;
    const obj = {
      id: genId("cir"),
      space: "2d",
      type: "circle2d",
      name: `(C${idx})`,
      centerLabel: `O${idx}`,
      cx: off,
      cy: 0,
      r: 3.2,
      sectorAngle: shapeKey === "circle" ? 75 : 0,
      equationText: `(x - ${off.toFixed(1)})² + y² = 3.2²`,
      visible: true,
      color,
      lineWidth: 2.5,
      dash: "solid",
      knowledgeId: shapeKey
    };
    state.objects2D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "plane3d") {
    state.spaceMode = "3d";
    const idx = state.objects3D.filter((o) => o.type === "plane3d").length + 1;
    const obj = {
      id: genId("pln"),
      space: "3d",
      type: "plane3d",
      name: `(α${idx})`,
      a: 0,
      b: 0,
      c: 1,
      d: -1.5,
      equationText: "z - 1.5 = 0",
      visible: true,
      color,
      lineWidth: 2,
      dash: "solid",
      knowledgeId: "sphere"
    };
    state.objects3D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "line3d" || shapeKey === "line3d_velocity") {
    state.spaceMode = "3d";
    const idx = state.objects3D.filter((o) => o.type === "line3d").length + 1;
    const isVel = shapeKey === "line3d_velocity";
    const obj = {
      id: genId("ln3"),
      space: "3d",
      type: "line3d",
      name: isVel ? `r⃗_${idx}(t)` : `Δ${idx}`,
      x0: isVel ? -2.5 : -2,
      y0: isVel ? -1.5 : -1,
      z0: isVel ? 0.8 : 0,
      ux: isVel ? 1.8 : 1,
      uy: isVel ? 1.2 : 1,
      uz: isVel ? 0.6 : 1.5,
      hasVelocity: isVel,
      vx: isVel ? 1.8 : 1.0,
      vy: isVel ? 1.2 : 1.0,
      vz: isVel ? 0.6 : 0.5,
      t: 0,
      isPlaying: isVel,
      equationText: isVel ? `r⃗(t) = r⃗₀ + v⃗·t` : "(x+2)/1 = (y+1)/1 = z/1.5",
      visible: true,
      color: isVel ? "#c62828" : color,
      lineWidth: 2.5,
      dash: "solid",
      knowledgeId: isVel ? "line3d_velocity" : undefined
    };
    state.objects3D.push(obj);
    state.selectedIds = [obj.id];
  } else if (shapeKey === "sphere") {
    state.spaceMode = "3d";
    const idx = state.objects3D.filter((o) => o.type === "sphere3d").length + 1;
    const obj = {
      id: genId("sph"),
      space: "3d",
      type: "sphere3d",
      name: `(S${idx})`,
      centerLabel: `I${idx}`,
      cx: 0,
      cy: 0,
      cz: 0,
      r: 3.8,
      equationText: "x² + y² + z² = 3.8²",
      visible: true,
      color,
      lineWidth: 2.2,
      dash: "solid",
      knowledgeId: "sphere"
    };
    state.objects3D.push(obj);
    state.selectedIds = [obj.id];
  } else if (["cube", "box", "prism_tri", "pyramid_square", "pyramid_tri", "cylinder", "cone"].includes(shapeKey)) {
    state.spaceMode = "3d";
    const idx = state.objects3D.length + 1;
    const obj = {
      id: genId(shapeKey),
      space: "3d",
      type: "solid3d",
      solidType: shapeKey,
      name: `${shapeInfo ? shapeInfo.name.split("(")[0].trim() : shapeKey}_${idx}`,
      cx: 0,
      cy: 0,
      cz: 0,
      a: 4.5,
      b: 3.5,
      h: 5.0,
      r: 3.0,
      visible: true,
      color,
      lineWidth: 2.4,
      dash: "solid",
      knowledgeId: shapeKey
    };
    state.objects3D.push(obj);
    state.selectedIds = [obj.id];
  }

  syncSpaceModeUI();
  refreshAllUI();
}

// ============================================================================
// CAD OPERATIONS: COPY, PASTE, DELETE, RENAME (A->P), HIDE/SHOW, ZOOM TO FIT
// ============================================================================

function getSelectedObjects() {
  const list = getActiveSceneList();
  return list.filter((o) => state.selectedIds.includes(o.id));
}

function deleteSelected() {
  if (state.selectedIds.length === 0) return;
  saveHistory();
  if (state.spaceMode === "2d") {
    state.objects2D = state.objects2D.filter((o) => !state.selectedIds.includes(o.id));
  } else {
    state.objects3D = state.objects3D.filter((o) => !state.selectedIds.includes(o.id));
  }
  state.selectedIds = [];
  refreshAllUI();
}

function copySelected() {
  const sel = getSelectedObjects();
  if (sel.length === 0) return;
  state.clipboard = cloneDeep(sel);
}

function pasteClipboard() {
  if (!state.clipboard || state.clipboard.length === 0) return;
  saveHistory();
  const list = getActiveSceneList();
  const newSelected = [];

  state.clipboard.forEach((orig) => {
    const copy = cloneDeep(orig);
    copy.id = genId(copy.type);
    copy.name = `${copy.name}'`;

    if (copy.space === "2d") {
      if (copy.pts) {
        copy.pts.forEach((pt) => {
          pt.x += 1.2;
          pt.y -= 0.8;
          pt.label = `${pt.label}'`;
        });
      } else if (copy.type === "circle2d" || copy.type === "point2d") {
        if (copy.cx !== undefined) copy.cx += 1.5;
        if (copy.cy !== undefined) copy.cy -= 1.0;
        if (copy.x !== undefined) copy.x += 1.5;
        if (copy.y !== undefined) copy.y -= 1.0;
      } else if (copy.type === "line2d") {
        copy.c -= copy.a * 1.5;
      }
    } else {
      if (copy.cx !== undefined) copy.cx += 1.5;
      if (copy.x0 !== undefined) copy.x0 += 1.5;
      if (copy.d !== undefined) copy.d -= 1.5;
    }

    list.push(copy);
    newSelected.push(copy.id);
  });

  state.selectedIds = newSelected;
  refreshAllUI();
}

function toggleSelectedVisibility() {
  const sel = getSelectedObjects();
  if (sel.length === 0) return;
  saveHistory();
  sel.forEach((o) => {
    o.visible = o.visible === false ? true : false;
  });
  refreshAllUI();
}

function applyStyleToSelected(stylePatch) {
  Object.assign(state.currentStyle, stylePatch);
  document.querySelectorAll(".color-swatch").forEach((sw) => {
    sw.classList.toggle("active", sw.dataset.color === state.currentStyle.color);
  });

  const sel = getSelectedObjects();
  if (sel.length > 0) {
    saveHistory();
    sel.forEach((o) => {
      if (stylePatch.color) o.color = stylePatch.color;
      if (stylePatch.lineWidth) o.lineWidth = stylePatch.lineWidth;
      if (stylePatch.dash) o.dash = stylePatch.dash;
    });
    refreshAllUI();
  }
}

function openRenameModal() {
  const sel = getSelectedObjects();
  if (sel.length === 0) return;
  const obj = sel[0];
  const dlg = document.getElementById("renameDialog");
  document.getElementById("renameObjInput").value = obj.name || "";

  const vertWrap = document.getElementById("renameVerticesWrap");
  const vertInput = document.getElementById("renameVerticesInput");
  if (obj.pts && obj.pts.length > 0) {
    vertWrap.style.display = "block";
    vertInput.value = obj.pts.map((p) => p.label).join(", ");
  } else if (obj.centerLabel) {
    vertWrap.style.display = "block";
    vertInput.value = obj.centerLabel;
  } else {
    vertWrap.style.display = "none";
  }

  dlg.showModal();
  document.getElementById("renameObjInput").focus();
}

function applyRenameFromModal() {
  const sel = getSelectedObjects();
  if (sel.length === 0) return;
  saveHistory();
  const obj = sel[0];
  const newName = document.getElementById("renameObjInput").value.trim();
  if (newName) obj.name = newName;

  const vertStr = document.getElementById("renameVerticesInput").value.trim();
  if (obj.pts && vertStr) {
    const labels = vertStr.split(",").map((s) => s.trim()).filter(Boolean);
    obj.pts.forEach((pt, idx) => {
      if (labels[idx]) pt.label = labels[idx];
    });
  } else if (obj.centerLabel && vertStr) {
    obj.centerLabel = vertStr.split(",")[0].trim();
  }
  refreshAllUI();
}

function zoomToFit() {
  if (state.spaceMode === "3d") {
    const vis = state.objects3D.filter((o) => o.visible !== false);
    if (vis.length === 0) {
      state.cam3D = { yaw: -0.65, pitch: 0.42, zoom: 1.0, panX: 0, panY: 0, target: { x: 0, y: 0, z: 0 }, unitScale: 1.0 };
      drawScene();
      return;
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    const include = (x, y, z) => {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    };
    vis.forEach((o) => {
      if (o.type === "line3d" || o.type === "motion3d") {
        include(o.x0, o.y0, o.z0);
        if (o.hasVelocity || o.vx || o.vy || o.vz) {
          const tMax = Math.max(25, o.tMinCpa ? o.tMinCpa * 1.5 : 50);
          include((o.x0 || 0) + (o.vx || 0) * tMax, (o.y0 || 0) + (o.vy || 0) * tMax, (o.z0 || 0) + (o.vz || 0) * tMax);
        } else {
          include((o.x0 || 0) + (o.ux || 1) * 3, (o.y0 || 0) + (o.uy || 0) * 3, (o.z0 || 0) + (o.uz || 0) * 3);
        }
      } else if (o.type === "point3d") {
        include(o.x, o.y, o.z);
      } else if (o.type === "sphere3d") {
        include(o.cx - o.r, o.cy - o.r, o.cz - o.r);
        include(o.cx + o.r, o.cy + o.r, o.cz + o.r);
      } else if (o.type === "vector3d") {
        include(o.x0 || 0, o.y0 || 0, o.z0 || 0);
        include((o.x0 || 0) + o.x, (o.y0 || 0) + o.y, (o.z0 || 0) + o.z);
      } else if (o.type === "solid3d") {
        const r = o.r || 3;
        const h = o.h || 4;
        include(-r, -r, -h / 2);
        include(r, r, h / 2);
      } else {
        include(-5, -5, -5);
        include(5, 5, 5);
      }
    });
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const spanZ = maxZ - minZ;
    const maxSpan = Math.max(spanX, spanY, spanZ, 8);
    state.cam3D.target = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };
    state.cam3D.unitScale = 1.0;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr || 800;
    const h = canvas.height / dpr || 600;
    const minDim = Math.min(w, h);
    state.cam3D.zoom = Math.max(0.05, Math.min(10.0, (minDim * 0.42) / (maxSpan * 34)));
    state.cam3D.panX = 0;
    state.cam3D.panY = 0;
    drawScene();
    updateCursorStatusPill();
    showToast("Đã khớp toàn bộ đối tượng 3D vào khung nhìn!");
    return;
  }

  const vis = state.objects2D.filter((o) => o.visible !== false);
  if (vis.length === 0) {
    state.view2D.offsetX = 0;
    state.view2D.offsetY = 0;
    state.view2D.scale = 38;
    drawScene();
    return;
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const includePt = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  vis.forEach((o) => {
    if (o.pts) {
      o.pts.forEach((p) => includePt(p.x, p.y));
    } else if (o.type === "circle2d") {
      includePt(o.cx - o.r, o.cy - o.r);
      includePt(o.cx + o.r, o.cy + o.r);
    } else if (o.type === "point2d") {
      includePt(o.x - 1, o.y - 1);
      includePt(o.x + 1, o.y + 1);
    } else if (o.type === "ellipse2d") {
      includePt(-o.rx, -o.ry);
      includePt(o.rx, o.ry);
    } else {
      includePt(-5, -5);
      includePt(5, 5);
    }
  });

  if (!isFinite(minX)) {
    minX = -6; maxX = 6; minY = -4; maxY = 4;
  }

  const w = canvas.clientWidth || 700;
  const h = canvas.clientHeight || 480;
  const spanX = Math.max(4, maxX - minX + 2.5);
  const spanY = Math.max(4, maxY - minY + 2.5);
  const newScale = Math.min((w * 0.8) / spanX, (h * 0.8) / spanY);

  state.view2D.scale = Math.max(12, Math.min(120, newScale));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  state.view2D.offsetX = -midX * state.view2D.scale;
  state.view2D.offsetY = midY * state.view2D.scale;
  drawScene();
}

function toggleFullscreenCanvas() {
  const card = document.getElementById("canvasCard");
  state.isFullscreen = !state.isFullscreen;
  card.classList.toggle("fullscreen-active", state.isFullscreen);
  document.getElementById("fullscreenBtn").classList.toggle("active", state.isFullscreen);
  if (state.isFullscreen && card.requestFullscreen) {
    card.requestFullscreen().catch(() => {});
  } else if (!state.isFullscreen && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  setTimeout(drawScene, 60);
}

function bindKeyboardShortcuts() {
  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement ? document.activeElement.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      e.preventDefault();
      copySelected();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      e.preventDefault();
      pasteClipboard();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteSelected();
    } else if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      zoomToFit();
    } else if (e.key.toLowerCase() === "g") {
      e.preventDefault();
      document.getElementById("gridToggleBtn").click();
    } else if (e.key.toLowerCase() === "x") {
      e.preventDefault();
      document.getElementById("axesToggleBtn").click();
    } else if (e.key.toLowerCase() === "h") {
      e.preventDefault();
      toggleSelectedVisibility();
    } else if (e.key.toLowerCase() === "r") {
      e.preventDefault();
      openRenameModal();
    } else if (e.key.toLowerCase() === "e") {
      e.preventDefault();
      openEditModal();
    }
  });
}

// ============================================================================
// CANVAS MOUSE / POINTER INTERACTION (DRAG VERTEX, PAN, WHEEL ZOOM, MARQUEE)
// ============================================================================

function runInertia3D() {
  if (state.spaceMode !== "3d" || !state.inertia3D) return;
  const speed = Math.hypot(state.inertia3D.vx, state.inertia3D.vy);
  if (speed < 0.0001) {
    state.inertia3D.vx = 0;
    state.inertia3D.vy = 0;
    state.inertia3D.animId = null;
    return;
  }
  state.cam3D.yaw += state.inertia3D.vx;
  state.cam3D.pitch = Math.max(-1.35, Math.min(1.35, state.cam3D.pitch + state.inertia3D.vy));
  state.inertia3D.vx *= 0.94;
  state.inertia3D.vy *= 0.94;
  drawScene();
  state.inertia3D.animId = requestAnimationFrame(runInertia3D);
}

function bindCanvasEvents() {
  const resizeObserver = new ResizeObserver(() => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    drawScene();
  });
  resizeObserver.observe(canvas.parentElement);

  const getLocalCenterCoords = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    };
  };

  // Prevent middle click autoscroll & iOS Safari long-press context menu
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 1) e.preventDefault();
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // Track active pointers for 2-finger pinch-to-zoom & pan on iPad / touch screens
  const activeTouches = new Map();
  let lastPinchDist = null;
  let lastPinchMid = null;
  let lastPenTimestamp = 0;

  canvas.addEventListener("dblclick", (e) => {
    const pos = getLocalCenterCoords(e);
    if (state.spaceMode === "2d") {
      const hit = hitTest2D(pos.x, pos.y);
      if (hit) {
        state.selectedIds = [hit.objId];
        refreshAllUI();
        openEditModal(hit.objId);
      }
    } else {
      if (state.inertia3D && state.inertia3D.animId) {
        cancelAnimationFrame(state.inertia3D.animId);
        state.inertia3D.animId = null;
      }
      state.cam3D = { yaw: -0.65, pitch: 0.42, zoom: 1.0, panX: 0, panY: 0 };
      drawScene();
      showToast("Đã đặt lại góc nhìn 3D");
    }
  });

  canvas.addEventListener("pointerdown", (e) => {
    const pos = getLocalCenterCoords(e);
    const isCoarse = e.pointerType === "touch" || e.pointerType === "pen";

    // Stop any coasting 3D inertia animation
    if (state.inertia3D && state.inertia3D.animId) {
      cancelAnimationFrame(state.inertia3D.animId);
      state.inertia3D.animId = null;
    }
    if (state.inertia3D) {
      state.inertia3D.vx = 0;
      state.inertia3D.vy = 0;
    }

    // Check hit on 3D Orientation Triad / Compass
    if (state.spaceMode === "3d" && state.show3DTriad !== false) {
      const rect = canvas.getBoundingClientRect();
      const triadCx = rect.width / 2 - 55;
      const triadCy = rect.height / 2 - 55;
      const relX = pos.x - triadCx;
      const relY = pos.y - triadCy;
      if (Math.hypot(relX, relY) <= 42) {
        if (handle3DTriadClick(relX, relY)) {
          return;
        }
      }
    }

    if (e.pointerType === "pen") {
      lastPenTimestamp = performance.now();
      activeTouches.clear();
      lastPinchDist = null;
      lastPinchMid = null;
      try {
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.rangeCount > 0) sel.removeAllRanges();
      } catch {}
    }

    // Palm Rejection: ignore touch if Apple Pencil is active or was used within 850ms
    if (e.pointerType === "touch") {
      if (window.pmathPencilGuardActive && performance.now() - lastPenTimestamp < 850) {
        e.preventDefault();
        return;
      }
      activeTouches.set(e.pointerId, pos);
      canvas.setPointerCapture(e.pointerId);

      // 2-Finger Pinch-to-Zoom & Pan on iPad
      if (activeTouches.size === 2) {
        const pts = Array.from(activeTouches.values());
        lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        lastPinchMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        state.interaction.mode = "pinch_zoom";
        state.interaction.marqueeRect = null;
        return;
      }
    }

    state.interaction.startX = pos.x;
    state.interaction.startY = pos.y;
    state.interaction.lastX = pos.x;
    state.interaction.lastY = pos.y;
    state.interaction.hasMoved = false;

    // Pan mode: Middle mouse (button === 1), Right-click in 3D (button === 2), Shift+drag in 3D, or Alt+LeftClick
    if (e.button === 1 || (e.button === 2 && state.spaceMode === "3d") || (e.shiftKey && state.spaceMode === "3d") || (e.button === 0 && e.altKey)) {
      state.interaction.mode = "pan";
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      return;
    }

    if (state.spaceMode === "3d") {
      state.interaction.mode = "orbit3d";
      canvas.setPointerCapture(e.pointerId);
      return;
    }

    // 2D Mode Hit-Testing (expanded hit radius on iPad / Apple Pencil for effortless vertex grabbing)
    const hit = hitTest2D(pos.x, pos.y, isCoarse ? 22 : 13);
    if (hit) {
      if (e.shiftKey) {
        if (state.selectedIds.includes(hit.objId)) {
          state.selectedIds = state.selectedIds.filter((id) => id !== hit.objId);
        } else {
          state.selectedIds.push(hit.objId);
        }
      } else if (!state.selectedIds.includes(hit.objId)) {
        state.selectedIds = [hit.objId];
      }

      saveHistory();
      if (hit.vertexIdx !== -1) {
        state.interaction.mode = "drag_vertex";
        state.interaction.targetObjId = hit.objId;
        state.interaction.targetVertexIdx = hit.vertexIdx;
      } else {
        state.interaction.mode = "drag_object";
        state.interaction.targetObjId = hit.objId;
      }
      canvas.setPointerCapture(e.pointerId);
      refreshAllUI();
    } else if (e.pointerType === "touch") {
      // Single-finger drag on empty space pans the 2D canvas smoothly on iPad
      state.interaction.mode = "pan";
      canvas.setPointerCapture(e.pointerId);
    } else {
      // Clicked on empty space with Mouse / Apple Pencil -> Start Marquee Box Selection!
      if (!e.shiftKey) state.selectedIds = [];
      state.interaction.mode = "marquee";
      state.interaction.marqueeRect = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
      canvas.setPointerCapture(e.pointerId);
      refreshAllUI();
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const pos = getLocalCenterCoords(e);
    if (e.pointerType === "pen") {
      lastPenTimestamp = performance.now();
    }

    if (e.pointerType === "touch" && activeTouches.has(e.pointerId)) {
      activeTouches.set(e.pointerId, pos);
      if (activeTouches.size === 2 && state.interaction.mode === "pinch_zoom") {
        const pts = Array.from(activeTouches.values());
        const dist = Math.max(10, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
        const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

        if (lastPinchDist && lastPinchMid) {
          const factor = dist / lastPinchDist;
          const dx = mid.x - lastPinchMid.x;
          const dy = mid.y - lastPinchMid.y;

          if (state.spaceMode === "2d") {
            const beforeMath = screenToMath2D(mid.x, mid.y);
            state.view2D.scale = Math.max(1.5, Math.min(3000, state.view2D.scale * factor));
            state.view2D.offsetX = mid.x - beforeMath.x * state.view2D.scale + dx;
            state.view2D.offsetY = mid.y + beforeMath.y * state.view2D.scale + dy;
          } else {
            state.cam3D.zoom = Math.max(0.01, Math.min(100.0, state.cam3D.zoom * factor));
            state.cam3D.panX += dx;
            state.cam3D.panY += dy;
          }
          updateCursorStatusPill();
          drawScene();
        }
        lastPinchDist = dist;
        lastPinchMid = mid;
        return;
      }
    }

    const mPos = screenToMath2D(pos.x, pos.y);
    state.cursorMathPos = mPos;
    updateCursorStatusPill();

    const dx = pos.x - state.interaction.lastX;
    const dy = pos.y - state.interaction.lastY;
    state.interaction.lastX = pos.x;
    state.interaction.lastY = pos.y;

    if (state.interaction.mode === "pan") {
      if (state.spaceMode === "2d") {
        state.view2D.offsetX += dx;
        state.view2D.offsetY += dy;
      } else {
        state.cam3D.panX += dx;
        state.cam3D.panY += dy;
      }
      drawScene();
      return;
    }

    if (state.interaction.mode === "orbit3d") {
      const stepVx = dx * 0.0085;
      const stepVy = dy * 0.0085;
      state.cam3D.yaw += stepVx;
      state.cam3D.pitch = Math.max(-1.35, Math.min(1.35, state.cam3D.pitch + stepVy));
      if (state.inertia3D) {
        state.inertia3D.vx = state.inertia3D.vx * 0.35 + stepVx * 0.65;
        state.inertia3D.vy = state.inertia3D.vy * 0.35 + stepVy * 0.65;
      }
      drawScene();
      return;
    }

    if (state.interaction.mode === "drag_vertex") {
      const obj = state.objects2D.find((o) => o.id === state.interaction.targetObjId);
      if (obj && obj.pts && obj.pts[state.interaction.targetVertexIdx]) {
        obj.pts[state.interaction.targetVertexIdx].x = mPos.x;
        obj.pts[state.interaction.targetVertexIdx].y = mPos.y;
        updateMetricsAndKnowledgeOnly();
        drawScene();
      }
      return;
    }

    if (state.interaction.mode === "drag_object") {
      const dmx = dx / state.view2D.scale;
      const dmy = -dy / state.view2D.scale;
      const selObjs = getSelectedObjects();
      selObjs.forEach((o) => {
        if (o.pts) {
          o.pts.forEach((pt) => {
            pt.x += dmx;
            pt.y += dmy;
          });
        } else if (o.type === "circle2d") {
          o.cx += dmx;
          o.cy += dmy;
          o.equationText = `(x - ${o.cx.toFixed(1)})² + (y - ${o.cy.toFixed(1)})² = ${o.r.toFixed(1)}²`;
        } else if (o.type === "point2d") {
          o.x += dmx;
          o.y += dmy;
        } else if (o.type === "line2d") {
          o.c -= o.a * dmx + o.b * dmy;
        }
      });
      updateMetricsAndKnowledgeOnly();
      drawScene();
      return;
    }

    if (state.interaction.mode === "marquee") {
      state.interaction.marqueeRect.x2 = pos.x;
      state.interaction.marqueeRect.y2 = pos.y;
      selectObjectsInMarquee(state.interaction.marqueeRect);
      renderSceneObjectsTree();
      drawScene();
      return;
    }

    // Hover feedback in 2D
    if (state.spaceMode === "2d") {
      const hit = hitTest2D(pos.x, pos.y);
      state.hoverTarget = hit;
      canvas.style.cursor = hit ? (hit.vertexIdx !== -1 ? "pointer" : "move") : "default";
      drawScene();
    }
  });

  const finishCanvasPointer = (e) => {
    if (e && e.pointerType === "touch") {
      activeTouches.delete(e.pointerId);
      if (activeTouches.size < 2) {
        lastPinchDist = null;
        lastPinchMid = null;
      }
    }
    if (state.interaction.mode === "marquee") {
      state.interaction.marqueeRect = null;
      refreshAllUI();
    } else if (state.interaction.mode === "drag_vertex" || state.interaction.mode === "drag_object") {
      refreshAllUI();
    } else if (state.interaction.mode === "orbit3d") {
      if (state.inertia3D && Math.hypot(state.inertia3D.vx, state.inertia3D.vy) > 0.0008) {
        if (state.inertia3D.animId) cancelAnimationFrame(state.inertia3D.animId);
        state.inertia3D.animId = requestAnimationFrame(runInertia3D);
      }
    }
    if (activeTouches.size === 0) {
      state.interaction.mode = "none";
      canvas.style.cursor = "default";
    }
  };

  canvas.addEventListener("pointerup", finishCanvasPointer);
  canvas.addEventListener("pointercancel", finishCanvasPointer);

  // Mouse Wheel Zoom (Zoom centered at cursor in 2D!)
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const pos = getLocalCenterCoords(e);
      const factor = e.deltaY < 0 ? 1.1 : 0.91;

      if (state.spaceMode === "2d") {
        const beforeMath = screenToMath2D(pos.x, pos.y);
        state.view2D.scale = Math.max(1.5, Math.min(3000, state.view2D.scale * factor));
        state.view2D.offsetX = pos.x - beforeMath.x * state.view2D.scale;
        state.view2D.offsetY = pos.y + beforeMath.y * state.view2D.scale;
      } else {
        state.cam3D.zoom = Math.max(0.01, Math.min(100.0, state.cam3D.zoom * factor));
      }
      updateCursorStatusPill();
      drawScene();
    },
    { passive: false }
  );
}

function updateCursorStatusPill() {
  const pill = document.getElementById("cursorCoordPill");
  if (!pill) return;
  if (state.spaceMode === "2d") {
    const zoomPct = Math.round((state.view2D.scale / 38) * 100);
    const xStr = state.cursorMathPos.x.toFixed(2).replace(".", ",");
    const yStr = state.cursorMathPos.y.toFixed(2).replace(".", ",");
    pill.textContent = `x: ${xStr}; y: ${yStr} | Tỉ lệ: ${zoomPct}%`;
  } else {
    const zoomPct = Math.round(state.cam3D.zoom * 100);
    const stepVal = typeof getAdaptiveStep3D === "function" ? getAdaptiveStep3D(34 * state.cam3D.zoom) : 2;
    const stepStr = (stepVal < 1 ? stepVal.toFixed(1) : stepVal.toString()).replace(".", ",");
    pill.textContent = `Không gian Oxyz | Tỉ lệ: ${zoomPct}% (Bước: ${stepStr})`;
  }
}
window.updateCursorStatusPill = updateCursorStatusPill;

function hitTest2D(sx, sy, vertexTol = 13) {
  const vis = state.objects2D.filter((o) => o.visible !== false);

  // 1. Check vertices first (radius 13px on desktop, 22px on iPad/touch)
  for (let i = vis.length - 1; i >= 0; i--) {
    const o = vis[i];
    if (o.pts) {
      for (let v = 0; v < o.pts.length; v++) {
        const sp = mathToScreen2D(o.pts[v].x, o.pts[v].y);
        if (Math.hypot(sp.x - sx, sp.y - sy) <= vertexTol) {
          return { objId: o.id, vertexIdx: v };
        }
      }
    } else if (o.type === "point2d") {
      const sp = mathToScreen2D(o.x, o.y);
      if (Math.hypot(sp.x - sx, sp.y - sy) <= vertexTol) {
        return { objId: o.id, vertexIdx: -1 };
      }
    } else if (o.type === "circle2d") {
      const sp = mathToScreen2D(o.cx, o.cy);
      if (Math.hypot(sp.x - sx, sp.y - sy) <= vertexTol) {
        return { objId: o.id, vertexIdx: -1 };
      }
    }
  }

  // 2. Check edges / curves / interiors
  const mPos = screenToMath2D(sx, sy);
  for (let i = vis.length - 1; i >= 0; i--) {
    const o = vis[i];
    if (o.type === "circle2d") {
      const distCenter = Math.hypot(mPos.x - o.cx, mPos.y - o.cy);
      if (Math.abs(distCenter - o.r) * state.view2D.scale <= 10) {
        return { objId: o.id, vertexIdx: -1 };
      }
    } else if (o.type === "line2d") {
      const d = Math.abs(o.a * mPos.x + o.b * mPos.y + o.c) / (Math.hypot(o.a, o.b) || 1);
      if (d * state.view2D.scale <= 9) {
        return { objId: o.id, vertexIdx: -1 };
      }
    } else if (o.type === "func2d" || o.type === "parabola2d") {
      const fy = GeoEquations.evalFunc2D(o, mPos.x);
      if (Number.isFinite(fy) && Math.abs(fy - mPos.y) * state.view2D.scale <= 12) {
        return { objId: o.id, vertexIdx: -1 };
      }
    } else if (o.type === "funcY2d") {
      const fn = GeoEquations.compileExpr(o.expr);
      const fx = fn ? fn(0, mPos.y, 0) : NaN;
      if (Number.isFinite(fx) && Math.abs(fx - mPos.x) * state.view2D.scale <= 12) {
        return { objId: o.id, vertexIdx: -1 };
      }
    } else if (o.type === "polygon2d" && o.pts) {
      if (isPointInPolygon(mPos, o.pts)) {
        return { objId: o.id, vertexIdx: -1 };
      }
    }
  }

  return null;
}

function isPointInPolygon(pt, vs) {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi || 1e-7) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function selectObjectsInMarquee(rect) {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);

  const inBox = (sx, sy) => sx >= minX && sx <= maxX && sy >= minY && sy <= maxY;
  const selected = [];

  state.objects2D.forEach((o) => {
    if (o.visible === false) return;
    if (o.pts && o.pts.some((p) => { const s = mathToScreen2D(p.x, p.y); return inBox(s.x, s.y); })) {
      selected.push(o.id);
    } else if (o.type === "circle2d") {
      const s = mathToScreen2D(o.cx, o.cy);
      if (inBox(s.x, s.y)) selected.push(o.id);
    } else if (o.type === "point2d") {
      const s = mathToScreen2D(o.x, o.y);
      if (inBox(s.x, s.y)) selected.push(o.id);
    }
  });

  state.selectedIds = selected;
}

// ============================================================================
// SIDEBAR, SLIDERS, METRICS & KNOWLEDGE PANEL RENDERING
// ============================================================================

function refreshAllUI() {
  renderSceneObjectsTree();
  renderLibraryList();
  renderSelectedObjectSliders();
  updateMetricsAndKnowledgeOnly();
  drawScene();
  updateCursorStatusPill();
}

function updateMetricsAndKnowledgeOnly() {
  renderLiveMetrics();
  renderKnowledgePanel();
}

function renderSceneObjectsTree() {
  const listEl = document.getElementById("sceneObjectsList");
  const list = getActiveSceneList();
  const badge = document.getElementById("sceneCountBadge");
  if (badge) badge.textContent = list.length;
  listEl.innerHTML = "";

  if (list.length === 0) {
    listEl.innerHTML = `<li style="padding:1rem 0.5rem; font-size:0.8rem; color:var(--text-muted); text-align:center; line-height:1.5;">
      Khung vẽ đang trống.<br>
      Nhập phương trình phía trên hoặc chọn từ tab <strong>Hình mẫu dựng sẵn</strong>!<br>
      <button type="button" class="cad-btn mini" style="margin-top:8px; display:inline-block;" onclick="window.loadDefaultDemoScenes()">Nạp hình mẫu</button>
    </li>`;
    return;
  }

  list.forEach((obj) => {
    const isSel = state.selectedIds.includes(obj.id);
    const li = document.createElement("li");
    li.className = `scene-obj-item ${isSel ? "selected" : ""} ${obj.visible === false ? "hidden-obj" : ""}`;

    const typeLabelMap = {
      solid3d: "Khối 3D",
      func2d: "Hàm số 2D",
      line2d: "Đường thẳng",
      line3d: "Đường thẳng 3D",
      polygon2d: "Đa giác",
      circle2d: "Đường tròn",
      sphere3d: "Mặt cầu",
      plane3d: "Mặt phẳng",
      point2d: "Điểm",
      point3d: "Điểm",
      vector3d: "Vectơ 3D",
      parabola2d: "Parabol 2D",
      surface3d: "Mặt cong 3D",
      curve3d: "Đường cong 3D"
    };
    const typeVn = typeLabelMap[obj.type] || obj.type;

    const subText = obj.hasVelocity
      ? `v = ${Math.hypot(obj.vx || obj.ux, obj.vy || obj.uy, obj.vz || obj.uz).toFixed(1).replace(".", ",")} m/s`
      : obj.equationText
      ? obj.equationText
      : obj.pts
      ? `${typeVn} ${obj.pts.map((p) => p.label).join("")}`
      : typeVn;

    li.innerHTML = `
      <div class="obj-left">
        <span class="obj-color-dot" style="background:${obj.color || "#1e64b4"}"></span>
        <div class="obj-title-wrap">
          <span class="obj-name">${escapeHtml(obj.name)}</span>
          <span class="obj-sub">${escapeHtml(subText)}</span>
        </div>
      </div>
      <div class="obj-actions">
        <button class="icon-mini-btn edit-obj-btn" title="Sửa đối tượng">Sửa</button>
        <button class="icon-mini-btn vis-obj-btn" title="Ẩn/Hiện">${obj.visible === false ? "Hiện" : "Ẩn"}</button>
        <button class="icon-mini-btn del-obj-btn" title="Xóa">✕</button>
      </div>
    `;

    li.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      if (e.shiftKey) {
        if (state.selectedIds.includes(obj.id)) {
          state.selectedIds = state.selectedIds.filter((id) => id !== obj.id);
        } else {
          state.selectedIds.push(obj.id);
        }
      } else {
        state.selectedIds = [obj.id];
      }
      if (obj.knowledgeId) state.activeKnowledgeId = obj.knowledgeId;
      refreshAllUI();
    });

    li.addEventListener("dblclick", () => {
      state.selectedIds = [obj.id];
      refreshAllUI();
      openEditModal(obj.id);
    });

    li.querySelector(".edit-obj-btn").addEventListener("click", () => {
      state.selectedIds = [obj.id];
      refreshAllUI();
      openEditModal(obj.id);
    });

    li.querySelector(".vis-obj-btn").addEventListener("click", () => {
      saveHistory();
      obj.visible = obj.visible === false ? true : false;
      refreshAllUI();
    });

    li.querySelector(".del-obj-btn").addEventListener("click", () => {
      saveHistory();
      if (state.spaceMode === "2d") {
        state.objects2D = state.objects2D.filter((o) => o.id !== obj.id);
      } else {
        state.objects3D = state.objects3D.filter((o) => o.id !== obj.id);
      }
      state.selectedIds = state.selectedIds.filter((id) => id !== obj.id);
      refreshAllUI();
    });

    listEl.appendChild(li);
  });
}

function renderLibraryList() {
  const listEl = document.getElementById("shapeList");
  if (!listEl) return;
  listEl.innerHTML = "";

  const filtered = GEOMETRY_DATA.filter((item) => {
    // 1. Search Query filter
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q);
      if (!match) return false;
    }
    // 2. Category Pill filter
    if (state.libraryFilter && state.libraryFilter !== "all") {
      if (state.libraryFilter === "2d") return item.category === "2d";
      if (state.libraryFilter === "3d") return item.category === "3d";
      if (state.libraryFilter === "special") {
        return (
          item.group.includes("Điểm") ||
          item.group.includes("đặc biệt") ||
          item.group.includes("Tam giác")
        );
      }
      if (state.libraryFilter === "motion") {
        return item.id === "line3d_velocity" || item.group.includes("Chuyển động");
      }
    }
    return true;
  });

  let lastGroup = "";
  filtered.forEach((item) => {
    if (item.group !== lastGroup) {
      lastGroup = item.group;
      const g = document.createElement("li");
      g.className = "shape-group-label";
      g.textContent = item.group;
      listEl.appendChild(g);
    }

    const li = document.createElement("li");
    const btn = document.createElement("div");
    btn.className = `shape-item ${item.id === state.activeKnowledgeId ? "active" : ""}`;
    btn.innerHTML = `
      <div class="shape-item-left">
        <span class="shape-badge">${item.icon}</span>
        <div style="overflow:hidden;">
          <div class="shape-item-title">${item.name}</div>
          <div class="shape-item-sub">${item.subtitle}</div>
        </div>
      </div>
      <span class="add-to-scene-pill" title="Thêm hình này vào bản vẽ">+ Thêm</span>
    `;

    btn.addEventListener("click", () => {
      state.activeKnowledgeId = item.id;
      quickAddShape(item.id);
    });

    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

function renderSelectedObjectSliders() {
  const container = document.getElementById("slidersContainer");
  const badge = document.getElementById("selectedObjBadge");
  const sel = getSelectedObjects();
  container.innerHTML = "";

  if (sel.length === 0) {
    badge.textContent = "Chưa chọn";
    container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); grid-column: 1 / -1;">Hãy nhấp vào một đối tượng trên hình vẽ hoặc trong danh sách bên trái để nhập chính xác kích thước, tọa độ, bán kính hoặc hệ số phương trình.</p>`;
    return;
  }

  const obj = sel[0];
  badge.textContent = sel.length > 1 ? `${sel.length} đối tượng` : obj.name;

  const addNumberInput = (label, val, unit, onChange, options = {}) => {
    const group = document.createElement("div");
    group.className = "param-input-group";
    const step = options.step || "0.1";
    const minAttr = options.min !== undefined ? `min="${options.min}"` : "";
    const formattedVal = Number.isInteger(val) ? val : Number(val).toFixed(2);

    group.innerHTML = `
      <label class="param-input-label">${label}</label>
      <div class="param-input-wrap">
        <input
          type="number"
          step="${step}"
          ${minAttr}
          value="${formattedVal}"
          class="param-number-input"
        />
        ${unit ? `<span class="param-unit-tag">${unit}</span>` : ""}
      </div>
    `;

    const inp = group.querySelector("input");
    inp.addEventListener("focus", () => saveHistory());
    inp.addEventListener("input", (e) => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      if (options.min !== undefined && v < options.min) return;
      onChange(v);
      renderSceneObjectsTree();
      updateMetricsAndKnowledgeOnly();
      drawScene();
    });
    container.appendChild(group);
  };

  if (obj.type === "circle2d") {
    const updateCircleEq = () => {
      obj.equationText = `(x - ${obj.cx.toFixed(1)})² + (y - ${obj.cy.toFixed(1)})² = ${obj.r.toFixed(1)}²`;
    };
    addNumberInput("Bán kính R", obj.r, "đv", (v) => {
      obj.r = Math.max(0.1, v);
      updateCircleEq();
    }, { min: 0.1, step: "0.1" });
    addNumberInput("Tâm x₀", obj.cx, "đv", (v) => {
      obj.cx = v;
      updateCircleEq();
    });
    addNumberInput("Tâm y₀", obj.cy, "đv", (v) => {
      obj.cy = v;
      updateCircleEq();
    });
  } else if (obj.type === "line2d") {
    const updateLineEq = () => {
      obj.equationText = `${obj.a.toFixed(1)}x + ${obj.b.toFixed(1)}y + ${obj.c.toFixed(1)} = 0`;
    };
    addNumberInput("Hệ số a (ax + by + c = 0)", obj.a, "", (v) => {
      obj.a = v;
      updateLineEq();
    });
    addNumberInput("Hệ số b", obj.b, "", (v) => {
      obj.b = v;
      updateLineEq();
    });
    addNumberInput("Hệ số tự do c", obj.c, "", (v) => {
      obj.c = v;
      updateLineEq();
    });
  } else if (obj.type === "point2d") {
    addNumberInput(`Hoành độ x (${obj.name})`, obj.x, "đv", (v) => {
      obj.x = v;
      obj.equationText = `${obj.name}(${obj.x.toFixed(1)}, ${obj.y.toFixed(1)})`;
    });
    addNumberInput(`Tung độ y (${obj.name})`, obj.y, "đv", (v) => {
      obj.y = v;
      obj.equationText = `${obj.name}(${obj.x.toFixed(1)}, ${obj.y.toFixed(1)})`;
    });
  } else if (obj.type === "parabola2d") {
    const updateParaEq = () => {
      obj.equationText = `y = ${obj.a}x² + ${obj.b}x + ${obj.c}`;
    };
    addNumberInput("Hệ số a (y = ax² + bx + c)", obj.a, "", (v) => {
      if (v !== 0) obj.a = v;
      updateParaEq();
    });
    addNumberInput("Hệ số b", obj.b, "", (v) => {
      obj.b = v;
      updateParaEq();
    });
    addNumberInput("Hệ số c", obj.c, "", (v) => {
      obj.c = v;
      updateParaEq();
    });
  } else if (obj.type === "func2d" || obj.type === "funcY2d" || obj.type === "implicit2d" || obj.type === "surface3d") {
    const exprGroup = document.createElement("div");
    exprGroup.className = "param-input-group";
    exprGroup.style.gridColumn = "span 2";
    const prefixLabel =
      obj.type === "func2d"
        ? "Hàm số y = f(x)"
        : obj.type === "funcY2d"
        ? "Hàm số x = g(y)"
        : obj.type === "surface3d"
        ? "Mặt cong z = f(x,y)"
        : "Phương trình F(x,y) = 0";
    exprGroup.innerHTML = `
      <label class="param-input-label">${prefixLabel}</label>
      <div class="param-input-wrap">
        <input
          type="text"
          value="${obj.expr || ""}"
          class="param-number-input"
          style="text-align:left; font-weight:600;"
        />
      </div>
    `;
    const exprInp = exprGroup.querySelector("input");
    exprInp.addEventListener("focus", () => saveHistory());
    exprInp.addEventListener("change", (e) => {
      const nextExpr = e.target.value.trim();
      if (!nextExpr) return;
      const testFn = GeoEquations.compileExpr(nextExpr);
      if (!testFn) return;
      obj.expr = nextExpr;
      obj.equationText =
        obj.type === "func2d"
          ? `y = ${nextExpr}`
          : obj.type === "funcY2d"
          ? `x = ${nextExpr}`
          : obj.type === "surface3d"
          ? `z = ${nextExpr}`
          : `${nextExpr} = 0`;
      renderSceneObjectsTree();
      updateMetricsAndKnowledgeOnly();
      drawScene();
    });
    container.appendChild(exprGroup);

    if (obj.type === "func2d") {
      if (obj.probeX === undefined) obj.probeX = 1;
      addNumberInput("Tính tại hoành độ x₀", obj.probeX, "đv", (v) => {
        obj.probeX = v;
      });
    }
  } else if (obj.type === "ellipse2d") {
    addNumberInput("Bán trục lớn a", obj.rx, "đv", (v) => {
      obj.rx = Math.max(0.2, v);
    }, { min: 0.2 });
    addNumberInput("Bán trục nhỏ b", obj.ry, "đv", (v) => {
      obj.ry = Math.max(0.2, v);
    }, { min: 0.2 });
    addNumberInput("Tâm x₀", obj.cx || 0, "đv", (v) => (obj.cx = v));
    addNumberInput("Tâm y₀", obj.cy || 0, "đv", (v) => (obj.cy = v));
  } else if (obj.type === "polygon2d" && obj.pts) {
    if (obj.subType === "square" && obj.pts.length === 4) {
      const curSide = Math.hypot(obj.pts[1].x - obj.pts[0].x, obj.pts[1].y - obj.pts[0].y);
      addNumberInput("Cạnh hình vuông (a)", curSide, "đv", (a) => {
        const s = Math.max(0.2, a) / 2;
        const cx = obj.pts.reduce((acc, p) => acc + p.x, 0) / 4;
        const cy = obj.pts.reduce((acc, p) => acc + p.y, 0) / 4;
        obj.pts[0].x = cx - s; obj.pts[0].y = cy + s;
        obj.pts[1].x = cx + s; obj.pts[1].y = cy + s;
        obj.pts[2].x = cx + s; obj.pts[2].y = cy - s;
        obj.pts[3].x = cx - s; obj.pts[3].y = cy - s;
      }, { min: 0.2 });
    } else if (obj.subType === "rectangle" && obj.pts.length === 4) {
      const curW = Math.hypot(obj.pts[1].x - obj.pts[0].x, obj.pts[1].y - obj.pts[0].y);
      const curH = Math.hypot(obj.pts[2].x - obj.pts[1].x, obj.pts[2].y - obj.pts[1].y);
      addNumberInput("Chiều dài (a)", curW, "đv", (a) => {
        const hw = Math.max(0.2, a) / 2;
        const hh = Math.hypot(obj.pts[2].x - obj.pts[1].x, obj.pts[2].y - obj.pts[1].y) / 2;
        const cx = obj.pts.reduce((acc, p) => acc + p.x, 0) / 4;
        const cy = obj.pts.reduce((acc, p) => acc + p.y, 0) / 4;
        obj.pts[0].x = cx - hw; obj.pts[0].y = cy + hh;
        obj.pts[1].x = cx + hw; obj.pts[1].y = cy + hh;
        obj.pts[2].x = cx + hw; obj.pts[2].y = cy - hh;
        obj.pts[3].x = cx - hw; obj.pts[3].y = cy - hh;
      }, { min: 0.2 });
      addNumberInput("Chiều rộng (b)", curH, "đv", (b) => {
        const hw = Math.hypot(obj.pts[1].x - obj.pts[0].x, obj.pts[1].y - obj.pts[0].y) / 2;
        const hh = Math.max(0.2, b) / 2;
        const cx = obj.pts.reduce((acc, p) => acc + p.x, 0) / 4;
        const cy = obj.pts.reduce((acc, p) => acc + p.y, 0) / 4;
        obj.pts[0].x = cx - hw; obj.pts[0].y = cy + hh;
        obj.pts[1].x = cx + hw; obj.pts[1].y = cy + hh;
        obj.pts[2].x = cx + hw; obj.pts[2].y = cy - hh;
        obj.pts[3].x = cx - hw; obj.pts[3].y = cy - hh;
      }, { min: 0.2 });
    }

    // Direct coordinate inputs for each vertex (up to 6 vertices)
    obj.pts.slice(0, 6).forEach((pt) => {
      addNumberInput(`Đỉnh ${pt.label} — Tọa độ x`, pt.x, "", (v) => {
        pt.x = v;
      });
      addNumberInput(`Đỉnh ${pt.label} — Tọa độ y`, pt.y, "", (v) => {
        pt.y = v;
      });
    });
  } else if (obj.type === "sphere3d") {
    const updateSphereEq = () => {
      obj.equationText = `(x-${obj.cx.toFixed(1)})² + (y-${obj.cy.toFixed(1)})² + (z-${obj.cz.toFixed(1)})² = ${obj.r.toFixed(1)}²`;
    };
    addNumberInput("Bán kính mặt cầu R", obj.r, "đv", (v) => {
      obj.r = Math.max(0.2, v);
      updateSphereEq();
    }, { min: 0.2 });
    addNumberInput("Tâm x₀", obj.cx, "", (v) => {
      obj.cx = v;
      updateSphereEq();
    });
    addNumberInput("Tâm y₀", obj.cy, "", (v) => {
      obj.cy = v;
      updateSphereEq();
    });
    addNumberInput("Tâm z₀", obj.cz, "", (v) => {
      obj.cz = v;
      updateSphereEq();
    });
  } else if (obj.type === "plane3d") {
    const updatePlaneEq = () => {
      obj.equationText = `${obj.a.toFixed(1)}x + ${obj.b.toFixed(1)}y + ${obj.c.toFixed(1)}z + ${obj.d.toFixed(1)} = 0`;
    };
    addNumberInput("Hệ số A (Ax+By+Cz+D=0)", obj.a, "", (v) => {
      obj.a = v;
      updatePlaneEq();
    });
    addNumberInput("Hệ số B", obj.b, "", (v) => {
      obj.b = v;
      updatePlaneEq();
    });
    addNumberInput("Hệ số C", obj.c, "", (v) => {
      obj.c = v;
      updatePlaneEq();
    });
    addNumberInput("Hệ số tự do D", obj.d, "", (v) => {
      obj.d = v;
      updatePlaneEq();
    });
  } else if (obj.type === "line3d") {
    const updateLine3DEq = () => {
      obj.equationText = `(x-${obj.x0.toFixed(1)})/${obj.ux.toFixed(1)} = (y-${obj.y0.toFixed(1)})/${obj.uy.toFixed(1)} = (z-${obj.z0.toFixed(1)})/${obj.uz.toFixed(1)}`;
    };
    addNumberInput("Điểm đi qua x₀", obj.x0, "", (v) => { obj.x0 = v; updateLine3DEq(); });
    addNumberInput("Điểm đi qua y₀", obj.y0, "", (v) => { obj.y0 = v; updateLine3DEq(); });
    addNumberInput("Điểm đi qua z₀", obj.z0, "", (v) => { obj.z0 = v; updateLine3DEq(); });
    addNumberInput("VTCP u_x", obj.ux, "", (v) => { obj.ux = v; updateLine3DEq(); });
    addNumberInput("VTCP u_y", obj.uy, "", (v) => { obj.uy = v; updateLine3DEq(); });
    addNumberInput("VTCP u_z", obj.uz, "", (v) => { obj.uz = v; updateLine3DEq(); });
  } else if (obj.type === "point3d") {
    addNumberInput("Hoành độ x", obj.x, "", (v) => (obj.x = v));
    addNumberInput("Tung độ y", obj.y, "", (v) => (obj.y = v));
    addNumberInput("Cao độ z", obj.z, "", (v) => (obj.z = v));
  } else if (obj.type === "solid3d") {
    if (obj.solidType !== "cylinder" && obj.solidType !== "cone") {
      addNumberInput("Cạnh đáy / Chiều dài (a)", obj.a, "cm", (v) => (obj.a = Math.max(0.2, v)), { min: 0.2 });
    }
    if (obj.solidType === "box") {
      addNumberInput("Chiều rộng đáy (b)", obj.b, "cm", (v) => (obj.b = Math.max(0.2, v)), { min: 0.2 });
    }
    if (obj.solidType === "cylinder" || obj.solidType === "cone") {
      addNumberInput("Bán kính đáy (r)", obj.r, "cm", (v) => (obj.r = Math.max(0.2, v)), { min: 0.2 });
    }
    if (obj.solidType !== "cube") {
      addNumberInput("Chiều cao (h)", obj.h, "cm", (v) => (obj.h = Math.max(0.2, v)), { min: 0.2 });
    }
    if (obj.solidType === "cone" || obj.solidType === "cylinder") {
      const btnGroup = document.createElement("div");
      btnGroup.className = "param-input-group";
      btnGroup.style.gridColumn = "span 2";
      btnGroup.innerHTML = `
        <button type="button" class="btn-primary" style="width:100%; justify-content:center; padding:7px 12px; font-size:0.82rem; margin-top:4px;">
          ${obj.isUnfolded ? "✕ Đóng trải phẳng" : "📐 Trải phẳng (Khai triển 2D)"}
        </button>
      `;
      btnGroup.querySelector("button").addEventListener("click", () => {
        obj.isUnfolded = !obj.isUnfolded;
        renderAll();
        populateInspectorForObject(obj);
      });
      fieldsContainer.appendChild(btnGroup);
    }
  }
}

function computePolygonMetrics(pts) {
  const n = pts.length;
  let perim = 0;
  let signedArea2 = 0;
  const sides = [];
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    sides.push(d);
    perim += d;
    signedArea2 += p1.x * p2.y - p2.x * p1.y;
  }
  const area = Math.abs(signedArea2) / 2;
  return { perim, area, sides };
}

function renderLiveMetrics() {
  const grid = document.getElementById("metricsGrid");
  const fmt = (v) => Number(v).toFixed(2).replace(".", ",");
  const sel = getSelectedObjects();

  let items = [];
  if (state.spaceMode === "2d") {
    const inter = GeoEquations.computeAll2DInteractions(state.objects2D);
    if (sel.length > 0) {
      const obj = sel[0];
      if (obj.type === "polygon2d" && obj.pts) {
        const { perim, area, sides } = computePolygonMetrics(obj.pts);
        items.push({
          name: `Chu vi P (${obj.name})`,
          val: `${fmt(perim)} đv`,
          sub: `Các cạnh: ${sides.map((s) => s.toFixed(1).replace(".", ",")).join("; ")}`
        });
        items.push({
          name: `Diện tích S (${obj.name})`,
          val: `${fmt(area)} đv²`,
          sub: obj.pts.length === 3 ? `p = ${fmt(perim / 2)} (Công thức Heron)` : `${obj.pts.length} đỉnh`
        });
        if (obj.pts.length === 3) {
          const [a, b, c] = [sides[1], sides[2], sides[0]];
          const R = area > 0 ? (a * b * c) / (4 * area) : 0;
          const r = perim > 0 ? (2 * area) / perim : 0;
          items.push({
            name: "Bán kính ngoại tiếp R & nội tiếp r",
            val: `R = ${fmt(R)} ; r = ${fmt(r)}`,
            sub: "R = abc/(4S) ; r = S/p"
          });
        }
      } else if (obj.type === "circle2d") {
        items.push({
          name: `Chu vi ${obj.name}`,
          val: `${fmt(2 * Math.PI * obj.r)} đv`,
          sub: `C = 2πR (R = ${fmt(obj.r)})`
        });
        items.push({
          name: `Diện tích ${obj.name}`,
          val: `${fmt(Math.PI * obj.r * obj.r)} đv²`,
          sub: `S = πR² ; Tâm (${fmt(obj.cx)}, ${fmt(obj.cy)})`
        });
      } else if (obj.type === "line2d") {
        const slope = obj.b !== 0 ? -obj.a / obj.b : Infinity;
        items.push({
          name: `Phương trình ${obj.name}`,
          val: `${obj.a.toFixed(1)}x + ${obj.b.toFixed(1)}y + ${obj.c.toFixed(1)} = 0`,
          sub: `VTPT n⃗ = (${obj.a.toFixed(1)}; ${obj.b.toFixed(1)})`
        });
        items.push({
          name: "Hệ số góc & Khoảng cách từ O",
          val: `k = ${isFinite(slope) ? fmt(slope) : "∞"}`,
          sub: `d(O, d) = ${fmt(Math.abs(obj.c) / (Math.hypot(obj.a, obj.b) || 1))}`
        });
      } else if (obj.type === "func2d" || obj.type === "parabola2d") {
        const x0 = obj.probeX !== undefined ? obj.probeX : 0;
        const y0 = GeoEquations.evalFunc2D(obj, x0);
        const h = 1e-5;
        const yPlus = GeoEquations.evalFunc2D(obj, x0 + h);
        const yMinus = GeoEquations.evalFunc2D(obj, x0 - h);
        let subDeriv = "";
        if (!Number.isFinite(y0) || Math.abs(y0) > 1e4 || !Number.isFinite(yPlus) || !Number.isFinite(yMinus)) {
          subDeriv = `Tại x = ${fmt(x0)}: Hàm số không xác định (Tiệm cận đứng / Điểm kỳ dị)`;
        } else {
          const dy = (yPlus - yMinus) / (2 * h);
          subDeriv = `f(${fmt(x0)}) = ${fmt(y0)} ; f'(${fmt(x0)}) = ${Number.isFinite(dy) && Math.abs(dy) < 1e5 ? fmt(dy) : "Không xác định"}`;
        }
        const roots = GeoEquations.findRoots1D((x) => GeoEquations.evalFunc2D(obj, x), -15, 15, 360);
        items.push({
          name: `Hàm số ${obj.name}`,
          val: obj.equationText || `y = ${obj.expr}`,
          sub: subDeriv
        });
        items.push({
          name: "Nghiệm thực f(x) = 0 trên [-15; 15]",
          val: `${roots.length} nghiệm`,
          sub: roots.length > 0 ? roots.slice(0, 4).map((r) => `x ≈ ${r.toFixed(2)}`).join("; ") : "Không cắt trục Ox"
        });

        const survey = window.MathSurveyEngine ? window.MathSurveyEngine.analyze(obj.equationText || obj.expr) : null;
        if (survey) {
          const extremaStr = survey.extrema && survey.extrema.length > 0
            ? survey.extrema.map((e) => `${e.type}: (${e.exactX}; ${e.exactY})`).join(" ; ")
            : "Không có cực trị";
          items.push({
            name: "Cực trị hàm số (GDPT 2018)",
            val: extremaStr,
            sub: survey.inflections && survey.inflections.length > 0
              ? `Điểm uốn: ${survey.inflections.map((i) => `(${i.exactX}; ${i.exactY})`).join(" ; ")}`
              : "Không có điểm uốn"
          });

          const asymParts = [];
          if (survey.asymptotes?.vertical?.length > 0) {
            asymParts.push(`TCĐ: ${survey.asymptotes.vertical.map((v) => v.label || v).join(", ")}`);
          }
          if (survey.asymptotes?.horizontal?.length > 0) {
            asymParts.push(`TCN: ${survey.asymptotes.horizontal.map((h) => h.label || h).join(", ")}`);
          }
          if (survey.asymptotes?.slant?.length > 0) {
            asymParts.push(`TCX: ${survey.asymptotes.slant.map((s) => s.label || s.line || s).join(", ")}`);
          }
          items.push({
            name: "Đường tiệm cận đồ thị",
            val: asymParts.length > 0 ? asymParts.join(" | ") : "Không có tiệm cận",
            sub: survey.domain || "D = ℝ"
          });
        }
      }
    }
    items.push({
      name: "Tổng số giao điểm trên mặt phẳng",
      val: `${inter.intersections.length} giao điểm`,
      sub: inter.intersections.slice(0, 2).map((p) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`).join(", ") || "Không có giao điểm"
    });
  } else {
    const inter3D = GeoEquations.computeAll3DInteractions(state.objects3D);
    if (sel.length > 0) {
      const obj = sel[0];
      if (obj.type === "sphere3d") {
        items.push({
          name: `Diện tích mặt cầu ${obj.name}`,
          val: `${fmt(4 * Math.PI * obj.r * obj.r)} đv²`,
          sub: `S = 4πR² (R = ${fmt(obj.r)})`
        });
        items.push({
          name: `Thể tích khối cầu ${obj.name}`,
          val: `${fmt((4 / 3) * Math.PI * Math.pow(obj.r, 3))} đv³`,
          sub: `V = (4/3)πR³`
        });
      } else if (obj.type === "plane3d") {
        const dO = Math.abs(obj.d) / (Math.hypot(obj.a, obj.b, obj.c) || 1);
        items.push({
          name: `Vectơ pháp tuyến ${obj.name}`,
          val: `n⃗ = (${obj.a}; ${obj.b}; ${obj.c})`,
          sub: obj.equationText
        });
        items.push({
          name: "Khoảng cách từ gốc O đến mặt phẳng",
          val: `d(O, α) = ${fmt(dO)}`,
          sub: "|D| / √(A² + B² + C²)"
        });
      } else if (obj.type === "solid3d") {
        const { a, b, h, r, solidType } = obj;
        if (solidType === "cube") {
          items.push({ name: "Diện tích toàn phần S_tp", val: `${fmt(6 * a * a)} cm²`, sub: "S_tp = 6a²" });
          items.push({ name: "Thể tích V = a³", val: `${fmt(a * a * a)} cm³`, sub: `Đường chéo AC' = ${fmt(a * Math.sqrt(3))} cm` });
        } else if (solidType === "box") {
          items.push({ name: "Diện tích toàn phần S_tp", val: `${fmt(2 * (a * b + b * h + h * a))} cm²`, sub: "2(ab + bh + ha)" });
          items.push({ name: "Thể tích V = a·b·h", val: `${fmt(a * b * h)} cm³`, sub: `Đường chéo D = ${fmt(Math.hypot(a, b, h))} cm` });
        } else if (solidType === "pyramid_square") {
          const d = Math.hypot(h, a / 2);
          items.push({ name: "Diện tích xung quanh S_xq", val: `${fmt(2 * a * d)} cm²`, sub: `Trung đoạn SI = ${fmt(d)} cm` });
          items.push({ name: "Thể tích V = ⅓ a²h", val: `${fmt((a * a * h) / 3)} cm³`, sub: `Chiều cao SO = ${h} cm` });
        } else if (solidType === "cone") {
          const cr = obj.r || 3;
          const ch = obj.h || 4;
          const l = Math.hypot(cr, ch);
          const alphaDeg = (cr / l) * 360;
          const sXq = Math.PI * cr * l;
          const sDay = Math.PI * cr * cr;
          const sTp = sXq + sDay;
          const vCone = (Math.PI * cr * cr * ch) / 3;
          const piFracXq = (cr * l);
          const piFracDay = (cr * cr);
          const piFracTp = (cr * (l + cr));

          items.push({
            name: "Đường sinh l & Góc trải phẳng α",
            val: `l = ${fmt(l)} cm ; α = ${alphaDeg.toFixed(1)}°`,
            sub: `r = ${cr} cm, h = ${ch} cm (l = √(r² + h²))`
          });
          items.push({
            name: "Diện tích xung quanh & Toàn phần",
            val: `S_xq = ${piFracXq}π ≈ ${fmt(sXq)} cm²`,
            sub: `S_tp = ${piFracTp}π ≈ ${fmt(sTp)} cm² (S_đáy = ${piFracDay}π ≈ ${fmt(sDay)} cm²)`
          });
          items.push({
            name: "Thể tích khối nón V = ⅓πr²h",
            val: `V = ${fmt(vCone)} cm³`,
            sub: `${(cr * cr * ch) % 3 === 0 ? `${(cr * cr * ch) / 3}π ≈ ` : ""}${fmt(vCone)} cm³`
          });
        } else if (solidType === "cylinder") {
          items.push({ name: "Diện tích xung quanh S_xq = 2πrh", val: `${fmt(2 * Math.PI * r * h)} cm²`, sub: `S_tp = ${fmt(2 * Math.PI * r * (r + h))} cm²` });
          items.push({ name: "Thể tích V = πr²h", val: `${fmt(Math.PI * r * r * h)} cm³`, sub: `Bán kính r = ${r}, cao h = ${h}` });
        }
      }
    }
    items.push({
      name: "Tương tác & Giao tuyến 3D",
      val: `${inter3D.intersections3D.length} giao thể`,
      sub: inter3D.relations3D[0] ? inter3D.relations3D[0].pair : "Thêm Mặt cầu & Mặt phẳng để cắt nhau"
    });
  }

  grid.innerHTML = items
    .slice(0, 4)
    .map(
      (m) => `
    <div class="metric-item">
      <span class="metric-name">${m.name}</span>
      <span class="metric-value">${m.val}</span>
      <span class="metric-formula-sub">${m.sub}</span>
    </div>
  `
    )
    .join("");
}

function renderKnowledgePanel() {
  const shape =
    (window.PMATH_Hub && window.PMATH_Hub.getMergedTopic(state.activeKnowledgeId)) ||
    GEOMETRY_DATA.find((s) => s.id === state.activeKnowledgeId) ||
    GEOMETRY_DATA[0];
  document.getElementById("knowledgeTitle").textContent = shape.name;
  document.getElementById("knowledgeSubtitle").textContent = shape.subtitle;

  const body = document.getElementById("knowledgeBody");

  if (state.activeInfoTab === "interactions") {
    if (state.spaceMode === "2d") {
      const { intersections, relations } = GeoEquations.computeAll2DInteractions(state.objects2D);
      body.innerHTML = `
        <div class="info-section">
          <h4>🔗 Quan Hệ Tương Tác Giữa Các Hình 2D (${relations.length})</h4>
          ${
            relations.length === 0
              ? `<p style="color:var(--text-muted); font-size:0.82rem;">Hãy vẽ từ 2 đối tượng trở lên (ví dụ: Đường thẳng + Đường tròn, hoặc 2 Đường tròn) để quan sát vị trí tương đối và giao điểm.</p>`
              : relations
                  .map(
                    (r) => `
                <div class="interaction-badge">
                  <strong>${r.pair}:</strong> ${r.desc}
                </div>`
                  )
                  .join("")
          }
        </div>
        <div class="info-section">
          <h4>📍 Tọa Độ Các Giao Điểm Tự Động (${intersections.length})</h4>
          ${
            intersections.length === 0
              ? `<p style="color:var(--text-muted); font-size:0.82rem;">Chưa có giao điểm thực nào giữa các hình đang hiển thị.</p>`
              : `<ul class="prop-list">
                  ${intersections
                    .map(
                      (pt) =>
                        `<li><strong>${pt.label} (${pt.pair}):</strong> (${pt.x.toFixed(2)}; ${pt.y.toFixed(2)})</li>`
                    )
                    .join("")}
                </ul>`
          }
        </div>
      `;
    } else {
      const { relations3D } = GeoEquations.computeAll3DInteractions(state.objects3D);
      body.innerHTML = `
        <div class="info-section">
          <h4>🔗 Giao Tuyến &amp; Vị Trí Tương Đối Không Gian 3D (${relations3D.length})</h4>
          ${
            relations3D.length === 0
              ? `<p style="color:var(--text-muted); font-size:0.82rem;">Hãy thêm Mặt cầu, Mặt phẳng hoặc Đường thẳng 3D để quan sát đường tròn giao tuyến và giao điểm trong không gian Oxyz!</p>`
              : relations3D
                  .map(
                    (r) => `
                <div class="interaction-badge">
                  <strong>${r.pair}:</strong> ${r.desc}
                </div>`
                  )
                  .join("")
          }
        </div>
      `;
    }
  } else if (state.activeInfoTab === "theory") {
    body.innerHTML = `
      <div class="info-section">
        <h4>Định nghĩa</h4>
        <p>${shape.definition}</p>
      </div>
      <div class="info-section">
        <h4>Kiến thức cần nắm &amp; Định lý</h4>
        <ul class="prop-list">
          ${shape.properties.map((pr) => `<li>${pr}</li>`).join("")}
        </ul>
      </div>
      <div class="info-section">
        <h4>Ví dụ &amp; Công thức chuẩn</h4>
        ${shape.formulas
          .map(
            (f) => `
          <div class="formula-card">
            <div class="formula-title">${f.title}</div>
            <div class="formula-math">${f.math}</div>
            <div class="formula-note">${f.note}</div>
          </div>`
          )
          .join("")}
      </div>
      ${
        shape.tips && shape.tips.length
          ? `<div class="info-section">
              <h4>Phương pháp giải &amp; Lưu ý thường gặp</h4>
              <ul class="prop-list">
                ${shape.tips.map((t) => `<li>${t}</li>`).join("")}
              </ul>
            </div>`
          : ""
      }
    `;
  } else if (state.activeInfoTab === "practice") {
    if (!state.quiz) generateQuizForShape(shape);
    const q = state.quiz;
    body.innerHTML = `
      <div class="quiz-box">
        <div class="tcolorbox-badge badge-ex">Câu 1 — Vận dụng (${shape.name})</div>
        <p style="font-size:0.95rem; font-weight:700; margin-top:0.2rem;">${q.question}</p>
        <div class="quiz-input-row">
          <input type="number" step="0.01" id="quizInput" class="quiz-input" placeholder="Nhập đáp số..." />
          <button class="btn-primary" id="checkQuizBtn">Kiểm tra</button>
        </div>
        <div id="quizFeedback" class="quiz-feedback"></div>
        <div style="display:flex; justify-content:space-between;">
          <button class="btn-secondary" id="showSolBtn">💡 Lời giải chi tiết</button>
          <button class="btn-secondary" id="newQuizBtn">🔄 Đổi câu hỏi</button>
        </div>
      </div>
    `;

    document.getElementById("checkQuizBtn").addEventListener("click", () => {
      const val = parseFloat(document.getElementById("quizInput").value);
      const fb = document.getElementById("quizFeedback");
      if (isNaN(val)) return;
      if (Math.abs(val - q.answer) <= 0.15) {
        fb.className = "quiz-feedback correct";
        fb.innerHTML = `✅ Chính xác! Đáp số: <strong>${q.answer.toFixed(2)} ${q.unit}</strong>.<br/>${q.explanation}`;
      } else {
        fb.className = "quiz-feedback wrong";
        fb.innerHTML = `❌ Chưa đúng. Hãy thử lại hoặc bấm Xem lời giải!`;
      }
    });
    document.getElementById("showSolBtn").addEventListener("click", () => {
      const fb = document.getElementById("quizFeedback");
      fb.className = "quiz-feedback correct";
      fb.innerHTML = `📘 <strong>Đáp án: ${q.answer.toFixed(2)} ${q.unit}</strong><br/>${q.explanation}`;
    });
    document.getElementById("newQuizBtn").addEventListener("click", () => {
      generateQuizForShape(shape);
      renderKnowledgePanel();
    });
  }
}

function generateQuizForShape(shape) {
  const rInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const a = rInt(3, 9);
  const h = rInt(4, 10);
  if (shape.id === "sphere") {
    state.quiz = {
      question: `Trong không gian Oxyz, cho mặt cầu (S): x² + y² + z² = ${a * a} bị cắt bởi mặt phẳng (P): z = 0. Tính diện tích thiết diện tạo thành.`,
      answer: Math.PI * a * a,
      unit: "đv²",
      explanation: `Mặt phẳng z = 0 đi qua tâm O(0,0,0) nên cắt mặt cầu theo đường tròn lớn bán kính R = ${a}. Diện tích S = πR² ≈ ${(Math.PI * a * a).toFixed(2)}.`
    };
  } else if (shape.id === "circle") {
    state.quiz = {
      question: `Cho đường tròn (C): (x - 1)² + (y + 2)² = ${a * a}. Tính chu vi của đường tròn (C).`,
      answer: 2 * Math.PI * a,
      unit: "đv",
      explanation: `Từ phương trình suy ra bán kính R = ${a}. Chu vi C = 2πR = 2 × π × ${a} ≈ ${(2 * Math.PI * a).toFixed(2)}.`
    };
  } else {
    state.quiz = {
      question: `Cho tam giác có cạnh đáy a = ${a * 2} cm và chiều cao h = ${h} cm. Tính diện tích S của tam giác.`,
      answer: a * h,
      unit: "cm²",
      explanation: `Diện tích S = ½ · a · h = ½ × ${a * 2} × ${h} = ${a * h} cm².`
    };
  }
}

// ============================================================================
// MAIN RENDERING ENGINE (2D MULTI-OBJECT + 3D MULTI-OBJECT + INTERSECTIONS)
// ============================================================================

function applyDashStyle(dash) {
  if (dash === "dashed") ctx.setLineDash([7, 5]);
  else if (dash === "dotted") ctx.setLineDash([2.5, 4]);
  else ctx.setLineDash([]);
}

function drawScene() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  if (!w || !h) return;

  const isLight = document.documentElement.getAttribute("data-theme") !== "dark";
  const theme = {
    isLight,
    text: isLight ? "#111827" : "#f8fafc",
    muted: isLight ? "#5a5a5a" : "#94a3b8",
    grid: isLight ? "rgba(30, 100, 180, 0.11)" : "rgba(148, 163, 184, 0.09)",
    axis: isLight ? "rgba(30, 100, 180, 0.65)" : "rgba(226, 232, 240, 0.45)",
    halo: isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(9, 16, 27, 0.9)"
  };

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // Subtle PMATH TikZ Corner Watermark (Theo Template_PMATH.tex)
  ctx.save();
  ctx.font = 'bold 12px "Times New Roman", AxMath, serif';
  ctx.fillStyle = isLight ? "rgba(30, 100, 180, 0.75)" : "rgba(78, 161, 255, 0.75)";
  ctx.fillText("PMATH EDUCATION  |  KHO HÌNH HỌC 2D & 3D", 14, 20);
  ctx.strokeStyle = isLight ? "rgba(30, 100, 180, 0.35)" : "rgba(78, 161, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, 25);
  ctx.lineTo(275, 25);
  ctx.stroke();
  ctx.restore();

  ctx.translate(w / 2, h / 2);

  if (state.spaceMode === "2d") {
    draw2DGridAndAxes(w, h, theme);
    drawAll2DObjects(w, h, theme);
  } else {
    draw3DGridAndAxes(w, h, theme);
    drawAll3DObjects(w, h, theme);
    draw3DOrientationTriad(w, h, theme);
  }

  // Draw Marquee Box if active
  if (state.interaction.mode === "marquee" && state.interaction.marqueeRect) {
    const r = state.interaction.marqueeRect;
    ctx.save();
    ctx.fillStyle = "rgba(30, 100, 180, 0.12)";
    ctx.strokeStyle = "#1e64b4";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.fillRect(r.x1, r.y1, r.x2 - r.x1, r.y2 - r.y1);
    ctx.strokeRect(r.x1, r.y1, r.x2 - r.x1, r.y2 - r.y1);
    ctx.restore();
  }

  ctx.restore();
  updateCursorStatusPill();
}
window.drawScene = drawScene;

function draw2DGridAndAxes(w, h, theme) {
  const { offsetX, offsetY, scale } = state.view2D;
  const halfW = w / 2;
  const halfH = h / 2;

  if (state.showGrid) {
    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const startX = ((offsetX + halfW) % scale) - halfW;
    for (let x = startX; x <= halfW; x += scale) {
      ctx.moveTo(x, -halfH);
      ctx.lineTo(x, halfH);
    }
    const startY = ((offsetY + halfH) % scale) - halfH;
    for (let y = startY; y <= halfH; y += scale) {
      ctx.moveTo(-halfW, y);
      ctx.lineTo(halfW, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (state.showAxes) {
    ctx.save();
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-halfW, offsetY);
    ctx.lineTo(halfW, offsetY);
    ctx.moveTo(offsetX, -halfH);
    ctx.lineTo(offsetX, halfH);
    ctx.stroke();

    // Tick numbers (Crisp Segoe UI / System Sans-Serif)
    ctx.fillStyle = theme.muted;
    ctx.font = '600 12px "Segoe UI", system-ui, -apple-system, sans-serif';
    const minUnitX = Math.ceil((-halfW - offsetX) / scale);
    const maxUnitX = Math.floor((halfW - offsetX) / scale);
    for (let u = minUnitX; u <= maxUnitX; u++) {
      if (u === 0) continue;
      const sx = offsetX + u * scale;
      ctx.fillText(u.toString(), sx - 4, offsetY + 15);
    }
    const minUnitY = Math.ceil((-halfH + offsetY) / scale);
    const maxUnitY = Math.floor((halfH + offsetY) / scale);
    for (let u = minUnitY; u <= maxUnitY; u++) {
      if (u === 0) continue;
      const sy = offsetY - u * scale;
      ctx.fillText(u.toString(), offsetX + 6, sy + 4);
    }
    ctx.font = 'italic bold 15px "Cambria Math", AxMath, Georgia, serif';
    ctx.fillStyle = theme.isLight ? "#1e64b4" : "#f8fafc";
    ctx.fillText("O", offsetX - 16, offsetY + 16);
    ctx.fillText("x", halfW - 18, offsetY - 8);
    ctx.fillText("y", offsetX + 9, -halfH + 18);
    ctx.restore();
  }
}

function drawAll2DObjects(w, h, theme) {
  const vis = state.objects2D.filter((o) => o.visible !== false);

  vis.forEach((obj) => {
    const isSel = state.selectedIds.includes(obj.id);
    const color = obj.color || "#1e64b4";
    const lw = (obj.lineWidth || 2.2) + (isSel ? 1.1 : 0);

    if (obj.type === "polygon2d" && obj.pts && obj.pts.length >= 3) {
      const sPts = obj.pts.map((p) => mathToScreen2D(p.x, p.y));
      ctx.save();
      ctx.beginPath();
      sPts.forEach((sp, i) => (i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y)));
      ctx.closePath();
      ctx.fillStyle = color + (isSel ? "28" : "14");
      ctx.fill();
      applyDashStyle(obj.dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.restore();

      // Special triangle overlays (G, H, O, I, Euler, midsegment)
      if (obj.pts.length === 3 && obj.overlays) {
        drawTriangleSpecialOverlays(sPts[0], sPts[1], sPts[2], obj.overlays);
      }

      // Draw draggable vertices
      sPts.forEach((sp, idx) => {
        const isHover =
          state.hoverTarget && state.hoverTarget.objId === obj.id && state.hoverTarget.vertexIdx === idx;
        drawScreenPoint(sp.x, sp.y, obj.pts[idx].label, color, isSel || isHover ? 6 : 4.8);
      });
    } else if (obj.type === "circle2d") {
      const cScreen = mathToScreen2D(obj.cx, obj.cy);
      const rPx = obj.r * state.view2D.scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cScreen.x, cScreen.y, rPx, 0, Math.PI * 2);
      ctx.fillStyle = color + (isSel ? "24" : "10");
      ctx.fill();
      applyDashStyle(obj.dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.restore();

      drawScreenPoint(cScreen.x, cScreen.y, obj.centerLabel || "O", color, 4.5);
      ctx.fillStyle = color;
      ctx.font = 'italic bold 14px "Cambria Math", AxMath, Georgia, serif';
      ctx.fillText(obj.name, cScreen.x + rPx * 0.72 + 6, cScreen.y - rPx * 0.72 - 6);
    } else if (obj.type === "ellipse2d") {
      const cScreen = mathToScreen2D(obj.cx || 0, obj.cy || 0);
      const rxPx = obj.rx * state.view2D.scale;
      const ryPx = obj.ry * state.view2D.scale;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cScreen.x, cScreen.y, rxPx, ryPx, 0, 0, Math.PI * 2);
      ctx.fillStyle = color + "16";
      ctx.fill();
      applyDashStyle(obj.dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.restore();
    } else if (obj.type === "parabola2d" || obj.type === "func2d") {
      const halfW = w / 2;
      const halfH = h / 2;
      ctx.save();
      applyDashStyle(obj.dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();

      let penDown = false;
      let prevMy = NaN;
      let prevSy = NaN;
      let labelPos = null;
      const asymptoteXs = [];

      for (let sx = -halfW; sx <= halfW; sx += 1.5) {
        const mx = (sx - state.view2D.offsetX) / state.view2D.scale;
        const my = GeoEquations.evalFunc2D(obj, mx);
        if (!Number.isFinite(my) || Math.abs(my) > 1e5) {
          penDown = false;
          prevMy = NaN;
          continue;
        }
        const sp = mathToScreen2D(mx, my);

        // Detect vertical asymptote / discontinuity jump (sign flip with large screen jump)
        if (penDown && Number.isFinite(prevMy)) {
          const dyScreen = Math.abs(sp.y - prevSy);
          if (dyScreen > h * 1.1 && prevMy * my < 0) {
            penDown = false;
            const asymX = mx - 0.75 / state.view2D.scale;
            if (!asymptoteXs.some((ax) => Math.abs(ax - asymX) < 0.15)) {
              asymptoteXs.push(asymX);
            }
          }
        }

        if (!penDown) {
          ctx.moveTo(sp.x, sp.y);
          penDown = true;
        } else {
          ctx.lineTo(sp.x, sp.y);
        }

        if (!labelPos && sp.x > -halfW + 60 && sp.x < halfW - 120 && sp.y > -halfH + 40 && sp.y < halfH - 40) {
          labelPos = { x: sp.x, y: sp.y };
        }
        prevMy = my;
        prevSy = sp.y;
      }
      ctx.stroke();

      // Analyze analytical features via MathSurveyEngine: TCĐ, TCN, TCX, Extrema, Inflection
      const analysis = window.MathSurveyEngine ? window.MathSurveyEngine.analyze(obj.equationText || obj.expr) : null;
      if (analysis) {
        // Vertical asymptotes: TCĐ
        if (analysis.asymptotes && analysis.asymptotes.vertical && analysis.asymptotes.vertical.length > 0) {
          analysis.asymptotes.vertical.forEach((asym) => {
            const val = typeof asym === "object" ? asym.val : asym;
            if (Number.isFinite(val)) {
              const sX = mathToScreen2D(val, 0).x;
              ctx.save();
              ctx.setLineDash([6, 4]);
              ctx.strokeStyle = "#e11d48";
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(sX, -halfH);
              ctx.lineTo(sX, halfH);
              ctx.stroke();

              const lbl = `TCĐ: ${asym.label || `x = ${val}`}`;
              ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
              ctx.fillStyle = "#e11d48";
              ctx.fillText(lbl, sX + 8, -halfH + 35);
              ctx.restore();
            }
          });
        }

        // Horizontal asymptotes: TCN
        if (analysis.asymptotes && analysis.asymptotes.horizontal && analysis.asymptotes.horizontal.length > 0) {
          analysis.asymptotes.horizontal.forEach((asym) => {
            const val = typeof asym === "object" ? asym.val : asym;
            if (Number.isFinite(val)) {
              const sY = mathToScreen2D(0, val).y;
              ctx.save();
              ctx.setLineDash([6, 4]);
              ctx.strokeStyle = "#0d9488";
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(-halfW, sY);
              ctx.lineTo(halfW, sY);
              ctx.stroke();

              const lbl = `TCN: ${asym.label || `y = ${val}`}`;
              ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
              ctx.fillStyle = "#0d9488";
              ctx.fillText(lbl, halfW - 120, sY - 8);
              ctx.restore();
            }
          });
        }

        // Slant asymptotes: TCX
        if (analysis.asymptotes && analysis.asymptotes.slant && analysis.asymptotes.slant.length > 0) {
          analysis.asymptotes.slant.forEach((asym) => {
            const a = asym.A !== undefined ? asym.A : asym.a;
            const b = asym.B !== undefined ? asym.B : asym.b;
            if (Number.isFinite(a) && Number.isFinite(b)) {
              const mx1 = (-halfW - state.view2D.offsetX) / state.view2D.scale;
              const mx2 = (halfW - state.view2D.offsetX) / state.view2D.scale;
              const p1 = mathToScreen2D(mx1, a * mx1 + b);
              const p2 = mathToScreen2D(mx2, a * mx2 + b);

              ctx.save();
              ctx.setLineDash([6, 4]);
              ctx.strokeStyle = "#d97706";
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();

              const lbl = `TCX: ${asym.label || `y = ${a}x + ${b}`}`;
              ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
              ctx.fillStyle = "#d97706";
              ctx.fillText(lbl, (p1.x + p2.x) * 0.35 + 10, (p1.y + p2.y) * 0.35 - 8);
              ctx.restore();
            }
          });
        }

        // Extrema markers
        if (analysis.extrema && analysis.extrema.length > 0) {
          analysis.extrema.forEach((ext) => {
            if (Number.isFinite(ext.x) && Number.isFinite(ext.y)) {
              const sp = mathToScreen2D(ext.x, ext.y);
              const isMax = ext.type === "Cực đại";
              const ptColor = isMax ? "#e11d48" : "#2563eb";
              const tag = isMax ? "CĐ" : "CT";

              ctx.save();
              ctx.beginPath();
              ctx.arc(sp.x, sp.y, 8, 0, Math.PI * 2);
              ctx.fillStyle = isMax ? "rgba(225, 29, 72, 0.2)" : "rgba(37, 99, 235, 0.2)";
              ctx.fill();

              ctx.beginPath();
              ctx.arc(sp.x, sp.y, 4.5, 0, Math.PI * 2);
              ctx.fillStyle = ptColor;
              ctx.fill();
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 1.6;
              ctx.stroke();

              const xStr = ext.exactX || ext.x.toFixed(2).replace(".", ",");
              const yStr = ext.exactY || ext.y.toFixed(2).replace(".", ",");
              ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
              ctx.fillStyle = ptColor;
              ctx.fillText(`${tag}(${xStr}; ${yStr})`, sp.x + 8, isMax ? sp.y - 8 : sp.y + 16);
              ctx.restore();
            }
          });
        }

        // Inflection points (Điểm uốn)
        if (analysis.inflections && analysis.inflections.length > 0) {
          analysis.inflections.forEach((inf) => {
            if (Number.isFinite(inf.x) && Number.isFinite(inf.y)) {
              const sp = mathToScreen2D(inf.x, inf.y);
              ctx.save();
              ctx.beginPath();
              ctx.arc(sp.x, sp.y, 8, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(168, 85, 247, 0.22)";
              ctx.fill();

              ctx.beginPath();
              ctx.arc(sp.x, sp.y, 4.5, 0, Math.PI * 2);
              ctx.fillStyle = "#9333ea";
              ctx.fill();
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 1.6;
              ctx.stroke();

              const xStr = inf.exactX || inf.x.toFixed(2).replace(".", ",");
              const yStr = inf.exactY || inf.y.toFixed(2).replace(".", ",");
              ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
              ctx.fillStyle = "#9333ea";
              ctx.fillText(`I(${xStr}; ${yStr})`, sp.x + 8, sp.y - 8);
              ctx.restore();
            }
          });
        }
      } else if (asymptoteXs.length > 0) {
        // Fallback dashed vertical asymptotes if detected via screen jump
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = color + "88";
        ctx.lineWidth = 1.4;
        asymptoteXs.forEach((ax) => {
          const sAsym = mathToScreen2D(ax, 0);
          ctx.beginPath();
          ctx.moveTo(sAsym.x, -halfH);
          ctx.lineTo(sAsym.x, halfH);
          ctx.stroke();
        });
        ctx.restore();
      }

      if (labelPos) {
        ctx.fillStyle = color;
        ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(`${obj.name}: ${obj.equationText || ""}`, labelPos.x + 8, labelPos.y - 10);
      }
      ctx.restore();
    } else if (obj.type === "funcY2d") {
      const fn = GeoEquations.compileExpr(obj.expr);
      if (fn) {
        const halfH = h / 2;
        ctx.save();
        applyDashStyle(obj.dash);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        let penDown = false;
        let prevSx = NaN;
        for (let sy = -halfH; sy <= halfH; sy += 1.5) {
          const my = -(sy - state.view2D.offsetY) / state.view2D.scale;
          const mx = fn(0, my, 0);
          if (!Number.isFinite(mx) || Math.abs(mx) > 1e5) {
            penDown = false;
            continue;
          }
          const sp = mathToScreen2D(mx, my);
          if (penDown && Math.abs(sp.x - prevSx) > w * 1.1) {
            penDown = false;
          }
          if (!penDown) {
            ctx.moveTo(sp.x, sp.y);
            penDown = true;
          } else {
            ctx.lineTo(sp.x, sp.y);
          }
          prevSx = sp.x;
        }
        ctx.stroke();
        ctx.restore();
      }
    } else if (obj.type === "implicit2d") {
      // Marching-squares zero contour for general F(x, y) = 0
      const fn = GeoEquations.compileExpr(obj.expr);
      if (fn) {
        const halfW = w / 2;
        const halfH = h / 2;
        const stepPx = 8;
        ctx.save();
        applyDashStyle(obj.dash);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let sx = -halfW; sx < halfW; sx += stepPx) {
          for (let sy = -halfH; sy < halfH; sy += stepPx) {
            const m00 = screenToMath2D(sx, sy);
            const m10 = screenToMath2D(sx + stepPx, sy);
            const m11 = screenToMath2D(sx + stepPx, sy + stepPx);
            const m01 = screenToMath2D(sx, sy + stepPx);
            const v00 = fn(m00.x, m00.y, 0);
            const v10 = fn(m10.x, m10.y, 0);
            const v11 = fn(m11.x, m11.y, 0);
            const v01 = fn(m01.x, m01.y, 0);
            if (!Number.isFinite(v00) || !Number.isFinite(v10) || !Number.isFinite(v11) || !Number.isFinite(v01)) continue;
            const pts = [];
            if (v00 * v10 <= 0 && Math.abs(v00 - v10) > 1e-9) {
              const t = v00 / (v00 - v10);
              pts.push({ x: sx + t * stepPx, y: sy });
            }
            if (v10 * v11 <= 0 && Math.abs(v10 - v11) > 1e-9) {
              const t = v10 / (v10 - v11);
              pts.push({ x: sx + stepPx, y: sy + t * stepPx });
            }
            if (v01 * v11 <= 0 && Math.abs(v01 - v11) > 1e-9) {
              const t = v01 / (v01 - v11);
              pts.push({ x: sx + t * stepPx, y: sy + stepPx });
            }
            if (v00 * v01 <= 0 && Math.abs(v00 - v01) > 1e-9) {
              const t = v00 / (v00 - v01);
              pts.push({ x: sx, y: sy + t * stepPx });
            }
            if (pts.length >= 2) {
              ctx.moveTo(pts[0].x, pts[0].y);
              ctx.lineTo(pts[1].x, pts[1].y);
            }
          }
        }
        ctx.stroke();
        ctx.restore();
      }
    } else if (obj.type === "line2d") {
      // ax + by + c = 0
      const halfW = w / 2;
      const halfH = h / 2;
      let p1, p2;
      if (Math.abs(obj.b) >= Math.abs(obj.a)) {
        const mx1 = (-halfW - state.view2D.offsetX) / state.view2D.scale;
        const mx2 = (halfW - state.view2D.offsetX) / state.view2D.scale;
        p1 = mathToScreen2D(mx1, (-obj.a * mx1 - obj.c) / obj.b);
        p2 = mathToScreen2D(mx2, (-obj.a * mx2 - obj.c) / obj.b);
      } else {
        const my1 = -(halfH - state.view2D.offsetY) / state.view2D.scale;
        const my2 = -(-halfH - state.view2D.offsetY) / state.view2D.scale;
        p1 = mathToScreen2D((-obj.b * my1 - obj.c) / obj.a, my1);
        p2 = mathToScreen2D((-obj.b * my2 - obj.c) / obj.a, my2);
      }
      ctx.save();
      applyDashStyle(obj.dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`${obj.name}: ${obj.equationText || ""}`, (p1.x + p2.x) * 0.25 + 10, (p1.y + p2.y) * 0.25 - 8);
      ctx.restore();
    } else if (obj.type === "point2d") {
      const sp = mathToScreen2D(obj.x, obj.y);
      drawScreenPoint(sp.x, sp.y, `${obj.name}(${obj.x.toFixed(1)}, ${obj.y.toFixed(1)})`, color, isSel ? 6.5 : 5);
    }
  });

  // Automatically draw all 2D Intersection Points in PMATH Crimson / Warn color!
  const { intersections } = GeoEquations.computeAll2DInteractions(state.objects2D);
  intersections.forEach((pt) => {
    const sp = mathToScreen2D(pt.x, pt.y);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(198, 40, 40, 0.2)";
    ctx.fill();
    ctx.restore();
    drawScreenPoint(
      sp.x,
      sp.y,
      `${pt.label}(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`,
      "#c62828",
      5
    );
  });

  // Draw Parametric m Line and Intersections (GDPT 2018 calculus tool)
  drawMLineAndIntersections(w, h, theme);

  // Draw Bounded Area between Curves (GDPT 2018 integral calculus tool)
  drawBoundedAreaBetweenCurves(w, h, theme);
}

// ============================================================================
// VIETNAMESE GDPT 2018 CALCULUS SURVEY, BBT & PARAMETRIC m ENGINE
// ============================================================================

function showToast(msg, duration = 2500) {
  let toast = document.getElementById("pmathAppToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pmathAppToast";
    toast.style.cssText =
      "position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(20px);" +
      "background:rgba(15,23,42,0.92);color:#ffffff;padding:10px 22px;border-radius:999px;" +
      "font-size:0.88rem;font-weight:600;box-shadow:0 10px 28px rgba(0,0,0,0.35);" +
      "backdrop-filter:blur(8px);z-index:9999999;opacity:0;pointer-events:none;" +
      "transition:all 0.25s cubic-bezier(0.16,1,0.3,1);";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, duration);
}
window.showToast = showToast;

function drawMLineAndIntersections(w, h, theme) {
  if (!state.mParam || !state.mParam.show || state.spaceMode !== "2d") return;
  const mVal = state.mParam.val || 0;

  // 1. Draw horizontal line y = m
  const pLeft = mathToScreen2D((-w / 2 - state.view2D.offsetX) / state.view2D.scale, mVal);
  const pRight = mathToScreen2D((w / 2 - state.view2D.offsetX) / state.view2D.scale, mVal);

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = "#8b5cf6"; // Purple accent
  ctx.lineWidth = 2.4;
  ctx.setLineDash([7, 4]);
  ctx.moveTo(-w / 2, pLeft.y);
  ctx.lineTo(w / 2, pRight.y);
  ctx.stroke();

  // Draw pill label at the right margin
  const mLabel = `y = m (${mVal.toFixed(1).replace(".", ",")})`;
  ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = "#8b5cf6";
  ctx.fillText(mLabel, w / 2 - 130, pLeft.y - 8);
  ctx.restore();

  // 2. Find real roots / intersections with the active 2D curve
  const activeFunc = state.objects2D.find(
    (o) => (o.type === "func2d" || o.type === "parabola2d") && o.visible !== false
  );
  if (!activeFunc) {
    const rootCountEl = document.getElementById("mRootCountDisp");
    if (rootCountEl) rootCountEl.textContent = "Chưa có hàm số";
    return;
  }

  const xMin = (-w / 2 - state.view2D.offsetX) / state.view2D.scale;
  const xMax = (w / 2 - state.view2D.offsetX) / state.view2D.scale;
  const numSamples = 400;
  const step = (xMax - xMin) / numSamples;

  const roots = [];
  let prevX = xMin;
  let prevDiff = GeoEquations.evalFunc2D(activeFunc, prevX) - mVal;

  for (let i = 1; i <= numSamples; i++) {
    const currX = xMin + i * step;
    const currY = GeoEquations.evalFunc2D(activeFunc, currX);
    if (!Number.isFinite(currY) || Math.abs(currY) > 1e4) {
      prevX = currX;
      prevDiff = NaN;
      continue;
    }
    const currDiff = currY - mVal;

    if (Number.isFinite(prevDiff) && prevDiff * currDiff <= 0) {
      // Discard asymptote jump: check if |f(currX) - f(prevX)| is too large
      const yPrev = prevDiff + mVal;
      if (Math.abs(currY - yPrev) < 20) {
        // Bisection to refine root accurate to 1e-4
        let lo = prevX, hi = currX;
        let root = (lo + hi) / 2;
        for (let it = 0; it < 14; it++) {
          const mid = (lo + hi) / 2;
          const midDiff = GeoEquations.evalFunc2D(activeFunc, mid) - mVal;
          if (Math.abs(midDiff) < 1e-6) {
            root = mid;
            break;
          }
          if (prevDiff * midDiff <= 0) {
            hi = mid;
          } else {
            lo = mid;
          }
          root = mid;
        }

        // Avoid duplicate within 0.04
        if (!roots.some((r) => Math.abs(r - root) < 0.04)) {
          roots.push(root);
        }
      }
    }
    prevX = currX;
    prevDiff = currDiff;
  }

  // 3. Draw intersection markers for each root
  roots.forEach((rx) => {
    const sp = mathToScreen2D(rx, mVal);
    ctx.save();
    // Halo ring
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(139, 92, 246, 0.25)";
    ctx.fill();

    // Solid dot
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#7c3aed";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Coordinate tag: (x_0; m)
    const rootTag = `(${rx.toFixed(2).replace(".", ",")}; ${mVal.toFixed(1).replace(".", ",")})`;
    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = "#7c3aed";
    ctx.fillText(rootTag, sp.x + 8, sp.y - 8);
    ctx.restore();
  });

  // 4. Update mRootCountDisp badge
  const rootCountEl = document.getElementById("mRootCountDisp");
  if (rootCountEl) {
    const countText = roots.length === 0 ? "Vô nghiệm" : `${roots.length} nghiệm`;
    rootCountEl.textContent = countText;
    rootCountEl.style.color = roots.length === 0 ? "var(--text-muted)" : "#7c3aed";
    rootCountEl.style.background = roots.length === 0 ? "rgba(148, 163, 184, 0.2)" : "rgba(139, 92, 246, 0.15)";
  }
}

function drawBoundedAreaBetweenCurves(w, h, theme) {
  if (state.spaceMode !== "2d") return;
  const funcs = state.objects2D.filter((o) => (o.type === "func2d" || o.type === "parabola2d") && o.visible !== false);
  if (funcs.length < 2 && !state.calcAreaBetweenCurves) return;
  if (funcs.length < 2) return;

  const f1 = funcs[0];
  const f2 = funcs[1];

  // Find intersection roots of diff(x) = f1(x) - f2(x) = 0 in [-15, 15]
  const diffFn = (x) => GeoEquations.evalFunc2D(f1, x) - GeoEquations.evalFunc2D(f2, x);
  const numSamples = 400;
  const xMin = Math.max(-15, (-w / 2 - state.view2D.offsetX) / state.view2D.scale);
  const xMax = Math.min(15, (w / 2 - state.view2D.offsetX) / state.view2D.scale);
  const step = (xMax - xMin) / numSamples;

  const roots = [];
  let prevX = xMin;
  let prevVal = diffFn(prevX);

  for (let i = 1; i <= numSamples; i++) {
    const currX = xMin + i * step;
    const currVal = diffFn(currX);
    if (!Number.isFinite(currVal) || Math.abs(currVal) > 1e4) {
      prevX = currX;
      prevVal = NaN;
      continue;
    }
    if (Number.isFinite(prevVal) && prevVal * currVal <= 0) {
      // Bisection refinement
      let lo = prevX, hi = currX;
      for (let it = 0; it < 16; it++) {
        const mid = (lo + hi) / 2;
        const vMid = diffFn(mid);
        if (Math.abs(vMid) < 1e-6) { lo = mid; hi = mid; break; }
        if (prevVal * vMid <= 0) hi = mid;
        else lo = mid;
      }
      const root = (lo + hi) / 2;
      if (!roots.some((r) => Math.abs(r - root) < 0.05)) {
        roots.push(root);
      }
    }
    prevX = currX;
    prevVal = currVal;
  }
  roots.sort((a, b) => a - b);

  if (roots.length < 2) return;

  const a = roots[0];
  const b = roots[roots.length - 1];

  // 1. Fill the bounded area
  ctx.save();
  ctx.beginPath();
  const sampleSteps = 200;
  const dx = (b - a) / sampleSteps;

  // Along f1 from a to b
  for (let i = 0; i <= sampleSteps; i++) {
    const x = a + i * dx;
    const y = GeoEquations.evalFunc2D(f1, x);
    const sp = mathToScreen2D(x, y);
    if (i === 0) ctx.moveTo(sp.x, sp.y);
    else ctx.lineTo(sp.x, sp.y);
  }
  // Along f2 from b back to a
  for (let i = sampleSteps; i >= 0; i--) {
    const x = a + i * dx;
    const y = GeoEquations.evalFunc2D(f2, x);
    const sp = mathToScreen2D(x, y);
    ctx.lineTo(sp.x, sp.y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(37, 99, 235, 0.18)";
  ctx.fill();
  ctx.strokeStyle = "rgba(37, 99, 235, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.restore();

  // 2. Numerical Integration: Composite Simpson's Rule for S = ∫|f1 - f2|dx and I = ∫(f1 - f2)dx
  const N = 200; // must be even
  const hSimp = (b - a) / N;
  let sumAbs = Math.abs(diffFn(a)) + Math.abs(diffFn(b));
  let sumSigned = diffFn(a) + diffFn(b);

  for (let i = 1; i < N; i++) {
    const x = a + i * hSimp;
    const dVal = diffFn(x);
    const coeff = (i % 2 === 1) ? 4 : 2;
    sumAbs += coeff * Math.abs(dVal);
    sumSigned += coeff * dVal;
  }
  const areaS = (hSimp / 3) * sumAbs;
  const integralI = (hSimp / 3) * sumSigned;

  // 3. Draw On-Canvas Floating Badge with results
  const badgeX = -w / 2 + 20;
  const badgeY = h / 2 - 50;
  ctx.save();
  ctx.fillStyle = theme.isLight ? "rgba(255, 255, 255, 0.94)" : "rgba(15, 23, 42, 0.92)";
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1.6;
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, 360, 36, 8);
  } else {
    ctx.rect(badgeX, badgeY, 360, 36);
  }
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = "transparent";

  ctx.font = 'bold 12.5px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = "#2563eb";
  const sText = `S = ∫|${f1.name} - ${f2.name}|dx = ${areaS.toFixed(2).replace(".", ",")} đvdt`;
  const iText = ` | I = ${Math.abs(integralI) < 1e-4 ? "0,00" : integralI.toFixed(2).replace(".", ",")}`;
  ctx.fillText(sText + iText, badgeX + 14, badgeY + 23);
  ctx.restore();
}

function openSurveyDialog(targetExpr) {
  const dialog = document.getElementById("surveyDialog");
  if (!dialog) return;

  let expr = targetExpr;
  if (!expr) {
    const sel = getSelectedObjects().find((o) => o.type === "func2d" || o.type === "parabola2d");
    if (sel && (sel.equationText || sel.expr)) {
      expr = sel.equationText || sel.expr;
    } else {
      const anyFunc = state.objects2D.find((o) => (o.type === "func2d" || o.type === "parabola2d") && o.visible !== false);
      if (anyFunc && (anyFunc.equationText || anyFunc.expr)) {
        expr = anyFunc.equationText || anyFunc.expr;
      } else {
        expr = "y = x^3 - 3x + 1";
      }
    }
  }

  if (window.MathSurveyEngine && typeof window.MathSurveyEngine.analyze === "function") {
    state.currentSurveyAnalysis = window.MathSurveyEngine.analyze(expr);
  }

  renderGoldTestChips(expr);
  renderSurveyContent(state.currentSurveyAnalysis, expr);

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "true");
  }
}

function renderGoldTestChips(currentExpr) {
  const container = document.getElementById("goldTestChipsRow");
  if (!container || !window.MathSurveyEngine || !window.MathSurveyEngine.GOLD_TEST_SUITE) return;

  container.innerHTML = "";
  window.MathSurveyEngine.GOLD_TEST_SUITE.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gold-chip-btn";
    const isAct = currentExpr && currentExpr.replace(/\s+/g, "").includes(item.expr.replace(/\s+/g, ""));
    if (isAct) btn.classList.add("active");
    btn.title = item.desc;
    btn.innerHTML = `<strong>#${item.id}</strong> ${item.label}`;
    btn.addEventListener("click", () => {
      openSurveyDialog(item.expr);
      handleAddEquation(item.expr);
    });
    container.appendChild(btn);
  });
}

function renderExtremaText(analysis) {
  if (!analysis) return "Không có dữ liệu";
  if (analysis.extrema && analysis.extrema.length > 0) {
    return analysis.extrema
      .map((e) => `<strong style="color:var(--primary);">${e.type}</strong> tại (${e.exactX || e.x}; ${e.exactY || e.y})`)
      .join("<br>");
  }
  if (analysis.type === "poly3") {
    return "<em style='color:var(--text-muted);'>Hàm số không có cực trị (y' = 0 có nghiệm kép hoặc vô nghiệm, y' không đổi dấu).</em>";
  }
  if (analysis.type === "rational1_1" || analysis.type === "rational_hole") {
    return "<em style='color:var(--text-muted);'>Hàm số không có cực trị (y' luôn đồng dấu trên từng khoảng xác định).</em>";
  }
  return "<em style='color:var(--text-muted);'>Hàm số không có điểm cực trị.</em>";
}

function renderBBTTableHTML(bbt, analysis) {
  if (!bbt || !bbt.xPoints || bbt.xPoints.length === 0) {
    return `<div style="padding:10px; color:var(--text-muted); font-style:italic;">Không thể khởi tạo bảng biến thiên cho dạng hàm này.</div>`;
  }

  let xCells = `<th class="bbt-header-col">x</th>`;
  bbt.xPoints.forEach((pt, i) => {
    if (i > 0) {
      xCells += `<td style="color:var(--text-muted); min-width:30px;"></td>`;
    }
    const isDouble = pt.isDoubleBar;
    xCells += `<td class="${isDouble ? "bbt-double-bar" : ""}" style="font-weight:700;">${pt.label}</td>`;
  });

  let yPrimeCells = `<th class="bbt-header-col">y'</th>`;
  bbt.xPoints.forEach((pt, i) => {
    if (i > 0) {
      const sign = (bbt.yPrimeSigns && bbt.yPrimeSigns[i - 1]) || "+";
      const signColor = sign === "+" ? "#16a34a" : "#dc2626";
      yPrimeCells += `<td style="font-weight:800; color:${signColor}; font-size:1.1rem;">${sign}</td>`;
    }
    if (pt.val === -Infinity || pt.val === Infinity) {
      yPrimeCells += `<td></td>`;
    } else if (pt.isDoubleBar) {
      yPrimeCells += `<td class="bbt-double-bar" style="font-weight:700;">||</td>`;
    } else {
      yPrimeCells += `<td style="font-weight:700; color:var(--text-muted);">0</td>`;
    }
  });

  let yCells = `<th class="bbt-header-col">y</th>`;
  bbt.xPoints.forEach((pt, i) => {
    if (i > 0) {
      const sign = (bbt.yPrimeSigns && bbt.yPrimeSigns[i - 1]) || "+";
      const isUp = sign === "+";
      const arrowChar = isUp ? "↗" : "↘";
      const arrowClass = isUp ? "bbt-arrow-up" : "bbt-arrow-down";
      yCells += `<td><span class="${arrowClass}" style="font-size:1.35rem; font-weight:800;">${arrowChar}</span></td>`;
    }
    const yValObj = bbt.yValues ? bbt.yValues[i] : null;
    const valText = yValObj ? yValObj.text : "";
    const isDouble = pt.isDoubleBar;
    if (isDouble) {
      yCells += `<td class="bbt-double-bar" style="font-weight:700;">||</td>`;
    } else {
      const isPeak = yValObj && yValObj.pos === "top";
      const valClass = isPeak ? "bbt-peak-val" : "bbt-bottom-val";
      yCells += `<td class="${valClass}" style="vertical-align:${isPeak ? "top" : "bottom"}; padding:6px 4px;">${valText}</td>`;
    }
  });

  return `
    <div class="bbt-wrapper">
      <table class="bbt-table">
        <tbody>
          <tr>${xCells}</tr>
          <tr>${yPrimeCells}</tr>
          <tr style="height:56px;">${yCells}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderMConclusionTableHTML(mParametric) {
  if (!mParametric || !mParametric.conclusions || mParametric.conclusions.length === 0) {
    return `<div style="padding:8px; color:var(--text-muted);">Không có dữ liệu biện luận cho hàm số này.</div>`;
  }

  let rows = "";
  mParametric.conclusions.forEach((c) => {
    const badgeClass = `m-badge-${Math.min(4, c.count)}`;
    rows += `
      <tr>
        <td style="font-weight:700; color:var(--primary); font-family:monospace; font-size:0.95rem;">${c.cond}</td>
        <td><span class="m-badge-count ${badgeClass}">${c.count} nghiệm</span></td>
        <td style="color:var(--text-main);">${c.text}</td>
      </tr>
    `;
  });

  return `
    <table class="m-concl-table">
      <thead>
        <tr>
          <th>Điều kiện tham số m</th>
          <th>Số nghiệm</th>
          <th>Kết luận</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function renderSurveyContent(analysis, expr) {
  const body = document.getElementById("surveyDialogBody");
  if (!body) return;

  if (!analysis) {
    body.innerHTML = `
      <div class="survey-card" style="text-align:center; padding:24px;">
        <p style="color:var(--warncolor); font-weight:700; margin-bottom:8px;">Chưa thể phân tích tự động hàm số: ${expr}</p>
        <p style="color:var(--text-muted); font-size:0.88rem;">Hãy chọn một trong 10 bài toán mẫu của Bộ Test Vàng phía trên để xem khảo sát mẫu chuẩn GDPT 2018.</p>
      </div>
    `;
    return;
  }

  let asymptotesHTML = "";
  const hasVertical = analysis.asymptotes && analysis.asymptotes.vertical && analysis.asymptotes.vertical.length > 0;
  const hasHorizontal = analysis.asymptotes && analysis.asymptotes.horizontal && analysis.asymptotes.horizontal.length > 0;
  const hasSlant = analysis.asymptotes && analysis.asymptotes.slant && analysis.asymptotes.slant.length > 0;
  const hasHoles = analysis.removableDiscontinuities && analysis.removableDiscontinuities.length > 0;

  if (hasVertical || hasHorizontal || hasSlant || hasHoles) {
    let details = "";
    if (hasHoles) {
      details += `<div class="survey-detail-row" style="background:rgba(239,68,68,0.1); padding:6px 10px; border-radius:6px; border:1px solid rgba(239,68,68,0.3);">
        <strong style="color:#dc2626;">⚠️ KHỬ NHÂN TỬ CHUNG:</strong> Đồ thị có lỗ thủng tại ${analysis.removableDiscontinuities.map(h => `(${h.exactX}; ${h.exactY})`).join(", ")}. <strong>KHÔNG CÓ TIỆM CẬN ĐỨNG</strong>!
      </div>`;
    }
    if (hasVertical) {
      details += `<div class="survey-detail-row"><span class="survey-detail-label">Tiệm cận đứng (TCĐ):</span> <span class="survey-detail-value" style="font-weight:700; color:#dc2626;">${analysis.asymptotes.vertical.map(v => typeof v === "object" ? v.label || v.val : v).join(", ")}</span></div>`;
    }
    if (hasHorizontal) {
      details += `<div class="survey-detail-row"><span class="survey-detail-label">Tiệm cận ngang (TCN):</span> <span class="survey-detail-value" style="font-weight:700; color:#2563eb;">${analysis.asymptotes.horizontal.map(h => typeof h === "object" ? h.label || h.val : h).join(", ")}</span></div>`;
    }
    if (hasSlant) {
      details += `<div class="survey-detail-row"><span class="survey-detail-label">Tiệm cận xiên (TCX):</span> <span class="survey-detail-value" style="font-weight:700; color:#d97706;">${analysis.asymptotes.slant.map(s => typeof s === "object" ? s.label || s.val : s).join(", ")}</span></div>`;
    }
    asymptotesHTML = `
      <div class="survey-card">
        <div class="survey-card-title">📐 Đường tiệm cận &amp; Gián đoạn</div>
        ${details}
      </div>
    `;
  }

  body.innerHTML = `
    <!-- Card 1: Dạng hàm & TXD -->
    <div class="survey-card">
      <div class="survey-card-title">📌 Dạng hàm: ${analysis.name}</div>
      <div class="survey-detail-row">
        <span class="survey-detail-label">Công thức:</span>
        <span class="survey-detail-value" style="font-weight:800; color:var(--primary); font-size:1.05rem;">${analysis.originalExpr}</span>
      </div>
      <div class="survey-detail-row">
        <span class="survey-detail-label">Tập xác định:</span>
        <span class="survey-detail-value" style="font-weight:700;">${analysis.domain || "D = ℝ"}</span>
      </div>
    </div>

    <!-- Card 2: Đạo hàm & Cực trị -->
    <div class="survey-card">
      <div class="survey-card-title">⚡ Đạo hàm &amp; Điểm cực trị</div>
      <div class="survey-detail-row">
        <span class="survey-detail-label">Đạo hàm y':</span>
        <span class="survey-detail-value" style="font-family:monospace; font-weight:700;">${analysis.derivativeExpr || "y'"}</span>
      </div>
      <div class="survey-detail-row">
        <span class="survey-detail-label">Nghiệm của y' = 0:</span>
        <span class="survey-detail-value">${analysis.derivativeRoots && analysis.derivativeRoots.length ? analysis.derivativeRoots.map(r => `x = ${r.exactX || r.x}`).join(", ") : "Vô nghiệm hoặc không đổi dấu"}</span>
      </div>
      <div class="survey-detail-row">
        <span class="survey-detail-label">Điểm cực trị:</span>
        <span class="survey-detail-value">${renderExtremaText(analysis)}</span>
      </div>
      ${analysis.inflections && analysis.inflections.length ? `
        <div class="survey-detail-row">
          <span class="survey-detail-label">Tâm đối xứng / Điểm uốn:</span>
          <span class="survey-detail-value" style="font-weight:700; color:#059669;">${analysis.inflections.map(p => `I(${p.exactX}; ${p.exactY})`).join(", ")}</span>
        </div>` : (analysis.type === "poly4" || analysis.type === "poly4_biquad" ? `
        <div class="survey-detail-row">
          <span class="survey-detail-label">Điểm uốn:</span>
          <span class="survey-detail-value" style="color:var(--text-muted); font-style:italic;">Hàm số y = x⁴ hoặc trùng phương có y'' không đổi dấu nên KHÔNG CÓ điểm uốn.</span>
        </div>` : "")}
    </div>

    <!-- Card 3: Tiệm cận -->
    ${asymptotesHTML}

    <!-- Card 4: Bảng Biến Thiên -->
    <div class="survey-card">
      <div class="survey-card-title">📊 Bảng biến thiên (Chuẩn SGK &amp; Đề thi THPT)</div>
      ${renderBBTTableHTML(analysis.bbt, analysis)}
    </div>

    <!-- Card 5: Biện luận theo m -->
    <div class="survey-card">
      <div class="survey-card-title">🎚️ Biện luận số nghiệm phương trình f(x) = m theo tham số m</div>
      <div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:8px;">
        Số nghiệm thực của phương trình f(x) = m là số giao điểm của đồ thị (C) và đường thẳng y = m:
      </div>
      ${renderMConclusionTableHTML(analysis.mParametric)}
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button type="button" class="btn-primary" id="surveySyncMBtn" style="font-size:0.85rem;">
          🎛️ Bật &amp; xem đường y = m trên Studio
        </button>
      </div>
    </div>
  `;

  // Wire sync m button
  const syncBtn = document.getElementById("surveySyncMBtn");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      state.mParam.show = true;
      const chk = document.getElementById("toggleMLineCheck");
      if (chk) chk.checked = true;
      drawScene();
      const dlg = document.getElementById("surveyDialog");
      if (dlg) dlg.close();
      showToast("Đã kích hoạt đường tham số y = m trên bảng vẽ 2D");
    });
  }
}

function drawTriangleSpecialOverlays(A, B, C, ov) {
  const Ma = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const Mb = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
  const Mc = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const G = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };

  const D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) || 1e-5;
  const a2 = A.x * A.x + A.y * A.y;
  const b2 = B.x * B.x + B.y * B.y;
  const c2 = C.x * C.x + C.y * C.y;
  const O = {
    x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / D,
    y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / D
  };
  const H = { x: A.x + B.x + C.x - 2 * O.x, y: A.y + B.y + C.y - 2 * O.y };

  const projFoot = (P, L1, L2) => {
    const dx = L2.x - L1.x, dy = L2.y - L1.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = ((P.x - L1.x) * dx + (P.y - L1.y) * dy) / len2;
    return { x: L1.x + t * dx, y: L1.y + t * dy };
  };
  const Ha = projFoot(A, B, C);
  const Hb = projFoot(B, A, C);
  const Hc = projFoot(C, A, B);

  if (ov.G) {
    drawScreenSegment(A, Ma, "#b45a14", 1.7, true);
    drawScreenSegment(B, Mb, "#b45a14", 1.7, true);
    drawScreenSegment(C, Mc, "#b45a14", 1.7, true);
    drawScreenPoint(G.x, G.y, "G (Trọng tâm)", "#b45a14", 5.2);
  }
  if (ov.H) {
    drawScreenSegment(A, Ha, "#c62828", 1.8, false);
    drawScreenSegment(B, Hb, "#c62828", 1.8, false);
    drawScreenSegment(C, Hc, "#c62828", 1.8, false);
    drawScreenPoint(H.x, H.y, "H (Trực tâm)", "#c62828", 5.2);
  }
  if (ov.O) {
    const R = Math.hypot(O.x - A.x, O.y - A.y);
    ctx.save();
    ctx.beginPath();
    ctx.arc(O.x, O.y, R, 0, Math.PI * 2);
    ctx.strokeStyle = "#148250";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.restore();
    drawScreenPoint(O.x, O.y, "O (Ngoại tiếp)", "#148250", 5.2);
  }
  if (ov.I) {
    const la = Math.hypot(B.x - C.x, B.y - C.y);
    const lb = Math.hypot(A.x - C.x, A.y - C.y);
    const lc = Math.hypot(A.x - B.x, A.y - B.y);
    const p = la + lb + lc || 1;
    const I = { x: (la * A.x + lb * B.x + lc * C.x) / p, y: (la * A.y + lb * B.y + lc * C.y) / p };
    const footI = projFoot(I, B, C);
    const rPx = Math.hypot(I.x - footI.x, I.y - footI.y);
    ctx.save();
    ctx.beginPath();
    ctx.arc(I.x, I.y, rPx, 0, Math.PI * 2);
    ctx.strokeStyle = "#008c96";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    drawScreenPoint(I.x, I.y, "I (Nội tiếp)", "#008c96", 5.2);
  }
  if (ov.E) {
    // Euler Line & 9-point circle
    const E = { x: (O.x + H.x) / 2, y: (O.y + H.y) / 2 };
    const rE = Math.hypot(O.x - A.x, O.y - A.y) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(E.x, E.y, rE, 0, Math.PI * 2);
    ctx.strokeStyle = "#b45a14";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
    drawScreenSegment(O, H, "#b45a14", 2.4, false);
    drawScreenPoint(O.x, O.y, "O", "#148250", 5);
    drawScreenPoint(G.x, G.y, "G", "#b45a14", 5);
    drawScreenPoint(H.x, H.y, "H", "#c62828", 5);
  }
  if (ov.mid) {
    drawScreenSegment(Ma, Mb, "#b45a14", 2.2, false);
    drawScreenSegment(Mb, Mc, "#b45a14", 2.2, false);
    drawScreenSegment(Mc, Ma, "#b45a14", 2.2, false);
    drawScreenPoint(Mc.x, Mc.y, "M", "#b45a14", 4.5);
    drawScreenPoint(Mb.x, Mb.y, "N", "#b45a14", 4.5);
    drawScreenPoint(Ma.x, Ma.y, "P", "#b45a14", 4.5);
  }
}

function drawScreenPoint(x, y, label, color, radius = 5, labelOffset = null) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  if (label) {
    const ox = labelOffset ? labelOffset.dx : 8;
    const oy = labelOffset ? labelOffset.dy : -7;
    ctx.font = '600 13.5px "Segoe UI", system-ui, -apple-system, sans-serif';
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = document.documentElement.getAttribute("data-theme") === "dark" ? "rgba(9,16,27,0.88)" : "rgba(255,255,255,0.94)";
    ctx.strokeText(label, x + ox, y + oy);
    ctx.fillStyle = color;
    ctx.fillText(label, x + ox, y + oy);
  }
  ctx.restore();
}

function drawScreenSegment(p1, p2, color, width = 2, dashed = false) {
  ctx.save();
  if (dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// 3D SCENE RENDERER (PLANES, SPHERES, 3D LINES, SOLIDS & 3D INTERSECTIONS)
// ============================================================================

// Adaptive grid step calculation for Infinite Oxyz Space
function getAdaptiveStep3D(scale) {
  const targetPx = 60;
  const rawStep = targetPx / Math.max(0.0001, scale);
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, exponent);
  let stepMult = 1;
  if (fraction < 1.6) stepMult = 1;
  else if (fraction < 3.8) stepMult = 2;
  else if (fraction < 7.5) stepMult = 5;
  else stepMult = 10;
  return stepMult * Math.pow(10, exponent);
}

// Compute infinite viewport extent (in 3D math units) based on canvas size, pan, and objects
function get3DViewportExtent(w, h) {
  const { zoom, panX, panY } = state.cam3D;
  const scale = 34 * (zoom || 1.0);
  const halfDiag = Math.hypot((w || 800) / 2, (h || 600) / 2) + Math.hypot(panX || 0, panY || 0);
  const mathRadius = (halfDiag / Math.max(0.01, scale)) * 1.15;

  let maxObjDist = 0;
  if (state.objects3D && state.objects3D.length > 0) {
    state.objects3D.forEach((o) => {
      if (o.visible === false) return;
      if (o.type === "point3d") {
        maxObjDist = Math.max(maxObjDist, Math.abs(o.x || 0), Math.abs(o.y || 0), Math.abs(o.z || 0));
      } else if (o.type === "sphere3d") {
        const r = o.r || 1;
        maxObjDist = Math.max(maxObjDist, Math.abs(o.cx || 0) + r, Math.abs(o.cy || 0) + r, Math.abs(o.cz || 0) + r);
      } else if (o.type === "line3d" || o.type === "motion3d") {
        maxObjDist = Math.max(maxObjDist, Math.abs(o.x0 || 0), Math.abs(o.y0 || 0), Math.abs(o.z0 || 0));
        if (o.vx || o.vy || o.vz) {
          const t = o.t || 5;
          maxObjDist = Math.max(maxObjDist, Math.abs((o.x0 || 0) + (o.vx || 0) * t), Math.abs((o.y0 || 0) + (o.vy || 0) * t), Math.abs((o.z0 || 0) + (o.vz || 0) * t));
        }
      } else if (o.type === "vector3d") {
        maxObjDist = Math.max(maxObjDist, Math.abs((o.x0 || 0) + (o.x || 0)), Math.abs((o.y0 || 0) + (o.y || 0)), Math.abs((o.z0 || 0) + (o.z || 0)));
      }
    });
  }

  const step = getAdaptiveStep3D(scale);
  const minUnits = Math.max(6, maxObjDist + step, mathRadius);
  const extent = Math.ceil(minUnits / step) * step;
  return { extent, step, scale };
}

function draw3DGridAndAxes(w, h, theme) {
  const { extent, step } = get3DViewportExtent(w, h);

  // 1. Desmos 3D Adaptive Bounding Box Frame (12 Edges)
  if (state.show3DBox !== false) {
    const B = Math.max(4.5, Math.min(extent * 0.65, 15));
    const boxCorners = [
      { x: -B, y: -B, z: -B }, // 0
      { x: B, y: -B, z: -B },  // 1
      { x: B, y: B, z: -B },   // 2
      { x: -B, y: B, z: -B },  // 3
      { x: -B, y: -B, z: B },  // 4
      { x: B, y: -B, z: B },   // 5
      { x: B, y: B, z: B },    // 6
      { x: -B, y: B, z: B }    // 7
    ];
    const boxEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bottom square
      [4, 5], [5, 6], [6, 7], [7, 4], // Top square
      [0, 4], [1, 5], [2, 6], [3, 7]  // Vertical pillars
    ];

    boxEdges.forEach(([i1, i2]) => {
      const p1 = boxCorners[i1];
      const p2 = boxCorners[i2];
      const s1 = project3D(p1);
      const s2 = project3D(p2);
      const zMid = (s1.z + s2.z) / 2;
      const isBackEdge = zMid > 0;

      ctx.save();
      if (isBackEdge) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = theme.isLight ? "rgba(100, 116, 139, 0.35)" : "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1;
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = theme.isLight ? "rgba(71, 85, 105, 0.55)" : "rgba(203, 213, 225, 0.5)";
        ctx.lineWidth = 1.35;
      }
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
      ctx.restore();
    });
  }

  // 2. Infinite Adaptive Oxy Floor Grid (z = 0 plane)
  if (state.show3DFloor !== false && state.showGrid) {
    const numSteps = Math.round(extent / step);
    const clampedSteps = Math.min(numSteps, 40);

    for (let k = -clampedSteps; k <= clampedSteps; k++) {
      if (k === 0) continue;
      const coord = Math.round(k * step * 1000) / 1000;
      const isMajor = (k % 5 === 0);
      const gridColor = isMajor
        ? (theme.isLight ? "rgba(30, 100, 180, 0.28)" : "rgba(148, 163, 184, 0.26)")
        : (theme.isLight ? "rgba(30, 100, 180, 0.14)" : "rgba(148, 163, 184, 0.12)");
      const gridLw = isMajor ? 1.2 : 0.8;

      const p1 = project3D({ x: coord, y: -extent, z: 0 });
      const p2 = project3D({ x: coord, y: extent, z: 0 });
      const q1 = project3D({ x: -extent, y: coord, z: 0 });
      const q2 = project3D({ x: extent, y: coord, z: 0 });

      drawScreenSegment(p1, p2, gridColor, gridLw, false);
      drawScreenSegment(q1, q2, gridColor, gridLw, false);
    }

    // Adaptive Floor Circular Coordinate Radar Rings
    const ringMultipliers = [2, 5, 10, 20, 50, 100];
    ringMultipliers.forEach((m) => {
      const rVal = m * step;
      if (rVal <= extent * 0.95) {
        draw3DCircleInSpace(0, 0, 0, 0, 0, 1, rVal, theme.isLight ? "rgba(30, 100, 180, 0.16)" : "rgba(148, 163, 184, 0.16)", 1.1, false);
      }
    });
  }

  // 3. Clear Education-Grade 3D Axes Oxyz with Unit Ticks & Labels (Infinite Extension)
  if (state.showAxes) {
    const O = project3D({ x: 0, y: 0, z: 0 });

    const axisPosLen = extent + 1.2 * step;
    const X_pos = project3D({ x: axisPosLen, y: 0, z: 0 });
    const Y_pos = project3D({ x: 0, y: axisPosLen, z: 0 });
    const Z_pos = project3D({ x: 0, y: 0, z: axisPosLen });

    const X_neg = project3D({ x: -extent, y: 0, z: 0 });
    const Y_neg = project3D({ x: 0, y: -extent, z: 0 });
    const Z_neg = project3D({ x: 0, y: 0, z: -extent });

    // Negative Dashed Axes
    drawScreenSegment(O, X_neg, "rgba(220, 38, 38, 0.38)", 1.3, true);
    drawScreenSegment(O, Y_neg, "rgba(22, 163, 74, 0.38)", 1.3, true);
    drawScreenSegment(O, Z_neg, "rgba(37, 99, 235, 0.38)", 1.3, true);

    // Positive Solid Axes
    drawScreenSegment(O, X_pos, "#dc2626", 2.4, false); // Ox in Red
    drawScreenSegment(O, Y_pos, "#16a34a", 2.4, false); // Oy in Green
    drawScreenSegment(O, Z_pos, "#2563eb", 2.4, false); // Oz in Blue

    // 3D Arrowhead drawing helper
    const drawAxisArrow = (pTo, fromPt, color) => {
      const angle = Math.atan2(pTo.y - fromPt.y, pTo.x - fromPt.x);
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(pTo.x, pTo.y);
      ctx.lineTo(pTo.x - 12 * Math.cos(angle - Math.PI / 7), pTo.y - 12 * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(pTo.x - 12 * Math.cos(angle + Math.PI / 7), pTo.y - 12 * Math.sin(angle + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawAxisArrow(X_pos, project3D({ x: axisPosLen - 0.5 * step, y: 0, z: 0 }), "#dc2626");
    drawAxisArrow(Y_pos, project3D({ x: 0, y: axisPosLen - 0.5 * step, z: 0 }), "#16a34a");
    drawAxisArrow(Z_pos, project3D({ x: 0, y: 0, z: axisPosLen - 0.5 * step }), "#2563eb");

    // Unit Ticks & Numeric Labels along each axis
    const tickLen = 0.12 * step;
    const numTicks = Math.round(extent / step);
    const clampedTicks = Math.min(numTicks, 35);

    const drawTickWithHalo = (text, sx, sy, color) => {
      ctx.save();
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.strokeStyle = theme.isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(15, 23, 42, 0.92)";
      ctx.lineWidth = 3;
      ctx.strokeText(text, sx, sy);
      ctx.fillStyle = color || (theme.isLight ? "#334155" : "#cbd5e1");
      ctx.fillText(text, sx, sy);
      ctx.restore();
    };

    for (let k = -clampedTicks; k <= clampedTicks; k++) {
      if (k === 0) continue;
      const u = Math.round(k * step * 1000) / 1000;
      const uStr = (step < 1 ? u.toFixed(1) : u.toString()).replace(".", ",");

      // Ox Ticks
      const ptX = project3D({ x: u, y: 0, z: 0 });
      const tickX1 = project3D({ x: u, y: 0, z: -tickLen });
      const tickX2 = project3D({ x: u, y: 0, z: tickLen });
      drawScreenSegment(tickX1, tickX2, "#dc2626", 1.5, false);
      drawTickWithHalo(uStr, ptX.x + 4, ptX.y + 13, theme.isLight ? "#991b1b" : "#fca5a5");

      // Oy Ticks
      const ptY = project3D({ x: 0, y: u, z: 0 });
      const tickY1 = project3D({ x: 0, y: u, z: -tickLen });
      const tickY2 = project3D({ x: 0, y: u, z: tickLen });
      drawScreenSegment(tickY1, tickY2, "#16a34a", 1.5, false);
      drawTickWithHalo(uStr, ptY.x + 5, ptY.y + 11, theme.isLight ? "#166534" : "#86efac");

      // Oz Ticks
      const ptZ = project3D({ x: 0, y: 0, z: u });
      const tickZ1 = project3D({ x: -tickLen, y: 0, z: u });
      const tickZ2 = project3D({ x: tickLen, y: 0, z: u });
      drawScreenSegment(tickZ1, tickZ2, "#2563eb", 1.5, false);
      drawTickWithHalo(uStr, ptZ.x + 7, ptZ.y + 4, theme.isLight ? "#1e40af" : "#93c5fd");
    }

    // Bold Axis Labels with Halo
    const drawAxisLabelWithHalo = (text, sx, sy, color) => {
      ctx.save();
      ctx.font = 'italic bold 17px "Cambria Math", Georgia, serif';
      ctx.strokeStyle = theme.isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.95)";
      ctx.lineWidth = 3.5;
      ctx.strokeText(text, sx, sy);
      ctx.fillStyle = color;
      ctx.fillText(text, sx, sy);
      ctx.restore();
    };

    drawAxisLabelWithHalo("x", X_pos.x + 10, X_pos.y + 4, "#dc2626");
    drawAxisLabelWithHalo("y", Y_pos.x + 10, Y_pos.y + 4, "#16a34a");
    drawAxisLabelWithHalo("z", Z_pos.x + 6, Z_pos.y - 8, "#2563eb");

    // Origin Mark O(0,0,0)
    ctx.save();
    ctx.font = 'italic bold 17px "Cambria Math", Georgia, serif';
    ctx.strokeStyle = theme.isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.95)";
    ctx.lineWidth = 3.5;
    ctx.strokeText("O", O.x - 17, O.y + 17);
    ctx.fillStyle = theme.isLight ? "#0f172a" : "#f8fafc";
    ctx.fillText("O", O.x - 17, O.y + 17);
    ctx.beginPath();
    ctx.arc(O.x, O.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function getOrthonormalBasis3D(nx, ny, nz) {
  const len = Math.hypot(nx, ny, nz) || 1;
  const n = { x: nx / len, y: ny / len, z: nz / len };
  const ref = Math.abs(n.x) < 0.8 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const ux = n.y * ref.z - n.z * ref.y;
  const uy = n.z * ref.x - n.x * ref.z;
  const uz = n.x * ref.y - n.y * ref.x;
  const uLen = Math.hypot(ux, uy, uz) || 1;
  const u = { x: ux / uLen, y: uy / uLen, z: uz / uLen };
  const v = {
    x: n.y * u.z - n.z * u.y,
    y: n.z * u.x - n.x * u.z,
    z: n.x * u.y - n.y * u.x
  };
  return { n, u, v };
}

function drawAll3DObjects(w, h, theme) {
  const vis = state.objects3D.filter((o) => o.visible !== false);
  const scale = 34 * (state.cam3D.zoom || 1.0);
  const { extent } = get3DViewportExtent(w, h);

  vis.forEach((obj) => {
    const isSel = state.selectedIds.includes(obj.id);
    const color = obj.color || "#1e64b4";

    if (obj.type === "sphere3d") {
      const C = project3D({ x: obj.cx, y: obj.cy, z: obj.cz });
      const rPx = Math.max(2, obj.r * scale);

      ctx.save();
      const grad = ctx.createRadialGradient(C.x - rPx * 0.3, C.y - rPx * 0.3, rPx * 0.08, C.x, C.y, rPx);
      grad.addColorStop(0, color + "36");
      grad.addColorStop(0.75, color + "16");
      grad.addColorStop(1, color + "08");
      ctx.beginPath();
      ctx.arc(C.x, C.y, rPx, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSel ? 3 : 2.2;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '600 13.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(obj.name, C.x + rPx * 0.72 + 6, C.y - rPx * 0.72 - 4);
      ctx.restore();

      draw3DCircleInSpace(obj.cx, obj.cy, obj.cz, 0, 0, 1, obj.r, color, 1.6, true);
      draw3DCircleInSpace(obj.cx, obj.cy, obj.cz, 1, 0, 0, obj.r, color + "77", 1.1, true);
      drawScreenPoint(C.x, C.y, `${obj.centerLabel || "I"}(${obj.cx},${obj.cy},${obj.cz})`, color, 4.5);
    } else if (obj.type === "plane3d") {
      drawDesmos3DPlane(obj, theme, extent);
    } else if (obj.type === "surface3d") {
      drawDesmos3DSurface(obj, theme, extent);
    } else if (obj.type === "point3d") {
      drawPointWith3DDroplines(obj, theme);
    } else if (obj.type === "vector3d") {
      draw3DVector(obj, theme);
    } else if (obj.type === "curve3d") {
      draw3DCurve(obj, theme);
    } else if (obj.type === "line3d") {
      const lineLen = Math.max(12, extent);
      const p1 = project3D({
        x: obj.x0 - obj.ux * lineLen,
        y: obj.y0 - obj.uy * lineLen,
        z: obj.z0 - obj.uz * lineLen
      });
      const p2 = project3D({
        x: obj.x0 + obj.ux * lineLen,
        y: obj.y0 + obj.uy * lineLen,
        z: obj.z0 + obj.uz * lineLen
      });
      drawScreenSegment(p1, p2, color, isSel ? 3.2 : 2.3, obj.dash === "dashed");
      const pMid = project3D({ x: obj.x0, y: obj.y0, z: obj.z0 });
      drawScreenPoint(pMid.x, pMid.y, obj.name, color, 4.5);

      if (obj.hasVelocity) {
        const t = obj.t !== undefined ? obj.t : (state.motionTime || 0);
        const cur3D = {
          x: obj.x0 + (obj.vx || 0) * t,
          y: obj.y0 + (obj.vy || 0) * t,
          z: obj.z0 + (obj.vz || 0) * t
        };
        const pCur = project3D(cur3D);
        
        const pStart = project3D({ x: obj.x0, y: obj.y0, z: obj.z0 });
        drawScreenSegment(pStart, pCur, "#b45a14", 3.2, false);

        ctx.save();
        const pulse = 1 + 0.3 * Math.sin(Date.now() / 160);
        ctx.beginPath();
        ctx.arc(pCur.x, pCur.y, 8 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(198, 40, 40, 0.2)";
        ctx.fill();
        ctx.strokeStyle = "#c62828";
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();

        const coordLabel = `${obj.name || "M"}(t) (${cur3D.x.toFixed(1)}, ${cur3D.y.toFixed(1)}, ${cur3D.z.toFixed(1)})`;
        drawScreenPoint(pCur.x, pCur.y, coordLabel, "#c62828", 5.5, { dx: 12, dy: -12 });

        const vEnd3D = {
          x: cur3D.x + (obj.vx || 0),
          y: cur3D.y + (obj.vy || 0),
          z: cur3D.z + (obj.vz || 0)
        };
        const speed = Math.sqrt((obj.vx || 0) ** 2 + (obj.vy || 0) ** 2 + (obj.vz || 0) ** 2);
        draw3DArrow(cur3D, vEnd3D, "#c62828", 2.6, `v⃗ (|v|=${speed.toFixed(1)})`);
      }
    } else if (obj.type === "solid3d") {
      drawSolid3DObject(obj, theme);
    }
  });

  // Multi-Object 3D Motion Proximity & Collision Alert (e.g. 2 airplanes CPA)
  const movingLines = state.objects3D.filter((o) => o.type === "line3d" && o.hasVelocity && o.visible);
  if (movingLines.length >= 2) {
    const l1 = movingLines[0];
    const l2 = movingLines[1];

    // Analytical Closest Point of Approach (CPA)
    const dx0 = l1.x0 - l2.x0;
    const dy0 = l1.y0 - l2.y0;
    const dz0 = l1.z0 - l2.z0;
    const dvx = (l1.vx || 0) - (l2.vx || 0);
    const dvy = (l1.vy || 0) - (l2.vy || 0);
    const dvz = (l1.vz || 0) - (l2.vz || 0);
    const dvSq = dvx * dvx + dvy * dvy + dvz * dvz;

    let tMin = 0;
    if (dvSq > 1e-9) {
      tMin = Math.max(0, -(dx0 * dvx + dy0 * dvy + dz0 * dvz) / dvSq);
    }
    const dMin = Math.sqrt((dx0 + dvx * tMin) ** 2 + (dy0 + dvy * tMin) ** 2 + (dz0 + dvz * tMin) ** 2);
    l1.tMinCpa = tMin;
    l2.tMinCpa = tMin;

    const t1 = l1.t !== undefined ? l1.t : (state.motionTime || 0);
    const t2 = l2.t !== undefined ? l2.t : (state.motionTime || 0);
    const m1 = { x: l1.x0 + (l1.vx || 0) * t1, y: l1.y0 + (l1.vy || 0) * t1, z: l1.z0 + (l1.vz || 0) * t1 };
    const m2 = { x: l2.x0 + (l2.vx || 0) * t2, y: l2.y0 + (l2.vy || 0) * t2, z: l2.z0 + (l2.vz || 0) * t2 };
    const dist = Math.sqrt((m1.x - m2.x) ** 2 + (m1.y - m2.y) ** 2 + (m1.z - m2.z) ** 2);
    const pm1 = project3D(m1);
    const pm2 = project3D(m2);

    const isMeters = Math.max(Math.abs(l1.x0), Math.abs(l2.x0), Math.abs(l1.vx || 0)) > 50;
    const alertThresh = isMeters ? 1000 : 3.0;
    const isAlert = dist <= alertThresh || dMin <= alertThresh;

    drawScreenSegment(pm1, pm2, isAlert ? "#dc2626" : "#b45a14", isAlert ? 2.6 : 1.8, true);
    const midX = (pm1.x + pm2.x) / 2;
    const midY = (pm1.y + pm2.y) / 2;

    const unitStr = isMeters ? "m" : "km";
    const curDistStr = isMeters && dist >= 1000 ? `${dist.toFixed(0)} m (${(dist/1000).toFixed(2)} km)` : `${dist.toFixed(2)} ${unitStr}`;
    const dMinStr = isMeters && dMin >= 1000 ? `${dMin.toFixed(0)} m (${(dMin/1000).toFixed(2)} km)` : `${dMin.toFixed(2)} ${unitStr}`;

    ctx.save();
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = isAlert ? "#dc2626" : (theme.isLight ? "#1e293b" : "#f1f5f9");
    ctx.fillText(`d(t) = ${curDistStr}`, midX + 8, midY - 6);
    ctx.fillText(`d_min = ${dMinStr} tại t = ${tMin.toFixed(1)}s`, midX + 8, midY + 11);
    if (isAlert) {
      ctx.fillStyle = "#dc2626";
      ctx.font = 'bold 11.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`⚠️ CẢNH BÁO TIẾP CẬN GẦN!`, midX + 8, midY + 27);
    }
    ctx.restore();
  }

  // Render 3D Intersections (Circles, Lines, Points) with smart label de-collision
  const { intersections3D } = GeoEquations.computeAll3DInteractions(state.objects3D);
  const placedLabels = [];
  const getDeCollidedOffset = (sx, sy, defaultDx = 9, defaultDy = -8) => {
    let dx = defaultDx;
    let dy = defaultDy;
    const candidates = [
      { dx: 10, dy: -9 },
      { dx: 10, dy: 16 },
      { dx: -115, dy: -9 },
      { dx: -115, dy: 16 },
      { dx: 10, dy: -26 },
      { dx: 10, dy: 32 }
    ];
    for (const cand of candidates) {
      const lx = sx + cand.dx;
      const ly = sy + cand.dy;
      const collision = placedLabels.some((p) => Math.abs(p.x - lx) < 85 && Math.abs(p.y - ly) < 18);
      if (!collision) {
        dx = cand.dx;
        dy = cand.dy;
        break;
      }
    }
    placedLabels.push({ x: sx + dx, y: sy + dy });
    return { dx, dy };
  };

  intersections3D.forEach((item) => {
    if (item.type === "circle3d") {
      draw3DCircleInSpace(item.cx, item.cy, item.cz, item.nx, item.ny, item.nz, item.r, "#b45a14", 2.6, true, true);
      const cProj = project3D({ x: item.cx, y: item.cy, z: item.cz });
      const off = getDeCollidedOffset(cProj.x, cProj.y, 10, -10);
      drawScreenPoint(cProj.x, cProj.y, `H (r=${item.r.toFixed(2)})`, "#b45a14", 5, off);
    } else if (item.type === "point3d") {
      const sp = project3D(item);
      const off = getDeCollidedOffset(sp.x, sp.y, 10, 15);
      drawScreenPoint(sp.x, sp.y, item.label, "#c62828", 5.8, off);
    } else if (item.type === "line3d") {
      const p1 = project3D({ x: item.x0 - item.ux * 5, y: item.y0 - item.uy * 5, z: item.z0 - item.uz * 5 });
      const p2 = project3D({ x: item.x0 + item.ux * 5, y: item.y0 + item.uy * 5, z: item.z0 + item.uz * 5 });
      drawScreenSegment(p1, p2, "#b45a14", 2.8, false);
    }
  });

  // Check if any cone is unfolded
  const unfoldedCone = state.objects3D.find(
    (o) => o.type === "solid3d" && o.solidType === "cone" && o.isUnfolded && o.visible !== false
  );
  if (unfoldedCone) {
    drawConeUnfolding(unfoldedCone, w, h, theme);
  }
}

function drawConeUnfolding(obj, w, h, theme) {
  const r = obj.r || 3;
  const height = obj.h || 4;
  const l = Math.hypot(r, height);
  const alphaDeg = (r / l) * 360;
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const sXq = Math.PI * r * l;
  const sDay = Math.PI * r * r;
  const sTp = sXq + sDay;
  const vCone = (Math.PI * r * r * height) / 3;

  // Draw overlay card in top-right of 3D canvas
  const cardW = 340;
  const cardH = 340;
  const cardX = w / 2 - cardW - 24;
  const cardY = -h / 2 + 30;

  ctx.save();
  // Card background
  ctx.fillStyle = theme.isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.94)";
  ctx.strokeStyle = theme.isLight ? "#cbd5e1" : "#334155";
  ctx.lineWidth = 1.6;
  ctx.shadowColor = "rgba(0, 0, 0, 0.16)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cardX, cardY, cardW, cardH, 12);
  } else {
    ctx.rect(cardX, cardY, cardW, cardH);
  }
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = "transparent";

  // Card Title
  ctx.fillStyle = "#2563eb";
  ctx.font = 'bold 13.5px "Segoe UI", system-ui, sans-serif';
  ctx.fillText("📐 Khai Triển 2D Hình Nón (Trải Phẳng)", cardX + 16, cardY + 26);

  // Unfolding Geometry Center
  const ox = cardX + 135;
  const oy = cardY + 115;
  const pxScale = 14; // pixels per cm
  const lPx = l * pxScale;
  const rPx = r * pxScale;

  // Unfolded sector: apex at S'(ox, oy)
  const startAng = -Math.PI / 2 - alphaRad / 2;
  const endAng = startAng + alphaRad;

  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, lPx, startAng, endAng);
  ctx.closePath();
  ctx.fillStyle = "rgba(37, 99, 235, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Apex marker S'
  ctx.beginPath();
  ctx.arc(ox, oy, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#2563eb";
  ctx.fill();
  ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
  ctx.fillText("S'", ox - 16, oy - 6);

  // Sector radius label l
  ctx.font = '600 11.5px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = "#1e40af";
  ctx.fillText(`l = ${l.toFixed(0)} cm`, ox + lPx * 0.45, oy - 10);

  // Sector angle label alpha
  ctx.fillStyle = "#b45a14";
  ctx.fillText(`α = ${alphaDeg.toFixed(1)}°`, ox - 24, oy + 28);

  // Base circle: tangent to the midpoint of the arc
  const midAng = (startAng + endAng) / 2;
  const touchX = ox + lPx * Math.cos(midAng);
  const touchY = oy + lPx * Math.sin(midAng);
  const baseCenter = {
    x: touchX + rPx * Math.cos(midAng),
    y: touchY + rPx * Math.sin(midAng)
  };

  ctx.beginPath();
  ctx.arc(baseCenter.x, baseCenter.y, rPx, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "#059669";
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Base center point O'
  ctx.beginPath();
  ctx.arc(baseCenter.x, baseCenter.y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#059669";
  ctx.fill();
  ctx.fillText("O'", baseCenter.x + 6, baseCenter.y - 4);

  // Base radius line and label
  ctx.beginPath();
  ctx.moveTo(baseCenter.x, baseCenter.y);
  ctx.lineTo(baseCenter.x + rPx, baseCenter.y);
  ctx.setLineDash([3, 2]);
  ctx.strokeStyle = "#059669";
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#065f46";
  ctx.fillText(`r = ${r} cm`, baseCenter.x + 8, baseCenter.y + 14);

  // Analytical summary below drawing
  const textStartY = cardY + 225;
  ctx.font = '12px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = theme.isLight ? "#334155" : "#cbd5e1";
  ctx.fillText(`• Bán kính quạt (đường sinh): l = √(r²+h²) = ${l.toFixed(0)} cm`, cardX + 16, textStartY);
  ctx.fillText(`• Góc ở đỉnh quạt: α = (r/l)·360° = ${alphaDeg.toFixed(1)}°`, cardX + 16, textStartY + 18);
  ctx.fillText(`• S_xq = π·r·l = ${r * l}π ≈ ${sXq.toFixed(2).replace(".", ",")} cm²`, cardX + 16, textStartY + 36);
  ctx.fillText(`• S_đáy = π·r² = ${r * r}π ≈ ${sDay.toFixed(2).replace(".", ",")} cm²`, cardX + 16, textStartY + 54);
  ctx.fillText(`• S_tp = ${r * (l + r)}π ≈ ${sTp.toFixed(2).replace(".", ",")} cm² | V = ${((r * r * height) / 3).toFixed(1)}π ≈ ${vCone.toFixed(2).replace(".", ",")} cm³`, cardX + 16, textStartY + 72);

  ctx.restore();
}

// ============================================================================
// DESMOS 3D ADVANCED GRAPHING & SHADING ENGINES
// ============================================================================

function drawDesmos3DSurface(obj, theme, extent) {
  const fn = GeoEquations.compileExpr(obj.expr);
  if (!fn) return;

  const B = Math.min(extent || 6.0, 25.0);
  const N = 26; // 26x26 quads
  const step = (2 * B) / N;

  const cosY = Math.cos(state.cam3D.yaw);
  const sinY = Math.sin(state.cam3D.yaw);
  const cosP = Math.cos(state.cam3D.pitch);
  const sinP = Math.sin(state.cam3D.pitch);
  const Vcam = { x: -sinY * cosP, y: -cosY * cosP, z: -sinP };

  const Ldir = { x: 0.45, y: -0.55, z: 0.70 };
  const Lmag = Math.hypot(Ldir.x, Ldir.y, Ldir.z) || 1;
  const Lx = Ldir.x / Lmag, Ly = Ldir.y / Lmag, Lz = Ldir.z / Lmag;

  const gridPts = [];
  for (let i = 0; i <= N; i++) {
    gridPts[i] = [];
    const x = -B + i * step;
    for (let j = 0; j <= N; j++) {
      const y = -B + j * step;
      let z = fn(x, y, 0);
      if (!Number.isFinite(z)) z = NaN;
      else if (Math.abs(z) > B * 1.5) z = Math.sign(z) * B * 1.5;
      gridPts[i][j] = { x, y, z };
    }
  }

  const triangles = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const p00 = gridPts[i][j];
      const p10 = gridPts[i + 1][j];
      const p11 = gridPts[i + 1][j + 1];
      const p01 = gridPts[i][j + 1];

      if (isNaN(p00.z) || isNaN(p10.z) || isNaN(p11.z) || isNaN(p01.z)) continue;

      const s00 = project3D(p00);
      const s10 = project3D(p10);
      const s11 = project3D(p11);
      const s01 = project3D(p01);

      // Tri 1: (p00, p10, p11)
      const nx1 = (p10.y - p00.y) * (p11.z - p00.z) - (p10.z - p00.z) * (p11.y - p00.y);
      const ny1 = (p10.z - p00.z) * (p11.x - p00.x) - (p10.x - p00.x) * (p11.z - p00.z);
      const nz1 = (p10.x - p00.x) * (p11.y - p00.y) - (p10.y - p00.y) * (p11.x - p00.x);
      const nlen1 = Math.hypot(nx1, ny1, nz1) || 1;
      const norm1 = { x: nx1 / nlen1, y: ny1 / nlen1, z: nz1 / nlen1 };

      const facing1 = norm1.x * Vcam.x + norm1.y * Vcam.y + norm1.z * Vcam.z;
      const isFront1 = facing1 >= 0;
      const dotL1 = norm1.x * Lx + norm1.y * Ly + norm1.z * Lz;

      let fill1;
      if (isFront1) {
        const diff = 0.52 + 0.44 * Math.max(0, dotL1);
        fill1 = `rgba(${Math.round(37 * diff)}, ${Math.round(99 * diff)}, ${Math.round(235 * diff)}, 0.85)`;
      } else {
        const diff = 0.38 + 0.32 * Math.max(0, -dotL1);
        fill1 = `rgba(${Math.round(30 * diff)}, ${Math.round(27 * diff)}, ${Math.round(75 * diff)}, 0.90)`;
      }
      triangles.push({
        s0: s00, s1: s10, s2: s11,
        depth: (s00.z + s10.z + s11.z) / 3,
        fill: fill1,
        stroke: i % 3 === 0 && j % 3 === 0 ? "rgba(255,255,255,0.18)" : null
      });

      // Tri 2: (p00, p11, p01)
      const nx2 = (p11.y - p00.y) * (p01.z - p00.z) - (p11.z - p00.z) * (p01.y - p00.y);
      const ny2 = (p11.z - p00.z) * (p01.x - p00.x) - (p11.x - p00.x) * (p01.z - p00.z);
      const nz2 = (p11.x - p00.x) * (p01.y - p00.y) - (p11.y - p00.y) * (p01.x - p00.x);
      const nlen2 = Math.hypot(nx2, ny2, nz2) || 1;
      const norm2 = { x: nx2 / nlen2, y: ny2 / nlen2, z: nz2 / nlen2 };

      const facing2 = norm2.x * Vcam.x + norm2.y * Vcam.y + norm2.z * Vcam.z;
      const isFront2 = facing2 >= 0;
      const dotL2 = norm2.x * Lx + norm2.y * Ly + norm2.z * Lz;

      let fill2;
      if (isFront2) {
        const diff = 0.52 + 0.44 * Math.max(0, dotL2);
        fill2 = `rgba(${Math.round(37 * diff)}, ${Math.round(99 * diff)}, ${Math.round(235 * diff)}, 0.85)`;
      } else {
        const diff = 0.38 + 0.32 * Math.max(0, -dotL2);
        fill2 = `rgba(${Math.round(30 * diff)}, ${Math.round(27 * diff)}, ${Math.round(75 * diff)}, 0.90)`;
      }
      triangles.push({
        s0: s00, s1: s11, s2: s01,
        depth: (s00.z + s11.z + s01.z) / 3,
        fill: fill2,
        stroke: i % 3 === 0 && j % 3 === 0 ? "rgba(255,255,255,0.18)" : null
      });
    }
  }

  // Painter's algorithm: sort depth descending (larger depth / farther away drawn first)
  triangles.sort((a, b) => b.depth - a.depth);

  ctx.save();
  triangles.forEach((t) => {
    ctx.beginPath();
    ctx.moveTo(t.s0.x, t.s0.y);
    ctx.lineTo(t.s1.x, t.s1.y);
    ctx.lineTo(t.s2.x, t.s2.y);
    ctx.closePath();
    ctx.fillStyle = t.fill;
    ctx.fill();
    if (t.stroke) {
      ctx.strokeStyle = t.stroke;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  });

  const pLabel = project3D({ x: 2.2, y: 2.2, z: fn(2.2, 2.2, 0) || 0 });
  ctx.fillStyle = "#2563eb";
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${obj.name}: ${obj.equationText || ""}`, pLabel.x + 8, pLabel.y - 8);
  ctx.restore();
}

function drawDesmos3DPlane(obj, theme, extent) {
  const B = Math.max(5.0, extent || 10.0);
  const a = obj.a, b = obj.b, c = obj.c, d = obj.d;
  const normLen = Math.hypot(a, b, c) || 1;

  const boxEdges = [
    [{ x: -B, y: -B, z: -B }, { x: B, y: -B, z: -B }],
    [{ x: B, y: -B, z: -B }, { x: B, y: B, z: -B }],
    [{ x: B, y: B, z: -B }, { x: -B, y: B, z: -B }],
    [{ x: -B, y: B, z: -B }, { x: -B, y: -B, z: -B }],
    [{ x: -B, y: -B, z: B }, { x: B, y: -B, z: B }],
    [{ x: B, y: -B, z: B }, { x: B, y: B, z: B }],
    [{ x: B, y: B, z: B }, { x: -B, y: B, z: B }],
    [{ x: -B, y: B, z: B }, { x: -B, y: -B, z: B }],
    [{ x: -B, y: -B, z: -B }, { x: -B, y: -B, z: B }],
    [{ x: B, y: -B, z: -B }, { x: B, y: -B, z: B }],
    [{ x: B, y: B, z: -B }, { x: B, y: B, z: B }],
    [{ x: -B, y: B, z: -B }, { x: -B, y: B, z: B }]
  ];

  const pts = [];
  boxEdges.forEach(([p1, p2]) => {
    const v1 = a * p1.x + b * p1.y + c * p1.z + d;
    const v2 = a * p2.x + b * p2.y + c * p2.z + d;
    if (v1 * v2 <= 0 && Math.abs(v1 - v2) > 1e-7) {
      const t = -v1 / (v2 - v1);
      const ix = p1.x + t * (p2.x - p1.x);
      const iy = p1.y + t * (p2.y - p1.y);
      const iz = p1.z + t * (p2.z - p1.z);
      if (!pts.some((p) => Math.hypot(p.x - ix, p.y - iy, p.z - iz) < 0.05)) {
        pts.push({ x: ix, y: iy, z: iz });
      }
    }
  });

  if (pts.length < 3) return;

  const C = {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    z: pts.reduce((s, p) => s + p.z, 0) / pts.length
  };

  const { u, v } = getOrthonormalBasis3D(a, b, c);
  pts.sort((p1, p2) => {
    const d1x = p1.x - C.x, d1y = p1.y - C.y, d1z = p1.z - C.z;
    const d2x = p2.x - C.x, d2y = p2.y - C.y, d2z = p2.z - C.z;
    const u1 = d1x * u.x + d1y * u.y + d1z * u.z;
    const v1 = d1x * v.x + d1y * v.y + d1z * v.z;
    const u2 = d2x * u.x + d2y * u.y + d2z * u.z;
    const v2 = d2x * v.x + d2y * v.y + d2z * v.z;
    return Math.atan2(v1, u1) - Math.atan2(v2, u2);
  });

  const screenPts = pts.map(project3D);
  const color = obj.color || "#059669";

  ctx.save();
  ctx.beginPath();
  screenPts.forEach((sp, i) => (i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y)));
  ctx.closePath();
  ctx.fillStyle = color + "36";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Draw Normal Vector n⃗ from Centroid C
  const nEnd = {
    x: C.x + (a / normLen) * 1.8,
    y: C.y + (b / normLen) * 1.8,
    z: C.z + (c / normLen) * 1.8
  };
  draw3DArrow(C, nEnd, color, 2.4, `n⃗(${a}, ${b}, ${c})`);

  const pProj = project3D(C);
  ctx.fillStyle = color;
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${obj.name}: ${obj.equationText || ""}`, pProj.x + 8, pProj.y - 8);
  ctx.restore();
}

function drawPointWith3DDroplines(obj, theme) {
  const { x, y, z, name } = obj;
  const color = obj.color || "#dc2626";

  const pM = project3D({ x, y, z });
  const pFloor = project3D({ x, y, z: 0 });
  const pOx = project3D({ x, y: 0, z: 0 });
  const pOy = project3D({ x: 0, y: 0, z: 0 });
  const pOz = project3D({ x: 0, y: 0, z });

  ctx.save();
  // 1. Vertical Dropline: M -> M'(x, y, 0)
  if (Math.abs(z) > 0.05) {
    drawScreenSegment(pM, pFloor, "#2563eb", 1.8, true);
    drawScreenPoint(pFloor.x, pFloor.y, `M'(${x.toFixed(1)}, ${y.toFixed(1)}, 0)`, "#2563eb", 3.8);
  }

  // 2. Floor Droplines: M' -> (x, 0, 0) and M' -> (0, y, 0)
  if (Math.abs(y) > 0.05) {
    drawScreenSegment(pFloor, pOx, "#dc2626", 1.5, true);
    drawScreenPoint(pOx.x, pOx.y, `${x.toFixed(1)}`, "#dc2626", 3.2);
  }
  if (Math.abs(x) > 0.05) {
    drawScreenSegment(pFloor, pOy, "#16a34a", 1.5, true);
    drawScreenPoint(pOy.x, pOy.y, `${y.toFixed(1)}`, "#16a34a", 3.2);
  }

  // 3. Height Dropline: M -> (0, 0, z)
  if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) {
    drawScreenSegment(pM, pOz, "#2563eb", 1.5, true);
    drawScreenPoint(pOz.x, pOz.y, `${z.toFixed(1)}`, "#2563eb", 3.2);
  }

  // 4. Point M with Glowing Ring & Label
  ctx.beginPath();
  ctx.arc(pM.x, pM.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(220, 38, 38, 0.25)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(pM.x, pM.y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(`${name}(${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`, pM.x + 9, pM.y - 7);
  ctx.restore();
}

function draw3DVector(obj, theme) {
  const x0 = obj.x0 || 0, y0 = obj.y0 || 0, z0 = obj.z0 || 0;
  const x1 = x0 + obj.x, y1 = y0 + obj.y, z1 = z0 + obj.z;
  const color = obj.color || "#9333ea";

  const p0 = { x: x0, y: y0, z: z0 };
  const p1 = { x: x1, y: y1, z: z1 };
  const mag = Math.hypot(obj.x, obj.y, obj.z);

  draw3DArrow(p0, p1, color, 3.0, `${obj.name}(${obj.x.toFixed(1)}, ${obj.y.toFixed(1)}, ${obj.z.toFixed(1)}) |${obj.name}|=${mag.toFixed(2)}`);

  // If another vector exists, compute dot product, angle theta, and cross product!
  const otherVecs = state.objects3D.filter((o) => o.type === "vector3d" && o.id !== obj.id);
  if (otherVecs.length > 0) {
    const v2 = otherVecs[0];
    const dot = obj.x * v2.x + obj.y * v2.y + obj.z * v2.z;
    const mag2 = Math.hypot(v2.x, v2.y, v2.z);
    if (mag > 1e-5 && mag2 > 1e-5) {
      const cosTheta = Math.max(-1, Math.min(1, dot / (mag * mag2)));
      const deg = (Math.acos(cosTheta) * 180) / Math.PI;

      const pMid = project3D({ x: (obj.x + v2.x) * 0.28, y: (obj.y + v2.y) * 0.28, z: (obj.z + v2.z) * 0.28 });
      ctx.save();
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = "#d97706";
      ctx.fillText(`φ = ${deg.toFixed(1)}° | u⃗·v⃗ = ${dot.toFixed(1)}`, pMid.x + 8, pMid.y - 8);
      ctx.restore();
    }
  }
}

function draw3DCurve(obj, theme) {
  const fx = GeoEquations.compileExpr(obj.fxExpr || "cos(t)");
  const fy = GeoEquations.compileExpr(obj.fyExpr || "sin(t)");
  const fz = GeoEquations.compileExpr(obj.fzExpr || "0.25*t");
  if (!fx || !fy || !fz) return;

  const tMin = obj.tMin !== undefined ? obj.tMin : -10;
  const tMax = obj.tMax !== undefined ? obj.tMax : 10;
  const steps = 180;
  const dt = (tMax - tMin) / steps;
  const color = obj.color || "#06b6d4";

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  let penDown = false;

  for (let i = 0; i <= steps; i++) {
    const t = tMin + i * dt;
    const x = fx(0, 0, t);
    const y = fy(0, 0, t);
    const z = fz(0, 0, t);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      penDown = false;
      continue;
    }
    const sp = project3D({ x, y, z });
    if (!penDown) {
      ctx.moveTo(sp.x, sp.y);
      penDown = true;
    } else {
      ctx.lineTo(sp.x, sp.y);
    }
  }
  ctx.stroke();

  const spMid = project3D({ x: fx(0, 0, 0), y: fy(0, 0, 0), z: fz(0, 0, 0) });
  ctx.fillStyle = color;
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${obj.name}: ${obj.equationText || ""}`, spMid.x + 8, spMid.y - 8);
  ctx.restore();
}

function draw3DOrientationTriad(w, h, theme) {
  if (state.spaceMode !== "3d" || state.show3DTriad === false) return;

  const cx = w / 2 - 55;
  const cy = h / 2 - 55;
  const R = 32;

  const { yaw, pitch } = state.cam3D;
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);

  const projectMini = (v3) => {
    const x1 = v3.x * cosY - v3.y * sinY;
    const y1 = v3.x * sinY + v3.y * cosY;
    const z1 = v3.z;
    const z2 = z1 * cosP - y1 * sinP;
    const depth = z1 * sinP + y1 * cosP;
    return {
      x: cx + x1 * R,
      y: cy - z2 * R,
      z: depth
    };
  };

  const pX = projectMini({ x: 1, y: 0, z: 0 });
  const pY = projectMini({ x: 0, y: 1, z: 0 });
  const pZ = projectMini({ x: 0, y: 0, z: 1 });

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fillStyle = theme.isLight ? "rgba(241, 245, 249, 0.78)" : "rgba(15, 23, 42, 0.78)";
  ctx.fill();
  ctx.strokeStyle = theme.isLight ? "rgba(203, 213, 225, 0.85)" : "rgba(51, 65, 85, 0.85)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const axes = [
    { p: pX, label: "x", color: "#dc2626" },
    { p: pY, label: "y", color: "#16a34a" },
    { p: pZ, label: "z", color: "#2563eb" }
  ];
  axes.sort((a, b) => b.p.z - a.p.z);

  axes.forEach((ax) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax.p.x, ax.p.y);
    ctx.strokeStyle = ax.color;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ax.p.x, ax.p.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = ax.color;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = 'bold 9.5px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ax.label, ax.p.x, ax.p.y);
  });

  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = theme.isLight ? "#334155" : "#f8fafc";
  ctx.fill();
  ctx.restore();
}

function handle3DTriadClick(relX, relY) {
  const { yaw, pitch } = state.cam3D;
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
  const R = 32;

  const projectMini = (v3) => {
    const x1 = v3.x * cosY - v3.y * sinY;
    const y1 = v3.x * sinY + v3.y * cosY;
    const z1 = v3.z;
    const z2 = z1 * cosP - y1 * sinP;
    return { x: x1 * R, y: -z2 * R };
  };

  const pX = projectMini({ x: 1, y: 0, z: 0 });
  const pY = projectMini({ x: 0, y: 1, z: 0 });
  const pZ = projectMini({ x: 0, y: 0, z: 1 });

  const dX = Math.hypot(relX - pX.x, relY - pX.y);
  const dY = Math.hypot(relX - pY.x, relY - pY.y);
  const dZ = Math.hypot(relX - pZ.x, relY - pZ.y);
  const dCenter = Math.hypot(relX, relY);

  if (dX < 16) {
    state.cam3D.yaw = Math.PI / 2;
    state.cam3D.pitch = 0;
    drawScene();
    showToast("La bàn 3D: Nhìn trục Ox (Mặt phẳng Oyz)");
    return true;
  } else if (dY < 16) {
    state.cam3D.yaw = 0;
    state.cam3D.pitch = 0;
    drawScene();
    showToast("La bàn 3D: Nhìn trục Oy (Mặt phẳng Oxz)");
    return true;
  } else if (dZ < 16) {
    state.cam3D.yaw = 0;
    state.cam3D.pitch = 1.35;
    drawScene();
    showToast("La bàn 3D: Nhìn trục Oz (Mặt phẳng Oxy)");
    return true;
  } else if (dCenter < 18) {
    state.cam3D.yaw = -0.65;
    state.cam3D.pitch = 0.42;
    drawScene();
    showToast("La bàn 3D: Góc phối cảnh chuẩn (Isometric)");
    return true;
  }
  return false;
}

function loadDesmos3DPreset(presetKey) {
  if (!ENABLE_3D_OXYZ) {
    showToast("Tính năng đồ thị 3D Oxyz tạm thời tắt để bảo trì.");
    return;
  }
  saveHistory();
  state.spaceMode = "3d";
  syncSpaceModeUI();

  if (presetKey === "paraboloid_elliptic") {
    state.objects3D = [{
      id: genId("surface3d"),
      space: "3d",
      type: "surface3d",
      name: "Paraboloid",
      expr: "x^2 + y^2",
      equationText: "z = x² + y²",
      color: "#2563eb",
      visible: true
    }];
    showToast("Đã vẽ Paraboloid eliptic: z = x² + y²");
  } else if (presetKey === "paraboloid_saddle") {
    state.objects3D = [{
      id: genId("surface3d"),
      space: "3d",
      type: "surface3d",
      name: "Yên ngựa",
      expr: "x^2 - y^2",
      equationText: "z = x² - y²",
      color: "#9333ea",
      visible: true
    }];
    showToast("Đã vẽ Yên ngựa (Hyperbolic paraboloid): z = x² - y²");
  } else if (presetKey === "surface_wave") {
    state.objects3D = [{
      id: genId("surface3d"),
      space: "3d",
      type: "surface3d",
      name: "Sóng nước",
      expr: "sin(x) * cos(y)",
      equationText: "z = sin(x) · cos(y)",
      color: "#0284c7",
      visible: true
    }];
    showToast("Đã vẽ Mặt sóng lượng giác: z = sin(x) · cos(y)");
  } else if (presetKey === "cone_surface") {
    state.objects3D = [{
      id: genId("surface3d"),
      space: "3d",
      type: "surface3d",
      name: "Mặt nón",
      expr: "sqrt(x^2 + y^2)",
      equationText: "z = √(x² + y²)",
      color: "#ea580c",
      visible: true
    }];
    showToast("Đã vẽ Mặt nón tròn xoay: z = √(x² + y²)");
  } else if (presetKey === "sphere_std") {
    state.objects3D = [{
      id: genId("sphere3d"),
      space: "3d",
      type: "sphere3d",
      name: "S",
      cx: 0, cy: 0, cz: 0, r: 3,
      equationText: "x² + y² + z² = 9",
      color: "#2563eb",
      visible: true
    }];
    showToast("Đã vẽ Mặt cầu tâm O, bán kính R = 3: x² + y² + z² = 9");
  } else if (presetKey === "plane_std") {
    state.objects3D = [{
      id: genId("plane3d"),
      space: "3d",
      type: "plane3d",
      name: "(α)",
      a: 2, b: -1, c: 2, d: -4,
      equationText: "2x - y + 2z - 4 = 0",
      color: "#059669",
      visible: true
    }];
    showToast("Đã vẽ Mặt phẳng (α): 2x - y + 2z - 4 = 0");
  } else if (presetKey === "sphere_plane_intersect") {
    state.objects3D = [
      {
        id: genId("sphere3d"),
        space: "3d",
        type: "sphere3d",
        name: "S",
        cx: 0, cy: 0, cz: 0, r: 3,
        equationText: "x² + y² + z² = 9",
        color: "#2563eb",
        visible: true
      },
      {
        id: genId("plane3d"),
        space: "3d",
        type: "plane3d",
        name: "(β)",
        a: 0, b: 0, c: 1, d: -1,
        equationText: "z = 1",
        color: "#059669",
        visible: true
      }
    ];
    showToast("Đã vẽ Mặt cầu & Mặt phẳng cắt nhau theo đường tròn giao tuyến");
  } else if (presetKey === "point_dropline") {
    state.objects3D = [
      {
        id: genId("point3d"),
        space: "3d",
        type: "point3d",
        name: "M",
        x: 2, y: 3, z: 4,
        dropline: true,
        equationText: "M(2, 3, 4)",
        color: "#dc2626",
        visible: true
      }
    ];
    showToast("Đã vẽ Điểm M(2; 3; 4) với gióng hình chiếu vuông góc 3D");
  } else if (presetKey === "vectors_angle") {
    state.objects3D = [
      {
        id: genId("vector3d"),
        space: "3d",
        type: "vector3d",
        name: "u⃗",
        x: 2, y: 3, z: 2,
        x0: 0, y0: 0, z0: 0,
        equationText: "u⃗ = (2, 3, 2)",
        color: "#9333ea",
        visible: true
      },
      {
        id: genId("vector3d"),
        space: "3d",
        type: "vector3d",
        name: "v⃗",
        x: 3, y: -1, z: 2,
        x0: 0, y0: 0, z0: 0,
        equationText: "v⃗ = (3, -1, 2)",
        color: "#d97706",
        visible: true
      }
    ];
    showToast("Đã vẽ Cặp vectơ u⃗, v⃗ trong không gian Oxyz");
  } else if (presetKey === "helix_curve") {
    state.objects3D = [
      {
        id: genId("curve3d"),
        space: "3d",
        type: "curve3d",
        name: "Helix",
        fxExpr: "cos(t)",
        fyExpr: "sin(t)",
        fzExpr: "0.25*t",
        tMin: -10,
        tMax: 10,
        equationText: "x = cos(t), y = sin(t), z = 0.25t",
        color: "#06b6d4",
        visible: true
      }
    ];
    showToast("Đã vẽ Đường xoắn ốc Helix trong không gian");
  }

  state.selectedIds = state.objects3D.map((o) => o.id);
  refreshAllUI();
}

function draw3DCircleInSpace(cx, cy, cz, nx, ny, nz, r, color, width = 2, backDashed = true, fill = false) {
  const { u, v } = getOrthonormalBasis3D(nx, ny, nz);
  const segs = 64;
  const pts2D = [];
  for (let i = 0; i < segs; i++) {
    const ang = (i * 2 * Math.PI) / segs;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    pts2D.push(
      project3D({
        x: cx + r * (u.x * ca + v.x * sa),
        y: cy + r * (u.y * ca + v.y * sa),
        z: cz + r * (u.z * ca + v.z * sa)
      })
    );
  }
  if (fill) {
    ctx.save();
    ctx.beginPath();
    pts2D.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.closePath();
    ctx.fillStyle = "rgba(180, 90, 20, 0.18)";
    ctx.fill();
    ctx.restore();
  }
  const cProj = project3D({ x: cx, y: cy, z: cz });
  for (let i = 0; i < segs; i++) {
    const p1 = pts2D[i];
    const p2 = pts2D[(i + 1) % segs];
    const isBack = backDashed && (p1.z + p2.z) / 2 < cProj.z;
    drawScreenSegment(p1, p2, color, width, isBack);
  }
}

function drawSolid3DObject(obj, theme) {
  const { a, b, h, r, solidType, color } = obj;
  if (solidType === "cube" || solidType === "box") {
    const hx = a / 2;
    const hy = (solidType === "cube" ? a : b) / 2;
    const hz = (solidType === "cube" ? a : h) / 2;
    const verts = [
      { x: -hx, y: -hy, z: -hz },
      { x: hx, y: -hy, z: -hz },
      { x: hx, y: hy, z: -hz },
      { x: -hx, y: hy, z: -hz },
      { x: -hx, y: -hy, z: hz },
      { x: hx, y: -hy, z: hz },
      { x: hx, y: hy, z: hz },
      { x: -hx, y: hy, z: hz }
    ];
    const faces = [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7]
    ];
    renderSolidPolyhedron(verts, faces, ["A", "B", "C", "D", "A'", "B'", "C'", "D'"], color, theme);
  } else if (solidType === "pyramid_square") {
    const hx = a / 2;
    const hz = h / 2;
    const verts = [
      { x: 0, y: 0, z: hz },
      { x: -hx, y: -hx, z: -hz },
      { x: hx, y: -hx, z: -hz },
      { x: hx, y: hx, z: -hz },
      { x: -hx, y: hx, z: -hz }
    ];
    const faces = [
      [1, 4, 3, 2],
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 4],
      [0, 4, 1]
    ];
    renderSolidPolyhedron(verts, faces, ["S", "A", "B", "C", "D"], color, theme);
    // Altitude SO
    drawScreenSegment(project3D(verts[0]), project3D({ x: 0, y: 0, z: -hz }), "#b45a14", 2, true);
  } else if (solidType === "pyramid_tri" || solidType === "prism_tri") {
    const R = a / Math.sqrt(3);
    const hz = h / 2;
    if (solidType === "pyramid_tri") {
      const verts = [
        { x: 0, y: 0, z: hz },
        { x: 0, y: -R, z: -hz },
        { x: -a / 2, y: R / 2, z: -hz },
        { x: a / 2, y: R / 2, z: -hz }
      ];
      const faces = [[1, 3, 2], [0, 1, 2], [0, 2, 3], [0, 3, 1]];
      renderSolidPolyhedron(verts, faces, ["S", "A", "B", "C"], color, theme);
    } else {
      const verts = [
        { x: 0, y: -R, z: -hz },
        { x: -a / 2, y: R / 2, z: -hz },
        { x: a / 2, y: R / 2, z: -hz },
        { x: 0, y: -R, z: hz },
        { x: -a / 2, y: R / 2, z: hz },
        { x: a / 2, y: R / 2, z: hz }
      ];
      const faces = [[0, 2, 1], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]];
      renderSolidPolyhedron(verts, faces, ["A", "B", "C", "A'", "B'", "C'"], color, theme);
    }
  } else if (solidType === "cone" || solidType === "cylinder") {
    const hz = h / 2;
    draw3DCircleInSpace(0, 0, -hz, 0, 0, 1, r, color, 2.2, true, true);
    const leftPt = project3D({ x: -r, y: 0, z: -hz });
    const rightPt = project3D({ x: r, y: 0, z: -hz });
    if (solidType === "cone") {
      const S = project3D({ x: 0, y: 0, z: hz });
      drawScreenSegment(S, leftPt, color, 2.4, false);
      drawScreenSegment(S, rightPt, color, 2.4, false);
      drawScreenSegment(S, project3D({ x: 0, y: 0, z: -hz }), "#b45a14", 2, true);
      drawScreenPoint(S.x, S.y, "S", color, 5.2);
    } else {
      draw3DCircleInSpace(0, 0, hz, 0, 0, 1, r, color, 2.2, false, true);
      drawScreenSegment(leftPt, project3D({ x: -r, y: 0, z: hz }), color, 2.4, false);
      drawScreenSegment(rightPt, project3D({ x: r, y: 0, z: hz }), color, 2.4, false);
    }
  }
}

function renderSolidPolyhedron(verts3D, faces, labels, color, theme) {
  const proj = verts3D.map(project3D);
  const faceData = faces.map((f) => {
    const p0 = proj[f[0]], p1 = proj[f[1]], p2 = proj[f[2]];
    const crossZ = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
    return { indices: f, isFront: crossZ < 0 };
  });

  const edgeMap = new Map();
  faceData.forEach((f) => {
    for (let i = 0; i < f.indices.length; i++) {
      const u = f.indices[i], v = f.indices[(i + 1) % f.indices.length];
      const key = u < v ? `${u}_${v}` : `${v}_${u}`;
      if (!edgeMap.has(key)) edgeMap.set(key, { u, v, vis: false });
      if (f.isFront) edgeMap.get(key).vis = true;
    }
  });

  edgeMap.forEach((e) => {
    if (!e.vis) drawScreenSegment(proj[e.u], proj[e.v], theme.muted, 1.6, true);
  });
  edgeMap.forEach((e) => {
    if (e.vis) drawScreenSegment(proj[e.u], proj[e.v], color, 2.4, false);
  });
  proj.forEach((pt, idx) => drawScreenPoint(pt.x, pt.y, labels[idx] || "", color, 4.5));
}

// ============================================================================
// 3D ARROW DRAWING & UNIFORM MOTION SIMULATION ENGINE
// ============================================================================

function draw3DArrow(from3D, to3D, color = "#c62828", width = 2.4, label = "") {
  const p1 = project3D(from3D);
  const p2 = project3D(to3D);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Draw 2D arrow head projected at p2
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len > 3) {
    const angle = Math.atan2(dy, dx);
    const headLen = 11;
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  if (label) {
    ctx.fillStyle = color;
    ctx.font = 'bold 12.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(label, p2.x + 8, p2.y - 6);
  }
  ctx.restore();
}

let lastMotionFrameTime = performance.now();
function startMotionLoop() {
  function tick(now) {
    const dt = Math.min((now - lastMotionFrameTime) / 1000, 0.1);
    lastMotionFrameTime = now;

    let hasActiveMotion = false;
    if (state.spaceMode === "3d") {
      const moving = state.objects3D.filter((o) => o.type === "line3d" && o.hasVelocity && o.isPlaying);
      let maxFlightTime = 25;
      if (moving.length >= 2 && moving[0].tMinCpa) {
        maxFlightTime = Math.max(25, Math.ceil(moving[0].tMinCpa * 1.5));
      }
      moving.forEach((obj) => {
        hasActiveMotion = true;
        if (obj.t === undefined) obj.t = 0;
        obj.t += dt * 1.0;
        if (obj.t > maxFlightTime) obj.t = 0; // seamlessly loop from 0 to maxFlightTime
        state.motionTime = obj.t;
      });
    }

    if (hasActiveMotion) {
      const timeDisp = document.getElementById("motionTimeDisplay");
      if (timeDisp) timeDisp.textContent = `t = ${(state.motionTime || 0).toFixed(1)}s`;
      drawScene();
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ============================================================================
// OBJECT EDITING & CUSTOMIZATION MODAL (TÍNH NĂNG SỬA)
// ============================================================================

function openEditModal(objId) {
  let targetObj = null;
  const list = state.spaceMode === "2d" ? state.objects2D : state.objects3D;
  if (objId) {
    targetObj = list.find((o) => o.id === objId);
  } else if (state.selectedIds.length > 0) {
    targetObj = list.find((o) => o.id === state.selectedIds[0]);
  }
  if (!targetObj && list.length > 0) {
    targetObj = list[0];
  }
  if (!targetObj) {
    alert("Không tìm thấy đối tượng nào để sửa. Hãy vẽ thêm đối tượng!");
    return;
  }

  state.editingObjectId = targetObj.id;
  const dialog = document.getElementById("editObjectDialog");
  const title = document.getElementById("editDialogTitle");
  const body = document.getElementById("editDialogBody");

  if (title) title.innerHTML = `Sửa đối tượng: <strong>${escapeHtml(targetObj.name)}</strong>`;
  if (body) body.innerHTML = renderEditDialogContent(targetObj);

  bindEditDialogDynamicEvents(targetObj);
  dialog.showModal();
}

function renderEditDialogContent(obj) {
  const vertexNamesVal =
    obj.pts && obj.pts.length > 0 ? obj.pts.map((p) => p.label || p.name || "").join(", ") : "";
  let html = `
    <div class="edit-form-group">
      <label>Tên và ký hiệu đối tượng:</label>
      <div class="edit-input-row">
        <input type="text" id="editObjName" class="edit-input-text" value="${escapeHtml(obj.name || "")}" placeholder="VD: A, B, d, (S), (α)..." />
      </div>
    </div>
    ${
      obj.pts && obj.pts.length > 0
        ? `
    <div class="edit-form-group">
      <label>Tên các đỉnh (cách nhau bằng dấu phẩy, VD: A, B, C):</label>
      <div class="edit-input-row">
        <input type="text" id="editVerticesInput" class="edit-input-text" value="${escapeHtml(vertexNamesVal)}" placeholder="VD: A, B, C" />
      </div>
    </div>`
        : ""
    }

    <div class="edit-form-group">
      <label>Màu sắc và kiểu nét:</label>
      <div class="edit-style-row">
        <div class="edit-color-picker-wrap">
          <input type="color" id="editObjColor" class="edit-color-input" value="${obj.color || "#1e64b4"}" />
          <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">Màu nét</span>
        </div>
        <select id="editObjLineWidth" class="edit-select">
          <option value="1.5" ${obj.lineWidth == 1.5 ? "selected" : ""}>Nét mảnh (1,5 pt)</option>
          <option value="2.2" ${!obj.lineWidth || obj.lineWidth == 2.2 ? "selected" : ""}>Nét chuẩn (2,2 pt)</option>
          <option value="3.0" ${obj.lineWidth == 3.0 ? "selected" : ""}>Nét đậm (3,0 pt)</option>
          <option value="4.0" ${obj.lineWidth == 4.0 ? "selected" : ""}>Nét rất đậm (4,0 pt)</option>
        </select>
        <select id="editObjDash" class="edit-select">
          <option value="solid" ${obj.dash !== "dashed" && obj.dash !== "dotted" ? "selected" : ""}>Nét liền</option>
          <option value="dashed" ${obj.dash === "dashed" ? "selected" : ""}>Nét đứt</option>
          <option value="dotted" ${obj.dash === "dotted" ? "selected" : ""}>Nét chấm</option>
        </select>
      </div>
    </div>
  `;

  // Type Specific Parameters
  if (obj.type === "point2d") {
    html += `
      <div class="edit-form-group">
        <label>Tọa độ điểm Oxy (x, y):</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>x =</span><input type="number" id="editPtX" step="0.1" value="${obj.x ?? 0}" /></div>
          <div class="edit-coord-item"><span>y =</span><input type="number" id="editPtY" step="0.1" value="${obj.y ?? 0}" /></div>
          <div class="edit-coord-item"><span>Bán kính:</span><input type="number" id="editPtR" step="0.5" value="${obj.radius ?? 5}" /></div>
        </div>
      </div>
    `;
  } else if (obj.type === "segment2d" || obj.type === "line2d") {
    html += `
      <div class="edit-form-group">
        <label>Tọa độ 2 đầu mút / điểm qua:</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>x₁ =</span><input type="number" id="editX1" step="0.1" value="${obj.x1 ?? 0}" /></div>
          <div class="edit-coord-item"><span>y₁ =</span><input type="number" id="editY1" step="0.1" value="${obj.y1 ?? 0}" /></div>
          <div class="edit-coord-item"><span>x₂ =</span><input type="number" id="editX2" step="0.1" value="${obj.x2 ?? 1}" /></div>
          <div class="edit-coord-item"><span>y₂ =</span><input type="number" id="editY2" step="0.1" value="${obj.y2 ?? 1}" /></div>
        </div>
      </div>
    `;
  } else if (obj.type === "circle2d") {
    html += `
      <div class="edit-form-group">
        <label>Tâm I(x, y) &amp; Bán kính R:</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>x =</span><input type="number" id="editCircX" step="0.1" value="${obj.cx ?? 0}" /></div>
          <div class="edit-coord-item"><span>y =</span><input type="number" id="editCircY" step="0.1" value="${obj.cy ?? 0}" /></div>
          <div class="edit-coord-item"><span>R =</span><input type="number" id="editCircR" step="0.1" min="0.1" value="${obj.r ?? 3}" /></div>
        </div>
      </div>
    `;
  } else if (obj.type === "polygon2d") {
    html += `
      <div class="edit-form-group">
        <label>Tọa độ các đỉnh đa giác (${(obj.pts || []).length} đỉnh):</label>
        <div class="edit-coord-grid">
          ${(obj.pts || [])
            .map(
              (p, i) => `
            <div class="edit-coord-item" style="grid-column: span 1;">
              <span>${escapeHtml(p.name || "P" + (i + 1))}:</span>
              <input type="number" class="edit-poly-pt" data-idx="${i}" data-coord="x" step="0.1" value="${p.x}" style="width:45px;" />
              <span style="margin:0 2px;">,</span>
              <input type="number" class="edit-poly-pt" data-idx="${i}" data-coord="y" step="0.1" value="${p.y}" style="width:45px;" />
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  } else if (obj.type === "function2d") {
    html += `
      <div class="edit-form-group">
        <label>Biểu thức hàm số y = f(x):</label>
        <input type="text" id="editFuncExpr" class="edit-input-text" value="${escapeHtml(obj.expr || "x^3 - 3*x")}" placeholder="VD: x^3 - 3*x + 1, sin(x), (2*x-1)/(x+1)..." />
      </div>
    `;
  } else if (obj.type === "point3d") {
    html += `
      <div class="edit-form-group">
        <label>Tọa độ điểm Oxyz (x, y, z):</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>x =</span><input type="number" id="editPt3X" step="0.1" value="${obj.x ?? 0}" /></div>
          <div class="edit-coord-item"><span>y =</span><input type="number" id="editPt3Y" step="0.1" value="${obj.y ?? 0}" /></div>
          <div class="edit-coord-item"><span>z =</span><input type="number" id="editPt3Z" step="0.1" value="${obj.z ?? 0}" /></div>
        </div>
      </div>
    `;
  } else if (obj.type === "line3d") {
    const spd = Math.sqrt((obj.vx || 0) ** 2 + (obj.vy || 0) ** 2 + (obj.vz || 0) ** 2);
    html += `
      <div class="edit-form-group">
        <label>Điểm đi qua M₀(x₀, y₀, z₀):</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>x₀ =</span><input type="number" id="editL3X0" step="0.1" value="${obj.x0 ?? 0}" /></div>
          <div class="edit-coord-item"><span>y₀ =</span><input type="number" id="editL3Y0" step="0.1" value="${obj.y0 ?? 0}" /></div>
          <div class="edit-coord-item"><span>z₀ =</span><input type="number" id="editL3Z0" step="0.1" value="${obj.z0 ?? 0}" /></div>
        </div>
      </div>
      <div class="edit-form-group">
        <label>Vectơ chỉ phương u⃗(u_x, u_y, u_z):</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>u_x =</span><input type="number" id="editL3Ux" step="0.1" value="${obj.ux ?? 1}" /></div>
          <div class="edit-coord-item"><span>u_y =</span><input type="number" id="editL3Uy" step="0.1" value="${obj.uy ?? 0}" /></div>
          <div class="edit-coord-item"><span>u_z =</span><input type="number" id="editL3Uz" step="0.1" value="${obj.uz ?? 0}" /></div>
        </div>
      </div>

      <!-- Velocity & Uniform Motion in Oxyz -->
      <div class="edit-velocity-card">
        <div class="edit-velocity-header">
          <strong>🚀 Chuyển Động Thẳng Đều &amp; Vectơ Vận Tốc v⃗:</strong>
          <span class="velocity-speed-tag" id="editLiveSpeedTag">|v⃗| = ${spd.toFixed(2)} đơn vị/s</span>
        </div>
        <div style="margin-bottom:0.5rem;">
          <label style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.82rem; font-weight:600; cursor:pointer;">
            <input type="checkbox" id="editHasVelocity" ${obj.hasVelocity ? "checked" : ""} />
            Kích hoạt chuyển động và hiển thị vectơ vận tốc
          </label>
        </div>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>v_x =</span><input type="number" id="editL3Vx" step="0.1" value="${obj.vx ?? 1.5}" /></div>
          <div class="edit-coord-item"><span>v_y =</span><input type="number" id="editL3Vy" step="0.1" value="${obj.vy ?? 1.0}" /></div>
          <div class="edit-coord-item"><span>v_z =</span><input type="number" id="editL3Vz" step="0.1" value="${obj.vz ?? 0.5}" /></div>
        </div>
      </div>
    `;
  } else if (obj.type === "sphere3d") {
    html += `
      <div class="edit-form-group">
        <label>Tâm mặt cầu I(x, y, z) &amp; Bán kính R:</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>x =</span><input type="number" id="editSphX" step="0.1" value="${obj.cx ?? 0}" /></div>
          <div class="edit-coord-item"><span>y =</span><input type="number" id="editSphY" step="0.1" value="${obj.cy ?? 0}" /></div>
          <div class="edit-coord-item"><span>z =</span><input type="number" id="editSphZ" step="0.1" value="${obj.cz ?? 0}" /></div>
          <div class="edit-coord-item"><span>R =</span><input type="number" id="editSphR" step="0.1" min="0.1" value="${obj.r ?? 3}" /></div>
        </div>
      </div>
    `;
  } else if (obj.type === "plane3d") {
    html += `
      <div class="edit-form-group">
        <label>Phương trình tổng quát Ax + By + Cz + D = 0:</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>A =</span><input type="number" id="editPlnA" step="0.1" value="${obj.a ?? 1}" /></div>
          <div class="edit-coord-item"><span>B =</span><input type="number" id="editPlnB" step="0.1" value="${obj.b ?? 1}" /></div>
          <div class="edit-coord-item"><span>C =</span><input type="number" id="editPlnC" step="0.1" value="${obj.c ?? 1}" /></div>
          <div class="edit-coord-item"><span>D =</span><input type="number" id="editPlnD" step="0.1" value="${obj.d ?? 0}" /></div>
        </div>
      </div>
    `;
  } else if (obj.type === "surface3d") {
    html += `
      <div class="edit-form-group">
        <label>Phương trình mặt cong z = f(x, y):</label>
        <input type="text" id="editSurfExpr" class="edit-input-text" value="${obj.expr || "sin(x)*cos(y)"}" />
      </div>
    `;
  } else if (obj.type === "solid3d") {
    html += `
      <div class="edit-form-group">
        <label>Kích thước khối hình học 3D (${obj.solidType}):</label>
        <div class="edit-coord-grid">
          <div class="edit-coord-item"><span>Cạnh đáy a:</span><input type="number" id="editSolidA" step="0.2" value="${obj.a ?? 3}" /></div>
          <div class="edit-coord-item"><span>Chiều cao h:</span><input type="number" id="editSolidH" step="0.2" value="${obj.h ?? 3}" /></div>
          ${obj.r ? `<div class="edit-coord-item"><span>Bán kính r:</span><input type="number" id="editSolidR" step="0.2" value="${obj.r}" /></div>` : ""}
        </div>
      </div>
    `;
  }

  return html;
}

function bindEditDialogDynamicEvents(obj) {
  // Live speed display listener when modifying vx, vy, vz
  if (obj.type === "line3d") {
    const vxIn = document.getElementById("editL3Vx");
    const vyIn = document.getElementById("editL3Vy");
    const vzIn = document.getElementById("editL3Vz");
    const speedTag = document.getElementById("editLiveSpeedTag");

    const updateSpeed = () => {
      const vx = parseFloat(vxIn.value) || 0;
      const vy = parseFloat(vyIn.value) || 0;
      const vz = parseFloat(vzIn.value) || 0;
      const spd = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (speedTag) speedTag.textContent = `|v⃗| = ${spd.toFixed(2)} đơn vị/s`;
    };

    if (vxIn) vxIn.addEventListener("input", updateSpeed);
    if (vyIn) vyIn.addEventListener("input", updateSpeed);
    if (vzIn) vzIn.addEventListener("input", updateSpeed);
  }
}

function saveEditModalChanges() {
  const targetId = state.editingObjectId;
  const list = state.spaceMode === "2d" ? state.objects2D : state.objects3D;
  const obj = list.find((o) => o.id === targetId);
  if (!obj) return;

  saveHistory();

  // Basic properties
  const nameIn = document.getElementById("editObjName");
  if (nameIn && nameIn.value.trim()) obj.name = nameIn.value.trim();

  const vertIn = document.getElementById("editVerticesInput");
  if (vertIn && obj.pts && obj.pts.length > 0) {
    const newNames = vertIn.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    obj.pts.forEach((pt, idx) => {
      if (newNames[idx]) {
        pt.label = newNames[idx];
        pt.name = newNames[idx];
      }
    });
  }

  const colorIn = document.getElementById("editObjColor");
  if (colorIn) obj.color = colorIn.value;

  const widthIn = document.getElementById("editObjLineWidth");
  if (widthIn) obj.lineWidth = parseFloat(widthIn.value);

  const dashIn = document.getElementById("editObjDash");
  if (dashIn) obj.dash = dashIn.value;

  // Type-specific properties
  if (obj.type === "point2d") {
    const xIn = document.getElementById("editPtX");
    const yIn = document.getElementById("editPtY");
    const rIn = document.getElementById("editPtR");
    if (xIn) obj.x = parseFloat(xIn.value) || 0;
    if (yIn) obj.y = parseFloat(yIn.value) || 0;
    if (rIn) obj.radius = parseFloat(rIn.value) || 5;
  } else if (obj.type === "segment2d" || obj.type === "line2d") {
    const x1 = document.getElementById("editX1");
    const y1 = document.getElementById("editY1");
    const x2 = document.getElementById("editX2");
    const y2 = document.getElementById("editY2");
    if (x1) obj.x1 = parseFloat(x1.value) || 0;
    if (y1) obj.y1 = parseFloat(y1.value) || 0;
    if (x2) obj.x2 = parseFloat(x2.value) || 0;
    if (y2) obj.y2 = parseFloat(y2.value) || 0;
  } else if (obj.type === "circle2d") {
    const cx = document.getElementById("editCircX");
    const cy = document.getElementById("editCircY");
    const r = document.getElementById("editCircR");
    if (cx) obj.cx = parseFloat(cx.value) || 0;
    if (cy) obj.cy = parseFloat(cy.value) || 0;
    if (r) obj.r = Math.max(0.1, parseFloat(r.value) || 1);
  } else if (obj.type === "polygon2d") {
    const ptInputs = document.querySelectorAll(".edit-poly-pt");
    ptInputs.forEach((input) => {
      const idx = parseInt(input.dataset.idx, 10);
      const coord = input.dataset.coord;
      if (obj.pts[idx]) {
        obj.pts[idx][coord] = parseFloat(input.value) || 0;
      }
    });
  } else if (obj.type === "function2d") {
    const exprIn = document.getElementById("editFuncExpr");
    if (exprIn) obj.expr = exprIn.value.trim();
  } else if (obj.type === "point3d") {
    const x = document.getElementById("editPt3X");
    const y = document.getElementById("editPt3Y");
    const z = document.getElementById("editPt3Z");
    if (x) obj.x = parseFloat(x.value) || 0;
    if (y) obj.y = parseFloat(y.value) || 0;
    if (z) obj.z = parseFloat(z.value) || 0;
  } else if (obj.type === "line3d") {
    const x0 = document.getElementById("editL3X0");
    const y0 = document.getElementById("editL3Y0");
    const z0 = document.getElementById("editL3Z0");
    const ux = document.getElementById("editL3Ux");
    const uy = document.getElementById("editL3Uy");
    const uz = document.getElementById("editL3Uz");
    if (x0) obj.x0 = parseFloat(x0.value) || 0;
    if (y0) obj.y0 = parseFloat(y0.value) || 0;
    if (z0) obj.z0 = parseFloat(z0.value) || 0;
    if (ux) obj.ux = parseFloat(ux.value) || 0;
    if (uy) obj.uy = parseFloat(uy.value) || 0;
    if (uz) obj.uz = parseFloat(uz.value) || 0;

    const hasVelIn = document.getElementById("editHasVelocity");
    const vxIn = document.getElementById("editL3Vx");
    const vyIn = document.getElementById("editL3Vy");
    const vzIn = document.getElementById("editL3Vz");
    if (hasVelIn) obj.hasVelocity = hasVelIn.checked;
    if (vxIn) obj.vx = parseFloat(vxIn.value) || 0;
    if (vyIn) obj.vy = parseFloat(vyIn.value) || 0;
    if (vzIn) obj.vz = parseFloat(vzIn.value) || 0;
    if (obj.hasVelocity) {
      obj.isPlaying = true;
      if (obj.t === undefined) obj.t = 0;
      obj.equationText = `r⃗(t) = (${obj.x0};${obj.y0};${obj.z0}) + (${obj.vx};${obj.vy};${obj.vz})t`;
    }
  } else if (obj.type === "sphere3d") {
    const cx = document.getElementById("editSphX");
    const cy = document.getElementById("editSphY");
    const cz = document.getElementById("editSphZ");
    const r = document.getElementById("editSphR");
    if (cx) obj.cx = parseFloat(cx.value) || 0;
    if (cy) obj.cy = parseFloat(cy.value) || 0;
    if (cz) obj.cz = parseFloat(cz.value) || 0;
    if (r) obj.r = Math.max(0.1, parseFloat(r.value) || 1);
  } else if (obj.type === "plane3d") {
    const a = document.getElementById("editPlnA");
    const b = document.getElementById("editPlnB");
    const c = document.getElementById("editPlnC");
    const d = document.getElementById("editPlnD");
    if (a) obj.a = parseFloat(a.value) || 0;
    if (b) obj.b = parseFloat(b.value) || 0;
    if (c) obj.c = parseFloat(c.value) || 0;
    if (d) obj.d = parseFloat(d.value) || 0;
  } else if (obj.type === "surface3d") {
    const exprIn = document.getElementById("editSurfExpr");
    if (exprIn) obj.expr = exprIn.value.trim();
  } else if (obj.type === "solid3d") {
    const a = document.getElementById("editSolidA");
    const h = document.getElementById("editSolidH");
    const r = document.getElementById("editSolidR");
    if (a) obj.a = parseFloat(a.value) || 3;
    if (h) obj.h = parseFloat(h.value) || 3;
    if (r) obj.r = parseFloat(r.value) || 2;
  }

  document.getElementById("editObjectDialog").close();
  refreshAllUI();
}

function duplicateSelectedObject() {
  const targetId = state.editingObjectId || state.selectedIds[0];
  const list = state.spaceMode === "2d" ? state.objects2D : state.objects3D;
  const obj = list.find((o) => o.id === targetId);
  if (!obj) return;

  saveHistory();
  const clone = cloneDeep(obj);
  clone.id = genId(obj.type.slice(0, 3));
  clone.name = `${obj.name}'`;

  // Apply slight offset to coordinates
  if (clone.x !== undefined) clone.x += 0.8;
  if (clone.y !== undefined) clone.y += 0.8;
  if (clone.x0 !== undefined) clone.x0 += 0.8;
  if (clone.y0 !== undefined) clone.y0 += 0.8;
  if (clone.x1 !== undefined) {
    clone.x1 += 0.8;
    clone.x2 += 0.8;
    clone.y1 += 0.8;
    clone.y2 += 0.8;
  }
  if (clone.cx !== undefined) {
    clone.cx += 0.8;
    clone.cy += 0.8;
  }
  if (clone.pts) {
    clone.pts.forEach((p) => {
      p.x += 0.8;
      p.y += 0.8;
      p.name = `${p.name}'`;
    });
  }

  list.push(clone);
  state.selectedIds = [clone.id];
  refreshAllUI();
}

// ============================================================================
// AUTOMATIC PERSISTENCE & LOCALSTORAGE ENGINE (MULTI-TAB SYNC & SILENT DRAFT)
// ============================================================================

function sanitizeObjectForWorkspace(obj) {
  if (!obj || typeof obj !== "object") return null;
  const clean = { ...obj };
  if (clean.name) clean.name = String(clean.name).replace(/<[^>]*>/g, "").trim().slice(0, 100);
  if (clean.expr) clean.expr = String(clean.expr).replace(/<[^>]*>/g, "").trim().slice(0, 500);
  if (clean.equationText) clean.equationText = String(clean.equationText).replace(/<[^>]*>/g, "").trim().slice(0, 500);
  if (clean.label) clean.label = String(clean.label).replace(/<[^>]*>/g, "").trim().slice(0, 100);
  if (Array.isArray(clean.pts)) {
    clean.pts = clean.pts.map((p) => ({
      ...p,
      name: p.name ? String(p.name).replace(/<[^>]*>/g, "").slice(0, 50) : undefined,
      label: p.label ? String(p.label).replace(/<[^>]*>/g, "").slice(0, 50) : undefined
    }));
  }
  return clean;
}

function initAutoSaveEngine() {
  // Trigger periodic auto-save every 10 seconds (10000 ms)
  setInterval(() => {
    runAutoSaveCycle();
  }, 10000);

  // Multi-tab synchronization (BUG-05)
  window.addEventListener("storage", (e) => {
    if (e.key === "pmath_studio_workspace" && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        // If our current tab has unsaved changes, don't blindly clobber
        if (state.isDirty) return;
        if (data.objects2D && Array.isArray(data.objects2D)) {
          state.objects2D = data.objects2D.map(sanitizeObjectForWorkspace).filter(Boolean);
        }
        if (data.objects3D && Array.isArray(data.objects3D)) {
          state.objects3D = data.objects3D.map(sanitizeObjectForWorkspace).filter(Boolean);
        }
        if (data.cam3D) state.cam3D = { ...state.cam3D, ...data.cam3D };
        if (data.view2D) state.view2D = { ...state.view2D, ...data.view2D };
        state.lastLoadedAt = Date.now();
        refreshAllUI();
        drawScene();
      } catch (err) {
        console.warn("Storage sync error:", err);
      }
    }
  });
}

function runAutoSaveCycle() {
  // 1. Auto-save studio workspace to localStorage only if modified (BUG-05)
  if (state.isDirty) {
    saveStudioWorkspaceToLocalStorage();
    state.isDirty = false;
  }

  // 2. Silent draft auto-save without synthetic Ctrl+S disruption (BUG-06)
  triggerNoteRendererSilentDraft();

  // 3. Update top indicator badge
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  state.lastAutoSavedAt = timeStr;

  const text = document.getElementById("autoSaveText");
  const badge = document.getElementById("autoSaveBadge");
  if (text) text.textContent = `Đã lưu lúc ${timeStr}`;
  if (badge) {
    badge.classList.add("saving");
    setTimeout(() => badge.classList.remove("saving"), 1400);
  }
}

function triggerNoteRendererSilentDraft() {
  // DO NOT dispatch synthetic Ctrl+S which disrupts the user by popping open the save modal!
  try {
    const rawActive = localStorage.getItem("pmath_active_notebook");
    if (rawActive) {
      localStorage.setItem("pmath_notebook_autosave_draft", rawActive);
    }
  } catch (err) {}
}

function saveStudioWorkspaceToLocalStorage() {
  try {
    const payload = {
      version: "2.1",
      savedAt: Date.now(),
      spaceMode: state.spaceMode,
      objects2D: state.objects2D.map(sanitizeObjectForWorkspace).filter(Boolean),
      objects3D: state.objects3D.map(sanitizeObjectForWorkspace).filter(Boolean),
      cam3D: state.cam3D,
      view2D: state.view2D
    };
    localStorage.setItem("pmath_studio_workspace", JSON.stringify(payload));
    state.lastLoadedAt = payload.savedAt;
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
  }
}

function restoreStudioWorkspace() {
  try {
    const raw = localStorage.getItem("pmath_studio_workspace");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.objects2D && Array.isArray(data.objects2D)) {
      state.objects2D = data.objects2D.map(sanitizeObjectForWorkspace).filter(Boolean);
    }
    if (data.objects3D && Array.isArray(data.objects3D)) {
      state.objects3D = data.objects3D.map(sanitizeObjectForWorkspace).filter(Boolean);
    }
    if (data.cam3D) state.cam3D = { ...state.cam3D, ...data.cam3D };
    if (data.view2D) state.view2D = { ...state.view2D, ...data.view2D };
    state.lastLoadedAt = Date.now();
  } catch (err) {
    console.warn("Failed to restore studio workspace:", err);
  }
}

// ============================================================================
// HARD DRIVE STORAGE LOCATION & DATA BACKUP ENGINE
// ============================================================================

function initStorageLocationEvents() {
  const openBtn = document.getElementById("openStorageLocationBtn");
  const dialog = document.getElementById("storageLocationDialog");
  const closeBtn = document.getElementById("closeStorageDialogBtn");
  const closeBtmBtn = document.getElementById("closeStorageDialogBottomBtn");

  if (openBtn && dialog) {
    openBtn.addEventListener("click", () => {
      renderStorageStatsList();
      dialog.showModal();
    });
  }
  if (closeBtn && dialog) closeBtn.addEventListener("click", () => dialog.close());
  if (closeBtmBtn && dialog) closeBtmBtn.addEventListener("click", () => dialog.close());

  // Copy path buttons
  document.querySelectorAll(".btn-copy-path").forEach((btn) => {
    btn.addEventListener("click", () => {
      const textToCopy = btn.dataset.copy;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const original = btn.textContent;
          btn.textContent = "✓ Đã copy!";
          btn.style.background = "var(--defcolor)";
          btn.style.color = "#ffffff";
          setTimeout(() => {
            btn.textContent = original;
            btn.style.background = "";
            btn.style.color = "";
          }, 1800);
        });
      }
    });
  });

  // Refresh stats
  const refreshBtn = document.getElementById("refreshStorageStatsBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", () => renderStorageStatsList());

  // Export to disk
  const exportBtn = document.getElementById("exportAllStorageBtn");
  if (exportBtn) exportBtn.addEventListener("click", () => exportAllDataToDisk());

  // Import from disk
  const importInput = document.getElementById("importStorageFileInput");
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importDataFromDisk(file);
    });
  }
}

async function getIndexedDbFiles() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open("noterenderer-library", 1);
      req.onerror = () => resolve([]);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("files")) {
          resolve([]);
          return;
        }
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => resolve(getAllReq.result || []);
        getAllReq.onerror = () => resolve([]);
      };
    } catch {
      resolve([]);
    }
  });
}

async function renderStorageStatsList() {
  const container = document.getElementById("storageFilesList");
  if (!container) return;

  container.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">Đang tải danh sách từ IndexedDB...</div>`;

  const files = await getIndexedDbFiles();
  let html = "";

  // NoteRenderer files
  if (files.length > 0) {
    files.forEach((f) => {
      const sizeKb = f.bytes ? (f.bytes.byteLength / 1024).toFixed(1) : "0.0";
      const mod = f.modified ? new Date(f.modified).toLocaleDateString("vi-VN") : "Gần đây";
      html += `
        <div class="storage-file-row">
          <div class="storage-file-info">
            <span>📒</span>
            <span class="storage-file-name">${f.name || "Sổ tay"}</span>
            <span class="storage-file-dir">${f.dir ? f.dir : "Thư mục gốc"}</span>
          </div>
          <div class="storage-file-meta">${sizeKb} KB • ${mod}</div>
        </div>
      `;
    });
  } else {
    html += `
      <div class="storage-file-row" style="color:var(--text-muted); justify-content:center;">
        Chưa có tệp sổ tay nào trong cơ sở dữ liệu IndexedDB (bạn có thể tạo ghi chú ở tab Sổ Tay).
      </div>
    `;
  }

  // Also include 2D/3D Studio Workspace info
  const studioCount = state.objects2D.length + state.objects3D.length;
  html += `
    <div class="storage-file-row" style="background:rgba(30,100,180,0.06);">
      <div class="storage-file-info">
        <span>📐</span>
        <span class="storage-file-name">Phòng thí nghiệm hình học &amp; phương trình (Studio Workspace)</span>
        <span class="storage-file-dir">LocalStorage</span>
      </div>
      <div class="storage-file-meta">${studioCount} đối tượng đang vẽ • Tự động lưu 10s</div>
    </div>
  `;

  container.innerHTML = html;
}

async function exportAllDataToDisk() {
  const msgEl = document.getElementById("storageActionMsg");
  try {
    const idbFiles = await getIndexedDbFiles();
    const studioRaw = localStorage.getItem("pmath_studio_workspace");
    const backupObj = {
      generator: "PMATH EDUCATION TOOLS",
      exportDate: new Date().toISOString(),
      indexedDbFiles: idbFiles,
      studioWorkspace: studioRaw ? JSON.parse(studioRaw) : null,
      currentStudioState: {
        spaceMode: state.spaceMode,
        objects2D: state.objects2D,
        objects3D: state.objects3D
      }
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const dateTag = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    a.href = url;
    a.download = `pmath_notes_and_studio_backup_${dateTag}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    if (msgEl) {
      msgEl.style.display = "block";
      msgEl.style.color = "var(--defcolor)";
      msgEl.textContent = `✓ Đã xuất thành công toàn bộ dữ liệu ra tệp: pmath_notes_and_studio_backup_${dateTag}.json!`;
    }
  } catch (err) {
    if (msgEl) {
      msgEl.style.display = "block";
      msgEl.style.color = "var(--danger)";
      msgEl.textContent = `Lỗi khi xuất dữ liệu: ${err.message}`;
    }
  }
}

async function importDataFromDisk(file) {
  const msgEl = document.getElementById("storageActionMsg");
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    let restoredFilesCount = 0;
    if (backup.indexedDbFiles && Array.isArray(backup.indexedDbFiles)) {
      await new Promise((resolve, reject) => {
        const req = indexedDB.open("noterenderer-library", 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("files", "readwrite");
          const store = tx.objectStore("files");
          backup.indexedDbFiles.forEach((item) => {
            const key = `${item.dir || ""}/${item.name}`;
            store.put(item, key);
            restoredFilesCount++;
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      });
    }

    if (backup.studioWorkspace) {
      if (backup.studioWorkspace.objects2D && Array.isArray(backup.studioWorkspace.objects2D)) {
        backup.studioWorkspace.objects2D = backup.studioWorkspace.objects2D.map(sanitizeObjectForWorkspace).filter(Boolean);
      }
      if (backup.studioWorkspace.objects3D && Array.isArray(backup.studioWorkspace.objects3D)) {
        backup.studioWorkspace.objects3D = backup.studioWorkspace.objects3D.map(sanitizeObjectForWorkspace).filter(Boolean);
      }
      localStorage.setItem("pmath_studio_workspace", JSON.stringify(backup.studioWorkspace));
      restoreStudioWorkspace();
      refreshAllUI();
    }

    renderStorageStatsList();

    if (msgEl) {
      msgEl.style.display = "block";
      msgEl.style.color = "var(--defcolor)";
      msgEl.textContent = `✓ Khôi phục thành công! Đã nạp lại ${restoredFilesCount} sổ tay vào IndexedDB và phục hồi Studio.`;
    }
  } catch (err) {
    if (msgEl) {
      msgEl.style.display = "block";
      msgEl.style.color = "var(--danger)";
      msgEl.textContent = `Lỗi khi nhập dữ liệu: ${err.message}`;
    }
  }
}

// ============================================================================
// IPAD & APPLE PENCIL GUARD (PALM REJECTION, ANTI-SELECTION & LOW-LATENCY INK)
// ============================================================================

function initApplePencilAndTouchGuard() {
  // Default Apple Pencil Guard to ON (or restore user's choice)
  const savedGuard = localStorage.getItem("pmath_pencil_guard_v1");
  window.pmathPencilGuardActive = savedGuard !== "off";

  const syncNoteRendererPenPrefs = (penOnly) => {
    try {
      const raw = localStorage.getItem("prefs");
      const prefs = raw ? JSON.parse(raw) : {};
      if (penOnly) {
        // On iPad/Apple Pencil mode: finger scrolls/pans, only stylus draws (unless user explicitly turns off guard)
        prefs.fingerDraw = false;
        prefs.inputMode = "auto";
      } else {
        prefs.fingerDraw = true;
        prefs.inputMode = "both";
      }
      localStorage.setItem("prefs", JSON.stringify(prefs));
    } catch {}
  };

  // Pre-seed NoteRenderer prefs if not explicitly set yet so first load on iPad has palm rejection ready
  try {
    const raw = localStorage.getItem("prefs");
    const prefs = raw ? JSON.parse(raw) : {};
    if (window.pmathPencilGuardActive && prefs.fingerDraw === undefined) {
      prefs.fingerDraw = false;
      prefs.inputMode = "auto";
      localStorage.setItem("prefs", JSON.stringify(prefs));
    }
  } catch {}

  const guardBtn = document.getElementById("togglePencilGuardBtn");
  const guardTitleEl = document.getElementById("pencilGuardMenuTitle");
  const updateGuardBtnUI = () => {
    if (!guardBtn) return;
    if (window.pmathPencilGuardActive) {
      guardBtn.classList.add("active");
      if (guardTitleEl) guardTitleEl.textContent = "Chống tỳ tay khi viết bút: Đang bật";
      else guardBtn.textContent = "Chống tỳ tay khi viết bút: Đang bật";
      guardBtn.title = "Đang bật chống tỳ tay và khóa bôi đen chữ khi viết bằng Apple Pencil (Bấm để chuyển sang vẽ bằng cả ngón tay)";
    } else {
      guardBtn.classList.remove("active");
      if (guardTitleEl) guardTitleEl.textContent = "Chống tỳ tay khi viết bút: Đang tắt";
      else guardBtn.textContent = "Chống tỳ tay khi viết bút: Đang tắt";
      guardBtn.title = "Đang cho phép vẽ bằng cả ngón tay và bút (Bấm để bật lại chế độ chống tỳ tay Apple Pencil)";
    }
  };
  updateGuardBtnUI();

  if (guardBtn) {
    guardBtn.addEventListener("click", () => {
      window.pmathPencilGuardActive = !window.pmathPencilGuardActive;
      localStorage.setItem("pmath_pencil_guard_v1", window.pmathPencilGuardActive ? "on" : "off");
      syncNoteRendererPenPrefs(window.pmathPencilGuardActive);
      updateGuardBtnUI();
      if (typeof showToast === "function") {
        showToast(
          window.pmathPencilGuardActive
            ? "Đã bật chế độ chống tỳ tay Apple Pencil: Khóa bôi đen chữ và dùng ngón tay để cuộn!"
            : "Đã chuyển sang chế độ vẽ bằng cả ngón tay và bút!"
        );
      }
    });
  }

  let isPenCurrentlyDown = false;
  let lastPenActiveTime = 0;

  const isEditableElement = (el) => {
    if (!el || typeof el.closest !== "function") return false;
    return Boolean(
      el.closest('input, textarea, select, [contenteditable="true"], .text-box, .ML__content, .fh-editor-panel, .kh-editor-card')
    );
  };

  const isInsideDrawingWorkspace = (el) => {
    if (!el || typeof el.closest !== "function") return false;
    return Boolean(
      el.closest("#root, #geolabView, .board, .board-scroller, #geoCanvas, .canvas-viewport, .pmath-global-bar")
    );
  };

  // 1. Capture pointerdown/move/up to track Apple Pencil state & clear any stray text selection immediately
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "pen") {
        isPenCurrentlyDown = true;
        lastPenActiveTime = performance.now();

        if (!isEditableElement(e.target)) {
          // Blur any active text input if user starts writing on canvas with Apple Pencil
          if (
            document.activeElement &&
            (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") &&
            isInsideDrawingWorkspace(e.target)
          ) {
            document.activeElement.blur();
          }
          // Clear any existing DOM text highlight immediately
          try {
            const sel = window.getSelection && window.getSelection();
            if (sel && sel.rangeCount > 0) sel.removeAllRanges();
          } catch {}
        }
      } else if (e.pointerType === "touch" && window.pmathPencilGuardActive) {
        // Palm Rejection: If palm touches screen while Apple Pencil is down or within 750ms of lifting pen
        if (isPenCurrentlyDown || performance.now() - lastPenActiveTime < 750) {
          if (e.target && e.target.closest && e.target.closest(".board-scroller, #geoCanvas, .canvas-viewport")) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
          }
        }
      }
    },
    { capture: true, passive: false }
  );

  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "pen") {
        lastPenActiveTime = performance.now();
        if (isPenCurrentlyDown && !isEditableElement(e.target)) {
          try {
            const sel = window.getSelection && window.getSelection();
            if (sel && sel.rangeCount > 0) sel.removeAllRanges();
          } catch {}
        }
      }
    },
    { capture: true, passive: true }
  );

  const handlePointerEnd = (e) => {
    if (e.pointerType === "pen") {
      isPenCurrentlyDown = false;
      lastPenActiveTime = performance.now();
    }
  };
  window.addEventListener("pointerup", handlePointerEnd, { capture: true, passive: true });
  window.addEventListener("pointercancel", handlePointerEnd, { capture: true, passive: true });

  // 2. Block 'selectstart' (the root cause of text highlighting when dragging Apple Pencil on iPad Safari)
  document.addEventListener(
    "selectstart",
    (e) => {
      if (isEditableElement(e.target)) return;
      if (
        document.body.classList.contains("in-canvas-mode") ||
        isPenCurrentlyDown ||
        performance.now() - lastPenActiveTime < 1200 ||
        isInsideDrawingWorkspace(e.target)
      ) {
        e.preventDefault();
      }
    },
    { capture: true, passive: false }
  );

  // 3. Secondary defense on 'selectionchange': if Safari still creates a selection range while writing on canvas, wipe it
  document.addEventListener("selectionchange", () => {
    if (!isPenCurrentlyDown && performance.now() - lastPenActiveTime > 900) return;
    const active = document.activeElement;
    if (isEditableElement(active)) return;
    if (document.body.classList.contains("in-canvas-mode")) {
      try {
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.rangeCount > 0) sel.removeAllRanges();
      } catch {}
    }
  });

  // 4. Block native HTML dragstart & iOS long-press contextmenu callout on canvas/toolbars
  document.addEventListener(
    "dragstart",
    (e) => {
      if (!isEditableElement(e.target) && isInsideDrawingWorkspace(e.target)) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  document.addEventListener(
    "contextmenu",
    (e) => {
      if (
        !isEditableElement(e.target) &&
        (document.body.classList.contains("in-canvas-mode") || isPenCurrentlyDown)
      ) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  // 5. Prevent accidental iOS Safari whole-page pinch zoom when inside full-screen Canvas modes
  document.addEventListener(
    "gesturestart",
    (e) => {
      if (document.body.classList.contains("in-canvas-mode")) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

window.addEventListener("DOMContentLoaded", initApp);
