import * as pdfjsLib from "./pdf-VJcNm7C7.js";
import * as pdfjsWorker from "./pdf.worker-CI4BB1ED.js";

// Bind WorkerMessageHandler so PDF.js can run in-thread fake worker reliably
if (typeof globalThis !== "undefined") {
  globalThis.pdfjsWorker = pdfjsWorker;
}
if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker-CI4BB1ED.js", import.meta.url).href;
  } catch (_) {}
}

const g = 1240;
const r = () => new Promise(s => setTimeout(s, 0));

const MoClass = (typeof window !== "undefined" && window.__NR && window.__NR.Mo) || class Mo extends Error {
  constructor(n, r = "") {
    super(r ? `${n}: ${r}` : n);
    this.key = n;
    this.detail = r;
  }
};

async function getPdfModule() {
  if (typeof window !== "undefined" && window.__NR && typeof window.__NR.HB === "function") {
    try {
      return await window.__NR.HB();
    } catch (_) {}
  }
  return pdfjsLib;
}

async function m(s, l) {
  const d = await getPdfModule();
  let e;
  try {
    const loadingTask = d.getDocument({
      data: s,
      isEvalSupported: false,
      useSystemFonts: true
    });
    e = await loadingTask.promise;
  } catch (err) {
    console.error("[PMATH PDF] getDocument error:", err);
    throw new MoClass("pdfFailed", String(err && err.message ? err.message : err));
  }

  const i = [];
  try {
    const total = e.numPages;
    for (let a = 1; a <= total; a++) {
      if (typeof l === "function") l(a, total);
      await r();

      const o = await e.getPage(a);
      const c = o.getViewport({ scale: 1 });
      const targetScale = (c.width > 0) ? (g / c.width) : 1;
      const h = o.getViewport({ scale: targetScale });

      const t = document.createElement("canvas");
      t.width = Math.max(1, Math.ceil(h.width));
      t.height = Math.max(1, Math.ceil(h.height));

      const n = t.getContext("2d", { willReadFrequently: false });
      if (!n) throw new MoClass("pdfFailed", "Canvas context unavailable");

      n.fillStyle = "#ffffff";
      n.fillRect(0, 0, t.width, t.height);

      try {
        await o.render({ canvasContext: n, viewport: h }).promise;
      } catch (renderErr) {
        console.warn(`[PMATH PDF] Warning rendering page ${a}:`, renderErr);
      }

      i.push({
        src: t.toDataURL("image/jpeg", 0.92),
        width: c.width || 1240,
        height: c.height || 1754,
        page: a
      });

      if (typeof o.cleanup === "function") {
        try { o.cleanup(); } catch (_) {}
      }
      t.width = t.height = 0;
      await r();
    }
  } catch (loopErr) {
    console.error("[PMATH PDF] Render loop error:", loopErr);
    if (i.length === 0) {
      throw new MoClass("pdfFailed", String(loopErr && loopErr.message ? loopErr.message : loopErr));
    }
  } finally {
    if (e && typeof e.destroy === "function") {
      try { await e.destroy(); } catch (_) {}
    }
  }

  if (typeof l === "function") l(i.length, i.length);
  await r();
  return i;
}

export { m as pdfPictures };
