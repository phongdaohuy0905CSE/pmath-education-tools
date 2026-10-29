// ============================================================================
// PMATH EDUCATION TOOLS — Equations Parser, Math Evaluator & Intersection Engine
// Hỗ trợ: Đường thẳng, Đường tròn, Elip, Parabol, Đa thức bậc 3/4/n, Phân thức,
// Lượng giác, Mũ/Logarit, Căn thức, Đường cong ẩn F(x,y)=0, Mặt phẳng, Mặt cầu,
// Đường thẳng 3D và Mặt cong 3D z = f(x,y)
// ============================================================================

const GeoEquations = {
  // Normalize math string: superscripts, spaces, unicode minus
  normalize(raw) {
    return raw
      .trim()
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/⁴/g, "^4")
      .replace(/−/g, "-")
      .replace(/–/g, "-")
      .replace(/·/g, "*")
      .replace(/×/g, "*")
      .replace(/\s+/g, "");
  },

  // ==========================================================================
  // SAFE & FAST RPN MATH COMPILER (Supports x, y, z, ^, sin, cos, tan, cot,
  // sqrt, cbrt, abs, |...|, ln, log, exp, pi, e, and implicit multiplication)
  // ==========================================================================
  preprocessAbsBars(str) {
    // Convert |expr| into abs(expr)
    let out = "";
    let open = false;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "|") {
        out += open ? ")" : "abs(";
        open = !open;
      } else {
        out += str[i];
      }
    }
    return out;
  },

  compileExpr(rawExpr) {
    try {
      let s = this.preprocessAbsBars(this.normalize(rawExpr).toLowerCase());
      s = s.replace(/π/g, "pi");
      if (!s) return null;

      // Tokenize
      const tokens = [];
      let i = 0;
      const fnNames = new Set([
        "sin", "cos", "tan", "cot", "asin", "acos", "atan",
        "sqrt", "cbrt", "abs", "ln", "log", "exp", "floor", "ceil"
      ]);

      while (i < s.length) {
        const ch = s[i];
        if (/\d|\./.test(ch)) {
          let numStr = "";
          while (i < s.length && /[\d.]/.test(s[i])) {
            numStr += s[i++];
          }
          const val = parseFloat(numStr);
          if (isNaN(val)) return null;
          tokens.push({ type: "num", val });
          continue;
        }
        if (/[a-z]/.test(ch)) {
          let id = "";
          while (i < s.length && /[a-z0-9_]/.test(s[i])) {
            id += s[i++];
          }
          if (id === "pi") {
            tokens.push({ type: "num", val: Math.PI });
          } else if (id === "e") {
            tokens.push({ type: "num", val: Math.E });
          } else if (fnNames.has(id)) {
            tokens.push({ type: "fn", name: id });
          } else {
            // Split implicit variable products like "xy", "x", "y", "z"
            for (let k = 0; k < id.length; k++) {
              const v = id[k];
              if (v === "x" || v === "y" || v === "z") {
                tokens.push({ type: "var", name: v });
              } else {
                return null;
              }
            }
          }
          continue;
        }
        if ("+-*/^()".includes(ch)) {
          tokens.push({ type: "sym", val: ch });
          i++;
          continue;
        }
        return null;
      }

      // Insert implicit multiplication '*' where needed:
      // e.g. 2x, 2(x+1), (x+1)(x-1), x(x+1), 2sin(x), )x
      const expanded = [];
      for (let idx = 0; idx < tokens.length; idx++) {
        const curr = tokens[idx];
        if (idx > 0) {
          const prev = tokens[idx - 1];
          const prevIsVal =
            prev.type === "num" ||
            prev.type === "var" ||
            (prev.type === "sym" && prev.val === ")");
          const currIsVal =
            curr.type === "num" ||
            curr.type === "var" ||
            curr.type === "fn" ||
            (curr.type === "sym" && curr.val === "(");
          if (prevIsVal && currIsVal && !(prev.type === "fn" && curr.val === "(")) {
            expanded.push({ type: "sym", val: "*" });
          }
        }
        expanded.push(curr);
      }

      // Shunting-yard to RPN
      // Note: In standard math notation, -x^2 means -(x^2), so unary minus 'u-'
      // has precedence 2.5 (above * / at 2, below ^ at 4)!
      const output = [];
      const opStack = [];
      const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "u-": 2.5, "u+": 2.5, "^": 4 };
      const rightAssoc = { "^": true, "u-": true, "u+": true };

      for (let idx = 0; idx < expanded.length; idx++) {
        const t = expanded[idx];
        if (t.type === "num" || t.type === "var") {
          output.push(t);
        } else if (t.type === "fn") {
          opStack.push(t);
        } else if (t.type === "sym") {
          if (t.val === "(") {
            opStack.push(t);
          } else if (t.val === ")") {
            let foundParen = false;
            while (opStack.length > 0) {
              const top = opStack.pop();
              if (top.type === "sym" && top.val === "(") {
                foundParen = true;
                break;
              }
              output.push(top);
            }
            if (!foundParen) return null;
            if (opStack.length > 0 && opStack[opStack.length - 1].type === "fn") {
              output.push(opStack.pop());
            }
          } else {
            let op = t.val;
            const prev = idx > 0 ? expanded[idx - 1] : null;
            const isUnary =
              !prev ||
              (prev.type === "sym" && prev.val !== ")");
            if (isUnary && (op === "-" || op === "+")) {
              op = op === "-" ? "u-" : "u+";
            }
            while (opStack.length > 0) {
              const top = opStack[opStack.length - 1];
              if (top.type === "sym" && top.val !== "(") {
                const pTop = prec[top.val] || 0;
                const pCurr = prec[op] || 0;
                if (pTop > pCurr || (pTop === pCurr && !rightAssoc[op])) {
                  output.push(opStack.pop());
                  continue;
                }
              }
              break;
            }
            opStack.push({ type: "sym", val: op });
          }
        }
      }

      while (opStack.length > 0) {
        const top = opStack.pop();
        if (top.type === "sym" && (top.val === "(" || top.val === ")")) return null;
        output.push(top);
      }

      if (output.length === 0) return null;

      // Return fast evaluator function(x, y, z)
      return function evalRPN(x = 0, y = 0, z = 0) {
        const st = [];
        for (let k = 0; k < output.length; k++) {
          const item = output[k];
          if (item.type === "num") {
            st.push(item.val);
          } else if (item.type === "var") {
            st.push(item.name === "x" ? x : item.name === "y" ? y : z);
          } else if (item.type === "sym") {
            if (item.val === "u-") {
              if (st.length < 1) return NaN;
              st[st.length - 1] = -st[st.length - 1];
            } else if (item.val === "u+") {
              if (st.length < 1) return NaN;
            } else {
              if (st.length < 2) return NaN;
              const b = st.pop();
              const a = st.pop();
              switch (item.val) {
                case "+": st.push(a + b); break;
                case "-": st.push(a - b); break;
                case "*": st.push(a * b); break;
                case "/": st.push(Math.abs(b) < 1e-12 ? NaN : a / b); break;
                case "^": {
                  // Support odd roots of negative numbers e.g. x^(1/3)
                  if (a < 0 && !Number.isInteger(b)) {
                    st.push(NaN);
                  } else {
                    st.push(Math.pow(a, b));
                  }
                  break;
                }
                default: return NaN;
              }
            }
          } else if (item.type === "fn") {
            if (st.length < 1) return NaN;
            const a = st.pop();
            switch (item.name) {
              case "sin": st.push(Math.sin(a)); break;
              case "cos": st.push(Math.cos(a)); break;
              case "tan": st.push(Math.abs(Math.cos(a)) < 1e-10 ? NaN : Math.tan(a)); break;
              case "cot": st.push(Math.abs(Math.sin(a)) < 1e-10 ? NaN : Math.cos(a) / Math.sin(a)); break;
              case "asin": st.push(Math.asin(a)); break;
              case "acos": st.push(Math.acos(a)); break;
              case "atan": st.push(Math.atan(a)); break;
              case "sqrt": st.push(a < 0 ? NaN : Math.sqrt(a)); break;
              case "cbrt": st.push(Math.cbrt(a)); break;
              case "abs": st.push(Math.abs(a)); break;
              case "ln": st.push(a <= 0 ? NaN : Math.log(a)); break;
              case "log": st.push(a <= 0 ? NaN : Math.log10(a)); break;
              case "exp": st.push(Math.exp(a)); break;
              case "floor": st.push(Math.floor(a)); break;
              case "ceil": st.push(Math.ceil(a)); break;
              default: return NaN;
            }
          }
        }
        return st.length === 1 ? st[0] : NaN;
      };
    } catch (e) {
      return null;
    }
  },

  evalFunc2D(obj, x) {
    if (obj.type === "parabola2d") {
      return obj.a * x * x + obj.b * x + obj.c;
    }
    if (obj.type === "func2d") {
      if (!obj._compiled) {
        obj._compiled = this.compileExpr(obj.expr);
      }
      return obj._compiled ? obj._compiled(x, 0, 0) : NaN;
    }
    return NaN;
  },

  // Parse linear expression in x, y, z on one side: returns { a, b, c, d } for ax + by + cz + d
  parseLinearExpr(exprStr) {
    let s = exprStr.replace(/\*/g, "");
    if (!s.startsWith("+") && !s.startsWith("-")) s = "+" + s;
    const tokenRegex = /([+-])(\d*(?:\.\d+)?)([xyzXYZ])?/g;
    let a = 0, b = 0, c = 0, d = 0;
    let match;
    let matchedLen = 0;

    while ((match = tokenRegex.exec(s)) !== null) {
      if (match[0] === "+" || match[0] === "-") continue;
      matchedLen += match[0].length;
      const sign = match[1] === "-" ? -1 : 1;
      const numStr = match[2];
      const variable = match[3] ? match[3].toLowerCase() : null;
      const val = numStr === "" ? 1 : parseFloat(numStr);
      if (isNaN(val)) return null;

      if (variable === "x") a += sign * val;
      else if (variable === "y") b += sign * val;
      else if (variable === "z") c += sign * val;
      else d += sign * val;
    }
    if (matchedLen !== s.length) return null;
    return { a, b, c, d };
  },

  // Main entry: parse equation string into a scene object (2D or 3D)
  parse(rawInput, currentSpaceMode = "2d") {
    const raw = rawInput.trim();
    if (!raw) return { error: "Vui lòng nhập phương trình, hàm số hoặc tọa độ." };

    // 1. Check Point 2D or 3D: e.g., A(2, 3) or M(1, -2, 4) or (2, 3)
    const ptMatch = raw.match(
      /^([A-Za-z_]\w*)?\s*\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)(?:\s*,\s*([+-]?\d+(?:\.\d+)?))?\s*\)$/
    );
    if (ptMatch) {
      const name = ptMatch[1] || "P";
      const x = parseFloat(ptMatch[2]);
      const y = parseFloat(ptMatch[3]);
      if (ptMatch[4] !== undefined) {
        const z = parseFloat(ptMatch[4]);
        return {
          space: "3d",
          type: "point3d",
          name,
          x, y, z,
          dropline: true,
          equationText: `${name}(${x}, ${y}, ${z})`
        };
      }
      return {
        space: "2d",
        type: "point2d",
        name,
        x, y,
        equationText: `${name}(${x}, ${y})`
      };
    }

    // 1b. Check 3D Vector: e.g. u = (1, 2, 3), v = (3, -1, 2), vec(1, 2, 3)
    const mNamedVec = raw.match(
      /^([A-Za-z_]\w*)\s*=\s*\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)$/i
    );
    const mAnonVec = raw.match(
      /^vec(?:tor)?\s*\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)$/i
    );
    if (mNamedVec || mAnonVec) {
      let vName = "u⃗";
      let vx = 0, vy = 0, vz = 0;
      if (mNamedVec) {
        vName = `${mNamedVec[1]}⃗`;
        vx = parseFloat(mNamedVec[2]);
        vy = parseFloat(mNamedVec[3]);
        vz = parseFloat(mNamedVec[4]);
      } else {
        vx = parseFloat(mAnonVec[1]);
        vy = parseFloat(mAnonVec[2]);
        vz = parseFloat(mAnonVec[3]);
      }
      return {
        space: "3d",
        type: "vector3d",
        name: vName,
        x: vx,
        y: vy,
        z: vz,
        x0: 0,
        y0: 0,
        z0: 0,
        equationText: `${vName} = (${vx}, ${vy}, ${vz})`
      };
    }

    // 1c. Check 3D Parametric Space Curve: e.g. (cos(t), sin(t), 0.25*t)
    const curveMatch = raw.match(/^\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)$/);
    if (curveMatch && (/t/i.test(raw) || /cos|sin|tan/i.test(raw))) {
      return {
        space: "3d",
        type: "curve3d",
        name: "γ(t)",
        fxExpr: curveMatch[1].trim(),
        fyExpr: curveMatch[2].trim(),
        fzExpr: curveMatch[3].trim(),
        tMin: -8,
        tMax: 8,
        equationText: raw
      };
    }

    const norm = this.normalize(raw);

    // 2. Check 3D Parametric Line: x=x0+at,y=y0+bt,z=z0+ct
    if (/x=.*t/i.test(norm) && /y=.*t/i.test(norm) && /z=/i.test(norm)) {
      const parts = norm.split(/[,;]/);
      const parseParam = (str, vName) => {
        const m = str.match(new RegExp(`^${vName}=(.+)$`, "i"));
        if (!m) return null;
        let rhs = m[1].replace(/\*/g, "");
        if (!rhs.startsWith("+") && !rhs.startsWith("-")) rhs = "+" + rhs;
        let p0 = 0, dir = 0;
        const reg = /([+-])(\d*(?:\.\d+)?)(t)?/gi;
        let mt;
        while ((mt = reg.exec(rhs)) !== null) {
          if (mt[0] === "+" || mt[0] === "-") continue;
          const sgn = mt[1] === "-" ? -1 : 1;
          const v = mt[2] === "" ? 1 : parseFloat(mt[2]);
          if (mt[3]) dir += sgn * v;
          else p0 += sgn * v;
        }
        return { p0, dir };
      };
      const px = parts.map((p) => parseParam(p, "x")).find(Boolean);
      const py = parts.map((p) => parseParam(p, "y")).find(Boolean);
      const pz = parts.map((p) => parseParam(p, "z")).find(Boolean);
      if (px && py && pz) {
        return {
          space: "3d",
          type: "line3d",
          name: "d",
          x0: px.p0, y0: py.p0, z0: pz.p0,
          ux: px.dir, uy: py.dir, uz: pz.dir,
          equationText: raw
        };
      }
    }

    // 3. Check 3D Canonical Line: (x-x0)/a = (y-y0)/b = (z-z0)/c
    const canonMatch = norm.match(
      /^\(?x([+-]\d+(?:\.\d+)?)?\)?\/([+-]?\d+(?:\.\d+)?)=\(?y([+-]\d+(?:\.\d+)?)?\)?\/([+-]?\d+(?:\.\d+)?)=\(?z([+-]\d+(?:\.\d+)?)?\)?\/([+-]?\d+(?:\.\d+)?)$/i
    );
    if (canonMatch) {
      const x0 = canonMatch[1] ? -parseFloat(canonMatch[1]) : 0;
      const ux = parseFloat(canonMatch[2]);
      const y0 = canonMatch[3] ? -parseFloat(canonMatch[3]) : 0;
      const uy = parseFloat(canonMatch[4]);
      const z0 = canonMatch[5] ? -parseFloat(canonMatch[5]) : 0;
      const uz = parseFloat(canonMatch[6]);
      return {
        space: "3d",
        type: "line3d",
        name: "d",
        x0, y0, z0, ux, uy, uz,
        equationText: raw
      };
    }

    // 4. Check 3D Sphere Standard Form: (x-a)^2 + (y-b)^2 + (z-c)^2 = R^2
    const sphereStdRegex =
      /^(?:\(x([+-]\d+(?:\.\d+)?)\)\^2|x\^2)\+(?:\(y([+-]\d+(?:\.\d+)?)\)\^2|y\^2)\+(?:\(z([+-]\d+(?:\.\d+)?)\)\^2|z\^2)=([+-]?\d+(?:\.\d+)?(?:\^2)?)$/i;
    const spMatch = norm.match(sphereStdRegex);
    if (spMatch) {
      const cx = spMatch[1] ? -parseFloat(spMatch[1]) : 0;
      const cy = spMatch[2] ? -parseFloat(spMatch[2]) : 0;
      const cz = spMatch[3] ? -parseFloat(spMatch[3]) : 0;
      let rhs = spMatch[4];
      const rSq = rhs.endsWith("^2") ? Math.pow(parseFloat(rhs), 2) : parseFloat(rhs);
      if (rSq <= 0) return { error: "Bán kính mặt cầu R² phải lớn hơn 0." };
      return {
        space: "3d",
        type: "sphere3d",
        name: "S",
        cx, cy, cz,
        r: Math.sqrt(rSq),
        equationText: raw
      };
    }

    // 5. Check 3D Sphere Expanded Form: x^2 + y^2 + z^2 + Ax + By + Cz + D = 0
    if (/x\^2\+y\^2\+z\^2/i.test(norm) && norm.includes("=")) {
      const [lhs, rhs] = norm.split("=");
      const restLhs = lhs.replace(/x\^2\+y\^2\+z\^2/i, "");
      const linL = this.parseLinearExpr(restLhs || "0");
      const linR = this.parseLinearExpr(rhs || "0");
      if (linL && linR) {
        const A = linL.a - linR.a;
        const B = linL.b - linR.b;
        const C = linL.c - linR.c;
        const D = linL.d - linR.d;
        const cx = -A / 2;
        const cy = -B / 2;
        const cz = -C / 2;
        const rSq = cx * cx + cy * cy + cz * cz - D;
        if (rSq <= 0) return { error: "Phương trình mặt cầu vô nghiệm (a² + b² + c² - d ≤ 0)." };
        return {
          space: "3d",
          type: "sphere3d",
          name: "S",
          cx, cy, cz,
          r: Math.sqrt(rSq),
          equationText: raw
        };
      }
    }

    // 6. Check 2D Circle Standard Form: (x-a)^2 + (y-b)^2 = R^2
    const circleStdRegex =
      /^(?:\(x([+-]\d+(?:\.\d+)?)\)\^2|x\^2)\+(?:\(y([+-]\d+(?:\.\d+)?)\)\^2|y\^2)=([+-]?\d+(?:\.\d+)?(?:\^2)?)$/i;
    const cirMatch = norm.match(circleStdRegex);
    if (cirMatch) {
      const cx = cirMatch[1] ? -parseFloat(cirMatch[1]) : 0;
      const cy = cirMatch[2] ? -parseFloat(cirMatch[2]) : 0;
      let rhs = cirMatch[3];
      const rSq = rhs.endsWith("^2") ? Math.pow(parseFloat(rhs), 2) : parseFloat(rhs);
      if (rSq <= 0) return { error: "Bán kính đường tròn R² phải lớn hơn 0." };
      return {
        space: "2d",
        type: "circle2d",
        name: "C",
        cx, cy,
        r: Math.sqrt(rSq),
        equationText: raw
      };
    }

    // 7. Check 2D Circle Expanded Form: x^2 + y^2 + Ax + By + C = 0
    if (/^x\^2\+y\^2/i.test(norm) && norm.includes("=")) {
      const [lhs, rhs] = norm.split("=");
      const restLhs = lhs.replace(/^x\^2\+y\^2/i, "");
      const linL = this.parseLinearExpr(restLhs || "0");
      const linR = this.parseLinearExpr(rhs || "0");
      if (linL && linR && linL.c === 0 && linR.c === 0) {
        const A = linL.a - linR.a;
        const B = linL.b - linR.b;
        const C = linL.d - linR.d;
        const cx = -A / 2;
        const cy = -B / 2;
        const rSq = cx * cx + cy * cy - C;
        if (rSq <= 0) return { error: "Phương trình đường tròn không hợp lệ (a² + b² - c ≤ 0)." };
        return {
          space: "2d",
          type: "circle2d",
          name: "C",
          cx, cy,
          r: Math.sqrt(rSq),
          equationText: raw
        };
      }
    }

    // 8. Check 2D Ellipse: x^2/a^2 + y^2/b^2 = 1
    const elMatch = norm.match(/^x\^2\/(\d+(?:\.\d+)?)\+y\^2\/(\d+(?:\.\d+)?)=1$/i);
    if (elMatch) {
      const a2 = parseFloat(elMatch[1]);
      const b2 = parseFloat(elMatch[2]);
      if (a2 > 0 && b2 > 0) {
        return {
          space: "2d",
          type: "ellipse2d",
          name: "E",
          rx: Math.sqrt(a2),
          ry: Math.sqrt(b2),
          cx: 0,
          cy: 0,
          equationText: raw
        };
      }
    }

    // 9. Check Linear Equation in 2D or 3D: ax + by + cz + d = 0 (or y = kx + m)
    if (norm.includes("=")) {
      const parts = norm.split("=");
      if (parts.length === 2) {
        const left = this.parseLinearExpr(parts[0]);
        const right = this.parseLinearExpr(parts[1]);
        if (left && right) {
          const a = left.a - right.a;
          const b = left.b - right.b;
          const c = left.c - right.c;
          const d = left.d - right.d;

          if (a === 0 && b === 0 && c === 0) {
            return { error: "Phương trình suy biến (không chứa biến x, y, z)." };
          }

          if (c !== 0 || currentSpaceMode === "3d") {
            return {
              space: "3d",
              type: "plane3d",
              name: "α",
              a, b, c, d,
              equationText: raw
            };
          } else {
            return {
              space: "2d",
              type: "line2d",
              name: "d",
              a, b, c: d,
              equationText: raw
            };
          }
        }
      }
    }

    // 10. Check 2D Standard Parabola: y = ax^2 + bx + c (so user gets a,b,c numeric inputs)
    if (/^y=/i.test(norm) && norm.includes("x^2") && !/x\^[3-9]|\/|sin|cos|tan|sqrt|ln|log|abs|\|/i.test(norm)) {
      let rhs = norm.slice(2).replace(/\*/g, "");
      if (!rhs.startsWith("+") && !rhs.startsWith("-")) rhs = "+" + rhs;
      const reg = /([+-])(\d*(?:\.\d+)?)(x\^2|x)?/gi;
      let a = 0, b = 0, c = 0;
      let m;
      let len = 0;
      while ((m = reg.exec(rhs)) !== null) {
        if (m[0] === "+" || m[0] === "-") continue;
        len += m[0].length;
        const sgn = m[1] === "-" ? -1 : 1;
        const val = m[2] === "" ? 1 : parseFloat(m[2]);
        const v = (m[3] || "").toLowerCase();
        if (v === "x^2") a += sgn * val;
        else if (v === "x") b += sgn * val;
        else c += sgn * val;
      }
      if (len === rhs.length && a !== 0) {
        return {
          space: "2d",
          type: "parabola2d",
          name: "P",
          a, b, c,
          equationText: raw
        };
      }
    }

    // 11. GENERAL 2D FUNCTION y = f(x) or f(x) = ... or bare expression in x (e.g. y = x^3, y = (2x-1)/(x+1), sin(x), x^4-2x^2)
    let fnExpr = null;
    if (/^(?:y|f\(x\)|g\(x\)|h\(x\))=/i.test(norm)) {
      fnExpr = norm.replace(/^(?:y|f\(x\)|g\(x\)|h\(x\))=/i, "");
    } else if (/^.+=\s*y$/i.test(norm)) {
      fnExpr = norm.replace(/=y$/i, "");
    } else if (!norm.includes("=") && !/[yz]/i.test(norm)) {
      fnExpr = norm;
    }

    if (fnExpr && !/[yz]/i.test(fnExpr.replace(/exp/gi, ""))) {
      const compiled = this.compileExpr(fnExpr);
      if (compiled) {
        return {
          space: "2d",
          type: "func2d",
          name: "f(x)",
          expr: fnExpr,
          equationText: raw.includes("=") ? raw : `y = ${raw}`,
          knowledgeId: "parabola_conics"
        };
      }
    }

    // 12. Explicit 2D Function x = g(y) (e.g. x = y^2 - 4, x = sin(y))
    if (/^x=/i.test(norm)) {
      const rhsY = norm.slice(2);
      if (!/[xz]/i.test(rhsY.replace(/exp/gi, ""))) {
        const compiled = this.compileExpr(rhsY);
        if (compiled) {
          return {
            space: "2d",
            type: "funcY2d",
            name: "g(y)",
            expr: rhsY,
            equationText: raw
          };
        }
      }
    }

    // 13. 3D Surface z = f(x, y) (e.g. z = x^2 + y^2, z = x^2 - y^2, z = sin(x)*cos(y))
    if (/^z=/i.test(norm)) {
      const rhsXY = norm.slice(2);
      const compiled = this.compileExpr(rhsXY);
      if (compiled) {
        return {
          space: "3d",
          type: "surface3d",
          name: "z(x,y)",
          expr: rhsXY,
          equationText: raw,
          knowledgeId: "sphere"
        };
      }
    }

    // 14. General 2D Implicit Curve F(x, y) = G(x, y) (e.g. x^3 + y^3 - 3xy = 0, x^2 - y^2 = 4)
    if (norm.includes("=")) {
      const [lhs, rhs] = norm.split("=");
      if (lhs && rhs && !/z/i.test(norm)) {
        const compL = this.compileExpr(lhs);
        const compR = this.compileExpr(rhs);
        if (compL && compR) {
          return {
            space: "2d",
            type: "implicit2d",
            name: "F(x,y)",
            lhsExpr: lhs,
            rhsExpr: rhs,
            equationText: raw
          };
        }
      }
    }

    return {
      error:
        "Không nhận diện được cú pháp. Ví dụ hợp lệ: y = x^3 - 3x + 1, y = (2x-1)/(x+1), y = sin(x), 2x - y + 1 = 0, (x-1)^2 + (y+2)^2 = 9, x^2 - y^2 = 4, x + y + z - 3 = 0, x^2 + y^2 + z^2 = 16"
    };
  },

  // ==========================================================================
  // 2D INTERSECTION & INTERACTION CALCULATOR
  // ==========================================================================
  get2DLineCoeffs(obj) {
    if (obj.type === "line2d") {
      return { a: obj.a, b: obj.b, c: obj.c, isSegment: false };
    }
    if (obj.type === "segment2d") {
      const p1 = obj.p1;
      const p2 = obj.p2;
      const a = p1.y - p2.y;
      const b = p2.x - p1.x;
      const c = p1.x * p2.y - p2.x * p1.y;
      return { a, b, c, isSegment: true, p1, p2 };
    }
    return null;
  },

  pointOnSegment(x, y, p1, p2) {
    const eps = 1e-4;
    return (
      x >= Math.min(p1.x, p2.x) - eps &&
      x <= Math.max(p1.x, p2.x) + eps &&
      y >= Math.min(p1.y, p2.y) - eps &&
      y <= Math.max(p1.y, p2.y) + eps
    );
  },

  intersect2DLines(L1, L2) {
    const det = L1.a * L2.b - L2.a * L1.b;
    if (Math.abs(det) < 1e-7) return [];
    const x = (L1.b * L2.c - L2.b * L1.c) / det;
    const y = (L2.a * L1.c - L1.a * L2.c) / det;
    if (L1.isSegment && !this.pointOnSegment(x, y, L1.p1, L1.p2)) return [];
    if (L2.isSegment && !this.pointOnSegment(x, y, L2.p1, L2.p2)) return [];
    return [{ x, y }];
  },

  intersectLineCircle2D(L, C) {
    const normSq = L.a * L.a + L.b * L.b;
    if (normSq < 1e-9) return [];
    const distSigned = (L.a * C.cx + L.b * C.cy + L.c) / Math.sqrt(normSq);
    const d = Math.abs(distSigned);
    if (d > C.r + 1e-5) return [];

    const t = -(L.a * C.cx + L.b * C.cy + L.c) / normSq;
    const hx = C.cx + L.a * t;
    const hy = C.cy + L.b * t;

    if (Math.abs(d - C.r) <= 1e-4) {
      if (L.isSegment && !this.pointOnSegment(hx, hy, L.p1, L.p2)) return [];
      return [{ x: hx, y: hy, isTangent: true }];
    }

    const hLen = Math.sqrt(Math.max(0, C.r * C.r - d * d));
    const ux = -L.b / Math.sqrt(normSq);
    const uy = L.a / Math.sqrt(normSq);

    const pts = [
      { x: hx + ux * hLen, y: hy + uy * hLen },
      { x: hx - ux * hLen, y: hy - uy * hLen }
    ];
    return pts.filter((pt) => !L.isSegment || this.pointOnSegment(pt.x, pt.y, L.p1, L.p2));
  },

  intersectCircles2D(C1, C2) {
    const dx = C2.cx - C1.cx;
    const dy = C2.cy - C1.cy;
    const d = Math.hypot(dx, dy);
    if (d > C1.r + C2.r + 1e-5 || d < Math.abs(C1.r - C2.r) - 1e-5 || d < 1e-7) {
      return [];
    }
    const a = (C1.r * C1.r - C2.r * C2.r + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, C1.r * C1.r - a * a));
    const x2 = C1.cx + (a * dx) / d;
    const y2 = C1.cy + (a * dy) / d;

    if (h < 1e-4) {
      return [{ x: x2, y: y2, isTangent: true }];
    }
    return [
      { x: x2 + (h * dy) / d, y: y2 - (h * dx) / d },
      { x: x2 - (h * dy) / d, y: y2 + (h * dx) / d }
    ];
  },

  // Numerical 1D root finder for h(x) = 0 on [xMin, xMax] (filters out vertical asymptotes)
  findRoots1D(hFn, xMin = -14, xMax = 14, steps = 450) {
    const roots = [];
    const dx = (xMax - xMin) / steps;
    let prevX = xMin;
    let prevY = hFn(prevX);

    const addUniqueRoot = (rx) => {
      if (!isFinite(rx)) return;
      const val = hFn(rx);
      if (!isFinite(val) || Math.abs(val) > 0.05) return;
      if (!roots.some((r) => Math.abs(r - rx) < 1e-2)) {
        roots.push(rx);
      }
    };

    for (let i = 1; i <= steps; i++) {
      const currX = xMin + i * dx;
      const currY = hFn(currX);

      if (isFinite(currY) && Math.abs(currY) < 1e-7) {
        addUniqueRoot(currX);
      } else if (isFinite(prevY) && isFinite(currY) && prevY * currY < 0) {
        // Bisection refinement
        let a = prevX, b = currX, fa = prevY, fb = currY;
        for (let iter = 0; iter < 28; iter++) {
          const mid = 0.5 * (a + b);
          const fm = hFn(mid);
          if (!isFinite(fm)) break;
          if (Math.abs(fm) < 1e-9) {
            a = b = mid;
            break;
          }
          if (fa * fm <= 0) {
            b = mid;
            fb = fm;
          } else {
            a = mid;
            fa = fm;
          }
        }
        const rootX = 0.5 * (a + b);
        // Verify continuity (not a vertical asymptote jump)
        if (Math.abs(hFn(rootX)) < 0.02) {
          addUniqueRoot(rootX);
        }
      }
      prevX = currX;
      prevY = currY;
    }
    return roots;
  },

  isExplicitFunc2D(obj) {
    return obj.type === "func2d" || obj.type === "parabola2d";
  },

  // Compute all 2D intersections & interaction descriptions among visible 2D scene objects
  computeAll2DInteractions(objects2D) {
    const visible = objects2D.filter((o) => o.visible !== false);
    const intersections = [];
    const relations = [];

    const getSegmentsOfObject = (obj) => {
      if (obj.type === "line2d" || obj.type === "segment2d") {
        return [this.get2DLineCoeffs(obj)];
      }
      if (obj.type === "polygon2d" && obj.pts && obj.pts.length >= 2) {
        const segs = [];
        for (let i = 0; i < obj.pts.length; i++) {
          const p1 = obj.pts[i];
          const p2 = obj.pts[(i + 1) % obj.pts.length];
          segs.push(this.get2DLineCoeffs({ type: "segment2d", p1, p2 }));
        }
        return segs;
      }
      return [];
    };

    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const A = visible[i];
        const B = visible[j];

        // 0. Explicit Function (func2d / parabola2d) vs Function / Line / Circle
        if (this.isExplicitFunc2D(A) || this.isExplicitFunc2D(B)) {
          const F = this.isExplicitFunc2D(A) ? A : B;
          const G = this.isExplicitFunc2D(A) ? B : A;

          if (this.isExplicitFunc2D(G)) {
            const roots = this.findRoots1D((x) => this.evalFunc2D(F, x) - this.evalFunc2D(G, x));
            const pts = roots.map((rx) => ({ x: rx, y: this.evalFunc2D(F, rx) })).filter((p) => isFinite(p.y));
            pts.forEach((p) => {
              intersections.push({
                x: p.x,
                y: p.y,
                label: `I_${intersections.length + 1}`,
                pair: `${A.name} ∩ ${B.name}`
              });
            });
            relations.push({
              pair: `${A.name} ∩ ${B.name}`,
              desc: pts.length > 0 ? `Cắt nhau tại ${pts.length} giao điểm` : `Không cắt nhau trên miền khảo sát`,
              points: pts
            });
            continue;
          }

          if (G.type === "line2d" || G.type === "segment2d" || G.type === "polygon2d") {
            const segs = getSegmentsOfObject(G);
            const foundPts = [];
            segs.forEach((L) => {
              let pts = [];
              if (Math.abs(L.b) > 1e-7) {
                const roots = this.findRoots1D((x) => L.a * x + L.b * this.evalFunc2D(F, x) + L.c);
                pts = roots.map((rx) => ({ x: rx, y: this.evalFunc2D(F, rx) })).filter((p) => isFinite(p.y));
              } else if (Math.abs(L.a) > 1e-7) {
                const x0 = -L.c / L.a;
                const y0 = this.evalFunc2D(F, x0);
                if (isFinite(y0)) pts = [{ x: x0, y: y0 }];
              }
              pts.forEach((p) => {
                if (!L.isSegment || this.pointOnSegment(p.x, p.y, L.p1, L.p2)) {
                  if (!foundPts.some((fp) => Math.hypot(fp.x - p.x, fp.y - p.y) < 1e-2)) {
                    foundPts.push(p);
                    intersections.push({
                      x: p.x,
                      y: p.y,
                      label: `I_${intersections.length + 1}`,
                      pair: `${F.name} ∩ ${G.name}`
                    });
                  }
                }
              });
            });
            relations.push({
              pair: `${F.name} ∩ ${G.name}`,
              desc: foundPts.length > 0 ? `Giao nhau tại ${foundPts.length} điểm` : `Không giao nhau`,
              points: foundPts
            });
            continue;
          }

          if (G.type === "circle2d") {
            const roots = this.findRoots1D(
              (x) => {
                const y = this.evalFunc2D(F, x);
                return (x - G.cx) * (x - G.cx) + (y - G.cy) * (y - G.cy) - G.r * G.r;
              },
              G.cx - G.r - 0.5,
              G.cx + G.r + 0.5,
              300
            );
            const pts = roots.map((rx) => ({ x: rx, y: this.evalFunc2D(F, rx) })).filter((p) => isFinite(p.y));
            pts.forEach((p) => {
              intersections.push({
                x: p.x,
                y: p.y,
                label: `I_${intersections.length + 1}`,
                pair: `${F.name} ∩ ${G.name}`
              });
            });
            relations.push({
              pair: `${F.name} ∩ ${G.name}`,
              desc: pts.length > 0 ? `Cắt đường tròn tại ${pts.length} điểm` : `Không cắt đường tròn`,
              points: pts
            });
            continue;
          }
        }

        // 1. Circle vs Circle
        if (A.type === "circle2d" && B.type === "circle2d") {
          const pts = this.intersectCircles2D(A, B);
          const d = Math.hypot(A.cx - B.cx, A.cy - B.cy);
          pts.forEach((p) => {
            intersections.push({
              x: p.x,
              y: p.y,
              label: `I_${intersections.length + 1}`,
              pair: `${A.name} ∩ ${B.name}`
            });
          });
          let status = "Không giao nhau";
          if (pts.length === 1) status = "Tiếp xúc nhau (1 điểm chung)";
          else if (pts.length === 2) status = "Cắt nhau tại 2 điểm";
          relations.push({
            pair: `${A.name} & ${B.name}`,
            desc: `${status} (Khoảng cách tâm OO' = ${d.toFixed(2)})`,
            points: pts
          });
          continue;
        }

        // 2. Line/Segment/Polygon vs Circle
        if (
          (A.type === "circle2d" && ["line2d", "segment2d", "polygon2d"].includes(B.type)) ||
          (B.type === "circle2d" && ["line2d", "segment2d", "polygon2d"].includes(A.type))
        ) {
          const cir = A.type === "circle2d" ? A : B;
          const linObj = A.type === "circle2d" ? B : A;
          const segs = getSegmentsOfObject(linObj);
          const foundPts = [];
          segs.forEach((seg) => {
            const pts = this.intersectLineCircle2D(seg, cir);
            pts.forEach((p) => {
              foundPts.push(p);
              intersections.push({
                x: p.x,
                y: p.y,
                label: `I_${intersections.length + 1}`,
                pair: `${A.name} ∩ ${B.name}`
              });
            });
          });
          if (linObj.type === "line2d") {
            const L = segs[0];
            const d = Math.abs(L.a * cir.cx + L.b * cir.cy + L.c) / Math.hypot(L.a, L.b);
            let status =
              d > cir.r + 1e-4
                ? "Không giao nhau (d > R)"
                : Math.abs(d - cir.r) <= 1e-3
                ? "Tiếp tuyến (d = R)"
                : "Cát tuyến cắt tại 2 điểm (d < R)";
            relations.push({
              pair: `${linObj.name} & ${cir.name}`,
              desc: `${status}, d(O, ${linObj.name}) = ${d.toFixed(2)}`,
              points: foundPts
            });
          } else if (foundPts.length > 0) {
            relations.push({
              pair: `${A.name} & ${B.name}`,
              desc: `Giao nhau tại ${foundPts.length} điểm`,
              points: foundPts
            });
          }
          continue;
        }

        // 3. Line/Segment/Polygon vs Line/Segment/Polygon
        const segsA = getSegmentsOfObject(A);
        const segsB = getSegmentsOfObject(B);
        if (segsA.length > 0 && segsB.length > 0) {
          const foundPts = [];
          segsA.forEach((sA) => {
            segsB.forEach((sB) => {
              const pts = this.intersect2DLines(sA, sB);
              pts.forEach((p) => {
                if (!foundPts.some((fp) => Math.hypot(fp.x - p.x, fp.y - p.y) < 1e-3)) {
                  foundPts.push(p);
                  intersections.push({
                    x: p.x,
                    y: p.y,
                    label: `I_${intersections.length + 1}`,
                    pair: `${A.name} ∩ ${B.name}`
                  });
                }
              });
            });
          });

          if (A.type === "line2d" && B.type === "line2d") {
            const L1 = segsA[0];
            const L2 = segsB[0];
            const dot = L1.a * L2.a + L1.b * L2.b;
            const n1 = Math.hypot(L1.a, L1.b) || 1;
            const n2 = Math.hypot(L2.a, L2.b) || 1;
            const cosAng = Math.min(1, Math.max(-1, Math.abs(dot) / (n1 * n2)));
            const angleDeg = (Math.acos(cosAng) * 180) / Math.PI;

            if (foundPts.length === 0) {
              relations.push({
                pair: `${A.name} // ${B.name}`,
                desc: `Song song (Góc = 0°)`,
                points: []
              });
            } else {
              const perpTag = Math.abs(angleDeg - 90) < 0.5 ? " (Vuông góc ⊥)" : "";
              relations.push({
                pair: `${A.name} ∩ ${B.name}`,
                desc: `Cắt tại (${foundPts[0].x.toFixed(2)}, ${foundPts[0].y.toFixed(2)}), Góc = ${angleDeg.toFixed(1)}°${perpTag}`,
                points: foundPts
              });
            }
          } else if (foundPts.length > 0) {
            relations.push({
              pair: `${A.name} ∩ ${B.name}`,
              desc: `Cắt nhau tại ${foundPts.length} giao điểm`,
              points: foundPts
            });
          }
        }
      }
    }

    return { intersections, relations };
  },

  // ==========================================================================
  // 3D INTERSECTION & INTERACTION CALCULATOR
  // ==========================================================================
  computeAll3DInteractions(objects3D) {
    const visible = objects3D.filter((o) => o.visible !== false);
    const intersections3D = [];
    const relations3D = [];

    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const A = visible[i];
        const B = visible[j];

        // 1. Plane ∩ Sphere -> Circle in 3D!
        if (
          (A.type === "plane3d" && B.type === "sphere3d") ||
          (B.type === "plane3d" && A.type === "sphere3d")
        ) {
          const pl = A.type === "plane3d" ? A : B;
          const sp = A.type === "plane3d" ? B : A;
          const normSq = pl.a * pl.a + pl.b * pl.b + pl.c * pl.c || 1;
          const norm = Math.sqrt(normSq);
          const signedDist = (pl.a * sp.cx + pl.b * sp.cy + pl.c * sp.cz + pl.d) / norm;
          const d = Math.abs(signedDist);

          const t = -(pl.a * sp.cx + pl.b * sp.cy + pl.c * sp.cz + pl.d) / normSq;
          const hx = sp.cx + pl.a * t;
          const hy = sp.cy + pl.b * t;
          const hz = sp.cz + pl.c * t;

          if (d > sp.r + 1e-4) {
            relations3D.push({
              pair: `${pl.name} & ${sp.name}`,
              desc: `Không giao nhau: d(I, ${pl.name}) = ${d.toFixed(2)} > R = ${sp.r.toFixed(2)}`
            });
          } else if (Math.abs(d - sp.r) <= 1e-3) {
            intersections3D.push({
              type: "point3d",
              x: hx, y: hy, z: hz,
              label: `H_tiếp_điểm`
            });
            relations3D.push({
              pair: `${pl.name} ∩ ${sp.name}`,
              desc: `Tiếp xúc tại H(${hx.toFixed(2)}, ${hy.toFixed(2)}, ${hz.toFixed(2)}), d = R = ${sp.r.toFixed(2)}`
            });
          } else {
            const rSec = Math.sqrt(Math.max(0, sp.r * sp.r - d * d));
            intersections3D.push({
              type: "circle3d",
              cx: hx, cy: hy, cz: hz,
              nx: pl.a / norm, ny: pl.b / norm, nz: pl.c / norm,
              r: rSec,
              label: `Giao tuyến (${pl.name} ∩ ${sp.name})`
            });
            relations3D.push({
              pair: `${pl.name} ∩ ${sp.name}`,
              desc: `Giao tuyến là Đường tròn tâm H(${hx.toFixed(1)}, ${hy.toFixed(1)}, ${hz.toFixed(1)}), bán kính r = √(R² - d²) = ${rSec.toFixed(2)}`
            });
          }
          continue;
        }

        // 2. Line 3D ∩ Plane 3D -> Point 3D
        if (
          (A.type === "line3d" && B.type === "plane3d") ||
          (B.type === "line3d" && A.type === "plane3d")
        ) {
          const ln = A.type === "line3d" ? A : B;
          const pl = A.type === "line3d" ? B : A;
          const denom = pl.a * ln.ux + pl.b * ln.uy + pl.c * ln.uz;
          const num = -(pl.a * ln.x0 + pl.b * ln.y0 + pl.c * ln.z0 + pl.d);

          if (Math.abs(denom) < 1e-7) {
            relations3D.push({
              pair: `${ln.name} & ${pl.name}`,
              desc: Math.abs(num) < 1e-5 ? `Đường thẳng nằm trong mặt phẳng` : `Đường thẳng song song với mặt phẳng`
            });
          } else {
            const t = num / denom;
            const ix = ln.x0 + ln.ux * t;
            const iy = ln.y0 + ln.uy * t;
            const iz = ln.z0 + ln.uz * t;
            intersections3D.push({
              type: "point3d",
              x: ix, y: iy, z: iz,
              label: `M(${ix.toFixed(1)},${iy.toFixed(1)},${iz.toFixed(1)})`
            });
            relations3D.push({
              pair: `${ln.name} ∩ ${pl.name}`,
              desc: `Cắt tại M(${ix.toFixed(2)}, ${iy.toFixed(2)}, ${iz.toFixed(2)}) ứng với t = ${t.toFixed(2)}`
            });
          }
          continue;
        }

        // 3. Line 3D ∩ Sphere 3D -> 1 or 2 Points in 3D
        if (
          (A.type === "line3d" && B.type === "sphere3d") ||
          (B.type === "line3d" && A.type === "sphere3d")
        ) {
          const ln = A.type === "line3d" ? A : B;
          const sp = A.type === "line3d" ? B : A;
          const dx = ln.x0 - sp.cx;
          const dy = ln.y0 - sp.cy;
          const dz = ln.z0 - sp.cz;
          const qa = ln.ux * ln.ux + ln.uy * ln.uy + ln.uz * ln.uz;
          const qb = 2 * (dx * ln.ux + dy * ln.uy + dz * ln.uz);
          const qc = dx * dx + dy * dy + dz * dz - sp.r * sp.r;
          const delta = qb * qb - 4 * qa * qc;

          if (delta < -1e-5 || qa < 1e-9) {
            relations3D.push({
              pair: `${ln.name} & ${sp.name}`,
              desc: `Đường thẳng không cắt mặt cầu (Δ < 0)`
            });
          } else if (Math.abs(delta) <= 1e-4) {
            const t = -qb / (2 * qa);
            const ix = ln.x0 + ln.ux * t;
            const iy = ln.y0 + ln.uy * t;
            const iz = ln.z0 + ln.uz * t;
            intersections3D.push({ type: "point3d", x: ix, y: iy, z: iz, label: "T_tiếp_điểm" });
            relations3D.push({
              pair: `${ln.name} ∩ ${sp.name}`,
              desc: `Tiếp xúc mặt cầu tại T(${ix.toFixed(2)}, ${iy.toFixed(2)}, ${iz.toFixed(2)})`
            });
          } else {
            const sqrtD = Math.sqrt(delta);
            const t1 = (-qb - sqrtD) / (2 * qa);
            const t2 = (-qb + sqrtD) / (2 * qa);
            const p1 = { x: ln.x0 + ln.ux * t1, y: ln.y0 + ln.uy * t1, z: ln.z0 + ln.uz * t1 };
            const p2 = { x: ln.x0 + ln.ux * t2, y: ln.y0 + ln.uy * t2, z: ln.z0 + ln.uz * t2 };
            intersections3D.push({ type: "point3d", ...p1, label: "M₁" });
            intersections3D.push({ type: "point3d", ...p2, label: "M₂" });
            relations3D.push({
              pair: `${ln.name} ∩ ${sp.name}`,
              desc: `Cắt tại 2 điểm M₁(${p1.x.toFixed(1)}, ${p1.y.toFixed(1)}, ${p1.z.toFixed(1)}) và M₂(${p2.x.toFixed(1)}, ${p2.y.toFixed(1)}, ${p2.z.toFixed(1)})`
            });
          }
          continue;
        }

        // 4. Plane 3D ∩ Plane 3D -> 3D Intersection Line
        if (A.type === "plane3d" && B.type === "plane3d") {
          const ux = A.b * B.c - A.c * B.b;
          const uy = A.c * B.a - A.a * B.c;
          const uz = A.a * B.b - A.b * B.a;
          const uLen = Math.hypot(ux, uy, uz);
          if (uLen < 1e-6) {
            relations3D.push({
              pair: `${A.name} // ${B.name}`,
              desc: `Hai mặt phẳng song song hoặc trùng nhau`
            });
          } else {
            let x0 = 0, y0 = 0, z0 = 0;
            if (Math.abs(uz) >= Math.abs(ux) && Math.abs(uz) >= Math.abs(uy)) {
              x0 = (A.b * B.d - B.b * A.d) / uz;
              y0 = (B.a * A.d - A.a * B.d) / uz;
            } else if (Math.abs(uy) >= Math.abs(ux)) {
              x0 = (B.c * A.d - A.c * B.d) / uy;
              z0 = (A.a * B.d - B.a * A.d) / uy;
            } else {
              y0 = (A.c * B.d - B.c * A.d) / ux;
              z0 = (B.b * A.d - A.b * B.d) / ux;
            }
            intersections3D.push({
              type: "line3d",
              x0, y0, z0,
              ux: ux / uLen, uy: uy / uLen, uz: uz / uLen,
              label: `${A.name} ∩ ${B.name}`
            });
            relations3D.push({
              pair: `${A.name} ∩ ${B.name}`,
              desc: `Giao tuyến là đường thẳng đi qua (${x0.toFixed(1)}, ${y0.toFixed(1)}, ${z0.toFixed(1)}), VTCP u⃗=(${ux.toFixed(1)}, ${uy.toFixed(1)}, ${uz.toFixed(1)})`
            });
          }
        }
      }
    }

    return { intersections3D, relations3D };
  }
};
