/**
 * PMATH EDUCATION TOOLS — Bộ Mô Phỏng Máy Tính Khoa Học THPT
 * Model 1: PMATH fx-580 PRO (Phong cách ClassWiz fx-580VN X)
 * Model 2: PMATH fx-880 ULTRA (Phong cách ClassWiz CW fx-880BTG với phím tròn, OK, Home, Catalog, Format, EXE)
 * Hỗ trợ mở độc lập hoặc mở song song 2 máy cùng lúc để giáo viên đối chiếu giảng dạy.
 * Thiết kế giao diện hiện đại độc quyền, tối ưu sư phạm, tránh bản quyền thương hiệu.
 */

(function () {
  "use strict";

  // Web Audio click generator for tactile feedback
  let audioCtx = null;
  let soundEnabled = true;

  function playClickSound() {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.015);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.015);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.018);
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (typeof str !== "string") str = String(str || "");
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Token to HTML renderer for natural textbook display (VPAM)
  function renderTokensToHtml(tokens, setup) {
    if (!tokens || !tokens.length) return "";
    let html = "";
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (!t) continue;
      if (t.k === "t") {
        const txt = t.t || "";
        if (txt === "neg" || txt === "−") {
          html += '<span class="lcd-minus" role="img" aria-label="−">−</span>';
        } else if (txt.endsWith("(") && txt.length > 1) {
          html += `<span class="lcd-fn">${escapeHtml(txt)}</span>`;
        } else if (txt.length === 1 && /[a-zA-Z]/.test(txt)) {
          html += `<span class="lcd-var">${escapeHtml(txt)}</span>`;
        } else {
          html += escapeHtml(txt);
        }
      } else if (t.k === "frac") {
        const num = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        const den = renderTokensToHtml(t.s && t.s[1] ? t.s[1] : [], setup);
        html += `<span class="lcd-frac"><span>${num}</span><span>${den}</span></span>`;
      } else if (t.k === "mixed") {
        const whole = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        const num = renderTokensToHtml(t.s && t.s[1] ? t.s[1] : [], setup);
        const den = renderTokensToHtml(t.s && t.s[2] ? t.s[2] : [], setup);
        html += `<span class="lcd-mixed"><span>${whole}</span><span class="lcd-frac"><span>${num}</span><span>${den}</span></span></span>`;
      } else if (t.k === "sqrt") {
        const inner = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        html += `<span class="lcd-sqrt"><svg class="lcd-radical" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0.5 12.5 L2.8 11 L5.6 20 L10 0"></path></svg><span class="lcd-radicand">${inner}</span></span>`;
      } else if (t.k === "root") {
        const deg = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        const inner = renderTokensToHtml(t.s && t.s[1] ? t.s[1] : [], setup);
        html += `<span class="lcd-sqrt"><sup class="lcd-root-degree">${deg}</sup><svg class="lcd-radical" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0.5 12.5 L2.8 11 L5.6 20 L10 0"></path></svg><span class="lcd-radicand">${inner}</span></span>`;
      } else if (t.k === "pow") {
        const p = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        html += `<sup class="lcd-sup">${p}</sup>`;
      } else if (t.k === "sq") {
        html += '<sup class="lcd-sup">2</sup>';
      } else if (t.k === "inv") {
        html += '<sup class="lcd-sup">−1</sup>';
      } else if (t.k === "e10") {
        const p = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        html += `<span>×10<sup class="lcd-sup">${p}</sup></span>`;
      } else if (t.k === "int") {
        const f = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        const a = renderTokensToHtml(t.s && t.s[1] ? t.s[1] : [], setup);
        const b = renderTokensToHtml(t.s && t.s[2] ? t.s[2] : [], setup);
        html += `<span class="lcd-big"><span class="lcd-op"><span class="lcd-op-hi">${b}</span><span class="lcd-op-sym">∫</span><span class="lcd-op-lo">${a}</span></span>${f}<span class="lcd-var">dx</span></span>`;
      } else if (t.k === "diff") {
        const f = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        const at = renderTokensToHtml(t.s && t.s[1] ? t.s[1] : [], setup);
        html += `<span class="lcd-big"><span class="lcd-frac lcd-ddx"><span>d</span><span>dx</span></span>(${f})<span class="lcd-at"><span class="lcd-var">x=</span>${at}</span></span>`;
      } else if (t.k === "abs") {
        const inner = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        html += `<span class="lcd-abs">|${inner}|</span>`;
      } else if (t.k === "log") {
        const base = renderTokensToHtml(t.s && t.s[0] ? t.s[0] : [], setup);
        const expr = renderTokensToHtml(t.s && t.s[1] ? t.s[1] : [], setup);
        html += `<span class="lcd-fn">log</span><sub class="lcd-sub">${base}</sub>(${expr})`;
      } else {
        html += escapeHtml(String(t.t || ""));
      }
    }
    return html;
  }

  const TITLE_MAP = {
    "@menu_calc": "1: Tính toán chung (Calculate)",
    "@menu_cmplx": "2: Số phức (Complex)",
    "@menu_base": "3: Hệ đếm cơ số (Base-N)",
    "@menu_matrix": "4: Ma trận (Matrix)",
    "@menu_vector": "5: Vectơ không gian (Vector)",
    "@menu_stat": "6: Thống kê (Statistics)",
    "@menu_dist": "7: Phân phối xác suất (Distribution)",
    "@menu_table": "8: Bảng giá trị f(x) (Table)",
    "@menu_eq": "9: Phương trình & Hệ PT (Equation)",
    "@menu_ineq": "A: Bất phương trình (Inequality)",
    "@menu_ratio": "B: Tỉ lệ thức (Ratio)",
    "@menu_verify": "C: Kiểm chứng đúng/sai (Verify)"
  };

  function translateTitle(t) {
    if (!t) return "";
    return TITLE_MAP[t] || (t.startsWith("@") ? t.slice(1) : t);
  }

  // Keyboards Definition
  // 1. Model 580 (fx-580VN X style)
  const KEYS_580_FN = [
    [
      { k: "optn", main: "OPTN", shift: "QR", cls: "fn" },
      { k: "calc", main: "CALC", shift: "SOLVE", alpha: "=", cls: "fn" },
      { k: "int", main: "∫▫", shift: "d/dx", alpha: ":", cls: "fn" },
      { k: "x", main: "<i>x</i>", name: "x", shift: "Σ", alpha: "Π", cls: "fn" }
    ],
    [
      { k: "frac", main: "▫/▫", shift: "▫▫/▫", alpha: "÷R" },
      { k: "sqrt", main: "√▫", shift: "∛▫", alpha: "‹▫›" },
      { k: "sq", main: "x²", shift: "x³", alpha: "DEC" },
      { k: "pow", main: "x^▫", shift: "ⁿ√▫", alpha: "HEX" },
      { k: "log", main: "log▫▫", shift: "10▫", alpha: "BIN" },
      { k: "ln", main: "ln", shift: "e▫", alpha: "OCT" }
    ],
    [
      { k: "neg", main: "(−)", shift: "log", alpha: "A" },
      { k: "dms", main: "° ′ ″", shift: "FACT", alpha: "B" },
      { k: "inv", main: "x⁻¹", shift: "x!", alpha: "C" },
      { k: "sin", main: "sin", shift: "sin⁻¹", alpha: "D" },
      { k: "cos", main: "cos", shift: "cos⁻¹", alpha: "E" },
      { k: "tan", main: "tan", shift: "tan⁻¹", alpha: "F" }
    ],
    [
      { k: "sto", main: "STO", shift: "RECALL" },
      { k: "eng", main: "ENG", shift: "← ∠", alpha: "i" },
      { k: "(", main: "(", shift: "Abs", alpha: "x" },
      { k: ")", main: ")", shift: ",", alpha: "y" },
      { k: "sd", main: "S⇔D", shift: "ab/c", alpha: "z" },
      { k: "m+", main: "M+", shift: "M−", alpha: "M" }
    ]
  ];

  const KEYS_580_NUM = [
    [
      { k: "7", main: "7", shift: "CONST" },
      { k: "8", main: "8", shift: "CONV" },
      { k: "9", main: "9", shift: "RESET" },
      { k: "del", main: "DEL", shift: "INS", alpha: "UNDO", cls: "del" },
      { k: "ac", main: "AC", shift: "OFF", cls: "del" }
    ],
    [
      { k: "4", main: "4" },
      { k: "5", main: "5" },
      { k: "6", main: "6" },
      { k: "×", main: "×", shift: "nPr", alpha: "GCD" },
      { k: "÷", main: "÷", shift: "nCr", alpha: "LCM" }
    ],
    [
      { k: "1", main: "1" },
      { k: "2", main: "2" },
      { k: "3", main: "3" },
      { k: "+", main: "+", shift: "Pol", alpha: "Int" },
      { k: "−", main: "−", shift: "Rec", alpha: "Intg" }
    ],
    [
      { k: "0", main: "0", shift: "Rnd" },
      { k: ".", main: ".", shift: "Ran#", alpha: "RanInt" },
      { k: "exp", main: "×10<sup>x</sup>", shift: "π", alpha: "e" },
      { k: "ans", main: "Ans", shift: "%", alpha: "PreAns" },
      { k: "=", main: "=", shift: "≈", cls: "eq" }
    ]
  ];

  // 2. Model 880 (fx-880BTG CW style)
  const KEYS_880_FN = [
    [
      { k: "optn", main: "CATALOG", shift: "QR", cls: "fn fn-cw" },
      { k: "S-menu", main: "SETTINGS", shift: "TOOLS", cls: "fn fn-cw" },
      { k: "table", main: "f(x)", shift: "g(x)", cls: "fn fn-cw" },
      { k: "sto", main: "VARIABLE", shift: "x,y,z", cls: "fn fn-cw" }
    ],
    [
      { k: "frac", main: "▫/▫", shift: "▫▫/▫" },
      { k: "sqrt", main: "√▫", shift: "∛▫" },
      { k: "sq", main: "x²", shift: "x³" },
      { k: "pow", main: "x^▫", shift: "ⁿ√▫" },
      { k: "log", main: "log▫▫", shift: "10▫" },
      { k: "ln", main: "ln", shift: "e▫" }
    ],
    [
      { k: "neg", main: "(−)", shift: "i" },
      { k: "dms", main: "° ′ ″", shift: "FACT" },
      { k: "inv", main: "x⁻¹", shift: "x!" },
      { k: "sin", main: "sin", shift: "sin⁻¹" },
      { k: "cos", main: "cos", shift: "cos⁻¹" },
      { k: "tan", main: "tan", shift: "tan⁻¹" }
    ],
    [
      { k: "sd", main: "FORMAT", shift: "ab/c" },
      { k: "(", main: "(", shift: "Abs" },
      { k: ")", main: ")", shift: "," },
      { k: "x", main: "<i>x</i>" },
      { k: "z", main: "<i>z</i>" },
      { k: "m+", main: "M+", shift: "M−" }
    ]
  ];

  const KEYS_880_NUM = [
    [
      { k: "7", main: "7", shift: "CONST" },
      { k: "8", main: "8", shift: "CONV" },
      { k: "9", main: "9", shift: "RESET" },
      { k: "del", main: "DEL", shift: "INS", cls: "del" },
      { k: "ac", main: "AC", shift: "OFF", cls: "del" }
    ],
    [
      { k: "4", main: "4" },
      { k: "5", main: "5" },
      { k: "6", main: "6" },
      { k: "×", main: "×", shift: "nPr" },
      { k: "÷", main: "÷", shift: "nCr" }
    ],
    [
      { k: "1", main: "1" },
      { k: "2", main: "2" },
      { k: "3", main: "3" },
      { k: "+", main: "+", shift: "Pol" },
      { k: "−", main: "−", shift: "Rec" }
    ],
    [
      { k: "0", main: "0", shift: "Rnd" },
      { k: ".", main: ".", shift: "Ran#" },
      { k: "exp", main: "×10<sup>x</sup>", shift: "π" },
      { k: "ans", main: "Ans", shift: "%" },
      { k: "=", main: "EXE", shift: "≈", cls: "exe-cw" }
    ]
  ];

  // Active instances management
  const instances = {
    580: null,
    880: null
  };

  let highestZ = 9000;

  class CalculatorInstance {
    constructor(model, options = {}) {
      this.model = String(model); // "580" or "880"
      this.is880 = this.model === "880";
      this.name = this.is880 ? "PMATH fx-880 ULTRA" : "PMATH fx-580 PRO";
      this.subName = this.is880 ? "CLASSWIZ CW • DUAL NAVIGATION" : "NATURAL V.P.A.M. • CLASSWIZ";

      // Instantiate engine
      if (typeof window.Wz === "function") {
        this.engine = new window.Wz();
      } else if (window.__NR && typeof window.__NR.Wz === "function") {
        this.engine = new window.__NR.Wz();
      } else {
        console.warn("[Calculator] window.Wz chưa sẵn sàng, chờ nạp...");
      }

      this.scale = options.scale || 1.0;
      this.x = options.x !== undefined ? options.x : (this.is880 ? 420 : 40);
      this.y = options.y !== undefined ? options.y : 80;
      this.minimized = false;

      this.createDom();
      this.bindEvents();
      this.updateLCD();
    }

    createDom() {
      const div = document.createElement("div");
      div.className = `calc pmath-calc-window calc-${this.model} ${this.is880 ? "theme-880" : "theme-580"}`;
      div.id = `pmathCalcWindow_${this.model}`;
      div.tabIndex = -1;
      div.style.left = `${this.x}px`;
      div.style.top = `${this.y}px`;
      div.style.zIndex = ++highestZ;
      if (this.scale !== 1.0) {
        div.style.transform = `scale(${this.scale})`;
        div.style.transformOrigin = "0 0";
      }

      const fnKeys = this.is880 ? KEYS_880_FN : KEYS_580_FN;
      const numKeys = this.is880 ? KEYS_880_NUM : KEYS_580_NUM;

      div.innerHTML = `
        <div class="calc-title" title="Kéo để di chuyển máy tính">
          <span class="calc-badge-brand">${this.is880 ? "880 ULTRA" : "580 PRO"}</span>
          <span class="calc-name">${this.name}</span>
          <div class="calc-title-tools" onpointerdown="event.stopPropagation()">
            <button type="button" class="btn-calc-scale" title="Thu phóng kích thước máy" data-action="scale">1.0x</button>
            <button type="button" class="btn-calc-tool" title="Bật/Tắt âm thanh bấm phím" data-action="sound">🔊</button>
            <button type="button" class="btn-calc-tool" title="Thu nhỏ máy tính xuống góc" data-action="min">_</button>
            <button type="button" class="calc-close" title="Đóng máy tính" data-action="close">✕</button>
          </div>
        </div>

        <div class="calc-lcd-bezel">
          <div class="calc-lcd ${this.is880 ? "lcd-cw-oled" : "lcd-580-classic"}">
            <div class="lcd-status" id="lcdStatus_${this.model}">
              <span class="ind ind-s">S</span>
              <span class="ind ind-a">A</span>
              <span class="ind ind-m">M</span>
              <span class="ind ind-sto">STO</span>
              <span class="ind ind-angle on">D</span>
              <span class="ind ind-mode"></span>
              <span class="lcd-arrows">
                <span class="ind ind-up">▲</span>
                <span class="ind ind-down">▼</span>
              </span>
            </div>
            <div class="lcd-main" id="lcdMain_${this.model}">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <div class="calc-keys">
          <!-- Top Row: SHIFT, ALPHA/HOME, DPAD, MENU/BACK, ON -->
          <div class="ck-top">
            <div class="ck-row ck-head">
              <div class="ck-cell">
                <button type="button" class="ck round ck-shift" data-k="shift" title="SHIFT">SHIFT</button>
              </div>
              <div class="ck-cell">
                ${
                  this.is880
                    ? '<button type="button" class="ck round ck-home" data-k="menu" title="HOME (Màn hình chính)">🏠 HOME</button>'
                    : '<button type="button" class="ck round ck-alpha" data-k="alpha" title="ALPHA">ALPHA</button>'
                }
              </div>
              
              <!-- D-Pad Navigation -->
              <div class="ck-pad ${this.is880 ? "ck-pad-cw" : ""}">
                <button type="button" class="ck-arrow up" data-k="up" aria-label="Lên">▲</button>
                <button type="button" class="ck-arrow left" data-k="left" aria-label="Trái">◀</button>
                ${
                  this.is880
                    ? '<button type="button" class="ck-arrow-center ok" data-k="=" title="OK (Xác nhận/Thực thi)">OK</button>'
                    : ""
                }
                <button type="button" class="ck-arrow right" data-k="right" aria-label="Phải">▶</button>
                <button type="button" class="ck-arrow down" data-k="down" aria-label="Xuống">▼</button>
              </div>

              <div class="ck-cell">
                ${
                  this.is880
                    ? '<button type="button" class="ck round ck-back" data-k="ac" title="BACK (Quay lại)">↩ BACK</button>'
                    : '<button type="button" class="ck round ck-menu" data-k="menu" title="MENU / SETUP"><span class="ck-sub-lbl">SETUP</span>MENU</button>'
                }
              </div>
              <div class="ck-cell">
                <button type="button" class="ck round ck-on" data-k="on" title="ON (Bật máy / Làm mới)">ON</button>
              </div>
            </div>

            <!-- Function Rows -->
            ${fnKeys
              .map(
                (row, rIdx) => `
              <div class="ck-row ${rIdx === 0 ? "ck-second" : ""}">
                ${row
                  .map(
                    (btn) => `
                  <div class="ck-cell">
                    <div class="ck-labels">
                      <span class="ck-shift">${btn.shift || ""}</span>
                      <span class="ck-alpha">${btn.alpha || ""}</span>
                    </div>
                    <button type="button" class="ck ${btn.cls || ""}" data-k="${btn.k}" title="${btn.name || btn.main}">
                      ${btn.main}
                    </button>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
              )
              .join("")}
          </div>

          <!-- Bottom Numpad Rows -->
          <div class="ck-bottom">
            ${numKeys
              .map(
                (row) => `
              <div class="ck-row">
                ${row
                  .map(
                    (btn) => `
                  <div class="ck-cell">
                    <div class="ck-labels">
                      <span class="ck-shift">${btn.shift || ""}</span>
                      <span class="ck-alpha">${btn.alpha || ""}</span>
                    </div>
                    <button type="button" class="ck big ${btn.cls || ""}" data-k="${btn.k}" title="${btn.main}">
                      ${btn.main}
                    </button>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="calc-footer-legal">
          <span>PMATH TOOLS GDPT 2018</span>
        </div>
      `;

      document.body.appendChild(div);
      this.el = div;
    }

    bindEvents() {
      // Focus on click
      this.el.addEventListener("pointerdown", () => {
        this.el.style.zIndex = ++highestZ;
      });

      // Draggable title bar
      const titleBar = this.el.querySelector(".calc-title");
      let dragStartX = 0,
        dragStartY = 0;
      let initialLeft = 0,
        initialTop = 0;
      let isDragging = false;

      titleBar.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button")) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        const rect = this.el.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        titleBar.setPointerCapture(e.pointerId);
      });

      titleBar.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        const newLeft = Math.max(0, Math.min(window.innerWidth - 80, initialLeft + dx));
        const newTop = Math.max(0, Math.min(window.innerHeight - 80, initialTop + dy));
        this.el.style.left = `${newLeft}px`;
        this.el.style.top = `${newTop}px`;
        this.x = newLeft;
        this.y = newTop;
      });

      const stopDrag = () => {
        isDragging = false;
      };
      titleBar.addEventListener("pointerup", stopDrag);
      titleBar.addEventListener("pointercancel", stopDrag);

      // Title bar buttons
      this.el.querySelector('[data-action="close"]').addEventListener("click", () => this.close());
      this.el.querySelector('[data-action="min"]').addEventListener("click", () => this.minimize());

      const soundBtn = this.el.querySelector('[data-action="sound"]');
      soundBtn.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
      });

      const scaleBtn = this.el.querySelector('[data-action="scale"]');
      const scales = [1.0, 1.2, 1.4];
      scaleBtn.addEventListener("click", () => {
        const curIdx = scales.indexOf(this.scale);
        const nextIdx = (curIdx + 1) % scales.length;
        this.scale = scales[nextIdx];
        scaleBtn.textContent = `${this.scale.toFixed(1)}x`;
        this.el.style.transform = this.scale === 1.0 ? "none" : `scale(${this.scale})`;
        this.el.style.transformOrigin = "0 0";
      });

      // Keys click delegation
      this.el.querySelector(".calc-keys").addEventListener("pointerdown", (e) => {
        const btn = e.target.closest("button[data-k]");
        if (!btn) return;
        e.preventDefault();
        const key = btn.getAttribute("data-k");
        this.pressKey(key);
      });

      // Tap on LCD menu/form items
      const lcdMain = this.el.querySelector(".lcd-main");
      lcdMain.addEventListener("pointerdown", (e) => {
        const itemBtn = e.target.closest("[data-idx]");
        if (!itemBtn) return;
        e.preventDefault();
        const idx = parseInt(itemBtn.getAttribute("data-idx"), 10);
        if (!isNaN(idx) && this.engine && typeof this.engine.tap === "function") {
          playClickSound();
          this.engine.tap(idx);
          this.updateLCD();
        }
      });

      // Keyboard support
      window.addEventListener("keydown", (e) => {
        // Only if this calculator is focused (highest z-index among calcs)
        if (!this.el || this.el.style.display === "none") return;
        if (parseInt(this.el.style.zIndex, 10) !== highestZ) return;

        const tag = document.activeElement ? document.activeElement.tagName : "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const keyMap = {
          Enter: "=",
          "=": "=",
          Backspace: "del",
          Delete: "ac",
          Escape: "ac",
          ArrowLeft: "left",
          ArrowRight: "right",
          ArrowUp: "up",
          ArrowDown: "down",
          "+": "+",
          "-": "−",
          "*": "×",
          "/": "÷",
          "^": "pow",
          "(": "(",
          ")": ")",
          ".": ".",
          s: "sin",
          c: "cos",
          t: "tan",
          l: "ln",
          r: "sqrt",
          p: "exp",
          x: "x"
        };

        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          this.pressKey(e.key);
        } else if (keyMap[e.key]) {
          e.preventDefault();
          this.pressKey(keyMap[e.key]);
        }
      });
    }

    pressKey(key) {
      if (!key) return;
      playClickSound();

      if (!this.engine) {
        if (typeof window.Wz === "function") {
          this.engine = new window.Wz();
        } else {
          return;
        }
      }

      this.engine.press(key);
      this.updateLCD();
    }

    updateLCD() {
      if (!this.engine || !this.el) return;

      const view = this.engine.view();
      const status = this.engine.status();

      // Update status indicators
      const statusEl = this.el.querySelector(`#lcdStatus_${this.model}`);
      if (statusEl) {
        statusEl.querySelector(".ind-s").classList.toggle("on", !!status.shift);
        statusEl.querySelector(".ind-a").classList.toggle("on", !!status.alpha);
        statusEl.querySelector(".ind-m").classList.toggle("on", !!status.m);
        statusEl.querySelector(".ind-sto").classList.toggle("on", !!status.sto);
        const angleEl = statusEl.querySelector(".ind-angle");
        angleEl.textContent = status.angle || "D";
        angleEl.classList.add("on");

        const modeEl = statusEl.querySelector(".ind-mode");
        modeEl.textContent = status.mode || "";
        modeEl.classList.toggle("on", !!status.mode);

        statusEl.querySelector(".ind-up").classList.toggle("on", !!status.up);
        statusEl.querySelector(".ind-down").classList.toggle("on", !!status.down);
      }

      // Update main LCD content
      const lcdMain = this.el.querySelector(`#lcdMain_${this.model}`);
      if (!lcdMain) return;

      if (!view) {
        lcdMain.innerHTML = '<div class="lcd-expr"><div class="lcd-input"><span class="lcd-caret"></span></div></div>';
        return;
      }

      if (view.k === "expr") {
        const inputHtml = renderTokensToHtml(view.input, this.engine.setup);
        let resultsHtml = "";

        if (view.error) {
          resultsHtml = `
            <div class="lcd-error">
              <b>[ERROR]: Lỗi cú pháp hoặc toán học</b>
              <small>[AC]: Huỷ bỏ &nbsp;|&nbsp; [◀ ▶]: Xem lại con trỏ</small>
            </div>
          `;
        } else if (view.lines && view.lines.length > 0) {
          resultsHtml = `
            <div class="lcd-results">
              ${view.lines
                .map(
                  (line) => `
                <div class="lcd-result ${line.right !== false ? "right" : ""}">
                  ${line.label ? `<span class="lcd-label">${escapeHtml(translateTitle(line.label))}</span>` : ""}
                  <span class="lcd-value">${renderTokensToHtml(line.value, this.engine.setup)}</span>
                </div>
              `
                )
                .join("")}
            </div>
          `;
        }

        lcdMain.innerHTML = `
          <div class="lcd-expr">
            <div class="lcd-input">${inputHtml}<span class="lcd-caret"></span></div>
            ${resultsHtml}
          </div>
        `;
      } else if (view.k === "menu") {
        const title = translateTitle(view.title);
        const items = view.items || [];
        lcdMain.innerHTML = `
          <div class="lcd-menu ${view.icons ? "icons" : ""}">
            <div class="lcd-head">${escapeHtml(title)}</div>
            <div class="lcd-menu-items">
              ${items
                .map(
                  (item, idx) => `
                <button type="button" class="lcd-menu-item ${idx === view.sel ? "sel" : ""}" data-idx="${idx}">
                  <span class="lcd-num">${idx < 9 ? idx + 1 : String.fromCharCode(65 + idx - 9)}:</span>
                  <span>${escapeHtml(translateTitle(item))}</span>
                </button>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      } else if (view.k === "form") {
        const title = translateTitle(view.title);
        const rows = view.rows || [];
        lcdMain.innerHTML = `
          <div class="lcd-form">
            <div class="lcd-head">${escapeHtml(title)}</div>
            ${rows
              .map(
                (row, idx) => `
              <div class="lcd-form-row ${idx === view.sel ? "sel" : ""}" data-idx="${idx}">
                <span class="lcd-form-label">${escapeHtml(translateTitle(row.label || ""))}</span>
                <span class="lcd-form-val">${renderTokensToHtml(row.val || [], this.engine.setup)}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      }
    }

    minimize() {
      this.minimized = true;
      this.el.style.display = "none";
      updateMinimizedTray();
    }

    restore() {
      this.minimized = false;
      this.el.style.display = "flex";
      this.el.style.zIndex = ++highestZ;
      updateMinimizedTray();
    }

    close() {
      if (this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
      instances[this.model] = null;
      updateMinimizedTray();
    }
  }

  // Floating Minimized Tray at bottom right
  function updateMinimizedTray() {
    let tray = document.getElementById("pmathCalcMinimizedTray");
    const minCalcs = Object.values(instances).filter((c) => c && c.minimized);

    if (minCalcs.length === 0) {
      if (tray) tray.style.display = "none";
      return;
    }

    if (!tray) {
      tray = document.createElement("div");
      tray.id = "pmathCalcMinimizedTray";
      tray.className = "calc-minimized-tray";
      document.body.appendChild(tray);
    }

    tray.style.display = "flex";
    tray.innerHTML = minCalcs
      .map(
        (c) => `
      <button type="button" class="btn-min-calc ${c.is880 ? "btn-min-880" : "btn-min-580"}" data-model="${c.model}">
        🧮 ${c.is880 ? "fx-880 ULTRA" : "fx-580 PRO"} (Nhấp để mở)
      </button>
    `
      )
      .join("");

    tray.querySelectorAll(".btn-min-calc").forEach((btn) => {
      btn.addEventListener("click", () => {
        const model = btn.getAttribute("data-model");
        if (instances[model]) instances[model].restore();
      });
    });
  }

  // Public PMathCalculator API
  window.PMathCalculator = {
    open(model) {
      const m = String(model);
      if (instances[m]) {
        instances[m].restore();
        return instances[m];
      }
      instances[m] = new CalculatorInstance(m);
      return instances[m];
    },

    toggle(model) {
      const m = String(model);
      if (instances[m]) {
        if (instances[m].minimized || instances[m].el.style.display === "none") {
          instances[m].restore();
        } else {
          instances[m].close();
        }
      } else {
        this.open(m);
      }
    },

    openDual() {
      // Calculate responsive coordinates for side-by-side view
      const screenW = window.innerWidth;
      const calcW = 320;
      let left1, left2;

      if (screenW >= 740) {
        const center = screenW / 2;
        left1 = Math.max(16, center - calcW - 15);
        left2 = Math.min(screenW - calcW - 16, center + 15);
      } else {
        left1 = 16;
        left2 = 36;
      }

      // Open 580 on the left
      if (instances["580"]) {
        instances["580"].restore();
        instances["580"].el.style.left = `${left1}px`;
        instances["580"].el.style.top = `80px`;
      } else {
        instances["580"] = new CalculatorInstance("580", { x: left1, y: 80 });
      }

      // Open 880 on the right
      if (instances["880"]) {
        instances["880"].restore();
        instances["880"].el.style.left = `${left2}px`;
        instances["880"].el.style.top = `80px`;
      } else {
        instances["880"] = new CalculatorInstance("880", { x: left2, y: 80 });
      }

      if (typeof showToast === "function") {
        showToast("🪟 Đã mở song song 2 máy tính fx-580 PRO và fx-880 ULTRA!");
      }
    },

    close(model) {
      const m = String(model);
      if (instances[m]) instances[m].close();
    },

    closeAll() {
      Object.keys(instances).forEach((k) => {
        if (instances[k]) instances[k].close();
      });
    }
  };
})();
