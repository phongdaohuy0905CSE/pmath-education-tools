// ============================================================================
// PMATH EDUCATION TOOLS — MODULE QUẢN LÝ BẢNG CÔNG THỨC & SỔ TAY KIẾN THỨC
// File độc lập: knowledge-handbook.js
// Tách biệt hoàn toàn:
//   1. Bảng Công Thức Toán Học (Formula Hub - tra cứu, copy, thêm/sửa/xuất JSON)
//   2. Sổ Tay Kiến Thức 24 Chuyên Đề (Knowledge Handbook - lý thuyết, định lý,
//      mẹo giải nhanh, trắc nghiệm, ghi chú cá nhân & chỉnh sửa trực tiếp)
// ============================================================================

(function () {
  const FORMULA_STORAGE_KEY = "pmath_custom_formulas_v1";
  const KNOWLEDGE_STORAGE_KEY = "pmath_custom_knowledge_v1";

  const hubState = {
    // Formula Hub State
    formulas: [],
    activeFormulaCategory: "all",
    formulaSearchQuery: "",
    onlyImportantFormulas: false,
    editingFormulaId: null,

    // Knowledge Handbook State
    knowledgeOverrides: {},
    activeTopicId: "triangle",
    activeTopicFilter: "all",
    topicSearchQuery: "",
    isEditingTopic: false,
    activeQuiz: null
  };

  // ==========================================================================
  // DATA PERSISTENCE & EASY UPDATE ENGINE
  // ==========================================================================

  function loadFormulasData() {
    const defaults = Array.isArray(window.PMATH_DEFAULT_FORMULAS)
      ? JSON.parse(JSON.stringify(window.PMATH_DEFAULT_FORMULAS))
      : [];
    try {
      const raw = localStorage.getItem(FORMULA_STORAGE_KEY);
      if (!raw) {
        hubState.formulas = defaults;
        return;
      }
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 0) {
        // Merge saved custom/edited formulas with any new default formulas
        const savedMap = new Map(saved.map((f) => [f.id, f]));
        const merged = defaults.map((defItem) =>
          savedMap.has(defItem.id) ? { ...defItem, ...savedMap.get(defItem.id) } : defItem
        );
        // Append purely custom user-created formulas
        saved.forEach((item) => {
          if (!defaults.some((d) => d.id === item.id)) {
            merged.push(item);
          }
        });
        hubState.formulas = merged;
      } else {
        hubState.formulas = defaults;
      }
    } catch (e) {
      console.warn("[FormulaHub] Failed to parse custom formulas:", e);
      hubState.formulas = defaults;
    }
  }

  function saveFormulasData() {
    try {
      localStorage.setItem(FORMULA_STORAGE_KEY, JSON.stringify(hubState.formulas));
    } catch (e) {
      console.warn("[FormulaHub] Could not save formulas:", e);
    }
  }

  function loadKnowledgeOverrides() {
    try {
      const raw = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
      hubState.knowledgeOverrides = raw ? JSON.parse(raw) : {};
    } catch (e) {
      hubState.knowledgeOverrides = {};
    }
  }

  function saveKnowledgeOverrides() {
    try {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(hubState.knowledgeOverrides));
    } catch (e) {
      console.warn("[KnowledgeHandbook] Could not save overrides:", e);
    }
  }

  function getMergedTopic(topicId) {
    const list = typeof GEOMETRY_DATA !== "undefined" ? GEOMETRY_DATA : [];
    const base = list.find((item) => item.id === topicId) || list[0];
    if (!base) return null;
    const over = hubState.knowledgeOverrides[base.id];
    if (!over) return { ...base, customNote: "" };
    return {
      ...base,
      definition: over.definition !== undefined ? over.definition : base.definition,
      properties: Array.isArray(over.properties) ? over.properties : base.properties,
      tips: Array.isArray(over.tips) ? over.tips : base.tips || [],
      customNote: over.customNote || ""
    };
  }

  function getAllMergedTopics() {
    const list = typeof GEOMETRY_DATA !== "undefined" ? GEOMETRY_DATA : [];
    return list.map((item) => getMergedTopic(item.id));
  }

  // ==========================================================================
  // PART 1: BẢNG CÔNG THỨC TOÁN HỌC (FORMULA HUB)
  // ==========================================================================

  function openFormulaSheet(initialCategory) {
    const dialog = document.getElementById("cheatsheetDialog");
    if (!dialog) return;
    if (initialCategory && typeof initialCategory === "string") {
      hubState.activeFormulaCategory = initialCategory;
    }
    hideFormulaEditor();
    renderFormulaCategories();
    renderFormulaCards();
    if (!dialog.open) dialog.showModal();
  }

  function renderFormulaCategories() {
    const container = document.getElementById("formulaCategoryPills");
    if (!container) return;
    const cats = window.PMATH_FORMULA_CATEGORIES || [];

    container.innerHTML = cats
      .map((cat) => {
        const count =
          cat.id === "all"
            ? hubState.formulas.length
            : hubState.formulas.filter((f) => f.category === cat.id).length;
        const activeClass = hubState.activeFormulaCategory === cat.id ? "active" : "";
        return `
          <button type="button" class="fh-cat-pill ${activeClass}" data-fcat="${cat.id}">
            <span>${cat.icon} ${cat.label}</span>
            <span class="fh-cat-count">${count}</span>
          </button>
        `;
      })
      .join("");

    container.querySelectorAll(".fh-cat-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        hubState.activeFormulaCategory = btn.dataset.fcat;
        renderFormulaCategories();
        renderFormulaCards();
      });
    });
  }

  function renderFormulaCards() {
    const grid = document.getElementById("formulaCardsGrid");
    const countEl = document.getElementById("formulaTotalCountBadge");
    if (!grid) return;

    const q = hubState.formulaSearchQuery.trim().toLowerCase();
    const filtered = hubState.formulas.filter((item) => {
      if (hubState.activeFormulaCategory !== "all" && item.category !== hubState.activeFormulaCategory) {
        return false;
      }
      if (hubState.onlyImportantFormulas && !item.important) {
        return false;
      }
      if (!q) return true;
      const hay = `${item.title} ${item.formula} ${item.subFormula || ""} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });

    if (countEl) {
      countEl.textContent = `${filtered.length} công thức`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="fh-empty-state">
          <div style="font-size:2.2rem; margin-bottom:0.5rem;">🔍</div>
          <strong>Không tìm thấy công thức phù hợp</strong>
          <p>Hãy thử từ khóa khác hoặc bấm <strong>"+ Thêm Công Thức Mới"</strong> để bổ sung vào bảng công thức.</p>
        </div>
      `;
      return;
    }

    const catMap = {};
    (window.PMATH_FORMULA_CATEGORIES || []).forEach((c) => {
      catMap[c.id] = c;
    });

    grid.innerHTML = filtered
      .map((item) => {
        const catInfo = catMap[item.category] || { icon: "📐", label: item.categoryName || "Toán THPT", color: "#1e64b4" };
        return `
          <article class="fh-card ${item.important ? "is-important" : ""}" data-fid="${item.id}">
            <div class="fh-card-top">
              <span class="fh-cat-badge" style="--cat-color: ${catInfo.color}">
                ${catInfo.icon} ${item.categoryName || catInfo.label}
              </span>
              <div class="fh-card-actions">
                ${item.important ? `<span class="fh-star-badge" title="Công thức trọng tâm hay thi">⭐ Trọng tâm</span>` : ""}
                <button type="button" class="fh-icon-btn copy-formula-btn" data-copy="${escapeAttr(item.formula + (item.subFormula ? " ; " + item.subFormula : ""))}" title="Sao chép công thức">
                  📋 Copy
                </button>
                <button type="button" class="fh-icon-btn edit-formula-btn" data-fid="${item.id}" title="Chỉnh sửa hoặc cập nhật công thức này">
                  ✏️ Sửa
                </button>
              </div>
            </div>

            <h4 class="fh-card-title">${escapeHtml(item.title)}</h4>

            <div class="fh-math-box primary">
              <code>${escapeHtml(item.formula)}</code>
            </div>

            ${
              item.subFormula
                ? `<div class="fh-math-box secondary">
                    <code>${escapeHtml(item.subFormula)}</code>
                  </div>`
                : ""
            }

            ${
              item.description
                ? `<p class="fh-card-desc">${escapeHtml(item.description)}</p>`
                : ""
            }

            ${
              item.tags && item.tags.length > 0
                ? `<div class="fh-tags-row">
                    ${item.tags.map((t) => `<span class="fh-tag">#${escapeHtml(t)}</span>`).join("")}
                  </div>`
                : ""
            }
          </article>
        `;
      })
      .join("");

    // Bind Copy & Edit buttons
    grid.querySelectorAll(".copy-formula-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-copy") || "";
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = "✓ Đã chép";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.remove("copied");
          }, 1500);
        });
      });
    });

    grid.querySelectorAll(".edit-formula-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openFormulaEditor(btn.dataset.fid);
      });
    });
  }

  function openFormulaEditor(formulaId) {
    const editorWrap = document.getElementById("formulaEditorPanel");
    if (!editorWrap) return;

    const existing = formulaId ? hubState.formulas.find((f) => f.id === formulaId) : null;
    hubState.editingFormulaId = existing ? existing.id : null;

    document.getElementById("feModalTitle").textContent = existing
      ? `✏️ Cập Nhật Công Thức: ${existing.title}`
      : "➕ Thêm Công Thức Mới Vào Bảng Công Thức";

    document.getElementById("feTitleInput").value = existing ? existing.title : "";
    document.getElementById("feCategorySelect").value = existing
      ? existing.category
      : hubState.activeFormulaCategory !== "all"
      ? hubState.activeFormulaCategory
      : "oxyz";
    document.getElementById("feFormulaInput").value = existing ? existing.formula : "";
    document.getElementById("feSubFormulaInput").value = existing && existing.subFormula ? existing.subFormula : "";
    document.getElementById("feDescInput").value = existing && existing.description ? existing.description : "";
    document.getElementById("feTagsInput").value =
      existing && Array.isArray(existing.tags) ? existing.tags.join(", ") : "";
    document.getElementById("feImportantCheck").checked = existing ? !!existing.important : true;

    const delBtn = document.getElementById("feDeleteBtn");
    if (delBtn) {
      delBtn.style.display = existing ? "inline-flex" : "none";
    }

    editorWrap.style.display = "block";
    document.getElementById("feTitleInput").focus();
  }

  function hideFormulaEditor() {
    const editorWrap = document.getElementById("formulaEditorPanel");
    if (editorWrap) editorWrap.style.display = "none";
    hubState.editingFormulaId = null;
  }

  function handleSaveFormula(e) {
    e.preventDefault();
    const title = document.getElementById("feTitleInput").value.trim();
    const category = document.getElementById("feCategorySelect").value;
    const formula = document.getElementById("feFormulaInput").value.trim();
    const subFormula = document.getElementById("feSubFormulaInput").value.trim();
    const description = document.getElementById("feDescInput").value.trim();
    const tagsRaw = document.getElementById("feTagsInput").value.trim();
    const important = document.getElementById("feImportantCheck").checked;

    if (!title || !formula) return;

    const catObj = (window.PMATH_FORMULA_CATEGORIES || []).find((c) => c.id === category);
    const categoryName = catObj ? catObj.label : "Toán THPT";
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    if (hubState.editingFormulaId) {
      const idx = hubState.formulas.findIndex((f) => f.id === hubState.editingFormulaId);
      if (idx !== -1) {
        hubState.formulas[idx] = {
          ...hubState.formulas[idx],
          title,
          category,
          categoryName,
          formula,
          subFormula,
          description,
          tags,
          important
        };
      }
    } else {
      const newFormula = {
        id: "f_custom_" + Date.now().toString(36),
        category,
        categoryName,
        title,
        formula,
        subFormula,
        description,
        tags,
        important
      };
      hubState.formulas.unshift(newFormula);
    }

    saveFormulasData();
    hideFormulaEditor();
    renderFormulaCategories();
    renderFormulaCards();
  }

  function handleDeleteFormula() {
    if (!hubState.editingFormulaId) return;
    hubState.formulas = hubState.formulas.filter((f) => f.id !== hubState.editingFormulaId);
    saveFormulasData();
    hideFormulaEditor();
    renderFormulaCategories();
    renderFormulaCards();
  }

  function exportFormulasJson() {
    const dataStr = JSON.stringify(hubState.formulas, null, 2);
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pmath-formulas-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ==========================================================================
  // PART 2: SỔ TAY KIẾN THỨC 24 CHUYÊN ĐỀ (KNOWLEDGE HANDBOOK)
  // ==========================================================================

  function openKnowledgeHandbook(topicId) {
    const dialog = document.getElementById("knowledgeHandbookDialog");
    if (!dialog) return;

    if (topicId && typeof topicId === "string") {
      hubState.activeTopicId = topicId;
    } else if (typeof state !== "undefined" && state.activeKnowledgeId) {
      hubState.activeTopicId = state.activeKnowledgeId;
    }

    hubState.isEditingTopic = false;
    hubState.activeQuiz = null;
    renderHandbookSidebar();
    renderHandbookDetail();
    if (!dialog.open) dialog.showModal();
  }

  function renderHandbookSidebar() {
    const listEl = document.getElementById("khTopicsList");
    const countEl = document.getElementById("khTopicsCountBadge");
    if (!listEl) return;

    const allTopics = getAllMergedTopics();
    const q = hubState.topicSearchQuery.trim().toLowerCase();

    const filtered = allTopics.filter((item) => {
      if (hubState.activeTopicFilter !== "all" && item.category !== hubState.activeTopicFilter) {
        return false;
      }
      if (!q) return true;
      const hay = `${item.name} ${item.subtitle} ${item.group || ""} ${item.definition || ""}`.toLowerCase();
      return hay.includes(q);
    });

    if (countEl) countEl.textContent = `${filtered.length}/24 chuyên đề`;

    // Update filter pills active state
    document.querySelectorAll("#khFilterPills .kh-filter-pill").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.kfilter === hubState.activeTopicFilter);
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<li class="kh-empty-item">Không tìm thấy chuyên đề nào khớp từ khóa.</li>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((item) => {
        const isActive = item.id === hubState.activeTopicId;
        const catBadge =
          item.category === "2d"
            ? "2D Phẳng"
            : item.category === "3d"
            ? "3D Không gian"
            : item.category === "motion"
            ? "🚀 Vận tốc Oxyz"
            : "Đường & Điểm";
        return `
          <li class="kh-topic-item ${isActive ? "active" : ""}" data-tid="${item.id}">
            <div class="kh-topic-icon">${item.icon || "📘"}</div>
            <div class="kh-topic-meta">
              <div class="kh-topic-top">
                <span class="kh-topic-group">${escapeHtml(item.group || catBadge)}</span>
                ${hubState.knowledgeOverrides[item.id] ? `<span class="kh-edited-dot" title="Đã có ghi chú / cập nhật">●</span>` : ""}
              </div>
              <strong class="kh-topic-name">${escapeHtml(item.name)}</strong>
              <span class="kh-topic-sub">${escapeHtml(item.subtitle)}</span>
            </div>
          </li>
        `;
      })
      .join("");

    listEl.querySelectorAll(".kh-topic-item").forEach((li) => {
      li.addEventListener("click", () => {
        hubState.activeTopicId = li.dataset.tid;
        hubState.isEditingTopic = false;
        hubState.activeQuiz = null;
        if (typeof state !== "undefined") {
          state.activeKnowledgeId = hubState.activeTopicId;
        }
        renderHandbookSidebar();
        renderHandbookDetail();
      });
    });
  }

  function renderHandbookDetail() {
    const container = document.getElementById("khDetailContent");
    if (!container) return;

    const topic = getMergedTopic(hubState.activeTopicId);
    if (!topic) return;

    if (hubState.isEditingTopic) {
      renderTopicEditor(container, topic);
      return;
    }

    if (!hubState.activeQuiz) {
      hubState.activeQuiz = buildTopicQuiz(topic);
    }
    const q = hubState.activeQuiz;

    container.innerHTML = `
      <!-- Topic Banner Header -->
      <div class="kh-detail-header">
        <div class="kh-detail-title-group">
          <div class="kh-detail-big-icon">${topic.icon || "📘"}</div>
          <div>
            <div class="kh-detail-badges">
              <span class="kh-badge-group">${escapeHtml(topic.group || "Chuyên đề Toán THPT")}</span>
              <span class="kh-badge-cat">${topic.category === "3d" || topic.category === "motion" ? "Không Gian 3D / Oxyz" : "Hình Học Phẳng 2D"}</span>
            </div>
            <h2 class="kh-detail-title">${escapeHtml(topic.name)}</h2>
            <p class="kh-detail-subtitle">${escapeHtml(topic.subtitle)}</p>
          </div>
        </div>

        <div class="kh-detail-actions">
          <button type="button" class="btn-secondary kh-action-btn" id="khEditTopicBtn" title="Chỉnh sửa lý thuyết hoặc thêm ghi chú cá nhân cho chuyên đề này">
            ✏️ Sửa &amp; Ghi Chú
          </button>
          <button type="button" class="btn-secondary kh-action-btn" id="khOpenFormulasBtn" title="Mở Bảng Công Thức Toán Học">
            📋 Bảng Công Thức
          </button>
          <button type="button" class="btn-primary kh-action-btn" id="khLaunchStudioBtn" title="Đưa hình vẽ của chuyên đề này vào Bảng vẽ Studio">
            🚀 Mở Hình Trên Studio
          </button>
        </div>
      </div>

      ${
        topic.interactiveHint
          ? `<div class="kh-hint-banner">
              <span>${escapeHtml(topic.interactiveHint)}</span>
            </div>`
          : ""
      }

      <!-- Section 1: Định nghĩa chuẩn SGK (tcolorbox def) -->
      <section class="kh-box kh-box-def">
        <div class="kh-box-badge def">📗 I. ĐỊNH NGHĨA &amp; KHÁI NIỆM CỐT LÕI</div>
        <p class="kh-def-text">${escapeHtml(topic.definition)}</p>
      </section>

      <!-- Section 2: Định lý & Tính chất trọng tâm (tcolorbox ex) -->
      <section class="kh-box kh-box-ex">
        <div class="kh-box-badge ex">📘 II. ĐỊNH LÝ, TÍNH CHẤT &amp; HỆ QUẢ TRỌNG TÂM</div>
        <ul class="kh-prop-list">
          ${(topic.properties || []).map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
        </ul>
      </section>

      <!-- Section 3: Lưu ý & Mẹo giải nhanh trắc nghiệm (tcolorbox warn) -->
      ${
        topic.tips && topic.tips.length > 0
          ? `<section class="kh-box kh-box-warn">
              <div class="kh-box-badge warn">📙 III. MẸO GIẢI NHANH &amp; LƯU Ý BẪY TRẮC NGHIỆM</div>
              <ul class="kh-tip-list">
                ${topic.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
              </ul>
            </section>`
          : ""
      }

      <!-- Section 4: Ghi chú cá nhân của Giáo viên / Học sinh -->
      ${
        topic.customNote
          ? `<section class="kh-box kh-box-note">
              <div class="kh-box-badge note">📝 GHI CHÚ BÀI GIẢNG &amp; BỔ SUNG CÁ NHÂN</div>
              <div class="kh-custom-note-body">${escapeHtml(topic.customNote).replace(/\n/g, "<br/>")}</div>
            </section>`
          : ""
      }

      <!-- Section 5: Tóm tắt các công thức gắn với chuyên đề -->
      ${
        topic.formulas && topic.formulas.length > 0
          ? `<section class="kh-box kh-box-formulas">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
                <div class="kh-box-badge tf" style="margin-bottom:0;">📐 IV. CÔNG THỨC ĐẶC TRƯNG CỦA CHUYÊN ĐỀ</div>
                <button type="button" class="cad-btn mini" id="khJumpAllFormulasBtn">Xem toàn bộ Bảng Công Thức ➔</button>
              </div>
              <div class="kh-mini-formulas-grid">
                ${topic.formulas
                  .map(
                    (f) => `
                  <div class="kh-mini-formula-card">
                    <div class="kh-mf-title">${escapeHtml(f.title)}</div>
                    <div class="kh-mf-math">${escapeHtml(f.math)}</div>
                    <div class="kh-mf-note">${escapeHtml(f.note || "")}</div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }

      <!-- Section 6: Bài tập Vận dụng tương tác trực tiếp -->
      <section class="kh-box kh-box-quiz">
        <div class="kh-box-badge ex">🎯 V. BÀI TẬP VẬN DỤNG TƯƠNG TÁC (${escapeHtml(topic.name)})</div>
        <p class="kh-quiz-question">${escapeHtml(q.question)}</p>
        <div class="kh-quiz-controls">
          <input type="number" step="0.01" id="khQuizInput" class="eq-input" placeholder="Nhập đáp số (làm tròn 2 chữ số thập phân)..." style="max-width:280px;" />
          <button type="button" class="btn-primary" id="khCheckQuizBtn">✓ Kiểm tra đáp án</button>
          <button type="button" class="btn-secondary" id="khShowSolBtn">💡 Xem lời giải</button>
          <button type="button" class="btn-secondary" id="khNewQuizBtn">🔄 Đổi số liệu mới</button>
        </div>
        <div id="khQuizFeedback" class="quiz-feedback" style="margin-top:0.65rem;"></div>
      </section>
    `;

    // Bind Action Buttons in Detail View
    const editBtn = document.getElementById("khEditTopicBtn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        hubState.isEditingTopic = true;
        renderHandbookDetail();
      });
    }

    const openFormulasBtn = document.getElementById("khOpenFormulasBtn");
    if (openFormulasBtn) {
      openFormulasBtn.addEventListener("click", () => {
        openFormulaSheet();
      });
    }

    const jumpFormulasBtn = document.getElementById("khJumpAllFormulasBtn");
    if (jumpFormulasBtn) {
      jumpFormulasBtn.addEventListener("click", () => {
        openFormulaSheet();
      });
    }

    const launchBtn = document.getElementById("khLaunchStudioBtn");
    if (launchBtn) {
      launchBtn.addEventListener("click", () => {
        const dialog = document.getElementById("knowledgeHandbookDialog");
        if (dialog && dialog.open) dialog.close();

        // Switch to Studio view and spawn the shape
        const topBtnGL = document.getElementById("topSwitchToGeoLabBtn");
        if (topBtnGL) topBtnGL.click();
        if (typeof spawnLibraryShape === "function") {
          spawnLibraryShape(topic);
        }
      });
    }

    // Bind Quiz Buttons
    const checkBtn = document.getElementById("khCheckQuizBtn");
    const solBtn = document.getElementById("khShowSolBtn");
    const newBtn = document.getElementById("khNewQuizBtn");
    const fb = document.getElementById("khQuizFeedback");

    if (checkBtn && fb) {
      checkBtn.addEventListener("click", () => {
        const val = parseFloat(document.getElementById("khQuizInput").value);
        if (isNaN(val)) return;
        if (Math.abs(val - q.answer) <= 0.15) {
          fb.className = "quiz-feedback correct";
          fb.innerHTML = `✅ <strong>Chính xác!</strong> Đáp số đúng là <strong>${q.answer.toFixed(2)} ${q.unit}</strong>.<br/>${q.explanation}`;
        } else {
          fb.className = "quiz-feedback wrong";
          fb.innerHTML = `❌ Chưa chính xác. Hãy kiểm tra lại công thức hoặc bấm <strong>Xem lời giải</strong>!`;
        }
      });
    }

    if (solBtn && fb) {
      solBtn.addEventListener("click", () => {
        fb.className = "quiz-feedback correct";
        fb.innerHTML = `📘 <strong>Lời giải chi tiết (Đáp số: ${q.answer.toFixed(2)} ${q.unit}):</strong><br/>${q.explanation}`;
      });
    }

    if (newBtn) {
      newBtn.addEventListener("click", () => {
        hubState.activeQuiz = buildTopicQuiz(topic);
        renderHandbookDetail();
      });
    }
  }

  function renderTopicEditor(container, topic) {
    container.innerHTML = `
      <div class="kh-editor-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border-color);">
          <div>
            <span class="kh-badge-group">CHẾ ĐỘ CẬP NHẬT SỔ TAY KIẾN THỨC</span>
            <h3 style="margin:0.25rem 0 0; color:var(--text-main);">✏️ Chỉnh Sửa Chuyên Đề: ${escapeHtml(topic.name)}</h3>
          </div>
          <button type="button" class="btn-secondary" id="khCancelEditBtn">✕ Hủy</button>
        </div>

        <form id="khTopicEditForm" class="kh-edit-form">
          <div class="kh-form-group">
            <label>📗 1. Định nghĩa &amp; Khái niệm cốt lõi:</label>
            <textarea id="khEditDef" rows="3" class="kh-textarea" required>${escapeHtml(topic.definition)}</textarea>
          </div>

          <div class="kh-form-group">
            <label>📘 2. Các Định lý &amp; Tính chất trọng tâm (Mỗi dòng 1 tính chất):</label>
            <textarea id="khEditProps" rows="6" class="kh-textarea" required>${escapeHtml((topic.properties || []).join("\n"))}</textarea>
          </div>

          <div class="kh-form-group">
            <label>📙 3. Mẹo giải nhanh &amp; Lưu ý trắc nghiệm (Mỗi dòng 1 mẹo):</label>
            <textarea id="khEditTips" rows="4" class="kh-textarea">${escapeHtml((topic.tips || []).join("\n"))}</textarea>
          </div>

          <div class="kh-form-group">
            <label>📝 4. Ghi chú bài giảng / Ví dụ bổ sung của riêng bạn:</label>
            <textarea id="khEditCustomNote" rows="4" class="kh-textarea" placeholder="Nhập ghi chú cá nhân, bài tập mẫu hoặc lưu ý giảng dạy cho chuyên đề này...">${escapeHtml(topic.customNote || "")}</textarea>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; pt:0.75rem;">
            <button type="button" class="cad-btn danger" id="khResetTopicDefaultBtn">↺ Khôi phục chuyên đề này về gốc</button>
            <div style="display:flex; gap:0.6rem;">
              <button type="button" class="btn-secondary" id="khCancelEditBtn2">Hủy bỏ</button>
              <button type="submit" class="btn-primary">💾 Lưu Cập Nhật Chuyên Đề</button>
            </div>
          </div>
        </form>
      </div>
    `;

    const cancel = () => {
      hubState.isEditingTopic = false;
      renderHandbookDetail();
    };
    document.getElementById("khCancelEditBtn").addEventListener("click", cancel);
    document.getElementById("khCancelEditBtn2").addEventListener("click", cancel);

    document.getElementById("khResetTopicDefaultBtn").addEventListener("click", () => {
      delete hubState.knowledgeOverrides[topic.id];
      saveKnowledgeOverrides();
      hubState.isEditingTopic = false;
      renderHandbookSidebar();
      renderHandbookDetail();
      if (typeof renderKnowledgePanel === "function") renderKnowledgePanel();
    });

    document.getElementById("khTopicEditForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const definition = document.getElementById("khEditDef").value.trim();
      const properties = document
        .getElementById("khEditProps")
        .value.split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const tips = document
        .getElementById("khEditTips")
        .value.split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const customNote = document.getElementById("khEditCustomNote").value.trim();

      hubState.knowledgeOverrides[topic.id] = {
        definition,
        properties,
        tips,
        customNote,
        updatedAt: new Date().toISOString()
      };

      saveKnowledgeOverrides();
      hubState.isEditingTopic = false;
      renderHandbookSidebar();
      renderHandbookDetail();
      if (typeof renderKnowledgePanel === "function") renderKnowledgePanel();
    });
  }

  function buildTopicQuiz(shape) {
    const rInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const a = rInt(3, 9);
    const h = rInt(4, 10);
    if (shape.id === "sphere") {
      return {
        question: `Trong không gian Oxyz, cho mặt cầu (S): x² + y² + z² = ${a * a} bị cắt bởi mặt phẳng (P): z = 0. Tính diện tích thiết diện tạo thành.`,
        answer: Math.PI * a * a,
        unit: "đvdt",
        explanation: `Mặt phẳng z = 0 đi qua tâm O(0;0;0) nên cắt mặt cầu theo đường tròn lớn bán kính R = ${a}. Diện tích thiết diện S = πR² ≈ ${(Math.PI * a * a).toFixed(2)}.`
      };
    } else if (shape.id === "circle") {
      return {
        question: `Cho đường tròn (C): (x - 1)² + (y + 2)² = ${a * a}. Tính chu vi của đường tròn (C).`,
        answer: 2 * Math.PI * a,
        unit: "đvđd",
        explanation: `Từ phương trình suy ra bán kính R = ${a}. Chu vi C = 2πR = 2 × π × ${a} ≈ ${(2 * Math.PI * a).toFixed(2)}.`
      };
    } else if (shape.id === "cube") {
      return {
        question: `Cho hình lập phương ABCD.A'B'C'D' có cạnh a = ${a} cm. Tính thể tích V của khối lập phương.`,
        answer: a * a * a,
        unit: "cm³",
        explanation: `Thể tích khối lập phương cạnh a: V = a³ = ${a}³ = ${a * a * a} cm³.`
      };
    } else if (shape.id === "line3d_velocity") {
      const vx = rInt(2, 6),
        vy = rInt(2, 6),
        vz = rInt(1, 5);
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      return {
        question: `Một vật chuyển động thẳng đều trong không gian Oxyz với vectơ vận tốc v⃗ = (${vx}; ${vy}; ${vz}) (m/s). Tính tốc độ |v⃗| của vật.`,
        answer: speed,
        unit: "m/s",
        explanation: `Độ lớn vận tốc: |v⃗| = √(${vx}² + ${vy}² + ${vz}²) = √${vx * vx + vy * vy + vz * vz} ≈ ${speed.toFixed(2)} m/s.`
      };
    } else {
      return {
        question: `Cho tam giác ABC có cạnh đáy a = ${a} cm và chiều cao tương ứng h = ${h} cm. Tính diện tích S của tam giác ABC.`,
        answer: 0.5 * a * h,
        unit: "cm²",
        explanation: `Áp dụng công thức S = ½ · a · h = 0.5 × ${a} × ${h} = ${(0.5 * a * h).toFixed(2)} cm².`
      };
    }
  }

  function exportKnowledgeJson() {
    const merged = getAllMergedTopics();
    const dataStr = JSON.stringify(merged, null, 2);
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pmath-knowledge-24-topics.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ==========================================================================
  // HELPERS & INITIALIZATION
  // ==========================================================================

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function initFormulaAndKnowledgeHub() {
    loadFormulasData();
    loadKnowledgeOverrides();

    // 1. Bind Formula Sheet Modal Controls
    const openFormulaBtns = [
      document.getElementById("topOpenFormulaSheetBtn"),
      document.getElementById("openCheatsheetBtn"),
      document.getElementById("heroBtnOpenFormulas"),
      document.getElementById("drawerOpenFormulaSheetBtn")
    ];
    openFormulaBtns.forEach((btn) => {
      if (btn) btn.addEventListener("click", () => openFormulaSheet());
    });

    const closeFormulaBtn = document.getElementById("closeCheatsheetBtn");
    const formulaDialog = document.getElementById("cheatsheetDialog");
    if (closeFormulaBtn && formulaDialog) {
      closeFormulaBtn.addEventListener("click", () => formulaDialog.close());
    }

    const formulaSearch = document.getElementById("formulaSearchInput");
    if (formulaSearch) {
      formulaSearch.addEventListener("input", (e) => {
        hubState.formulaSearchQuery = e.target.value;
        renderFormulaCards();
      });
    }

    const impFilterBtn = document.getElementById("formulaImportantToggleBtn");
    if (impFilterBtn) {
      impFilterBtn.addEventListener("click", () => {
        hubState.onlyImportantFormulas = !hubState.onlyImportantFormulas;
        impFilterBtn.classList.toggle("active", hubState.onlyImportantFormulas);
        renderFormulaCards();
      });
    }

    const addFormulaBtn = document.getElementById("openAddFormulaBtn");
    if (addFormulaBtn) {
      addFormulaBtn.addEventListener("click", () => openFormulaEditor(null));
    }

    const cancelFeBtn = document.getElementById("feCancelBtn");
    if (cancelFeBtn) cancelFeBtn.addEventListener("click", hideFormulaEditor);

    const feForm = document.getElementById("formulaEditForm");
    if (feForm) feForm.addEventListener("submit", handleSaveFormula);

    const feDelBtn = document.getElementById("feDeleteBtn");
    if (feDelBtn) feDelBtn.addEventListener("click", handleDeleteFormula);

    const exportFormulaBtn = document.getElementById("exportFormulasJsonBtn");
    if (exportFormulaBtn) exportFormulaBtn.addEventListener("click", exportFormulasJson);

    const resetFormulaBtn = document.getElementById("resetFormulasDefaultBtn");
    if (resetFormulaBtn) {
      resetFormulaBtn.addEventListener("click", () => {
        localStorage.removeItem(FORMULA_STORAGE_KEY);
        loadFormulasData();
        renderFormulaCategories();
        renderFormulaCards();
      });
    }

    // 2. Bind Knowledge Handbook Modal Controls
    const openHandbookBtns = [
      document.getElementById("toggleKnowledgeBtn"),
      document.getElementById("heroBtnOpenKnowledge"),
      document.getElementById("cardBtnKnowledge"),
      document.getElementById("expandFullHandbookBtn")
    ];
    openHandbookBtns.forEach((btn) => {
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          openKnowledgeHandbook();
        });
      }
    });

    const closeKhBtn = document.getElementById("closeKnowledgeHandbookBtn");
    const khDialog = document.getElementById("knowledgeHandbookDialog");
    if (closeKhBtn && khDialog) {
      closeKhBtn.addEventListener("click", () => khDialog.close());
    }

    const khSearch = document.getElementById("khSearchInput");
    if (khSearch) {
      khSearch.addEventListener("input", (e) => {
        hubState.topicSearchQuery = e.target.value;
        renderHandbookSidebar();
      });
    }

    document.querySelectorAll("#khFilterPills .kh-filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        hubState.activeTopicFilter = btn.dataset.kfilter;
        renderHandbookSidebar();
      });
    });

    const exportKhBtn = document.getElementById("exportKnowledgeJsonBtn");
    if (exportKhBtn) exportKhBtn.addEventListener("click", exportKnowledgeJson);
  }

  // Expose public API globally
  window.PMATH_Hub = {
    openFormulaSheet,
    openKnowledgeHandbook,
    getMergedTopic,
    getAllMergedTopics,
    refreshFormulas: renderFormulaCards,
    refreshHandbook: renderHandbookDetail
  };

  window.addEventListener("DOMContentLoaded", initFormulaAndKnowledgeHub);
})();
