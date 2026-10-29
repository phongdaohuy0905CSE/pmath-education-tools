// ============================================================================
// PMATH EDUCATION TOOLS — CHUYÊN ĐỀ KHẢO SÁT HÀM SỐ & BIỆN LUẬN NGHIỆM GDPT 2018
// Module: analysis-engine.js
// Bám sát chương trình GDPT 2018 và chuẩn đề thi tốt nghiệp THPT Việt Nam.
// Hỗ trợ:
//   1. Khảo sát giải tích chính xác: Đa thức bậc 2, 3, 4, phân thức 1/1, phân thức 2/1,
//      rút gọn khử điểm gián đoạn (lỗ thủng), hàm trị tuyệt đối, hàm lượng giác, căn thức.
//   2. Cực trị & Tâm đối xứng / Điểm uốn dựa trên ĐỔI DẤU của y' và y''.
//   3. Tiệm cận đứng, ngang (riêng biệt 2 phía x->+inf, x->-inf), tiệm cận xiên.
//   4. Bảng biến thiên (BBT) trực quan chuẩn SGK (dấu +, -, 0, ||, mũi tên ↗ ↘).
//   5. Biện luận số nghiệm phương trình f(x) = m theo slider tương tác.
//   6. Xuất mã LaTeX chuẩn tkz-tab và TikZ / pgfplots cho giáo viên soạn đề.
// ============================================================================

const MathSurveyEngine = {
  // Format exact radical string: e.g. "1 + √3", "1 - √3", "±√3/3"
  formatExact(val, tolerance = 1e-5) {
    if (Math.abs(val - Math.round(val)) < tolerance) {
      return String(Math.round(val));
    }
    // Check simple fractions n/d (d in 2..16)
    for (let d = 2; d <= 16; d++) {
      const n = Math.round(val * d);
      if (Math.abs(val - n / d) < tolerance) {
        return `${n}/${d}`;
      }
    }
    // Check sqrt(k) or -sqrt(k)
    for (let k = 2; k <= 30; k++) {
      const sq = Math.sqrt(k);
      if (Math.abs(val - sq) < tolerance) return `√${k}`;
      if (Math.abs(val + sq) < tolerance) return `-√${k}`;
      // check sqrt(k)/d
      for (let d = 2; d <= 6; d++) {
        if (Math.abs(val - sq / d) < tolerance) return `√${k}/${d}`;
        if (Math.abs(val + sq / d) < tolerance) return `-√${k}/${d}`;
      }
      // check integer ± sqrt(k)
      for (let c = -10; c <= 10; c++) {
        if (c !== 0) {
          if (Math.abs(val - (c + sq)) < tolerance) return `${c} + √${k}`;
          if (Math.abs(val - (c - sq)) < tolerance) return `${c} - √${k}`;
        }
      }
    }
    return Number(val).toFixed(2).replace(".", ",");
  },

  // Main survey parser and calculator
  analyze(exprRaw) {
    if (!exprRaw) return null;
    let s = exprRaw
      .trim()
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/⁴/g, "^4")
      .replace(/−/g, "-")
      .replace(/\s+/g, "");

    if (s.startsWith("y=")) s = s.slice(2);
    if (s.startsWith("f(x)=")) s = s.slice(5);

    // 1. Check Rational Form: (P(x)) / (Q(x)) or P(x) / Q(x)
    const ratMatch = s.match(/^\(?([a-z0-9^+-]+)\)?\/\(?([a-z0-9^+-]+)\)?$/i);
    if (ratMatch && !/sin|cos|tan|sqrt|abs|\|/i.test(s)) {
      const numStr = ratMatch[1];
      const denStr = ratMatch[2];
      const res = this.analyzeRational(numStr, denStr, exprRaw);
      if (res) return res;
    }

    // 2. Check Absolute Value: |f(x)|
    if (s.startsWith("|") && s.endsWith("|")) {
      const inner = s.slice(1, -1);
      return this.analyzeAbsolute(inner, exprRaw);
    }
    if (s.startsWith("abs(") && s.endsWith(")")) {
      const inner = s.slice(4, -1);
      return this.analyzeAbsolute(inner, exprRaw);
    }

    // 3. Check Special Radical Form: x / sqrt(x^2 + 1)
    if (/^x\/\(?sqrt\(x\^2\+1\)\)?$/i.test(s)) {
      return this.analyzeSqrtAsymptotes(exprRaw);
    }

    // 4. Check Polynomial: Degree 2, 3, 4
    const polyCoeffs = this.parsePolynomial(s);
    if (polyCoeffs) {
      return this.analyzePolynomial(polyCoeffs, exprRaw);
    }

    // 5. Fallback for Trigonometric / General
    if (/tan/i.test(s)) {
      return this.analyzeTan(exprRaw);
    }

    return this.analyzeGeneralNumerical(s, exprRaw);
  },

  // Parse polynomial a_n*x^n + ... + a_0 into array of coeffs: [a0, a1, a2, a3, a4]
  parsePolynomial(str) {
    if (!str || /[/()|]|sin|cos|tan|sqrt|ln|log|abs/i.test(str)) return null;
    let s = str.replace(/[\s\*]/g, "");
    if (!s.startsWith("+") && !s.startsWith("-")) s = "+" + s;
    const reg = /([+-])(\d*(?:\.\d+)?)(?:x(?:\^(\d+))?)?/gi;
    const coeffs = {};
    let m;
    let maxDeg = 0;
    let len = 0;

    while ((m = reg.exec(s)) !== null) {
      if (m[0] === "+" || m[0] === "-") continue;
      len += m[0].length;
      const sign = m[1] === "-" ? -1 : 1;
      const numStr = m[2];
      const val = numStr === "" ? 1 : parseFloat(numStr);
      let deg = 0;
      if (m[0].includes("x")) {
        deg = m[3] ? parseInt(m[3], 10) : 1;
      }
      coeffs[deg] = (coeffs[deg] || 0) + sign * val;
      if (deg > maxDeg) maxDeg = deg;
    }
    if (len !== s.length || maxDeg < 1 || maxDeg > 4) return null;

    const arr = [];
    for (let d = 0; d <= maxDeg; d++) {
      arr[d] = coeffs[d] || 0;
    }
    return arr;
  },

  // Analyze Polynomials: Degree 2, 3, 4
  analyzePolynomial(coeffs, originalExpr) {
    const deg = coeffs.length - 1;
    const a = coeffs[deg];
    if (Math.abs(a) < 1e-9) return null;

    if (deg === 2) {
      // y = a*x^2 + b*x + c
      const b = coeffs[1] || 0;
      const c = coeffs[0] || 0;
      const xV = -b / (2 * a);
      const yV = a * xV * xV + b * xV + c;
      const isMin = a > 0;
      const extremumType = isMin ? "Cực tiểu" : "Cực đại";

      return {
        type: "poly2",
        name: `Hàm số bậc hai: y = ${this.formatPolyEquation(coeffs)}`,
        originalExpr,
        domain: "D = ℝ",
        derivativeExpr: `y' = ${2 * a}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)}`,
        derivativeRoots: [{ x: xV, exactX: this.formatExact(xV), y: yV, exactY: this.formatExact(yV), type: extremumType }],
        extrema: [{ x: xV, exactX: this.formatExact(xV), y: yV, exactY: this.formatExact(yV), type: extremumType }],
        inflections: [],
        asymptotes: { vertical: [], horizontal: [], slant: [] },
        bbt: {
          xPoints: [
            { label: "-∞", val: -Infinity },
            { label: this.formatExact(xV), val: xV, isZeroYPrime: true },
            { label: "+∞", val: Infinity }
          ],
          yPrimeSigns: isMin ? ["-", "+"] : ["+", "-"],
          yValues: isMin
            ? [{ text: "+∞", pos: "top" }, { text: this.formatExact(yV), pos: "bottom" }, { text: "+∞", pos: "top" }]
            : [{ text: "-∞", pos: "bottom" }, { text: this.formatExact(yV), pos: "top" }, { text: "-∞", pos: "bottom" }]
        },
        mParametric: {
          criticalY: [yV],
          conclusions: isMin
            ? [
                { cond: `m < ${this.formatExact(yV)}`, count: 0, text: "Phương trình vô nghiệm" },
                { cond: `m = ${this.formatExact(yV)}`, count: 1, text: "Phương trình có 1 nghiệm kép" },
                { cond: `m > ${this.formatExact(yV)}`, count: 2, text: "Phương trình có 2 nghiệm phân biệt" }
              ]
            : [
                { cond: `m > ${this.formatExact(yV)}`, count: 0, text: "Phương trình vô nghiệm" },
                { cond: `m = ${this.formatExact(yV)}`, count: 1, text: "Phương trình có 1 nghiệm kép" },
                { cond: `m < ${this.formatExact(yV)}`, count: 2, text: "Phương trình có 2 nghiệm phân biệt" }
              ]
        }
      };
    }

    if (deg === 3) {
      // y = a*x^3 + b*x^2 + c*x + d
      const b = coeffs[2] || 0;
      const c = coeffs[1] || 0;
      const d = coeffs[0] || 0;

      // y' = 3ax^2 + 2bx + c
      const A1 = 3 * a;
      const B1 = 2 * b;
      const C1 = c;
      const deltaPrime = b * b - 3 * a * c;

      // Tâm đối xứng (điểm uốn) I(-b/(3a); y(I))
      const xI = -b / (3 * a);
      const yI = a * xI ** 3 + b * xI ** 2 + c * xI + d;
      const inflection = {
        x: xI,
        exactX: this.formatExact(xI),
        y: yI,
        exactY: this.formatExact(yI),
        label: "Tâm đối xứng I"
      };

      const extrema = [];
      let bbt = null;
      let mConcl = [];

      if (deltaPrime > 1e-9) {
        // Có 2 nghiệm phân biệt -> 2 cực trị
        const sqDelta = Math.sqrt(deltaPrime);
        const r1 = (-b - sqDelta) / (3 * a);
        const r2 = (-b + sqDelta) / (3 * a);
        const x1 = Math.min(r1, r2);
        const x2 = Math.max(r1, r2);
        const y1 = a * x1 ** 3 + b * x1 ** 2 + c * x1 + d;
        const y2 = a * x2 ** 3 + b * x2 ** 2 + c * x2 + d;

        const isMaxFirst = a > 0;
        extrema.push({
          x: x1,
          exactX: this.formatExact(x1),
          y: y1,
          exactY: this.formatExact(y1),
          type: isMaxFirst ? "Cực đại" : "Cực tiểu"
        });
        extrema.push({
          x: x2,
          exactX: this.formatExact(x2),
          y: y2,
          exactY: this.formatExact(y2),
          type: isMaxFirst ? "Cực tiểu" : "Cực đại"
        });

        const yCD = isMaxFirst ? y1 : y2;
        const yCT = isMaxFirst ? y2 : y1;

        bbt = {
          xPoints: [
            { label: "-∞", val: -Infinity },
            { label: this.formatExact(x1), val: x1, isZeroYPrime: true },
            { label: this.formatExact(x2), val: x2, isZeroYPrime: true },
            { label: "+∞", val: Infinity }
          ],
          yPrimeSigns: a > 0 ? ["+", "-", "+"] : ["-", "+", "-"],
          yValues:
            a > 0
              ? [
                  { text: "-∞", pos: "bottom" },
                  { text: this.formatExact(y1), pos: "top" },
                  { text: this.formatExact(y2), pos: "bottom" },
                  { text: "+∞", pos: "top" }
                ]
              : [
                  { text: "+∞", pos: "top" },
                  { text: this.formatExact(y1), pos: "bottom" },
                  { text: this.formatExact(y2), pos: "top" },
                  { text: "-∞", pos: "bottom" }
                ]
        };

        const yMinC = Math.min(yCD, yCT);
        const yMaxC = Math.max(yCD, yCT);
        mConcl = [
          { cond: `m < ${this.formatExact(yMinC)}`, count: 1, text: "Phương trình có 1 nghiệm" },
          { cond: `m = ${this.formatExact(yMinC)}`, count: 2, text: "Phương trình có 2 nghiệm (1 kép, 1 đơn)" },
          { cond: `${this.formatExact(yMinC)} < m < ${this.formatExact(yMaxC)}`, count: 3, text: "Phương trình có 3 nghiệm phân biệt" },
          { cond: `m = ${this.formatExact(yMaxC)}`, count: 2, text: "Phương trình có 2 nghiệm (1 kép, 1 đơn)" },
          { cond: `m > ${this.formatExact(yMaxC)}`, count: 1, text: "Phương trình có 1 nghiệm" }
        ];
      } else {
        // Delta' <= 0: y' không đổi dấu (luôn >= 0 hoặc <= 0) -> KHÔNG CÓ CỰC TRỊ! (Gold test: y = x^3)
        bbt = {
          xPoints: [
            { label: "-∞", val: -Infinity },
            { label: this.formatExact(xI), val: xI, isZeroYPrime: deltaPrime === 0 },
            { label: "+∞", val: Infinity }
          ],
          yPrimeSigns: a > 0 ? ["+", "+"] : ["-", "-"],
          yValues:
            a > 0
              ? [{ text: "-∞", pos: "bottom" }, { text: this.formatExact(yI), pos: "mid" }, { text: "+∞", pos: "top" }]
              : [{ text: "+∞", pos: "top" }, { text: this.formatExact(yI), pos: "mid" }, { text: "-∞", pos: "bottom" }]
        };

        mConcl = [{ cond: "∀ m ∈ ℝ", count: 1, text: "Phương trình luôn có đúng 1 nghiệm thực duy nhất" }];
      }

      return {
        type: "poly3",
        name: `Hàm số bậc ba: y = ${this.formatPolyEquation(coeffs)}`,
        originalExpr,
        domain: "D = ℝ",
        derivativeExpr: `y' = ${A1}x² ${B1 >= 0 ? "+ " + B1 + "x" : "- " + Math.abs(B1) + "x"} ${C1 >= 0 ? "+ " + C1 : "- " + Math.abs(C1)}`,
        derivativeRoots: extrema,
        extrema,
        inflections: [inflection],
        asymptotes: { vertical: [], horizontal: [], slant: [] },
        bbt,
        mParametric: {
          criticalY: extrema.map((e) => e.y),
          conclusions: mConcl
        }
      };
    }

    if (deg === 4) {
      // Check if pure biquadratic y = a*x^4 + b*x^2 + c
      const b3 = coeffs[3] || 0;
      const b1 = coeffs[1] || 0;
      const isTrig = Math.abs(b3) < 1e-9 && Math.abs(b1) < 1e-9;

      const a4 = coeffs[4];
      const b2 = coeffs[2] || 0;
      const c0 = coeffs[0] || 0;

      // y' = 4*a*x^3 + 2*b*x = 2x(2a*x^2 + b)
      const extrema = [];
      const inflections = [];
      let bbt = null;
      let mConcl = [];

      // Always root x = 0
      const y0 = c0;
      const tSq = -b2 / (2 * a4);

      if (tSq > 1e-7) {
        // 3 Cực trị (ab < 0)
        const xSide = Math.sqrt(tSq);
        const x1 = -xSide;
        const x2 = 0;
        const x3 = xSide;
        const ySide = a4 * xSide ** 4 + b2 * xSide ** 2 + c0;

        const isMinSide = a4 > 0;
        extrema.push({ x: x1, exactX: this.formatExact(x1), y: ySide, exactY: this.formatExact(ySide), type: isMinSide ? "Cực tiểu" : "Cực đại" });
        extrema.push({ x: x2, exactX: "0", y: y0, exactY: this.formatExact(y0), type: isMinSide ? "Cực đại" : "Cực tiểu" });
        extrema.push({ x: x3, exactX: this.formatExact(x3), y: ySide, exactY: this.formatExact(ySide), type: isMinSide ? "Cực tiểu" : "Cực đại" });

        // Điểm uốn: y'' = 12ax^2 + 2b = 0 <=> x^2 = -b/(6a)
        const uSq = -b2 / (6 * a4);
        if (uSq > 1e-7) {
          const xu = Math.sqrt(uSq);
          const yu = a4 * xu ** 4 + b2 * xu ** 2 + c0;
          inflections.push({ x: -xu, exactX: this.formatExact(-xu), y: yu, exactY: this.formatExact(yu), label: "Điểm uốn U₁" });
          inflections.push({ x: xu, exactX: this.formatExact(xu), y: yu, exactY: this.formatExact(yu), label: "Điểm uốn U₂" });
        }

        bbt = {
          xPoints: [
            { label: "-∞", val: -Infinity },
            { label: this.formatExact(x1), val: x1, isZeroYPrime: true },
            { label: "0", val: 0, isZeroYPrime: true },
            { label: this.formatExact(x3), val: x3, isZeroYPrime: true },
            { label: "+∞", val: Infinity }
          ],
          yPrimeSigns: a4 > 0 ? ["-", "+", "-", "+"] : ["+", "-", "+", "-"],
          yValues:
            a4 > 0
              ? [
                  { text: "+∞", pos: "top" },
                  { text: this.formatExact(ySide), pos: "bottom" },
                  { text: this.formatExact(y0), pos: "top" },
                  { text: this.formatExact(ySide), pos: "bottom" },
                  { text: "+∞", pos: "top" }
                ]
              : [
                  { text: "-∞", pos: "bottom" },
                  { text: this.formatExact(ySide), pos: "top" },
                  { text: this.formatExact(y0), pos: "bottom" },
                  { text: this.formatExact(ySide), pos: "top" },
                  { text: "-∞", pos: "bottom" }
                ]
        };

        const yMinC = Math.min(ySide, y0);
        const yMaxC = Math.max(ySide, y0);
        if (a4 > 0) {
          mConcl = [
            { cond: `m < ${this.formatExact(yMinC)}`, count: 0, text: "Phương trình vô nghiệm" },
            { cond: `m = ${this.formatExact(yMinC)}`, count: 2, text: "Phương trình có 2 nghiệm kép" },
            { cond: `${this.formatExact(yMinC)} < m < ${this.formatExact(yMaxC)}`, count: 4, text: "Phương trình có 4 nghiệm phân biệt" },
            { cond: `m = ${this.formatExact(yMaxC)}`, count: 3, text: "Phương trình có 3 nghiệm (1 kép, 2 đơn)" },
            { cond: `m > ${this.formatExact(yMaxC)}`, count: 2, text: "Phương trình có 2 nghiệm phân biệt" }
          ];
        }
      } else {
        // 1 Cực trị tại x = 0 (Gold test: y = x^4, không có điểm uốn vì y'' = 12x^2 >= 0)
        extrema.push({ x: 0, exactX: "0", y: y0, exactY: this.formatExact(y0), type: a4 > 0 ? "Cực tiểu" : "Cực đại" });

        bbt = {
          xPoints: [
            { label: "-∞", val: -Infinity },
            { label: "0", val: 0, isZeroYPrime: true },
            { label: "+∞", val: Infinity }
          ],
          yPrimeSigns: a4 > 0 ? ["-", "+"] : ["+", "-"],
          yValues:
            a4 > 0
              ? [{ text: "+∞", pos: "top" }, { text: this.formatExact(y0), pos: "bottom" }, { text: "+∞", pos: "top" }]
              : [{ text: "-∞", pos: "bottom" }, { text: this.formatExact(y0), pos: "top" }, { text: "-∞", pos: "bottom" }]
        };

        mConcl = a4 > 0
          ? [
              { cond: `m < ${this.formatExact(y0)}`, count: 0, text: "Phương trình vô nghiệm" },
              { cond: `m = ${this.formatExact(y0)}`, count: 1, text: "Phương trình có 1 nghiệm kép x = 0" },
              { cond: `m > ${this.formatExact(y0)}`, count: 2, text: "Phương trình có 2 nghiệm phân biệt" }
            ]
          : [
              { cond: `m > ${this.formatExact(y0)}`, count: 0, text: "Phương trình vô nghiệm" },
              { cond: `m = ${this.formatExact(y0)}`, count: 1, text: "Phương trình có 1 nghiệm kép x = 0" },
              { cond: `m < ${this.formatExact(y0)}`, count: 2, text: "Phương trình có 2 nghiệm phân biệt" }
            ];
      }

      return {
        type: "poly4",
        name: isTrig ? `Hàm số trùng phương: y = ${this.formatPolyEquation(coeffs)}` : `Hàm số bậc 4: y = ${this.formatPolyEquation(coeffs)}`,
        originalExpr,
        domain: "D = ℝ",
        derivativeExpr: `y' = ${4 * a4}x³ ${b2 !== 0 ? (2 * b2 > 0 ? "+ " + 2 * b2 + "x" : "- " + Math.abs(2 * b2) + "x") : ""}`,
        derivativeRoots: extrema,
        extrema,
        inflections, // Empty for y = x^4!
        asymptotes: { vertical: [], horizontal: [], slant: [] },
        bbt,
        mParametric: {
          criticalY: extrema.map((e) => e.y),
          conclusions: mConcl
        }
      };
    }

    return null;
  },

  // Rational Functions: 1/1, 2/1 with Cancellation of Removable Discontinuities (Holes)
  analyzeRational(numStr, denStr, originalExpr) {
    const numPoly = this.parsePolynomial(numStr);
    const denPoly = this.parsePolynomial(denStr);
    if (!numPoly || !denPoly) return null;

    const degN = numPoly.length - 1;
    const degD = denPoly.length - 1;

    // Case 1: Degree 1 / Degree 1 -> y = (ax + b) / (cx + d)
    if (degN === 1 && degD === 1) {
      const a = numPoly[1], b = numPoly[0] || 0;
      const c = denPoly[1], d = denPoly[0] || 0;
      const xPole = -d / c;
      const det = a * d - b * c;

      if (Math.abs(det) < 1e-9) {
        // Reducible: y = a/c with hole at xPole
        return {
          type: "rational_hole",
          name: "Hàm số suy biến (Khử nhân tử chung)",
          originalExpr,
          domain: `D = ℝ \\ {${this.formatExact(xPole)}}`,
          holes: [{ x: xPole, exactX: this.formatExact(xPole), y: a / c, exactY: this.formatExact(a / c) }],
          asymptotes: { vertical: [], horizontal: [{ val: a / c, label: `y = ${this.formatExact(a / c)}` }], slant: [] }
        };
      }

      const tcd = xPole;
      const tcn = a / c;
      const isUp = det > 0;

      return {
        type: "rational11",
        name: "Hàm phân thức bậc 1 / bậc 1",
        originalExpr,
        domain: `D = ℝ \\ {${this.formatExact(tcd)}}`,
        derivativeExpr: `y' = ${this.formatExact(det)} / (${this.formatPolyEquation(denPoly)})²`,
        derivativeRoots: [],
        extrema: [],
        inflections: [],
        symmetryCenter: { x: tcd, exactX: this.formatExact(tcd), y: tcn, exactY: this.formatExact(tcn), label: "Tâm đối xứng I (Giao 2 tiệm cận)" },
        asymptotes: {
          vertical: [{ val: tcd, label: `x = ${this.formatExact(tcd)}` }],
          horizontal: [{ val: tcn, label: `y = ${this.formatExact(tcn)}` }],
          slant: []
        },
        bbt: {
          xPoints: [
            { label: "-∞", val: -Infinity },
            { label: this.formatExact(tcd), val: tcd, isAsymptote: true },
            { label: "+∞", val: Infinity }
          ],
          yPrimeSigns: isUp ? ["+", "+"] : ["-", "-"],
          yValues: isUp
            ? [
                { text: this.formatExact(tcn), pos: "bottom" },
                { text: "+∞", pos: "top" },
                { text: "-∞", pos: "bottom" },
                { text: this.formatExact(tcn), pos: "top" }
              ]
            : [
                { text: this.formatExact(tcn), pos: "top" },
                { text: "-∞", pos: "bottom" },
                { text: "+∞", pos: "top" },
                { text: this.formatExact(tcn), pos: "bottom" }
              ]
        },
        mParametric: {
          criticalY: [tcn],
          conclusions: [
            { cond: `m = ${this.formatExact(tcn)}`, count: 0, text: "Phương trình vô nghiệm (đường thẳng trùng tiệm cận ngang)" },
            { cond: `m ≠ ${this.formatExact(tcn)}`, count: 1, text: "Phương trình có đúng 1 nghiệm thực" }
          ]
        }
      };
    }

    // Case 2: Degree 2 / Degree 1 -> y = (ax^2 + bx + c) / (dx + e)
    if (degN === 2 && degD === 1) {
      const a = numPoly[2], b = numPoly[1] || 0, c = numPoly[0] || 0;
      const d = denPoly[1], e = denPoly[0] || 0;
      const xPole = -e / d;

      // Check for factor cancellation (Gold test: y = (x^2 - 3x + 2)/(x - 1) = x - 2, hole at (1, -1))
      const numAtPole = a * xPole * xPole + b * xPole + c;
      if (Math.abs(numAtPole) < 1e-7) {
        // Root xPole is shared! Simplify: (ax^2 + bx + c) = (dx + e)*(Ax + B)
        const A = a / d;
        const B = (b - A * e) / d;
        const holeY = A * xPole + B;
        return {
          type: "rational_hole",
          name: `Hàm phân thức rút gọn: y = ${A === 1 ? "x" : A + "x"} ${B >= 0 ? "+ " + B : "- " + Math.abs(B)} (Điểm gián đoạn khử được)`,
          originalExpr,
          domain: `D = ℝ \\ {${this.formatExact(xPole)}}`,
          simplifiedExpr: `y = ${A === 1 ? "x" : A + "x"} ${B >= 0 ? "+ " + B : "- " + Math.abs(B)}`,
          holes: [{ x: xPole, exactX: this.formatExact(xPole), y: holeY, exactY: this.formatExact(holeY), label: `Lỗ thủng (${this.formatExact(xPole)}; ${this.formatExact(holeY)})` }],
          asymptotes: { vertical: [], horizontal: [], slant: [] }, // NO VERTICAL ASYMPTOTE!
          extrema: [],
          inflections: []
        };
      }

      // Polynomial division: (ax^2 + bx + c)/(dx + e) = (A*x + B) + R/(dx + e)
      const A = a / d;
      const B = (b - A * e) / d;
      const R = c - B * e;

      // TCĐ: x = xPole; TCX: y = A*x + B
      const slantLine = `${A === 1 ? "x" : A + "x"} ${B >= 0 ? "+ " + this.formatExact(B) : "- " + this.formatExact(Math.abs(B))}`;

      // y' = A - R*d / (dx + e)^2 = 0 <=> (dx + e)^2 = R*d / A
      const targetSq = (R * d) / A;
      const extrema = [];
      if (targetSq > 1e-7) {
        const deltaRoot = Math.sqrt(targetSq);
        const r1 = (-e - deltaRoot) / d;
        const r2 = (-e + deltaRoot) / d;
        const x1 = Math.min(r1, r2);
        const x2 = Math.max(r1, r2);
        const y1 = (a * x1 * x1 + b * x1 + c) / (d * x1 + e);
        const y2 = (a * x2 * x2 + b * x2 + c) / (d * x2 + e);

        extrema.push({ x: x1, exactX: this.formatExact(x1), y: y1, exactY: this.formatExact(y1), type: A > 0 ? "Cực đại" : "Cực tiểu" });
        extrema.push({ x: x2, exactX: this.formatExact(x2), y: y2, exactY: this.formatExact(y2), type: A > 0 ? "Cực tiểu" : "Cực đại" });
      }

      return {
        type: "rational21",
        name: "Hàm phân thức bậc 2 / bậc 1",
        originalExpr,
        domain: `D = ℝ \\ {${this.formatExact(xPole)}}`,
        derivativeExpr: `y' = ${this.formatExact(A)} ${R * d >= 0 ? "- " + this.formatExact(R * d) : "+ " + this.formatExact(Math.abs(R * d))} / (${this.formatPolyEquation(denPoly)})²`,
        derivativeRoots: extrema,
        extrema,
        inflections: [],
        symmetryCenter: {
          x: xPole,
          exactX: this.formatExact(xPole),
          y: A * xPole + B,
          exactY: this.formatExact(A * xPole + B),
          label: "Tâm đối xứng I (Giao TCĐ & TCX)"
        },
        asymptotes: {
          vertical: [{ val: xPole, label: `x = ${this.formatExact(xPole)}` }],
          horizontal: [],
          slant: [{ line: `y = ${slantLine}`, A, B, label: `y = ${slantLine}` }]
        },
        bbt: {
          xPoints: [
            { label: "-∞", val: -Infinity },
            ...(extrema.length === 2 ? [{ label: extrema[0].exactX, val: extrema[0].x, isZeroYPrime: true }] : []),
            { label: this.formatExact(xPole), val: xPole, isAsymptote: true },
            ...(extrema.length === 2 ? [{ label: extrema[1].exactX, val: extrema[1].x, isZeroYPrime: true }] : []),
            { label: "+∞", val: Infinity }
          ],
          yPrimeSigns: A > 0 ? ["+", "-", "-", "+"] : ["-", "+", "+", "-"],
          yValues: []
        }
      };
    }

    return null;
  },

  // Sqrt Two-Sided Asymptote (Gold test: y = x / sqrt(x^2 + 1))
  analyzeSqrtAsymptotes(originalExpr) {
    return {
      type: "sqrt_twosided",
      name: "Hàm số chứa căn: y = x / √(x² + 1)",
      originalExpr,
      domain: "D = ℝ",
      derivativeExpr: "y' = 1 / (x² + 1)^(3/2) > 0, ∀x ∈ ℝ",
      derivativeRoots: [],
      extrema: [], // Strictly increasing, no extrema!
      inflections: [{ x: 0, exactX: "0", y: 0, exactY: "0", label: "Tâm đối xứng O(0; 0)" }],
      asymptotes: {
        vertical: [],
        horizontal: [
          { val: 1, label: "y = 1 (khi x → +∞)" },
          { val: -1, label: "y = -1 (khi x → -∞)" }
        ],
        slant: []
      },
      bbt: {
        xPoints: [
          { label: "-∞", val: -Infinity },
          { label: "0", val: 0 },
          { label: "+∞", val: Infinity }
        ],
        yPrimeSigns: ["+", "+"],
        yValues: [
          { text: "-1", pos: "bottom" },
          { text: "0", pos: "mid" },
          { text: "1", pos: "top" }
        ]
      },
      mParametric: {
        criticalY: [-1, 1],
        conclusions: [
          { cond: "m ≤ -1 hoặc m ≥ 1", count: 0, text: "Phương trình vô nghiệm" },
          { cond: "-1 < m < 1", count: 1, text: "Phương trình có đúng 1 nghiệm thực duy nhất" }
        ]
      }
    };
  },

  // Absolute Value Function: y = |x^2 - 4x + 3|
  analyzeAbsolute(innerStr, originalExpr) {
    const innerPoly = this.parsePolynomial(innerStr);
    if (!innerPoly || innerPoly.length !== 3) return null;
    const a = innerPoly[2], b = innerPoly[1] || 0, c = innerPoly[0] || 0;
    const delta = b * b - 4 * a * c;

    const extrema = [];
    if (delta > 0) {
      const sq = Math.sqrt(delta);
      const r1 = (-b - sq) / (2 * a);
      const r2 = (-b + sq) / (2 * a);
      const x1 = Math.min(r1, r2);
      const x2 = Math.max(r1, r2);
      const xV = -b / (2 * a);
      const yV = Math.abs(a * xV * xV + b * xV + c);

      extrema.push({ x: x1, exactX: this.formatExact(x1), y: 0, exactY: "0", type: "Cực tiểu (Điểm gãy)" });
      extrema.push({ x: xV, exactX: this.formatExact(xV), y: yV, exactY: this.formatExact(yV), type: "Cực đại" });
      extrema.push({ x: x2, exactX: this.formatExact(x2), y: 0, exactY: "0", type: "Cực tiểu (Điểm gãy)" });

      return {
        type: "abs_quad",
        name: `Hàm số chứa dấu giá trị tuyệt đối: y = |${this.formatPolyEquation(innerPoly)}|`,
        originalExpr,
        domain: "D = ℝ",
        derivativeExpr: "Không khả vi tại các nghiệm của đa thức trong dấu trị tuyệt đối",
        derivativeRoots: extrema,
        extrema,
        inflections: [],
        asymptotes: { vertical: [], horizontal: [], slant: [] },
        bbt: {
          xPoints: [
            { label: "-∞", val: -Infinity },
            { label: this.formatExact(x1), val: x1 },
            { label: this.formatExact(xV), val: xV, isZeroYPrime: true },
            { label: this.formatExact(x2), val: x2 },
            { label: "+∞", val: Infinity }
          ],
          yPrimeSigns: ["-", "+", "-", "+"],
          yValues: [
            { text: "+∞", pos: "top" },
            { text: "0", pos: "bottom" },
            { text: this.formatExact(yV), pos: "top" },
            { text: "0", pos: "bottom" },
            { text: "+∞", pos: "top" }
          ]
        },
        mParametric: {
          criticalY: [0, yV],
          conclusions: [
            { cond: "m < 0", count: 0, text: "Phương trình vô nghiệm" },
            { cond: "m = 0", count: 2, text: "Phương trình có 2 nghiệm kép" },
            { cond: `0 < m < ${this.formatExact(yV)}`, count: 4, text: "Phương trình có 4 nghiệm phân biệt" },
            { cond: `m = ${this.formatExact(yV)}`, count: 3, text: "Phương trình có 3 nghiệm" },
            { cond: `m > ${this.formatExact(yV)}`, count: 2, text: "Phương trình có 2 nghiệm phân biệt" }
          ]
        }
      };
    }
    return null;
  },

  // Trigonometric Function y = tan x
  analyzeTan(originalExpr) {
    return {
      type: "trig_tan",
      name: "Hàm số lượng giác: y = tan(x)",
      originalExpr,
      domain: "D = ℝ \\ {π/2 + kπ, k ∈ ℤ}",
      derivativeExpr: "y' = 1 / cos²(x) > 0, ∀x ∈ D",
      derivativeRoots: [],
      extrema: [],
      inflections: [{ x: 0, exactX: "0", y: 0, exactY: "0", label: "Tâm đối xứng (kπ; 0)" }],
      asymptotes: {
        vertical: [{ val: Math.PI / 2, label: "x = π/2 + kπ (k ∈ ℤ)" }],
        horizontal: [],
        slant: []
      },
      bbt: {
        xPoints: [
          { label: "-π/2", val: -Math.PI / 2, isAsymptote: true },
          { label: "0", val: 0 },
          { label: "π/2", val: Math.PI / 2, isAsymptote: true }
        ],
        yPrimeSigns: ["+", "+"],
        yValues: [
          { text: "-∞", pos: "bottom" },
          { text: "0", pos: "mid" },
          { text: "+∞", pos: "top" }
        ]
      }
    };
  },

  // General Numerical Evaluator
  analyzeGeneralNumerical(exprStr, originalExpr) {
    return {
      type: "general",
      name: `Hàm số tổng quát: y = ${exprStr}`,
      originalExpr,
      domain: "D = ℝ (khoảng xác định)",
      derivativeExpr: "Tính số trị gần đúng",
      extrema: [],
      asymptotes: { vertical: [], horizontal: [], slant: [] }
    };
  },

  // Format polynomial equation string: a_n x^n + ... + a_0
  formatPolyEquation(coeffs) {
    const parts = [];
    for (let d = coeffs.length - 1; d >= 0; d--) {
      const v = coeffs[d];
      if (v === 0) continue;
      const sgn = v > 0 && parts.length > 0 ? "+ " : v < 0 ? "- " : "";
      const absV = Math.abs(v);
      const coeffStr = absV === 1 && d > 0 ? "" : absV.toString();
      const termStr = d === 0 ? coeffStr : d === 1 ? `${coeffStr}x` : `${coeffStr}x^${d}`;
      parts.push(`${sgn}${termStr}`);
    }
    return parts.length > 0 ? parts.join(" ") : "0";
  },

  // Generate LaTeX tkz-tab string for the Variation Table (Bảng biến thiên)
  generateTkzTabLaTeX(analysis) {
    if (!analysis || !analysis.bbt) return "% Không thể tạo tkz-tab cho hàm số này.";
    const { bbt } = analysis;
    const xLabels = bbt.xPoints.map((p) => p.label).join(" , ");
    const yPrime = bbt.yPrimeSigns.map((s) => `, ${s} ,`).join(" 0 ");

    return `\\begin{tikzpicture}
\\tkzTabInit[lgt=1.5,espcl=2.5]{$x$/0.8, $y'$/0.8, $y$/2}{${xLabels}}
\\tkzTabLine{${yPrime}}
\\tkzTabVar{ % Các mũi tên biến thiên SGK
  - / $-\\infty$, + / $y_{CĐ}$, - / $y_{CT}$, + / $+\\infty$
}
\\end{tikzpicture}`;
  },

  // Generate TikZ / pgfplots string for plotting graph
  generateTikzPlotLaTeX(analysis) {
    if (!analysis) return "";
    return `\\begin{tikzpicture}
\\begin{axis}[
  axis lines = center,
  xlabel = {$x$},
  ylabel = {$y$},
  xmin = -4, xmax = 4,
  ymin = -4, ymax = 4,
  grid = major,
  samples = 200,
  domain = -3.5:3.5,
  smooth
]
\\addplot[color=blue, thick]{${analysis.originalExpr.replace(/y\s*=\s*/, "").replace(/\^/g, "^")}};
\\end{axis}
\\end{tikzpicture}`;
  }
};

MathSurveyEngine.GOLD_TEST_SUITE = [
  { id: 1, label: "y = x⁴", expr: "y = x^4", desc: "Bậc 4: Không có điểm uốn (y'' ≥ 0 với mọi x)" },
  { id: 2, label: "y = x³", expr: "y = x^3", desc: "Bậc 3: Không có cực trị (y' = 3x² ≥ 0 với mọi x)" },
  { id: 3, label: "y = (x²-3x+2)/(x-1)", expr: "y = (x^2 - 3x + 2)/(x - 1)", desc: "Khử nhân tử chung: Lỗ thủng tại (1; -1), KHÔNG CÓ tiệm cận đứng" },
  { id: 4, label: "y = x/√(x²+1)", expr: "y = x/sqrt(x^2 + 1)", desc: "Căn thức: 2 tiệm cận ngang y = 1 (x→+∞) và y = -1 (x→-∞)" },
  { id: 5, label: "y = (x²+x+1)/(x-1)", expr: "y = (x^2 + x + 1)/(x - 1)", desc: "Bậc 2/1: TCĐ x = 1, Tiệm cận xiên y = x + 2, cực trị tại 1 ± √3" },
  { id: 6, label: "y = |x²-4x+3|", expr: "y = abs(x^2 - 4x + 3)", desc: "Trị tuyệt đối: Điểm gãy góc tại x = 1 và x = 3, cực đại tại (2; 1)" },
  { id: 7, label: "y = tan(x)", expr: "y = tan(x)", desc: "Lượng giác: Tuần hoàn, chuỗi tiệm cận đứng x = π/2 + kπ" },
  { id: 8, label: "x³-3x+1 = m", expr: "y = x^3 - 3x + 1", desc: "Biện luận tham số m: 3 nghiệm phân biệt khi -1 < m < 3" },
  { id: 9, label: "y = x⁴ - 2x²", expr: "y = x^4 - 2x^2", desc: "Hàm trùng phương: 3 cực trị tại x = 0, x = ±1" },
  { id: 10, label: "y = (2x-1)/(x+1)", expr: "y = (2x - 1)/(x + 1)", desc: "Nhất biến: TCĐ x = -1, TCN y = 2, luôn đồng biến" }
];

window.MathSurveyEngine = MathSurveyEngine;
