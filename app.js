// ============================================================================
// PMATH EDUCATION TOOLS — Multi-Object 2D/3D CAD, Equation & Interaction Engine
// Đồng bộ thiết kế & bảng màu chuẩn Template_PMATH.tex (v2.1)
// ============================================================================

const COLORS_PALETTE = ["#1e64b4", "#148250", "#008c96", "#b45a14", "#6a1b9a", "#c62828"];

const state = {
  spaceMode: "2d", // "2d" | "3d"
  searchQuery: "",
  sidebarTab: "scene", // "scene" | "library"
  libraryFilter: "all", // "all" | "2d" | "3d" | "special" | "motion"
  knowledgeOpen: false, // Right drawer is closed by default to maximize canvas space
  activeKnowledgeId: "triangle",
  activeInfoTab: "interactions", // "interactions" | "theory" | "practice"

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
  quiz: null
};

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
  const { yaw, pitch, zoom, panX, panY } = state.cam3D;
  const scale = 34 * zoom;

  // Rotate in XY plane by yaw
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = pt3.x * cosY - pt3.y * sinY;
  const y1 = pt3.x * sinY + pt3.y * cosY;
  const z1 = pt3.z;

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
    saveHistory();
    if (state.spaceMode === "2d") state.objects2D = [];
    else state.objects3D = [];
    state.selectedIds = [];
    refreshAllUI();
  });

  // CAD Toolbar Buttons
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);
  document.getElementById("copyBtn").addEventListener("click", copySelected);
  document.getElementById("pasteBtn").addEventListener("click", pasteClipboard);
  document.getElementById("editObjBtn").addEventListener("click", () => openEditModal());
  document.getElementById("renameBtn").addEventListener("click", openRenameModal);
  document.getElementById("toggleVisBtn").addEventListener("click", toggleSelectedVisibility);
  document.getElementById("deleteBtn").addEventListener("click", deleteSelected);
  document.getElementById("zoomFitBtn").addEventListener("click", zoomToFit);

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

  // Knowledge Panel Drawer Toggle (On-Demand Reference)
  const bindKnowledgeToggle = (btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener("click", () => toggleKnowledgeDrawer());
  };
  bindKnowledgeToggle("toggleKnowledgeBtn");
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
  themeBtn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "light");
      themeBtn.textContent = "🌙 Giao diện Tối";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      themeBtn.textContent = "☀️ Giao diện Sáng";
    }
    drawScene();
  });

  // Modals (Cheat sheet, Shortcuts, Rename, Edit Object)
  bindModal("openCheatsheetBtn", "closeCheatsheetBtn", "cheatsheetDialog");
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
  document.getElementById("mode2DBtn").classList.toggle("active", state.spaceMode === "2d");
  document.getElementById("mode3DBtn").classList.toggle("active", state.spaceMode === "3d");
  document.getElementById("eqModeBadge").textContent =
    state.spaceMode === "2d" ? "ƒ(x,y) 2D" : "ƒ(x,y,z) 3D";
  document.getElementById("specialOverlayBar").style.display =
    state.spaceMode === "2d" ? "flex" : "none";

  const motBar = document.getElementById("motionQuickBar");
  if (motBar) {
    const hasMot = state.spaceMode === "3d" && state.objects3D.some((o) => o.type === "line3d" && o.hasVelocity);
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
      { label: "+ Vận tốc v⃗ Oxyz", action: () => quickAddShape("line3d_velocity") },
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
  row.innerHTML = `<span style="color:var(--text-muted); font-weight:600;">⚡ Mẫu hàm số &amp; Phương trình:</span>`;

  const presets =
    state.spaceMode === "2d"
      ? [
          { label: "Bậc 3: y = x^3 - 3x + 1", eq: "y = x^3 - 3x + 1" },
          { label: "Trùng phương: y = x^4 - 2x^2 - 1", eq: "y = x^4 - 2x^2 - 1" },
          { label: "Phân thức: y = (2x-1)/(x+1)", eq: "y = (2x-1)/(x+1)" },
          { label: "Lượng giác: y = 2*sin(x)", eq: "y = 2*sin(x)" },
          { label: "Trị tuyệt đối: y = |x^2 - 4|", eq: "y = |x^2 - 4|" },
          { label: "Đường tròn: (x-1)^2 + (y+1)^2 = 16", eq: "(x-1)^2 + (y+1)^2 = 16" },
          { label: "Elip: x^2/25 + y^2/9 = 1", eq: "x^2/25 + y^2/9 = 1" },
          { label: "🔥 Combo: Bậc 3 & Cát tuyến", combo: "cubic_secant" },
          { label: "🔥 Combo: 2 Đường tròn cắt nhau", combo: "circles_secant" }
        ]
      : [
          { label: "🚀 Combo: 2 Máy bay & Khoảng cách tiếp cận Oxyz", combo: "airplanes_motion" },
          { label: "Mặt phẳng: x + y + z - 3 = 0", eq: "x + y + z - 3 = 0" },
          { label: "Mặt cầu: (x-1)^2 + (y-1)^2 + (z-1)^2 = 16", eq: "(x-1)^2 + (y-1)^2 + (z-1)^2 = 16" },
          { label: "Đường 3D: (x-1)/2 = (y+1)/1 = z/3", eq: "(x-1)/2 = (y+1)/1 = z/3" },
          { label: "Mặt bậc 2: z = 0.25*(x^2 - y^2)", eq: "z = 0.25*(x^2 - y^2)" },
          { label: "🔥 Combo: Mặt phẳng cắt Mặt cầu & Đường 3D", combo: "sphere_plane_line" }
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
  if (comboName === "airplanes_motion") {
    state.spaceMode = "3d";
    state.objects3D = [
      {
        id: genId("plane1"),
        space: "3d",
        type: "line3d",
        name: "✈️ Máy bay 1",
        visible: true,
        color: "#c62828",
        lineWidth: 2.6,
        dash: "solid",
        x0: -3.8,
        y0: -2.5,
        z0: 1.8,
        ux: 1.8,
        uy: 1.2,
        uz: 0.3,
        hasVelocity: true,
        vx: 1.8,
        vy: 1.2,
        vz: 0.3,
        t: 0,
        isPlaying: true,
        equationText: "r⃗₁(t) = (-3.8;-2.5;1.8) + (1.8;1.2;0.3)t",
        knowledgeId: "line3d_velocity"
      },
      {
        id: genId("plane2"),
        space: "3d",
        type: "line3d",
        name: "✈️ Máy bay 2",
        visible: true,
        color: "#1e64b4",
        lineWidth: 2.6,
        dash: "solid",
        x0: -2.5,
        y0: 3.2,
        z0: 2.5,
        ux: 1.3,
        uy: -1.5,
        uz: -0.2,
        hasVelocity: true,
        vx: 1.3,
        vy: -1.5,
        vz: -0.2,
        t: 0,
        isPlaying: true,
        equationText: "r⃗₂(t) = (-2.5;3.2;2.5) + (1.3;-1.5;-0.2)t",
        knowledgeId: "line3d_velocity"
      }
    ];
    state.selectedIds = [state.objects3D[0].id];
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
  }
};

function handleAddEquation(rawText) {
  const errEl = document.getElementById("eqErrorMsg");
  errEl.style.display = "none";

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
    state.cam3D.zoom = 1.0;
    state.cam3D.panX = 0;
    state.cam3D.panY = 0;
    drawScene();
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

  // Prevent middle click autoscroll
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 1) e.preventDefault();
  });

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
      const sel = getSelectedObjects();
      if (sel.length > 0) openEditModal(sel[0].id);
    }
  });

  canvas.addEventListener("pointerdown", (e) => {
    const pos = getLocalCenterCoords(e);
    state.interaction.startX = pos.x;
    state.interaction.startY = pos.y;
    state.interaction.lastX = pos.x;
    state.interaction.lastY = pos.y;
    state.interaction.hasMoved = false;

    // Middle mouse button (button === 1) or Alt+LeftClick -> PAN
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
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

    // 2D Mode Hit-Testing
    const hit = hitTest2D(pos.x, pos.y);
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
    } else {
      // Clicked on empty space -> Start Marquee Box Selection!
      if (!e.shiftKey) state.selectedIds = [];
      state.interaction.mode = "marquee";
      state.interaction.marqueeRect = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
      canvas.setPointerCapture(e.pointerId);
      refreshAllUI();
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const pos = getLocalCenterCoords(e);
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
      state.cam3D.yaw += dx * 0.0085;
      state.cam3D.pitch = Math.max(-1.35, Math.min(1.35, state.cam3D.pitch + dy * 0.0085));
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

  canvas.addEventListener("pointerup", () => {
    if (state.interaction.mode === "marquee") {
      state.interaction.marqueeRect = null;
      refreshAllUI();
    } else if (state.interaction.mode === "drag_vertex" || state.interaction.mode === "drag_object") {
      refreshAllUI();
    }
    state.interaction.mode = "none";
    canvas.style.cursor = "default";
  });

  // Mouse Wheel Zoom (Zoom centered at cursor in 2D!)
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const pos = getLocalCenterCoords(e);
      const factor = e.deltaY < 0 ? 1.1 : 0.91;

      if (state.spaceMode === "2d") {
        const beforeMath = screenToMath2D(pos.x, pos.y);
        state.view2D.scale = Math.max(10, Math.min(180, state.view2D.scale * factor));
        state.view2D.offsetX = pos.x - beforeMath.x * state.view2D.scale;
        state.view2D.offsetY = pos.y + beforeMath.y * state.view2D.scale;
      } else {
        state.cam3D.zoom = Math.max(0.4, Math.min(2.6, state.cam3D.zoom * factor));
      }
      updateCursorStatusPill();
      drawScene();
    },
    { passive: false }
  );
}

function updateCursorStatusPill() {
  const pill = document.getElementById("cursorCoordPill");
  if (state.spaceMode === "2d") {
    const zoomPct = Math.round((state.view2D.scale / 38) * 100);
    pill.textContent = `x: ${state.cursorMathPos.x.toFixed(2)}, y: ${state.cursorMathPos.y.toFixed(2)} | Zoom: ${zoomPct}%`;
  } else {
    const zoomPct = Math.round(state.cam3D.zoom * 100);
    pill.textContent = `Không gian Oxyz | Zoom: ${zoomPct}%`;
  }
}

function hitTest2D(sx, sy) {
  const vis = state.objects2D.filter((o) => o.visible !== false);

  // 1. Check vertices first (radius 12px)
  for (let i = vis.length - 1; i >= 0; i--) {
    const o = vis[i];
    if (o.pts) {
      for (let v = 0; v < o.pts.length; v++) {
        const sp = mathToScreen2D(o.pts[v].x, o.pts[v].y);
        if (Math.hypot(sp.x - sx, sp.y - sy) <= 13) {
          return { objId: o.id, vertexIdx: v };
        }
      }
    } else if (o.type === "point2d") {
      const sp = mathToScreen2D(o.x, o.y);
      if (Math.hypot(sp.x - sx, sp.y - sy) <= 13) {
        return { objId: o.id, vertexIdx: -1 };
      }
    } else if (o.type === "circle2d") {
      const sp = mathToScreen2D(o.cx, o.cy);
      if (Math.hypot(sp.x - sx, sp.y - sy) <= 12) {
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
      Bảng vẽ trống.<br>
      Nhập phương trình phía trên hoặc chọn từ <strong>Kho hình học</strong>!<br>
      <button type="button" class="cad-btn mini" style="margin-top:8px; display:inline-block;" onclick="window.loadDefaultDemoScenes()">⚡ Nạp hình mẫu (Demo)</button>
    </li>`;
    return;
  }

  list.forEach((obj) => {
    const isSel = state.selectedIds.includes(obj.id);
    const li = document.createElement("li");
    li.className = `scene-obj-item ${isSel ? "selected" : ""} ${obj.visible === false ? "hidden-obj" : ""}`;

    const subText = obj.hasVelocity
      ? `🚀 v = ${Math.hypot(obj.vx || obj.ux, obj.vy || obj.uy, obj.vz || obj.uz).toFixed(1)} m/s`
      : obj.equationText
      ? obj.equationText
      : obj.pts
      ? obj.pts.map((p) => p.label).join("")
      : obj.type;

    li.innerHTML = `
      <div class="obj-left">
        <span class="obj-color-dot" style="background:${obj.color || "#1e64b4"}"></span>
        <div class="obj-title-wrap">
          <span class="obj-name">${obj.name}</span>
          <span class="obj-sub">${subText}</span>
        </div>
      </div>
      <div class="obj-actions">
        <button class="icon-mini-btn edit-obj-btn" title="Tùy chỉnh & Sửa chi tiết">⚙️ Sửa</button>
        <button class="icon-mini-btn vis-obj-btn" title="Ẩn/Hiện">${obj.visible === false ? "🚫" : "👁️"}</button>
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
  const fmt = (v) => Number(v).toFixed(2);
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
          sub: `Các cạnh: ${sides.map((s) => s.toFixed(1)).join(", ")}`
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
        const dy = (GeoEquations.evalFunc2D(obj, x0 + h) - GeoEquations.evalFunc2D(obj, x0 - h)) / (2 * h);
        const roots = GeoEquations.findRoots1D((x) => GeoEquations.evalFunc2D(obj, x), -15, 15, 360);
        items.push({
          name: `Hàm số ${obj.name}`,
          val: obj.equationText || `y = ${obj.expr}`,
          sub: `f(${fmt(x0)}) = ${Number.isFinite(y0) ? fmt(y0) : "KXĐ"} ; f'(${fmt(x0)}) = ${Number.isFinite(dy) ? fmt(dy) : "KXĐ"}`
        });
        items.push({
          name: "Nghiệm thực f(x) = 0 trên [-15; 15]",
          val: `${roots.length} nghiệm`,
          sub: roots.length > 0 ? roots.slice(0, 4).map((r) => `x ≈ ${r.toFixed(2)}`).join("; ") : "Không cắt trục Ox"
        });
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
          const l = Math.hypot(r, h);
          items.push({ name: "Diện tích xung quanh S_xq = πrl", val: `${fmt(Math.PI * r * l)} cm²`, sub: `Đường sinh l = ${fmt(l)} cm` });
          items.push({ name: "Thể tích V = ⅓ πr²h", val: `${fmt((Math.PI * r * r * h) / 3)} cm³`, sub: `Bán kính r = ${r}, cao h = ${h}` });
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
  const shape = GEOMETRY_DATA.find((s) => s.id === state.activeKnowledgeId) || GEOMETRY_DATA[0];
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

    // Also append quick summary of current selected shape's formulas below interactions
    body.innerHTML += `
      <div class="info-section">
        <h4>📐 Công Thức Của ${shape.name}</h4>
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
    `;
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
              <h4>Lưu ý &amp; Mẹo giải nhanh</h4>
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
    draw3DGridAndAxes(theme);
    drawAll3DObjects(theme);
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
}

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

      // Draw dashed vertical asymptotes if detected (e.g. rational functions)
      if (asymptoteXs.length > 0) {
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

function draw3DGridAndAxes(theme) {
  if (state.showGrid) {
    for (let i = -5; i <= 5; i++) {
      const p1 = project3D({ x: i, y: -5, z: 0 });
      const p2 = project3D({ x: i, y: 5, z: 0 });
      const q1 = project3D({ x: -5, y: i, z: 0 });
      const q2 = project3D({ x: 5, y: i, z: 0 });
      drawScreenSegment(p1, p2, theme.grid, 1, false);
      drawScreenSegment(q1, q2, theme.grid, 1, false);
    }
  }

  if (state.showAxes) {
    const O = project3D({ x: 0, y: 0, z: 0 });
    const X = project3D({ x: 6, y: 0, z: 0 });
    const Y = project3D({ x: 0, y: 6, z: 0 });
    const Z = project3D({ x: 0, y: 0, z: 5.5 });
    drawScreenSegment(O, X, "#b45a14", 2, false);
    drawScreenSegment(O, Y, "#148250", 2, false);
    drawScreenSegment(O, Z, "#1e64b4", 2, false);
    drawScreenPoint(X.x, X.y, "x", "#b45a14", 3.8);
    drawScreenPoint(Y.x, Y.y, "y", "#148250", 3.8);
    drawScreenPoint(Z.x, Z.y, "z", "#1e64b4", 3.8);
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

function drawAll3DObjects(theme) {
  const vis = state.objects3D.filter((o) => o.visible !== false);
  const scale = 34 * state.cam3D.zoom;

  vis.forEach((obj) => {
    const isSel = state.selectedIds.includes(obj.id);
    const color = obj.color || "#1e64b4";

    if (obj.type === "sphere3d") {
      const C = project3D({ x: obj.cx, y: obj.cy, z: obj.cz });
      // True camera-invariant sphere silhouette radius (never foreshortens when rotating yaw/pitch!)
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

      // Label sphere name on top-right silhouette rim
      ctx.fillStyle = color;
      ctx.font = '600 13.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(obj.name, C.x + rPx * 0.72 + 6, C.y - rPx * 0.72 - 4);
      ctx.restore();

      // Horizontal Equator ring (normal = Z) & Vertical Meridian ring (normal = X)
      draw3DCircleInSpace(obj.cx, obj.cy, obj.cz, 0, 0, 1, obj.r, color, 1.6, true);
      draw3DCircleInSpace(obj.cx, obj.cy, obj.cz, 1, 0, 0, obj.r, color + "77", 1.1, true);
      drawScreenPoint(C.x, C.y, `${obj.centerLabel || "I"}`, color, 4.5);
    } else if (obj.type === "plane3d") {
      // Plane ax + by + cz + d = 0: render a 3D patch around closest point to origin
      const normSq = obj.a * obj.a + obj.b * obj.b + obj.c * obj.c || 1;
      const t0 = -obj.d / normSq;
      const p0 = { x: obj.a * t0, y: obj.b * t0, z: obj.c * t0 };
      const { u, v } = getOrthonormalBasis3D(obj.a, obj.b, obj.c);
      const S = 4.6;
      const corners3D = [
        { x: p0.x - u.x * S - v.x * S, y: p0.y - u.y * S - v.y * S, z: p0.z - u.z * S - v.z * S },
        { x: p0.x + u.x * S - v.x * S, y: p0.y + u.y * S - v.y * S, z: p0.z + u.z * S - v.z * S },
        { x: p0.x + u.x * S + v.x * S, y: p0.y + u.y * S + v.y * S, z: p0.z + u.z * S + v.z * S },
        { x: p0.x - u.x * S + v.x * S, y: p0.y - u.y * S + v.y * S, z: p0.z - u.z * S + v.z * S }
      ];
      const corners2D = corners3D.map(project3D);
      ctx.save();
      ctx.beginPath();
      corners2D.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.closePath();
      ctx.fillStyle = color + (isSel ? "33" : "1e");
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSel ? 2.6 : 1.8;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = '600 13.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(obj.name, corners2D[0].x + 8, corners2D[0].y - 6);
      ctx.restore();
    } else if (obj.type === "surface3d") {
      // 3D surface z = f(x, y) wireframe grid
      const fn = GeoEquations.compileExpr(obj.expr);
      if (fn) {
        const range = 4;
        const steps = 16;
        const step = (range * 2) / steps;
        ctx.save();
        ctx.strokeStyle = color + "bb";
        ctx.lineWidth = isSel ? 1.8 : 1.2;
        for (let i = 0; i <= steps; i++) {
          const x = -range + i * step;
          ctx.beginPath();
          let started = false;
          for (let j = 0; j <= steps; j++) {
            const y = -range + j * step;
            const z = fn(x, y, 0);
            if (!Number.isFinite(z) || Math.abs(z) > 12) {
              started = false;
              continue;
            }
            const p = project3D({ x, y, z });
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
          ctx.stroke();
        }
        for (let j = 0; j <= steps; j++) {
          const y = -range + j * step;
          ctx.beginPath();
          let started = false;
          for (let i = 0; i <= steps; i++) {
            const x = -range + i * step;
            const z = fn(x, y, 0);
            if (!Number.isFinite(z) || Math.abs(z) > 12) {
              started = false;
              continue;
            }
            const p = project3D({ x, y, z });
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (obj.type === "line3d") {
      const p1 = project3D({
        x: obj.x0 - obj.ux * 5,
        y: obj.y0 - obj.uy * 5,
        z: obj.z0 - obj.uz * 5
      });
      const p2 = project3D({
        x: obj.x0 + obj.ux * 5,
        y: obj.y0 + obj.uy * 5,
        z: obj.z0 + obj.uz * 5
      });
      drawScreenSegment(p1, p2, color, isSel ? 3.2 : 2.3, obj.dash === "dashed");
      const pMid = project3D({ x: obj.x0, y: obj.y0, z: obj.z0 });
      drawScreenPoint(pMid.x, pMid.y, obj.name, color, 4.5);

      // Uniform Motion & 3D Velocity Vector Rendering
      if (obj.hasVelocity) {
        const t = obj.t !== undefined ? obj.t : (state.motionTime || 0);
        const cur3D = {
          x: obj.x0 + (obj.vx || 0) * t,
          y: obj.y0 + (obj.vy || 0) * t,
          z: obj.z0 + (obj.vz || 0) * t
        };
        const pCur = project3D(cur3D);
        
        // Traveled trail from M0 to M(t)
        const pStart = project3D({ x: obj.x0, y: obj.y0, z: obj.z0 });
        drawScreenSegment(pStart, pCur, "#b45a14", 3.2, false);

        // Moving beacon particle at M(t) with pulsating ring
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

        // Draw 3D Velocity Arrow v⃗ starting at M(t)
        const vEnd3D = {
          x: cur3D.x + (obj.vx || 0),
          y: cur3D.y + (obj.vy || 0),
          z: cur3D.z + (obj.vz || 0)
        };
        const speed = Math.sqrt((obj.vx || 0) ** 2 + (obj.vy || 0) ** 2 + (obj.vz || 0) ** 2);
        draw3DArrow(cur3D, vEnd3D, "#c62828", 2.6, `v⃗ (|v|=${speed.toFixed(1)})`);
      }
    } else if (obj.type === "point3d") {
      const sp = project3D(obj);
      drawScreenPoint(sp.x, sp.y, `${obj.name}(${obj.x},${obj.y},${obj.z})`, color, 5.5);
    } else if (obj.type === "solid3d") {
      drawSolid3DObject(obj, theme);
    }
  });

  // Multi-Object 3D Motion Proximity & Collision Alert (e.g. 2 airplanes)
  const movingLines = state.objects3D.filter((o) => o.type === "line3d" && o.hasVelocity && o.visible);
  if (movingLines.length >= 2) {
    const l1 = movingLines[0];
    const l2 = movingLines[1];
    const t1 = l1.t !== undefined ? l1.t : (state.motionTime || 0);
    const t2 = l2.t !== undefined ? l2.t : (state.motionTime || 0);
    const m1 = { x: l1.x0 + (l1.vx || 0) * t1, y: l1.y0 + (l1.vy || 0) * t1, z: l1.z0 + (l1.vz || 0) * t1 };
    const m2 = { x: l2.x0 + (l2.vx || 0) * t2, y: l2.y0 + (l2.vy || 0) * t2, z: l2.z0 + (l2.vz || 0) * t2 };
    const dist = Math.sqrt((m1.x - m2.x) ** 2 + (m1.y - m2.y) ** 2 + (m1.z - m2.z) ** 2);
    const pm1 = project3D(m1);
    const pm2 = project3D(m2);

    const isAlert = dist < 3.0;
    drawScreenSegment(pm1, pm2, isAlert ? "#c62828" : "#b45a14", isAlert ? 2.8 : 1.8, true);
    const midX = (pm1.x + pm2.x) / 2;
    const midY = (pm1.y + pm2.y) / 2;

    ctx.save();
    ctx.font = 'bold 12.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = isAlert ? "#c62828" : "#b45a14";
    ctx.fillText(`${isAlert ? "⚠️ Cảnh báo an toàn! " : ""}d(t) = ${dist.toFixed(2)} km`, midX + 8, midY - 6);
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
      state.objects3D.forEach((obj) => {
        if (obj.type === "line3d" && obj.hasVelocity && obj.isPlaying) {
          hasActiveMotion = true;
          if (obj.t === undefined) obj.t = 0;
          obj.t += dt * 0.8;
          if (obj.t > 8) obj.t = -3.5; // loop flight
          state.motionTime = obj.t;
        }
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

  if (title) title.innerHTML = `⚙️ Tùy Chỉnh: <strong>${targetObj.name}</strong> (${targetObj.type})`;
  if (body) body.innerHTML = renderEditDialogContent(targetObj);

  bindEditDialogDynamicEvents(targetObj);
  dialog.showModal();
}

function renderEditDialogContent(obj) {
  let html = `
    <div class="edit-form-group">
      <label>Tên &amp; Ký hiệu đối tượng:</label>
      <div class="edit-input-row">
        <input type="text" id="editObjName" class="edit-input-text" value="${obj.name || ""}" placeholder="VD: A, B, d, (S), (α)..." />
      </div>
    </div>

    <div class="edit-form-group">
      <label>Màu sắc &amp; Kiểu nét:</label>
      <div class="edit-style-row">
        <div class="edit-color-picker-wrap">
          <input type="color" id="editObjColor" class="edit-color-input" value="${obj.color || "#1e64b4"}" />
          <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">Màu nét</span>
        </div>
        <select id="editObjLineWidth" class="edit-select">
          <option value="1.5" ${obj.lineWidth == 1.5 ? "selected" : ""}>Nét mảnh (1.5pt)</option>
          <option value="2.2" ${!obj.lineWidth || obj.lineWidth == 2.2 ? "selected" : ""}>Nét chuẩn (2.2pt)</option>
          <option value="3.0" ${obj.lineWidth == 3.0 ? "selected" : ""}>Nét đậm (3.0pt)</option>
          <option value="4.0" ${obj.lineWidth == 4.0 ? "selected" : ""}>Nét rất đậm (4.0pt)</option>
        </select>
        <select id="editObjDash" class="edit-select">
          <option value="solid" ${obj.dash !== "dashed" && obj.dash !== "dotted" ? "selected" : ""}>Nét liền (solid)</option>
          <option value="dashed" ${obj.dash === "dashed" ? "selected" : ""}>Nét đứt (dashed)</option>
          <option value="dotted" ${obj.dash === "dotted" ? "selected" : ""}>Nét chấm (dotted)</option>
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
              <span>${p.name || "P" + (i + 1)}:</span>
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
        <input type="text" id="editFuncExpr" class="edit-input-text" value="${obj.expr || "x^3 - 3*x"}" placeholder="VD: x^3 - 3*x + 1, sin(x), (2*x-1)/(x+1)..." />
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
// AUTO-SAVE ENGINE (EVERY 10 SECONDS FOR SỔ TAY & PHÒNG THÍ NGHIỆM)
// ============================================================================

function initAutoSaveEngine() {
  // Trigger periodic auto-save every 10 seconds (10000 ms)
  setInterval(() => {
    runAutoSaveCycle();
  }, 10000);
}

function runAutoSaveCycle() {
  // 1. Auto-save studio workspace to localStorage
  saveStudioWorkspaceToLocalStorage();

  // 2. Dispatch synthetic Ctrl+S to NoteRenderer to trigger its built-in save
  triggerNoteRendererSave();

  // 3. Update top indicator badge
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  state.lastAutoSavedAt = timeStr;

  const text = document.getElementById("autoSaveText");
  const badge = document.getElementById("autoSaveBadge");
  if (text) text.textContent = `Tự động lưu: 10s • ${timeStr}`;
  if (badge) {
    badge.classList.add("saving");
    setTimeout(() => badge.classList.remove("saving"), 1400);
  }
}

function triggerNoteRendererSave() {
  const root = document.getElementById("root");
  const activeEl = document.activeElement || document.body;
  const evt = new KeyboardEvent("keydown", {
    key: "s",
    code: "KeyS",
    keyCode: 83,
    which: 83,
    ctrlKey: true,
    metaKey: false,
    bubbles: true,
    cancelable: true
  });
  if (root) root.dispatchEvent(evt);
  window.dispatchEvent(evt);
  activeEl.dispatchEvent(evt);
}

function saveStudioWorkspaceToLocalStorage() {
  try {
    const payload = {
      version: "2.1",
      savedAt: Date.now(),
      spaceMode: state.spaceMode,
      objects2D: state.objects2D,
      objects3D: state.objects3D,
      cam3D: state.cam3D,
      view2D: state.view2D
    };
    localStorage.setItem("pmath_studio_workspace", JSON.stringify(payload));
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
      state.objects2D = data.objects2D;
    }
    if (data.objects3D && Array.isArray(data.objects3D)) {
      state.objects3D = data.objects3D;
    }
    if (data.cam3D) state.cam3D = { ...state.cam3D, ...data.cam3D };
    if (data.view2D) state.view2D = { ...state.view2D, ...data.view2D };
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

window.addEventListener("DOMContentLoaded", initApp);
