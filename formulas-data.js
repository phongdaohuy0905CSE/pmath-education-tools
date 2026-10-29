// ============================================================================
// PMATH EDUCATION TOOLS — DỮ LIỆU BẢNG CÔNG THỨC TOÁN THPT (GDPT 2018)
// File độc lập: formulas-data.js
// Cấu trúc rõ ràng, dễ dàng cập nhật, chỉnh sửa hoặc bổ sung công thức mới.
// ============================================================================

const PMATH_FORMULA_CATEGORIES = [
  { id: "all", label: "Tất cả công thức", icon: "📚", color: "#1e64b4" },
  { id: "oxyz", label: "Không gian Oxyz & Vận tốc", icon: "🧊", color: "#e11d48" },
  { id: "oxy", label: "Hình giải tích Oxy", icon: "📐", color: "#0284c7" },
  { id: "plane2d", label: "Hệ thức lượng & Hình 2D", icon: "📐", color: "#148250" },
  { id: "solid3d", label: "Khối đa diện & Tròn xoay 3D", icon: "📦", color: "#7c3aed" },
  { id: "calculus", label: "Đạo hàm, Đồ thị & Tích phân", icon: "📈", color: "#008c96" },
  { id: "trig", label: "Lượng giác & Cấp số", icon: "〰️", color: "#b45a14" }
];

const PMATH_DEFAULT_FORMULAS = [
  // ==========================================================================
  // 1. KHÔNG GIAN OXYZ & BÀI TOÁN VẬN TỐC THỰC TẾ (TOÁN 12 - GDPT 2018)
  // ==========================================================================
  {
    id: "f_oxyz_vectors",
    category: "oxyz",
    categoryName: "Không gian Oxyz & Vận tốc",
    title: "Tích vô hướng & Tích có hướng của 2 vectơ",
    formula: "u⃗ · v⃗ = x₁x₂ + y₁y₂ + z₁z₂ = |u⃗|·|v⃗|·cos(u⃗, v⃗)",
    subFormula: "[u⃗, v⃗] = (y₁z₂ - z₁y₂ ; z₁x₂ - x₁z₂ ; x₁y₂ - y₁x₂)",
    description: "u⃗ ⊥ v⃗ ⇔ u⃗ · v⃗ = 0. u⃗ cùng phương v⃗ ⇔ [u⃗, v⃗] = 0⃗. Diện tích tam giác S_ABC = ½|[\\vec{AB}, \\vec{AC}]|.",
    tags: ["Oxyz", "Vectơ", "Tích có hướng", "Diện tích"],
    important: true
  },
  {
    id: "f_oxyz_plane",
    category: "oxyz",
    categoryName: "Không gian Oxyz & Vận tốc",
    title: "Phương trình Mặt phẳng (α) & Khoảng cách",
    formula: "(α): A(x - x₀) + B(y - y₀) + C(z - z₀) = 0  ⇔  Ax + By + Cz + D = 0",
    subFormula: "d(M₀, (α)) = |Ax₀ + By₀ + Cz₀ + D| / √(A² + B² + C²)",
    description: "Vectơ pháp tuyến n⃗ = (A; B; C) ⊥ (α). Phương trình mặt phẳng theo đoạn chắn qua A(a;0;0), B(0;b;0), C(0;0;c) là: x/a + y/b + z/c = 1.",
    tags: ["Oxyz", "Mặt phẳng", "Khoảng cách", "VTPT"],
    important: true
  },
  {
    id: "f_oxyz_sphere",
    category: "oxyz",
    categoryName: "Không gian Oxyz & Vận tốc",
    title: "Phương trình Mặt cầu (S) & Giao tuyến Mặt phẳng",
    formula: "(S): (x - a)² + (y - b)² + (z - c)² = R²",
    subFormula: "Khai triển: x² + y² + z² - 2ax - 2by - 2cz + d = 0  (R = √(a² + b² + c² - d))",
    description: "Tâm I(a; b; c). Khi mặt phẳng (α) cắt mặt cầu (d(I, α) = d < R), giao tuyến là đường tròn tâm H, bán kính r = √(R² - d²).",
    tags: ["Oxyz", "Mặt cầu", "Thiết diện", "Giao tuyến"],
    important: true
  },
  {
    id: "f_oxyz_line",
    category: "oxyz",
    categoryName: "Không gian Oxyz & Vận tốc",
    title: "Phương trình Đường thẳng (Δ) trong không gian",
    formula: "Tham số: x = x₀ + a·t ,  y = y₀ + b·t ,  z = z₀ + c·t   (t ∈ ℝ)",
    subFormula: "Chính tắc: (x - x₀)/a = (y - y₀)/b = (z - z₀)/c   (a, b, c ≠ 0)",
    description: "Đi qua M₀(x₀; y₀; z₀) và có vectơ chỉ phương u⃗ = (a; b; c). Khoảng cách từ M đến Δ: d(M, Δ) = |[M₀M⃗, u⃗]| / |u⃗|.",
    tags: ["Oxyz", "Đường thẳng", "Tham số", "VTCP"],
    important: true
  },
  {
    id: "f_oxyz_velocity",
    category: "oxyz",
    categoryName: "Không gian Oxyz & Vận tốc",
    title: "Phương trình Chuyển động & Vectơ Vận tốc thực tế",
    formula: "r⃗(t) = r⃗₀ + v⃗ · t  ⇔  M(t) = (x₀ + vₓt ; y₀ + vᵧt ; z₀ + v_zt)",
    subFormula: "Tốc độ: |v⃗| = √(vₓ² + vᵧ² + v_z²)  ;   Khoảng cách 2 vật: d(t) = |M₁(t)M₂(t)|",
    description: "Ứng dụng bài toán radar hàng không: Tìm thời điểm t để 2 máy bay gần nhau nhất bằng cách khảo sát hàm bậc hai d²(t) = |Δr⃗₀ + Δv⃗ · t|² đạt GTNN khi t = -(Δr⃗₀ · Δv⃗) / |Δv⃗|².",
    tags: ["Oxyz", "Vận tốc", "Chuyển động", "Thực tế", "Máy bay"],
    important: true
  },
  {
    id: "f_oxyz_angles",
    category: "oxyz",
    categoryName: "Không gian Oxyz & Vận tốc",
    title: "Góc giữa Đường thẳng & Mặt phẳng trong Oxyz",
    formula: "cos(α, β) = |n⃗₁ · n⃗₂| / (|n⃗₁|·|n⃗₂|)  ;   cos(Δ₁, Δ₂) = |u⃗₁ · u⃗₂| / (|u⃗₁|·|u⃗₂|)",
    subFormula: "Góc giữa đường thẳng Δ và mặt phẳng (α):  sin(Δ, (α)) = |u⃗ · n⃗| / (|u⃗|·|n⃗|)",
    description: "Lưu ý cực kỳ quan trọng: Góc giữa Đường thẳng và Mặt phẳng dùng hàm SIN, còn góc giữa 2 Đường thẳng hoặc 2 Mặt phẳng dùng hàm COS.",
    tags: ["Oxyz", "Góc", "Đường thẳng", "Mặt phẳng"],
    important: true
  },

  // ==========================================================================
  // 2. HÌNH HỌC GIẢI TÍCH PHẲNG OXY (TOÁN 10)
  // ==========================================================================
  {
    id: "f_oxy_line",
    category: "oxy",
    categoryName: "Hình giải tích Oxy",
    title: "Phương trình Đường thẳng 2D & Khoảng cách",
    formula: "Tổng quát: ax + by + c = 0   (VTPT n⃗ = (a; b), VTCP u⃗ = (-b; a))",
    subFormula: "Khoảng cách: d(M₀, Δ) = |ax₀ + by₀ + c| / √(a² + b²)",
    description: "Phương trình tham số: x = x₀ + u₁t, y = y₀ + u₂t. Hệ số góc k = -a/b = tan(α).",
    tags: ["Oxy", "Đường thẳng", "Khoảng cách"],
    important: true
  },
  {
    id: "f_oxy_circle",
    category: "oxy",
    categoryName: "Hình giải tích Oxy",
    title: "Phương trình Đường tròn (C) & Tiếp tuyến",
    formula: "(C): (x - a)² + (y - b)² = R²  ⇔  x² + y² - 2ax - 2by + c = 0",
    subFormula: "Tiếp tuyến tại M₀(x₀; y₀) ∈ (C):  (x₀ - a)(x - a) + (y₀ - b)(y - b) = R²",
    description: "Điều kiện tồn tại đường tròn: a² + b² - c > 0, khi đó tâm I(a; b) và bán kính R = √(a² + b² - c).",
    tags: ["Oxy", "Đường tròn", "Tiếp tuyến"],
    important: true
  },
  {
    id: "f_oxy_conics",
    category: "oxy",
    categoryName: "Hình giải tích Oxy",
    title: "Ba đường Conic: Elip (E), Hypebol (H), Parabol (P)",
    formula: "(E): x²/a² + y²/b² = 1 (a > b > 0, c² = a² - b²)  ;  Tiêu cự 2c",
    subFormula: "(H): x²/a² - y²/b² = 1 (c² = a² + b²)  ;   (P): y² = 2px (p > 0, Tiêu điểm F(p/2; 0))",
    description: "Diện tích hình Elip: S = π·a·b. Tâm sai của Elip và Hypebol: e = c / a.",
    tags: ["Oxy", "Elip", "Hypebol", "Parabol", "Conic"],
    important: false
  },

  // ==========================================================================
  // 3. HỆ THỨC LƯỢNG & HÌNH HỌC PHẲNG 2D
  // ==========================================================================
  {
    id: "f_2d_cos_sin",
    category: "plane2d",
    categoryName: "Hệ thức lượng & Hình 2D",
    title: "Định lý Cô-sin, Định lý Sin & Công thức Trung tuyến",
    formula: "a² = b² + c² - 2bc·cos(A)   ;   a/sin(A) = b/sin(B) = c/sin(C) = 2R",
    subFormula: "Đường trung tuyến: mₐ² = (b² + c²)/2 - a²/4 = (2b² + 2c² - a²) / 4",
    description: "Suy ra cos(A) = (b² + c² - a²) / (2bc). Áp dụng tính cạnh và góc cho mọi tam giác bất kỳ.",
    tags: ["Tam giác", "Định lý Cosin", "Định lý Sin", "Trung tuyến"],
    important: true
  },
  {
    id: "f_2d_tri_area",
    category: "plane2d",
    categoryName: "Hệ thức lượng & Hình 2D",
    title: "5 Công thức tính Diện tích Tam giác (ΔABC)",
    formula: "S = ½·a·hₐ = ½·b·c·sin(A) = √[p(p - a)(p - b)(p - c)]",
    subFormula: "S = (a·b·c) / (4R) = p · r   (với p = (a + b + c)/2)",
    description: "Tam giác đều cạnh a: Đường cao h = a√3/2, Diện tích S = a²√3/4, R = a√3/3, r = a√3/6.",
    tags: ["Tam giác", "Diện tích", "Heron", "Ngoại tiếp", "Nội tiếp"],
    important: true
  },
  {
    id: "f_2d_euler_line",
    category: "plane2d",
    categoryName: "Hệ thức lượng & Hình 2D",
    title: "Hệ thức Đường thẳng Euler & Tâm tỉ cự Tam giác",
    formula: "\\vec{OH} = 3\\vec{OG} = \\vec{OA} + \\vec{OB} + \\vec{OC}   ;   \\vec{GH} = -2\\vec{GO}",
    subFormula: "Trọng tâm G: \\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{0}   ;   Bán kính đường tròn Euler: R_E = R / 2",
    description: "Trong mọi tam giác, Tâm ngoại tiếp O, Trọng tâm G và Trực tâm H luôn thẳng hàng trên đường thẳng Euler và HG = 2·GO.",
    tags: ["Tam giác", "Euler", "Trọng tâm", "Trực tâm"],
    important: false
  },
  {
    id: "f_2d_quads",
    category: "plane2d",
    categoryName: "Hệ thức lượng & Hình 2D",
    title: "Diện tích Hình vuông, HCN, Hình thoi, Hình bình hành, Hình thang",
    formula: "S_vuông = a² (d = a√2)  ;   S_HCN = a·b  ;   S_bh = a·h = a·b·sin(α)",
    subFormula: "S_thoi = ½·d₁·d₂   ;   S_thang = ½·(a + b)·h",
    description: "Với mọi tứ giác có 2 đường chéo AC và BD vuông góc nhau: S = ½ · AC · BD.",
    tags: ["Tứ giác", "Hình vuông", "Hình thoi", "Hình thang", "Diện tích"],
    important: false
  },

  // ==========================================================================
  // 4. KHỐI ĐA DIỆN & KHỐI TRÒN XOAY 3D (TOÁN 11 & 12)
  // ==========================================================================
  {
    id: "f_3d_pyramid_prism",
    category: "solid3d",
    categoryName: "Khối đa diện & Tròn xoay 3D",
    title: "Thể tích Khối chóp, Khối lăng trụ & Tỉ số thể tích Simson",
    formula: "V_chóp = ⅓ · S_đáy · h   ;   V_lăng_trụ = S_đáy · h   ;   V_hộp = a · b · c",
    subFormula: "Tỉ số thể tích chóp tam giác: V_(S.A'B'C') / V_(S.ABC) = (SA'/SA) · (SB'/SB) · (SC'/SC)",
    description: "Tứ diện đều cạnh a: Chiều cao h = a√6/3, Thể tích V = a³√2/12. Chóp tam giác đều cạnh đáy a, cạnh bên b: h = √(b² - a²/3).",
    tags: ["Khối chóp", "Lăng trụ", "Thể tích", "Simson", "3D"],
    important: true
  },
  {
    id: "f_3d_round_bodies",
    category: "solid3d",
    categoryName: "Khối đa diện & Tròn xoay 3D",
    title: "Hình Nón, Hình Trụ & Hình Cầu (Diện tích & Thể tích)",
    formula: "Nón: S_xq = πrl , V = ⅓πr²h (l = √(r²+h²))  ;  Trụ: S_xq = 2πrh , V = πr²h",
    subFormula: "Mặt cầu & Khối cầu bán kính R:  S_mặt_cầu = 4πR²   ;   V_khối_cầu = (4/3)πR³",
    description: "Diện tích toàn phần: S_tp_nón = πrl + πr² ; S_tp_trụ = 2πrh + 2πr².",
    tags: ["Hình nón", "Hình trụ", "Mặt cầu", "Thể tích", "3D"],
    important: true
  },
  {
    id: "f_3d_circum_sphere",
    category: "solid3d",
    categoryName: "Khối đa diện & Tròn xoay 3D",
    title: "Công thức tính nhanh Bán kính Mặt cầu ngoại tiếp Khối chóp",
    formula: "Cạnh bên SA = h ⊥ đáy:  R = √(R_đáy² + (h / 2)²)",
    subFormula: "Chóp đều cạnh bên b, chiều cao h:  R = b² / (2h)",
    description: "Nếu mặt bên (SAB) ⊥ đáy và có đường tròn ngoại tiếp bán kính R_bên, giao tuyến AB = c: R = √(R_đáy² + R_bên² - c²/4).",
    tags: ["Mặt cầu ngoại tiếp", "Khối chóp", "Tính nhanh", "3D"],
    important: true
  },

  // ==========================================================================
  // 5. ĐẠO HÀM, KHẢO SÁT ĐỒ THỊ HÀM SỐ & TÍCH PHÂN (TOÁN 12)
  // ==========================================================================
  {
    id: "f_calc_cubic",
    category: "calculus",
    categoryName: "Đạo hàm, Đồ thị & Tích phân",
    title: "Khảo sát Hàm bậc ba y = ax³ + bx² + cx + d (a ≠ 0)",
    formula: "y' = 3ax² + 2bx + c  ;   Δ' = b² - 3ac  ;   Tâm đối xứng (Điểm uốn): x_U = -b / (3a)",
    subFormula: "Hàm có 2 cực trị (CĐ, CT) ⇔ Δ' = b² - 3ac > 0. Đồng biến trên ℝ ⇔ a > 0 và b² - 3ac ≤ 0",
    description: "Phương trình đường thẳng đi qua 2 điểm cực trị: y = (2/9a)·(3ac - b²)x + d - (bc)/(9a).",
    tags: ["Giải tích 12", "Hàm bậc 3", "Cực trị", "Điểm uốn"],
    important: true
  },
  {
    id: "f_calc_rational",
    category: "calculus",
    categoryName: "Đạo hàm, Đồ thị & Tích phân",
    title: "Hàm phân thức bậc nhất & Phân thức bậc hai trên bậc nhất",
    formula: "y = (ax + b)/(cx + d):  y' = (ad - bc)/(cx + d)²  ;  TCĐ: x = -d/c , TCN: y = a/c",
    subFormula: "y = (ax² + bx + c)/(mx + n): Chia đa thức được y = px + q + r/(mx + n) ⇒ TCX: y = px + q",
    description: "Hàm bậc nhất/bậc nhất luôn đơn điệu trên từng khoảng xác định (không có cực trị). Giao hai tiệm cận là tâm đối xứng của đồ thị.",
    tags: ["Giải tích 12", "Hàm phân thức", "Tiệm cận", "Đạo hàm"],
    important: true
  },
  {
    id: "f_calc_integral_area",
    category: "calculus",
    categoryName: "Đạo hàm, Đồ thị & Tích phân",
    title: "Ứng dụng Tích phân tính Diện tích & Thể tích vật thể tròn xoay",
    formula: "Diện tích hình phẳng: S = ∫[a→b] |f(x) - g(x)| dx",
    subFormula: "Thể tích quay quanh trục Ox: V = π · ∫[a→b] [f(x)]² dx",
    description: "Công thức tính nhanh diện tích Parabol cắt đường thẳng (hệ số a, nghiệm x₁ < x₂): S = |a|·(x₂ - x₁)³ / 6.",
    tags: ["Tích phân", "Diện tích", "Thể tích", "Giải tích 12"],
    important: true
  },

  // ==========================================================================
  // 6. LƯỢNG GIÁC & CẤP SỐ CỘNG - CẤP SỐ NHÂN (TOÁN 11)
  // ==========================================================================
  {
    id: "f_trig_core",
    category: "trig",
    categoryName: "Lượng giác & Cấp số",
    title: "Công thức Nhân đôi, Hạ bậc & Biến đổi Lượng giác",
    formula: "sin(2x) = 2sin(x)cos(x)  ;   cos(2x) = cos²x - sin²x = 2cos²x - 1 = 1 - 2sin²x",
    subFormula: "Hạ bậc: cos²x = (1 + cos 2x)/2  ;   sin²x = (1 - cos 2x)/2",
    description: "Hệ thức cơ bản: sin²x + cos²x = 1 ; 1 + tan²x = 1/cos²x ; 1 + cot²x = 1/sin²x.",
    tags: ["Lượng giác", "Nhân đôi", "Hạ bậc", "Toán 11"],
    important: false
  },
  {
    id: "f_seq_arith_geo",
    category: "trig",
    categoryName: "Lượng giác & Cấp số",
    title: "Cấp số cộng (CSC) & Cấp số nhân (CSN)",
    formula: "CSC (công sai d): uₙ = u₁ + (n - 1)d   ;   Sₙ = n(u₁ + uₙ)/2 = n·u₁ + n(n - 1)d / 2",
    subFormula: "CSN (công bội q ≠ 1): uₙ = u₁ · qⁿ⁻¹   ;   Sₙ = u₁ · (1 - qⁿ) / (1 - q)",
    description: "Tính chất trung bình: CSC có uₖ = (uₖ₋₁ + uₖ₊₁)/2 ; CSN có uₖ² = uₖ₋₁ · uₖ₊₁.",
    tags: ["Cấp số cộng", "Cấp số nhân", "Dãy số", "Toán 11"],
    important: false
  }
];

// Export to global window scope for easy access and updates
window.PMATH_FORMULA_CATEGORIES = PMATH_FORMULA_CATEGORIES;
window.PMATH_DEFAULT_FORMULAS = PMATH_DEFAULT_FORMULAS;
