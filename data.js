const GEOMETRY_DATA = [
  // ==========================================
  // PHẦN 1: HÌNH HỌC PHẲNG 2D
  // ==========================================
  {
    id: "triangle",
    category: "2d",
    group: "Đa giác cơ bản",
    name: "Hình Tam Giác (△ABC)",
    subtitle: "Thường, Vuông, Cân, Đều (Kéo thả 3 đỉnh)",
    icon: "△",
    interactiveHint: "💡 Kéo thả trực tiếp 3 đỉnh A, B, C trên mặt phẳng hoặc chọn loại tam giác mẫu bên dưới.",
    presets: [
      { id: "scalene", label: "Tam giác thường", pts: [{ x: -40, y: -110 }, { x: -150, y: 95 }, { x: 145, y: 95 }] },
      { id: "right", label: "Tam giác vuông tại B", pts: [{ x: -130, y: -105 }, { x: -130, y: 95 }, { x: 130, y: 95 }] },
      { id: "isosceles", label: "Tam giác cân tại A", pts: [{ x: 0, y: -125 }, { x: -130, y: 95 }, { x: 130, y: 95 }] },
      { id: "equilateral", label: "Tam giác đều", pts: [{ x: 0, y: -126 }, { x: -140, y: 116 }, { x: 140, y: 116 }] }
    ],
    sliders: [
      { key: "scale", label: "Hệ số tỉ lệ kích thước", min: 0.5, max: 1.5, step: 0.05, default: 1.0, unit: "×" }
    ],
    definition:
      "Tam giác ABC là hình gồm ba đoạn thẳng AB, BC, CA khi ba điểm A, B, C không thẳng hàng. Ba điểm A, B, C gọi là 3 đỉnh; ba đoạn thẳng BC = a, AC = b, AB = c gọi là 3 cạnh.",
    properties: [
      "Tổng ba góc trong của một tam giác luôn bằng 180°: ∠A + ∠B + ∠C = 180°.",
      "Bất đẳng thức tam giác: Tổng độ dài hai cạnh bất kỳ luôn lớn hơn cạnh còn lại (|b - c| < a < b + c).",
      "Trong một tam giác, cạnh đối diện với góc lớn hơn là cạnh lớn hơn và ngược lại.",
      "Góc ngoài của tam giác bằng tổng hai góc trong không kề với nó.",
      "Định lý Cô-sin: a² = b² + c² - 2bc·cos(A). Định lý Sin: a/sin(A) = b/sin(B) = c/sin(C) = 2R."
    ],
    formulas: [
      {
        title: "Chu vi (P) và Nửa chu vi (p)",
        math: "P = a + b + c  ;   p = (a + b + c) / 2",
        note: "a = BC, b = AC, c = AB là độ dài 3 cạnh."
      },
      {
        title: "Diện tích theo cạnh đáy và chiều cao",
        math: "S = ½ · a · hₐ = ½ · b · c · sin(A)",
        note: "hₐ là đường cao kẻ từ đỉnh A xuống cạnh BC."
      },
      {
        title: "Công thức Heron (khi biết 3 cạnh)",
        math: "S = √[ p(p - a)(p - b)(p - c) ]",
        note: "Rất tiện lợi khi biết độ dài 3 cạnh a, b, c."
      },
      {
        title: "Diện tích theo bán kính ngoại tiếp R & nội tiếp r",
        math: "S = (a·b·c) / (4R) = p · r",
        note: "R: bán kính đường tròn ngoại tiếp; r: bán kính đường tròn nội tiếp."
      }
    ],
    tips: [
      "Tam giác vuông: Có 1 góc bằng 90°, thỏa định lý Pythagore a² + b² = c²; trung tuyến ứng với cạnh huyền bằng nửa cạnh huyền.",
      "Tam giác đều cạnh a: Ba góc bằng 60°, đường cao h = a√3 / 2, diện tích S = a²√3 / 4."
    ]
  },

  {
    id: "square",
    category: "2d",
    group: "Tứ giác đặc biệt",
    name: "Hình Vuông (ABCD)",
    subtitle: "4 cạnh bằng nhau, 4 góc vuông",
    icon: "□",
    interactiveHint: "💡 Điều chỉnh độ dài cạnh a để quan sát sự thay đổi của đường chéo d, chu vi P và diện tích S.",
    sliders: [
      { key: "a", label: "Cạnh hình vuông (a)", min: 2, max: 12, step: 0.5, default: 6, unit: "cm" }
    ],
    definition:
      "Hình vuông là tứ giác có bốn góc vuông và bốn cạnh bằng nhau. Hình vuông vừa là hình chữ nhật đặc biệt, vừa là hình thoi đặc biệt.",
    properties: [
      "Bốn cạnh bằng nhau: AB = BC = CD = DA = a; bốn góc đều bằng 90°.",
      "Hai đường chéo AC và BD bằng nhau (d = a√2), vuông góc với nhau tại trung điểm O của mỗi đường.",
      "Hai đường chéo đồng thời là các đường phân giác của các góc của hình vuông (tạo góc 45°).",
      "Tâm đối xứng là giao điểm O của hai đường chéo; có 4 trục đối xứng (2 đường chéo và 2 đường nối trung điểm cặp cạnh đối).",
      "Nội tiếp đường tròn bán kính R = a√2 / 2 và ngoại tiếp đường tròn bán kính r = a / 2."
    ],
    formulas: [
      {
        title: "Chu vi hình vuông",
        math: "P = 4 · a",
        note: "a là độ dài cạnh hình vuông."
      },
      {
        title: "Diện tích hình vuông",
        math: "S = a² = ½ · d²",
        note: "Có thể tính theo cạnh a hoặc theo đường chéo d."
      },
      {
        title: "Độ dài đường chéo",
        math: "d = AC = BD = a√2",
        note: "Suy ra từ định lý Pythagore trong tam giác vuông cân ABC."
      }
    ],
    tips: [
      "Trong mọi hình chữ nhật có cùng chu vi, hình vuông luôn là hình có diện tích lớn nhất (Bất đẳng thức AM-GM)."
    ]
  },

  {
    id: "rectangle",
    category: "2d",
    group: "Tứ giác đặc biệt",
    name: "Hình Chữ Nhật (ABCD)",
    subtitle: "Tứ giác có 4 góc vuông",
    icon: "▭",
    interactiveHint: "💡 Thay đổi chiều dài a và chiều rộng b để quan sát đường chéo và đường tròn ngoại tiếp.",
    sliders: [
      { key: "a", label: "Chiều dài (a)", min: 3, max: 14, step: 0.5, default: 8, unit: "cm" },
      { key: "b", label: "Chiều rộng (b)", min: 2, max: 10, step: 0.5, default: 5, unit: "cm" }
    ],
    definition:
      "Hình chữ nhật là tứ giác có bốn góc vuông (90°). Hình chữ nhật cũng là một hình bình hành có một góc vuông hoặc hai đường chéo bằng nhau.",
    properties: [
      "Các cạnh đối song song và bằng nhau: AB = CD = a, AD = BC = b.",
      "Bốn góc ở đỉnh đều bằng 90°.",
      "Hai đường chéo bằng nhau (AC = BD = √(a² + b²)) và cắt nhau tại trung điểm O của mỗi đường.",
      "Điểm O cách đều 4 đỉnh A, B, C, D nên O là tâm đường tròn ngoại tiếp hình chữ nhật với bán kính R = d/2.",
      "Có 2 trục đối xứng là hai đường thẳng đi qua trung điểm hai cặp cạnh đối diện."
    ],
    formulas: [
      {
        title: "Chu vi hình chữ nhật",
        math: "P = 2 · (a + b)",
        note: "a: chiều dài, b: chiều rộng (cùng đơn vị đo)."
      },
      {
        title: "Diện tích hình chữ nhật",
        math: "S = a · b",
        note: "Tích hai kích thước chiều dài và chiều rộng."
      },
      {
        title: "Độ dài đường chéo & Bán kính ngoại tiếp",
        math: "d = √(a² + b²)  ;   R = d / 2",
        note: "Áp dụng định lý Pythagore cho tam giác vuông ABC."
      }
    ],
    tips: [
      "Dấu hiệu nhận biết: Hình bình hành có 1 góc vuông hoặc có 2 đường chéo bằng nhau là hình chữ nhật."
    ]
  },

  {
    id: "parallelogram",
    category: "2d",
    group: "Tứ giác đặc biệt",
    name: "Hình Bình Hành (ABCD)",
    subtitle: "Các cặp cạnh đối song song và bằng nhau",
    icon: "▱",
    interactiveHint: "💡 Điều chỉnh cạnh đáy a, cạnh bên b và góc nhọn α để quan sát chiều cao h và hai đường chéo.",
    sliders: [
      { key: "a", label: "Cạnh đáy (a)", min: 3, max: 12, step: 0.5, default: 8, unit: "cm" },
      { key: "b", label: "Cạnh bên (b)", min: 2, max: 10, step: 0.5, default: 5, unit: "cm" },
      { key: "alpha", label: "Góc nhọn α (∠A)", min: 30, max: 135, step: 5, default: 60, unit: "°" }
    ],
    definition:
      "Hình bình hành là tứ giác có các cặp cạnh đối song song. Đây là hình cơ sở của các tứ giác đặc biệt như hình chữ nhật, hình thoi, hình vuông.",
    properties: [
      "Các cạnh đối song song và bằng nhau: AB // CD, AB = CD = a; AD // BC, AD = BC = b.",
      "Các góc đối bằng nhau: ∠A = ∠C, ∠B = ∠D; hai góc kề một cạnh bù nhau (tổng bằng 180°).",
      "Hai đường chéo AC và BD cắt nhau tại trung điểm O của mỗi đường (O là tâm đối xứng).",
      "Hệ thức lượng đường chéo: AC² + BD² = 2(a² + b²)."
    ],
    formulas: [
      {
        title: "Chu vi hình bình hành",
        math: "P = 2 · (a + b)",
        note: "a, b là độ dài hai cạnh kề nhau."
      },
      {
        title: "Chiều cao ứng với cạnh đáy a",
        math: "h = b · sin(α)",
        note: "h là khoảng cách vuông góc giữa hai cạnh đối AB và CD."
      },
      {
        title: "Diện tích hình bình hành",
        math: "S = a · h = a · b · sin(α)",
        note: "Tích cạnh đáy và chiều cao tương ứng."
      }
    ],
    tips: [
      "Khi giữ nguyên cạnh đáy a và chiều cao h (trượt đỉnh trên đường thẳng song song với đáy), diện tích hình bình hành không đổi!"
    ]
  },

  {
    id: "rhombus",
    category: "2d",
    group: "Tứ giác đặc biệt",
    name: "Hình Thoi (ABCD)",
    subtitle: "Tứ giác có 4 cạnh bằng nhau, 2 đường chéo vuông góc",
    icon: "◇",
    interactiveHint: "💡 Thay đổi độ dài hai đường chéo d₁ và d₂ để thấy cách chúng vuông góc tại trung điểm và tạo thành 4 tam giác vuông bằng nhau.",
    sliders: [
      { key: "d1", label: "Đường chéo lớn (d₁ = AC)", min: 4, max: 14, step: 0.5, default: 10, unit: "cm" },
      { key: "d2", label: "Đường chéo nhỏ (d₂ = BD)", min: 2, max: 12, step: 0.5, default: 6, unit: "cm" }
    ],
    definition:
      "Hình thoi là tứ giác có bốn cạnh bằng nhau (AB = BC = CD = DA = a). Hình thoi cũng là một hình bình hành đặc biệt.",
    properties: [
      "Bốn cạnh bằng nhau: a = √((d₁/2)² + (d₂/2)²).",
      "Hai đường chéo AC và BD vuông góc với nhau (AC ⊥ BD) tại trung điểm O của mỗi đường.",
      "Hai đường chéo là các đường phân giác của các góc của hình thoi.",
      "Có tâm đối xứng O và 2 trục đối xứng là hai đường chéo AC, BD."
    ],
    formulas: [
      {
        title: "Cạnh hình thoi theo hai đường chéo",
        math: "a = ½ · √(d₁² + d₂²)",
        note: "Áp dụng định lý Pythagore trong tam giác vuông AOB tại O."
      },
      {
        title: "Chu vi hình thoi",
        math: "P = 4 · a",
        note: "a là độ dài một cạnh hình thoi."
      },
      {
        title: "Diện tích hình thoi",
        math: "S = ½ · d₁ · d₂ = a · h",
        note: "Bằng nửa tích độ dài hai đường chéo."
      }
    ],
    tips: [
      "Mọi tứ giác có hai đường chéo vuông góc đều có diện tích S = ½ · d₁ · d₂ (áp dụng cho cả hình thoi, hình vuông và hình cánh diều)."
    ]
  },

  {
    id: "trapezoid",
    category: "2d",
    group: "Tứ giác đặc biệt",
    name: "Hình Thang Cân (ABCD)",
    subtitle: "Hai đáy song song, đường trung bình MN",
    icon: "⏢",
    interactiveHint: "💡 Điều chỉnh đáy lớn a, đáy nhỏ b và chiều cao h; quan sát đường trung bình MN song song với hai đáy.",
    sliders: [
      { key: "a", label: "Đáy lớn (a = CD)", min: 4, max: 14, step: 0.5, default: 10, unit: "cm" },
      { key: "b", label: "Đáy nhỏ (b = AB)", min: 2, max: 12, step: 0.5, default: 5, unit: "cm" },
      { key: "h", label: "Chiều cao (h)", min: 2, max: 10, step: 0.5, default: 5, unit: "cm" }
    ],
    definition:
      "Hình thang là tứ giác có hai cạnh đối song song (gọi là hai đáy). Hình thang cân là hình thang có hai góc kề một đáy bằng nhau.",
    properties: [
      "Hai cạnh đáy song song: AB // CD. Trong hình thang cân, hai cạnh bên bằng nhau (AD = BC) và hai đường chéo bằng nhau (AC = BD).",
      "Hai góc kề một cạnh bên bù nhau: ∠A + ∠D = 180°, ∠B + ∠C = 180°.",
      "Đường trung bình MN (nối trung điểm hai cạnh bên) song song với hai đáy và bằng nửa tổng hai đáy: MN = (a + b) / 2.",
      "Mọi hình thang cân đều nội tiếp được trong một đường tròn."
    ],
    formulas: [
      {
        title: "Độ dài đường trung bình (MN)",
        math: "MN = (a + b) / 2",
        note: "M, N lần lượt là trung điểm của hai cạnh bên AD và BC."
      },
      {
        title: "Diện tích hình thang",
        math: "S = ½ · (a + b) · h = MN · h",
        note: "Muốn tính diện tích hình thang, đáy lớn đáy nhỏ ta mang cộng vào, thế rồi nhân với chiều cao, chia đôi lấy nửa thế nào cũng ra!"
      },
      {
        title: "Chu vi hình thang cân",
        math: "P = a + b + 2 · c",
        note: "Với c = √(h² + ((a - b)/2)²) là cạnh bên của hình thang cân."
      }
    ],
    tips: [
      "Bài thơ quen thuộc: 'Muốn tính diện tích hình thang / Đáy lớn đáy nhỏ ta mang cộng vào / Cộng vào nhân với chiều cao / Chia đôi lấy nửa thế nào cũng ra'."
    ]
  },

  {
    id: "circle",
    category: "2d",
    group: "Đường cong & Đa giác đều",
    name: "Đường Tròn & Hình Quạt (O; R)",
    subtitle: "Bán kính R, đường kính d, cung & quạt tròn",
    icon: "◯",
    interactiveHint: "💡 Thay đổi bán kính R và góc ở tâm α để quan sát dây cung AB, độ dài cung l và diện tích hình quạt tròn.",
    sliders: [
      { key: "R", label: "Bán kính (R)", min: 2, max: 10, step: 0.5, default: 6, unit: "cm" },
      { key: "alpha", label: "Góc ở tâm (α)", min: 15, max: 330, step: 5, default: 75, unit: "°" }
    ],
    definition:
      "Đường tròn tâm O bán kính R (ký hiệu (O; R)) là tập hợp tất cả các điểm trong mặt phẳng cách điểm O cố định một khoảng bằng R (R > 0). Hình tròn gồm đường tròn và tất cả các điểm nằm bên trong nó.",
    properties: [
      "Đường tròn có tâm đối xứng là tâm O và có vô số trục đối xứng (mọi đường thẳng đi qua tâm O).",
      "Đường kính d = 2R là dây cung lớn nhất đi qua tâm.",
      "Đường kính vuông góc với một dây cung thì đi qua trung điểm của dây ấy và chia đôi cung căng dây.",
      "Số đo của góc ở tâm bằng số đo của cung bị chắn (sđ cung AB = ∠AOB = α)."
    ],
    formulas: [
      {
        title: "Đường kính & Chu vi đường tròn",
        math: "d = 2R  ;   C = 2πR = πd",
        note: "π ≈ 3.14159265..."
      },
      {
        title: "Diện tích hình tròn",
        math: "S = π · R²",
        note: "Diện tích toàn bộ miền phẳng giới hạn bởi đường tròn."
      },
      {
        title: "Độ dài cung tròn n° (hoặc α°)",
        math: "l = (π · R · α) / 180°",
        note: "α là số đo góc ở tâm tính bằng độ."
      },
      {
        title: "Diện tích hình quạt tròn & Dây cung AB",
        math: "S_quạt = (π · R² · α) / 360° = ½ · l · R  ;   AB = 2R · sin(α/2)",
        note: "Hình quạt giới hạn bởi 2 bán kính OA, OB và cung AB."
      }
    ],
    tips: [
      "Ghi nhớ nhanh: Công thức diện tích quạt S_quạt = ½ · l · R có dạng rất giống công thức diện tích tam giác S = ½ · a · h!"
    ]
  },

  {
    id: "regular_polygon",
    category: "2d",
    group: "Đường cong & Đa giác đều",
    name: "Đa Giác Đều (n cạnh)",
    subtitle: "Ngũ giác đều, Lục giác đều, Bát giác đều...",
    icon: "⬡",
    interactiveHint: "💡 Thay đổi số cạnh n (từ 3 đến 12) để thấy khi n càng lớn, đa giác đều càng tiến gần tới đường tròn ngoại tiếp.",
    sliders: [
      { key: "n", label: "Số cạnh đa giác (n)", min: 3, max: 12, step: 1, default: 6, unit: "cạnh" },
      { key: "R", label: "Bán kính ngoại tiếp (R)", min: 3, max: 10, step: 0.5, default: 6, unit: "cm" }
    ],
    definition:
      "Đa giác đều là đa giác lồi có tất cả các cạnh bằng nhau và tất cả các góc ở đỉnh bằng nhau. Ví dụ: Tam giác đều (n=3), Hình vuông (n=4), Ngũ giác đều (n=5), Lục giác đều (n=6).",
    properties: [
      "Tổng các góc trong của đa giác n cạnh bằng (n - 2)·180°.",
      "Mỗi góc trong của đa giác đều n cạnh bằng: α = [(n - 2)·180°] / n.",
      "Góc ở tâm chắn mỗi cạnh bằng: φ = 360° / n.",
      "Mọi đa giác đều luôn có một tâm O duy nhất vừa là tâm đường tròn ngoại tiếp (bán kính R), vừa là tâm đường tròn nội tiếp (bán kính r = R·cos(180°/n), còn gọi là trung đoạn).",
      "Riêng Lục giác đều (n = 6): Cạnh a bằng đúng bán kính đường tròn ngoại tiếp (a = R), được ghép từ 6 tam giác đều."
    ],
    formulas: [
      {
        title: "Cạnh a và Trung đoạn r (bán kính nội tiếp)",
        math: "a = 2R · sin(180°/n)  ;   r = R · cos(180°/n)",
        note: "r là khoảng cách từ tâm O đến mỗi cạnh."
      },
      {
        title: "Chu vi đa giác đều",
        math: "P = n · a",
        note: "Tích số cạnh n và độ dài một cạnh a."
      },
      {
        title: "Diện tích đa giác đều",
        math: "S = ½ · P · r = ½ · n · R² · sin(360°/n)",
        note: "Tổng diện tích của n tam giác cân đỉnh O."
      }
    ],
    tips: [
      "Lục giác đều cạnh a có diện tích bằng 6 lần diện tích tam giác đều cạnh a: S = 6 · (a²√3 / 4) = (3√3 / 2)a²."
    ]
  },

  // ==========================================
  // PHẦN 2: ĐƯỜNG & ĐIỂM ĐẶC BIỆT (TRỌNG TÂM, TRỰC TÂM, EULER...)
  // ==========================================
  {
    id: "centroid_medians",
    category: "special",
    group: "Đường & Điểm đặc biệt trong Tam giác",
    name: "Đường Trung Tuyến & Trọng Tâm G",
    subtitle: "3 trung tuyến đồng quy tại G, tỉ lệ AG/AM = 2/3",
    icon: "G",
    interactiveHint: "💡 Kéo thả 3 đỉnh A, B, C để kiểm chứng: 3 đường trung tuyến luôn cắt nhau tại G và chia tam giác thành 6 phần diện tích bằng nhau!",
    sliders: [],
    definition:
      "Đường trung tuyến của tam giác là đoạn thẳng nối một đỉnh của tam giác với trung điểm của cạnh đối diện. Ba đường trung tuyến của một tam giác cùng đi qua một điểm, điểm đó gọi là Trọng tâm G của tam giác.",
    properties: [
      "Ba đường trung tuyến AMₐ, BM_b, CM_c đồng quy tại Trọng tâm G.",
      "Tính chất tỉ lệ vàng của trọng tâm: Trọng tâm G cách mỗi đỉnh một khoảng bằng 2/3 độ dài đường trung tuyến đi qua đỉnh ấy: AG/AMₐ = BG/BM_b = CG/CM_c = 2/3 (hay GA = 2·GMₐ).",
      "Mỗi đường trung tuyến chia tam giác thành 2 tam giác có diện tích bằng nhau. Ba đường trung tuyến chia tam giác thành 6 tam giác nhỏ có diện tích bằng nhau!",
      "Tọa độ trọng tâm: x_G = (x_A + x_B + x_C)/3 ; y_G = (y_A + y_B + y_C)/3 (công thức trung bình cộng).",
      "Hệ thức vectơ: GA⃗ + GB⃗ + GC⃗ = 0⃗. Về mặt vật lý, G chính là khối tâm (trọng tâm cân bằng) của tấm phẳng hình tam giác."
    ],
    formulas: [
      {
        title: "Tỉ lệ khoảng cách từ Trọng tâm G",
        math: "AG = (2/3) AMₐ  ;   GMₐ = (1/3) AMₐ  ;   AG = 2 · GMₐ",
        note: "Mₐ, M_b, M_c lần lượt là trung điểm của BC, AC, AB."
      },
      {
        title: "Công thức độ dài đường trung tuyến (Apollonius)",
        math: "mₐ² = AMₐ² = (2b² + 2c² - a²) / 4",
        note: "Cho phép tính độ dài trung tuyến khi biết 3 cạnh a, b, c."
      },
      {
        title: "Diện tích các tam giác con",
        math: "S(△GAB) = S(△GBC) = S(△GCA) = ⅓ · S(△ABC)",
        note: "Trọng tâm G chia tam giác thành 3 phần có diện tích bằng nhau."
      }
    ],
    tips: [
      "Trọng tâm G luôn luôn nằm bên trong tam giác dù tam giác đó là nhọn, vuông hay tù."
    ]
  },

  {
    id: "orthocenter_altitudes",
    category: "special",
    group: "Đường & Điểm đặc biệt trong Tam giác",
    name: "Đường Cao & Trực Tâm H",
    subtitle: "3 đường cao vuông góc cạnh đối, đồng quy tại H",
    icon: "H",
    interactiveHint: "💡 Thử kéo đỉnh A để tạo Tam giác tù: bạn sẽ thấy Trực tâm H chạy ra bên ngoài tam giác! Nếu tạo góc 90°, H trùng ngay với đỉnh góc vuông.",
    sliders: [],
    definition:
      "Đường cao của một tam giác là đoạn thẳng kẻ từ một đỉnh và vuông góc với đường thẳng chứa cạnh đối diện. Ba đường thẳng chứa ba đường cao đồng quy tại một điểm gọi là Trực tâm H của tam giác.",
    properties: [
      "Ba đường thẳng chứa ba đường cao AHₐ, BH_b, CH_c đồng quy tại Trực tâm H.",
      "Vị trí của Trực tâm H phụ thuộc vào loại tam giác:",
      "• Tam giác nhọn (3 góc < 90°): Trực tâm H nằm bên trong tam giác.",
      "• Tam giác vuông (có 1 góc = 90°): Trực tâm H trùng với đỉnh góc vuông.",
      "• Tam giác tù (có 1 góc > 90°): Trực tâm H nằm bên ngoài tam giác!",
      "Tam giác HₐH_bH_c nối 3 chân đường cao gọi là tam giác trực tâm (orthic triangle)."
    ],
    formulas: [
      {
        title: "Độ dài đường cao theo diện tích S",
        math: "hₐ = 2S / a  ;   h_b = 2S / b  ;   h_c = 2S / c",
        note: "Cạnh càng lớn thì đường cao tương ứng càng nhỏ (tỉ lệ nghịch)."
      },
      {
        title: "Hệ thức lượng trong tam giác vuông (A = 90°)",
        math: "1/hₐ² = 1/b² + 1/c²  ;   hₐ · a = b · c",
        note: "Áp dụng riêng khi tam giác vuông tại A."
      },
      {
        title: "Độ dài đường cao theo góc",
        math: "hₐ = b · sin(C) = c · sin(B)",
        note: "Suy ra từ tỉ số lượng giác trong tam giác vuông."
      }
    ],
    tips: [
      "Nếu H là trực tâm của △ABC thì A cũng là trực tâm của △HBC, B là trực tâm của △HAC, và C là trực tâm của △HAB (Hệ 4 điểm trực tâm)."
    ]
  },

  {
    id: "circumcenter_bisectors",
    category: "special",
    group: "Đường & Điểm đặc biệt trong Tam giác",
    name: "Đường Trung Trực & Tâm Ngoại Tiếp O",
    subtitle: "Cách đều 3 đỉnh OA = OB = OC = R",
    icon: "O",
    interactiveHint: "💡 Kéo 3 đỉnh để xem Đường tròn ngoại tiếp đi qua A, B, C. Khi tam giác vuông, tâm O nằm chính giữa cạnh huyền!",
    sliders: [],
    definition:
      "Đường trung trực của một đoạn thẳng là đường thẳng vuông góc với đoạn thẳng ấy tại trung điểm của nó. Ba đường trung trực của một tam giác đồng quy tại một điểm O, điểm này cách đều 3 đỉnh và là Tâm đường tròn ngoại tiếp tam giác.",
    properties: [
      "Mọi điểm nằm trên đường trung trực của đoạn thẳng thì cách đều hai đầu mút của đoạn thẳng đó.",
      "Ba đường trung trực của tam giác đồng quy tại O nên OA = OB = OC = R (bán kính đường tròn ngoại tiếp).",
      "Vị trí của Tâm ngoại tiếp O:",
      "• Tam giác nhọn: Tâm O nằm bên trong tam giác.",
      "• Tam giác vuông: Tâm O là trung điểm của cạnh huyền (R = cạnh huyền / 2).",
      "• Tam giác tù: Tâm O nằm bên ngoài tam giác."
    ],
    formulas: [
      {
        title: "Bán kính đường tròn ngoại tiếp R (Định lý Sin)",
        math: "R = a / (2·sin A) = b / (2·sin B) = c / (2·sin C)",
        note: "Liên hệ trực tiếp giữa cạnh, góc đối diện và bán kính ngoại tiếp."
      },
      {
        title: "Bán kính R theo 3 cạnh và diện tích S",
        math: "R = (a · b · c) / (4 · S)",
        note: "Công thức cực kỳ phổ biến trong các bài toán hình học phẳng và không gian."
      }
    ],
    tips: [
      "Đừng nhầm lẫn: Đường trung trực vuông góc tại trung điểm của cạnh nhưng KHÔNG nhất thiết đi qua đỉnh đối diện (chỉ đi qua đỉnh khi tam giác cân hoặc đều)!"
    ]
  },

  {
    id: "incenter_anglebisectors",
    category: "special",
    group: "Đường & Điểm đặc biệt trong Tam giác",
    name: "Đường Phân Giác & Tâm Nội Tiếp I",
    subtitle: "Cách đều 3 cạnh, tâm đường tròn nội tiếp (I; r)",
    icon: "I",
    interactiveHint: "💡 Kéo các đỉnh A, B, C để quan sát Đường tròn nội tiếp luôn tiếp xúc vừa khít với cả 3 cạnh của tam giác.",
    sliders: [],
    definition:
      "Đường phân giác trong của một góc trong tam giác chia góc đó thành hai góc bằng nhau. Ba đường phân giác trong của tam giác đồng quy tại một điểm I, cách đều ba cạnh và là Tâm đường tròn nội tiếp tam giác.",
    properties: [
      "Mọi điểm nằm trên tia phân giác của một góc thì cách đều hai cạnh của góc đó.",
      "Ba đường phân giác trong AD_a, BD_b, CD_c luôn đồng quy tại điểm I nằm BÊN TRONG tam giác.",
      "Khoảng cách từ I đến ba cạnh BC, AC, AB bằng nhau và bằng bán kính đường tròn nội tiếp r.",
      "Tính chất đường phân giác (Định lý chia tỉ lệ): Chân đường phân giác AD_a chia cạnh đối diện BC thành hai đoạn tỉ lệ với hai cạnh kề: D_aB / D_aC = AB / AC = c / b."
    ],
    formulas: [
      {
        title: "Bán kính đường tròn nội tiếp r",
        math: "r = S / p = 2S / (a + b + c)",
        note: "Với S là diện tích tam giác và p = (a + b + c)/2 là nửa chu vi."
      },
      {
        title: "Định lý đường phân giác trong",
        math: "DB / DC = c / b  ⇒  DB = a·c / (b + c) ,  DC = a·b / (b + c)",
        note: "D là chân đường phân giác kẻ từ đỉnh A xuống cạnh BC."
      },
      {
        title: "Độ dài đường phân giác trong lₐ",
        math: "lₐ = (2·b·c · cos(A/2)) / (b + c) = √[ b·c · (1 - a²/(b+c)²) ]",
        note: "Tính độ dài đoạn phân giác AD_a từ đỉnh A đến cạnh BC."
      }
    ],
    tips: [
      "Trong tam giác đều cạnh a, cả 4 điểm đặc biệt G, H, O, I trùng nhau tại một điểm duy nhất, và R = 2r = a√3 / 3."
    ]
  },

  {
    id: "euler_ninepoint",
    category: "special",
    group: "Đường & Điểm đặc biệt trong Tam giác",
    name: "Đường Thẳng Euler & Đường Tròn 9 Điểm",
    subtitle: "O, G, H thẳng hàng (OH = 3·OG) & Đường tròn Euler",
    icon: "E",
    interactiveHint: "💡 Kéo 3 đỉnh A, B, C: dù tam giác biến đổi thế nào, 3 điểm O (Ngoại tiếp), G (Trọng tâm), H (Trực tâm) luôn nằm trên một đường thẳng duy nhất!",
    sliders: [],
    definition:
      "Năm 1765, nhà toán học Leonhard Euler chứng minh rằng trong mọi tam giác không đều, Tâm đường tròn ngoại tiếp (O), Trọng tâm (G) và Trực tâm (H) luôn thẳng hàng trên một đường thẳng gọi là Đường thẳng Euler.",
    properties: [
      "Ba điểm O, G, H luôn thẳng hàng và G luôn nằm giữa O và H.",
      "Tỉ lệ khoảng cách cố định: GH = 2 · GO hay OH = 3 · OG (Hệ thức vectơ: OH⃗ = 3·OG⃗ = OA⃗ + OB⃗ + OC⃗).",
      "Đường tròn Euler (Đường tròn 9 điểm): Tâm E là trung điểm của đoạn OH, có bán kính R_E = R / 2.",
      "Đường tròn Euler đi qua đúng 9 điểm đặc biệt: 3 trung điểm của 3 cạnh (Mₐ, M_b, M_c), 3 chân đường cao (Hₐ, H_b, H_c), và 3 trung điểm của các đoạn nối đỉnh với trực tâm (HA, HB, HC)!"
    ],
    formulas: [
      {
        title: "Hệ thức khoảng cách trên đường thẳng Euler",
        math: "GH = 2 · GO  ;   OH = 3 · OG  ;   OE = EH = 1.5 · OG",
        note: "E là tâm đường tròn 9 điểm (trung điểm của OH)."
      },
      {
        title: "Bán kính đường tròn 9 điểm Euler",
        math: "R_Euler = R / 2",
        note: "Bằng đúng một nửa bán kính đường tròn ngoại tiếp tam giác ABC."
      },
      {
        title: "Công thức Euler tính khoảng cách OH",
        math: "OH² = 9R² - (a² + b² + c²)",
        note: "Liên hệ giữa khoảng cách OH, bán kính ngoại tiếp R và 3 cạnh."
      }
    ],
    tips: [
      "Trong tam giác đều, O ≡ G ≡ H nên mọi đường thẳng đi qua tâm đều có thể coi là đường thẳng Euler."
    ]
  },

  {
    id: "midsegment",
    category: "special",
    group: "Đường & Điểm đặc biệt trong Tam giác",
    name: "Đường Trung Bình Của Tam Giác",
    subtitle: "Nối trung điểm 2 cạnh: MN // BC và MN = ½ BC",
    icon: "⧍",
    interactiveHint: "💡 Kéo 3 đỉnh A, B, C để quan sát tam giác trung bình MNP chia △ABC thành 4 tam giác đồng dạng bằng nhau.",
    sliders: [],
    definition:
      "Đường trung bình của tam giác là đoạn thẳng nối trung điểm hai cạnh của tam giác. Một tam giác có ba đường trung bình tạo thành tam giác trung bình.",
    properties: [
      "Định lý 1: Đường thẳng đi qua trung điểm một cạnh của tam giác và song song với cạnh thứ hai thì đi qua trung điểm của cạnh thứ ba.",
      "Định lý 2: Đường trung bình của tam giác thì song song với cạnh thứ ba và bằng nửa cạnh ấy (MN // BC và MN = ½ BC).",
      "Ba đường trung bình chia tam giác ABC thành 4 tam giác nhỏ bằng nhau (△AMN = △Mbp = △NMC = △PMN), mỗi tam giác nhỏ có diện tích bằng ¼ diện tích △ABC.",
      "Chu vi tam giác trung bình bằng một nửa chu vi tam giác ban đầu."
    ],
    formulas: [
      {
        title: "Quan hệ độ dài đường trung bình",
        math: "MN = ½ · BC  ;   MP = ½ · AC  ;   NP = ½ · AB",
        note: "M, N, P là trung điểm của AB, AC, BC."
      },
      {
        title: "Chu vi và Diện tích tam giác trung bình",
        math: "P(△MNP) = ½ · P(△ABC)  ;   S(△MNP) = ¼ · S(△ABC)",
        note: "Tam giác trung bình đồng dạng với △ABC theo tỉ số k = ½."
      }
    ],
    tips: [
      "Đường trung bình là công cụ số 1 để chứng minh hai đường thẳng song song hoặc tính độ dài đoạn thẳng bằng một nửa đoạn cho trước."
    ]
  },

  {
    id: "circle_lines_angles",
    category: "special",
    group: "Đường & Góc đặc biệt trong Đường tròn",
    name: "Tiếp Tuyến, Dây Cung & Góc Nội Tiếp",
    subtitle: "Tiếp tuyến PT ⊥ OT, góc nội tiếp ∠AMB = ½ ∠AOB",
    icon: "⌖",
    interactiveHint: "💡 Điều chỉnh góc cung AB và vị trí điểm M trên đường tròn để thấy góc nội tiếp ∠AMB luôn bằng đúng một nửa góc ở tâm ∠AOB!",
    sliders: [
      { key: "R", label: "Bán kính đường tròn (R)", min: 3, max: 8, step: 0.5, default: 5, unit: "cm" },
      { key: "arcAngle", label: "Số đo cung nhỏ AB (∠AOB)", min: 40, max: 160, step: 5, default: 100, unit: "°" },
      { key: "mPos", label: "Vị trí điểm M trên cung lớn", min: -50, max: 50, step: 2, default: 15, unit: "°" },
      { key: "pDist", label: "Khoảng cách điểm P ngoài đường tròn (OP)", min: 6, max: 13, step: 0.5, default: 9, unit: "cm" }
    ],
    definition:
      "Minh họa tổng hợp các đường và góc quan trọng nhất của đường tròn: Tiếp tuyến (chỉ có 1 điểm chung T với đường tròn, vuông góc với bán kính tại tiếp điểm), Dây cung AB, Góc ở tâm ∠AOB và Góc nội tiếp ∠AMB.",
    properties: [
      "Tiếp tuyến: Đường thẳng PT là tiếp tuyến của (O; R) tại tiếp điểm T ⇔ PT ⊥ OT tại T.",
      "Hai tiếp tuyến cắt nhau tại P: PT₁ = PT₂, PO là tia phân giác của ∠T₁PT₂ và OP là đường trung trực của đoạn nối hai tiếp điểm.",
      "Góc nội tiếp: Có đỉnh M nằm trên đường tròn và hai cạnh chứa hai dây cung MA, MB. Trong một đường tròn, số đo góc nội tiếp bằng NỬA số đo của cung bị chắn: ∠AMB = ½ · ∠AOB.",
      "Hệ quả: Các góc nội tiếp cùng chắn một cung thì bằng nhau (khi bạn trượt điểm M trên cung lớn, góc ∠AMB giữ nguyên không đổi!). Góc nội tiếp chắn nửa đường tròn là góc vuông (90°).",
      "Góc tạo bởi tia tiếp tuyến và dây cung bằng nửa số đo cung bị chắn (bằng góc nội tiếp cùng chắn cung đó)."
    ],
    formulas: [
      {
        title: "Quan hệ Góc nội tiếp và Góc ở tâm cùng chắn cung AB",
        math: "∠AMB = ½ · ∠AOB = ½ · sđ(cung AB)",
        note: "Dù điểm M di chuyển ở đâu trên cung lớn AB, góc ∠AMB luôn không đổi."
      },
      {
        title: "Độ dài đoạn tiếp tuyến PT kẻ từ điểm P ngoài đường tròn",
        math: "PT = √(OP² - R²)",
        note: "Do tam giác OTP vuông tại tiếp điểm T."
      },
      {
        title: "Khoảng cách OH từ tâm O đến dây cung AB",
        math: "OH = R · cos(∠AOB / 2) = √(R² - (AB/2)²)",
        note: "H là trung điểm của dây cung AB (OH ⊥ AB)."
      }
    ],
    tips: [
      "Mẹo chứng minh 4 điểm cùng thuộc một đường tròn (Tứ giác nội tiếp): Tổng hai góc đối bằng 180°, hoặc hai đỉnh kề nhau cùng nhìn cạnh đối diện dưới một góc bằng nhau."
    ]
  },

  // ==========================================
  // PHẦN 3: HÌNH HỌC KHÔNG GIAN 3D
  // ==========================================
  {
    id: "cube",
    category: "3d",
    group: "Khối đa diện (Polyhedra)",
    name: "Hình Lập Phương (ABCD.A'B'C'D')",
    subtitle: "6 mặt đều là hình vuông, 12 cạnh bằng nhau",
    icon: "🧊",
    interactiveHint: "💡 Kéo chuột trên hình để xoay góc nhìn 3D! Các cạnh bị che khuất được tự động vẽ bằng nét đứt đúng chuẩn sách giáo khoa.",
    sliders: [
      { key: "a", label: "Cạnh hình lập phương (a)", min: 2, max: 10, step: 0.5, default: 5, unit: "cm" }
    ],
    definition:
      "Hình lập phương là khối đa diện đều loại {4; 3} có 6 mặt đều là các hình vuông bằng nhau, 12 cạnh bằng nhau và 8 đỉnh (mỗi đỉnh là giao của 3 cạnh đôi một vuông góc).",
    properties: [
      "Có 6 mặt là 6 hình vuông bằng nhau, 12 cạnh có độ dài bằng a, 8 đỉnh.",
      "Đường chéo của một mặt bên (ví dụ AC) bằng a√2.",
      "Bốn đường chéo của hình lập phương (AC', BD', CA', DB') bằng nhau, cắt nhau tại trung điểm O của mỗi đường và có độ dài d = a√3.",
      "Tâm O cách đều 8 đỉnh (bán kính mặt cầu ngoại tiếp R = a√3 / 2) và cách đều 6 mặt (bán kính mặt cầu nội tiếp r = a / 2)."
    ],
    formulas: [
      {
        title: "Diện tích xung quanh (4 mặt bên)",
        math: "S_xq = 4 · a²",
        note: "Tổng diện tích 4 mặt bên hình vuông."
      },
      {
        title: "Diện tích toàn phần (cả 6 mặt)",
        math: "S_tp = 6 · a²",
        note: "Tổng diện tích tất cả 6 mặt hình vuông."
      },
      {
        title: "Thể tích khối lập phương",
        math: "V = a³",
        note: "Cạnh nhân cạnh nhân cạnh."
      },
      {
        title: "Đường chéo mặt & Đường chéo khối lập phương",
        math: "d_mặt = a√2  ;   D_khối = AC' = a√3",
        note: "Áp dụng định lý Pythagore trong không gian 3 chiều."
      }
    ],
    tips: [
      "Khi nhân đôi độ dài cạnh a của hình lập phương (a → 2a), diện tích tăng gấp 4 lần (2²) nhưng thể tích tăng gấp 8 lần (2³)!"
    ]
  },

  {
    id: "box",
    category: "3d",
    group: "Khối đa diện (Polyhedra)",
    name: "Hình Hộp Chữ Nhật",
    subtitle: "6 mặt là hình chữ nhật, 3 kích thước a, b, h",
    icon: "📦",
    interactiveHint: "💡 Xoay 3D và thay đổi chiều dài a, chiều rộng b, chiều cao h. Quan sát đường chéo không gian AC' nối hai đỉnh đối diện.",
    sliders: [
      { key: "a", label: "Chiều dài đáy (a)", min: 2, max: 10, step: 0.5, default: 6, unit: "cm" },
      { key: "b", label: "Chiều rộng đáy (b)", min: 2, max: 10, step: 0.5, default: 4, unit: "cm" },
      { key: "h", label: "Chiều cao (h = AA')", min: 2, max: 10, step: 0.5, default: 5, unit: "cm" }
    ],
    definition:
      "Hình hộp chữ nhật là hình lăng trụ đứng có đáy là hình chữ nhật (tất cả 6 mặt đều là hình chữ nhật). Nó được xác định bởi 3 kích thước: chiều dài a, chiều rộng b và chiều cao h.",
    properties: [
      "Có 6 mặt là các hình chữ nhật (các mặt đối diện song song và bằng nhau), 12 cạnh chia làm 3 nhóm bằng nhau, 8 đỉnh.",
      "Các cạnh bên AA', BB', CC', DD' đôi một song song, bằng nhau (= h) và vuông góc với hai mặt đáy.",
      "Bốn đường chéo không gian (AC', BD', CA', DB') bằng nhau, đồng quy tại trung điểm O và có độ dài D = √(a² + b² + h²).",
      "Nội tiếp trong mặt cầu tâm O với bán kính R = ½ √(a² + b² + h²)."
    ],
    formulas: [
      {
        title: "Diện tích xung quanh (4 mặt đứng)",
        math: "S_xq = 2 · (a + b) · h = P_đáy · h",
        note: "Chu vi đáy nhân với chiều cao."
      },
      {
        title: "Diện tích toàn phần",
        math: "S_tp = S_xq + 2·S_đáy = 2 · (ab + bh + ha)",
        note: "Tổng diện tích xung quanh và 2 mặt đáy."
      },
      {
        title: "Thể tích hình hộp chữ nhật",
        math: "V = a · b · h = S_đáy · h",
        note: "Tích ba kích thước dài, rộng, cao."
      },
      {
        title: "Độ dài đường chéo không gian AC'",
        math: "D = √(a² + b² + h²)",
        note: "Định lý Pythagore 3D."
      }
    ],
    tips: [
      "Trong mọi hình hộp chữ nhật, bình phương đường chéo bằng tổng bình phương ba kích thước xuất phát từ cùng một đỉnh: AC'² = AB² + AD² + AA'²."
    ]
  },

  {
    id: "prism_tri",
    category: "3d",
    group: "Khối đa diện (Polyhedra)",
    name: "Hình Lăng Trụ Đứng Tam Giác",
    subtitle: "2 đáy tam giác song song, 3 mặt bên chữ nhật",
    icon: "∆",
    interactiveHint: "💡 Kéo chuột để quan sát 2 mặt đáy tam giác đều song song và 3 cạnh bên vuông góc với đáy.",
    sliders: [
      { key: "a", label: "Cạnh tam giác đều đáy (a)", min: 2, max: 10, step: 0.5, default: 5, unit: "cm" },
      { key: "h", label: "Chiều cao cạnh bên (h)", min: 2, max: 10, step: 0.5, default: 6, unit: "cm" }
    ],
    definition:
      "Hình lăng trụ đứng tam giác ABC.A'B'C' là hình đa diện có hai mặt đáy ABC và A'B'C' là hai tam giác bằng nhau nằm trên hai mặt phẳng song song, và các cạnh bên AA', BB', CC' vuông góc với mặt đáy.",
    properties: [
      "Hai mặt đáy song song và bằng nhau (△ABC = △A'B'C').",
      "Các cạnh bên song song, bằng nhau (AA' = BB' = CC' = h) và vuông góc với hai mặt phẳng đáy.",
      "Các mặt bên (ABB'A', BCC'B', CAA'C') đều là các hình chữ nhật vuông góc với đáy.",
      "Có 6 đỉnh, 9 cạnh và 5 mặt (2 mặt đáy + 3 mặt bên)."
    ],
    formulas: [
      {
        title: "Diện tích đáy (khi đáy là tam giác đều cạnh a)",
        math: "S_đáy = (a²√3) / 4",
        note: "Nếu đáy là tam giác thường thì tính bằng công thức Heron hoặc ½·đáy·cao."
      },
      {
        title: "Diện tích xung quanh & Toàn phần",
        math: "S_xq = P_đáy · h  ;   S_tp = S_xq + 2 · S_đáy",
        note: "P_đáy là chu vi tam giác đáy."
      },
      {
        title: "Thể tích khối lăng trụ",
        math: "V = S_đáy · h",
        note: "Diện tích đáy nhân với chiều cao (không có hệ số 1/3!)."
      }
    ],
    tips: [
      "Phân biệt rõ: Thể tích Lăng trụ là V = S_đáy · h, còn thể tích Hình chóp cùng đáy cùng chiều cao chỉ bằng 1/3 lăng trụ (V = ⅓ · S_đáy · h)."
    ]
  },

  {
    id: "pyramid_square",
    category: "3d",
    group: "Khối đa diện (Polyhedra)",
    name: "Hình Chóp Tứ Giác Đều (S.ABCD)",
    subtitle: "Đáy hình vuông, chân đường cao SO tại tâm O",
    icon: "⛰️",
    interactiveHint: "💡 Quan sát đường cao SO (màu vàng) vuông góc với tâm đáy O, và trung đoạn SI (màu hồng) là đường cao của mặt bên △SBC.",
    sliders: [
      { key: "a", label: "Cạnh hình vuông đáy (a)", min: 2, max: 10, step: 0.5, default: 6, unit: "cm" },
      { key: "h", label: "Chiều cao hình chóp (SO = h)", min: 2, max: 10, step: 0.5, default: 6, unit: "cm" }
    ],
    definition:
      "Hình chóp tứ giác đều S.ABCD có mặt đáy ABCD là hình vuông, bốn mặt bên là các tam giác cân bằng nhau có chung đỉnh S, và hình chiếu vuông góc của đỉnh S lên mặt đáy trùng với tâm O của hình vuông đáy.",
    properties: [
      "Mặt đáy ABCD là hình vuông cạnh a; tâm O là giao điểm hai đường chéo AC và BD (AC ⊥ BD).",
      "Đường cao SO vuông góc với mặt phẳng đáy (ABCD): SO ⊥ (ABCD).",
      "Bốn cạnh bên bằng nhau: SA = SB = SC = SD = √(h² + a²/2).",
      "Bốn mặt bên là 4 tam giác cân bằng nhau. Đường cao kẻ từ đỉnh S tới trung điểm I của cạnh đáy BC gọi là Trung đoạn d = SI = √(h² + (a/2)²).",
      "Có 5 đỉnh, 8 cạnh và 5 mặt."
    ],
    formulas: [
      {
        title: "Trung đoạn (d = SI) và Cạnh bên (SA)",
        math: "d = SI = √[ h² + (a/2)² ]  ;   SA = √(h² + a²/2)",
        note: "Tính từ tam giác vuông SOI (vuông tại O, OI = a/2) và SOA (OA = a√2/2)."
      },
      {
        title: "Diện tích xung quanh & Toàn phần",
        math: "S_xq = ½ · P_đáy · d = 2 · a · d  ;   S_tp = a² + 2 · a · d",
        note: "Diện tích xung quanh bằng nửa chu vi đáy nhân với trung đoạn d."
      },
      {
        title: "Thể tích khối chóp tứ giác đều",
        math: "V = ⅓ · S_đáy · h = ⅓ · a² · h",
        note: "Một phần ba diện tích đáy nhân với chiều cao SO = h."
      }
    ],
    tips: [
      "Cẩn thận nhầm lẫn giữa Chiều cao hình chóp (h = SO, nối đỉnh S với tâm đáy O) và Trung đoạn (d = SI, đường cao của mặt bên dùng để tính diện tích xung quanh)!"
    ]
  },

  {
    id: "pyramid_tri",
    category: "3d",
    group: "Khối đa diện (Polyhedra)",
    name: "Hình Chóp Tam Giác Đều (S.ABC)",
    subtitle: "Đáy tam giác đều, chân đường cao tại trọng tâm G",
    icon: "▲",
    interactiveHint: "💡 Xoay 3D để quan sát đường cao SG hạ thẳng xuống trọng tâm G của tam giác đều ABC.",
    sliders: [
      { key: "a", label: "Cạnh đáy tam giác đều (a)", min: 2, max: 10, step: 0.5, default: 6, unit: "cm" },
      { key: "h", label: "Chiều cao hình chóp (SG = h)", min: 2, max: 10, step: 0.5, default: 5.5, unit: "cm" }
    ],
    definition:
      "Hình chóp tam giác đều S.ABC là hình chóp có đáy ABC là tam giác đều cạnh a và các cạnh bên SA = SB = SC bằng nhau. Chân đường cao hạ từ S trùng với trọng tâm G (cũng là tâm ngoại tiếp/nội tiếp) của đáy ABC.",
    properties: [
      "Đáy ABC là tam giác đều cạnh a, diện tích đáy S_đáy = a²√3 / 4.",
      "Ba mặt bên SAB, SBC, SCA là các tam giác cân tại S bằng nhau.",
      "Chân đường cao G cách mỗi đỉnh của đáy một đoạn AG = R_đáy = a√3 / 3, và cách mỗi cạnh đáy một đoạn GM = r_đáy = a√3 / 6.",
      "Các cặp cạnh đối diện vuông góc với nhau từng đôi một: SA ⊥ BC, SB ⊥ AC, SC ⊥ AB.",
      "Đặc biệt: Khi cạnh bên bằng luôn cạnh đáy (SA = a), hình chóp trở thành Tứ diện đều (4 mặt đều là tam giác đều), khi đó h = a√6 / 3 và V = a³√2 / 12."
    ],
    formulas: [
      {
        title: "Trung đoạn (d = SM) và Cạnh bên (SA)",
        math: "d = √[ h² + (a√3/6)² ]  ;   SA = √[ h² + (a√3/3)² ]",
        note: "Với M là trung điểm BC, GM = a√3/6 và GA = a√3/3."
      },
      {
        title: "Diện tích xung quanh & Toàn phần",
        math: "S_xq = ½ · (3a) · d  ;   S_tp = S_xq + (a²√3)/4",
        note: "d = SM là trung đoạn (đường cao mặt bên SBC)."
      },
      {
        title: "Thể tích khối chóp tam giác đều",
        math: "V = ⅓ · S_đáy · h = (a²√3 / 12) · h",
        note: "Một phần ba diện tích tam giác đều đáy nhân với chiều cao h."
      }
    ],
    tips: [
      "Ghi nhớ cho Tứ diện đều cạnh a (cả 6 cạnh đều bằng a): Chiều cao h = a√6 / 3, Thể tích V = a³√2 / 12."
    ]
  },

  {
    id: "cylinder",
    category: "3d",
    group: "Khối tròn xoay (Surfaces of Revolution)",
    name: "Hình Trụ Tròn Xoay",
    subtitle: "Quay hình chữ nhật quanh 1 cạnh cố định (r, h)",
    icon: "🛢️",
    interactiveHint: "💡 Điều chỉnh bán kính đáy r và chiều cao h. Quan sát trục OO' và đường sinh l = h.",
    sliders: [
      { key: "r", label: "Bán kính đáy (r)", min: 1.5, max: 7, step: 0.5, default: 3.5, unit: "cm" },
      { key: "h", label: "Chiều cao / Đường sinh (h = l)", min: 2, max: 10, step: 0.5, default: 6, unit: "cm" }
    ],
    definition:
      "Khi quay một hình chữ nhật OAA'O' một vòng quanh cạnh cố định OO', ta được một Hình trụ tròn xoay. Hai cạnh OA, O'A' quét nên hai hình tròn đáy bằng nhau có bán kính r; cạnh AA' quét nên mặt xung quanh (đường sinh l = h).",
    properties: [
      "Hai đáy là hai hình tròn bằng nhau (O; r) và (O'; r) nằm trong hai mặt phẳng song song.",
      "Độ dài đường sinh l bằng chiều cao h của hình trụ (l = h = OO').",
      "Khi trải phẳng mặt xung quanh của hình trụ ra mặt phẳng, ta được một hình chữ nhật có một chiều là chu vi đáy (2πr) và chiều kia là chiều cao h.",
      "Thiết diện qua trục OO' là một hình chữ nhật có kích thước 2r × h."
    ],
    formulas: [
      {
        title: "Diện tích xung quanh hình trụ",
        math: "S_xq = 2 · π · r · h",
        note: "Chu vi đường tròn đáy (2πr) nhân với chiều cao h."
      },
      {
        title: "Diện tích toàn phần hình trụ",
        math: "S_tp = S_xq + 2·S_đáy = 2πr(h + r)",
        note: "Gồm diện tích xung quanh cộng với diện tích 2 hình tròn đáy."
      },
      {
        title: "Thể tích khối trụ",
        math: "V = S_đáy · h = π · r² · h",
        note: "Diện tích hình tròn đáy nhân với chiều cao h."
      }
    ],
    tips: [
      "Nếu cắt mặt xung quanh của chiếc lon hình trụ dọc theo một đường sinh rồi trải phẳng ra bàn, diện tích tờ nhãn chính là S_xq = 2πrh."
    ]
  },

  {
    id: "cone",
    category: "3d",
    group: "Khối tròn xoay (Surfaces of Revolution)",
    name: "Hình Nón Tròn Xoay",
    subtitle: "Đỉnh S, bán kính đáy r, chiều cao h, đường sinh l",
    icon: "🍦",
    interactiveHint: "💡 Quan sát tam giác vuông SOA (vuông tại tâm đáy O) liên hệ trực tiếp giữa chiều cao h, bán kính r và đường sinh l = √(r² + h²).",
    sliders: [
      { key: "r", label: "Bán kính đáy (r)", min: 1.5, max: 7, step: 0.5, default: 4, unit: "cm" },
      { key: "h", label: "Chiều cao (SO = h)", min: 2, max: 10, step: 0.5, default: 6, unit: "cm" }
    ],
    definition:
      "Khi quay một tam giác vuông SOA (vuông tại O) một vòng quanh cạnh góc vuông SO cố định, ta được một Hình nón tròn xoay. Cạnh OA quét nên hình tròn đáy (O; r), cạnh huyền SA quét nên mặt xung quanh và gọi là đường sinh l.",
    properties: [
      "Đáy là hình tròn tâm O bán kính r; đỉnh là điểm S; trục hình nón là đường thẳng SO.",
      "Chiều cao h = SO vuông góc với mặt đáy. Mọi đường sinh SA, SB... đều có độ dài bằng nhau: l = √(r² + h²).",
      "Thiết diện đi qua trục SO là một tam giác cân SAB có cạnh bên bằng l và cạnh đáy bằng đường kính 2r.",
      "Khi trải phẳng mặt xung quanh của hình nón, ta thu được một hình quạt tròn có bán kính bằng đường sinh l và độ dài cung bằng chu vi đáy 2πr."
    ],
    formulas: [
      {
        title: "Độ dài đường sinh l",
        math: "l = SA = √(r² + h²)",
        note: "Áp dụng định lý Pythagore cho tam giác vuông SOA."
      },
      {
        title: "Diện tích xung quanh & Toàn phần hình nón",
        math: "S_xq = π · r · l  ;   S_tp = π · r · (l + r)",
        note: "Lưu ý: Tính S_xq dùng đường sinh l, tính thể tích V dùng chiều cao h!"
      },
      {
        title: "Thể tích khối nón",
        math: "V = ⅓ · S_đáy · h = ⅓ · π · r² · h",
        note: "Bằng 1/3 thể tích khối trụ có cùng bán kính đáy r và chiều cao h."
      }
    ],
    tips: [
      "Lỗi sai phổ biến nhất của học sinh: dùng nhầm chiều cao h vào công thức S_xq = πrl hoặc dùng nhầm đường sinh l vào công thức thể tích V = ⅓πr²h. Hãy luôn tính l = √(r²+h²) trước!"
    ]
  },

  {
    id: "sphere",
    category: "3d",
    group: "Khối tròn xoay (Surfaces of Revolution)",
    name: "Mặt Cầu & Khối Cầu (O; R)",
    subtitle: "Tâm O, bán kính R, đường tròn lớn & mặt phẳng cắt",
    icon: "🌐",
    interactiveHint: "💡 Thay đổi bán kính R và khoảng cách mặt phẳng cắt d từ tâm O để quan sát thiết diện là đường tròn bán kính r = √(R² - d²).",
    sliders: [
      { key: "R", label: "Bán kính mặt cầu (R)", min: 2, max: 8, step: 0.5, default: 5, unit: "cm" },
      { key: "d", label: "Khoảng cách mặt cắt từ tâm (d)", min: 0, max: 4.5, step: 0.5, default: 2.5, unit: "cm" }
    ],
    definition:
      "Mặt cầu tâm O bán kính R là tập hợp tất cả các điểm trong không gian 3 chiều cách điểm O cố định một khoảng không đổi bằng R (R > 0). Khối cầu gồm mặt cầu và phần không gian bên trong mặt cầu đó.",
    properties: [
      "Mọi mặt phẳng cắt mặt cầu đều tạo ra giao tuyến là một đường tròn bán kính r = √(R² - d²), trong đó d < R là khoảng cách từ tâm O đến mặt phẳng cắt.",
      "Khi mặt phẳng đi qua tâm O (d = 0), thiết diện là Đường tròn lớn (kinh tuyến/xích đạo) có bán kính lớn nhất bằng R.",
      "Khi d = R, mặt phẳng chỉ tiếp xúc với mặt cầu tại 1 điểm duy nhất (Tiếp diện), bán kính vuông góc với tiếp diện tại tiếp điểm.",
      "Trong mọi hình có cùng diện tích bề mặt, khối cầu là hình có thể tích lớn nhất (vì thế giọt nước, bong bóng xà phòng và các hành tinh đều có dạng hình cầu!)."
    ],
    formulas: [
      {
        title: "Diện tích mặt cầu",
        math: "S = 4 · π · R² = π · D²",
        note: "Bằng đúng 4 lần diện tích hình tròn lớn (Archimedes đã chứng minh)."
      },
      {
        title: "Thể tích khối cầu",
        math: "V = (4/3) · π · R³ = (1/6) · π · D³",
        note: "Với R là bán kính và D = 2R là đường kính mặt cầu."
      },
      {
        title: "Bán kính đường tròn giao tuyến khi cắt bởi mặt phẳng cách tâm đoạn d",
        math: "r = √(R² - d²)   (với 0 ≤ d < R)",
        note: "Chu vi thiết diện C = 2πr, diện tích thiết diện S_cắt = π(R² - d²)."
      }
    ],
    tips: [
      "Mẹo nhớ đạo hàm thú vị: Đạo hàm của công thức thể tích khối cầu V(R) = (4/3)πR³ theo biến R chính là diện tích mặt cầu S(R) = 4πR²!"
    ]
  },

  {
    id: "line3d_velocity",
    category: "3d",
    group: "Hình học Không gian Oxyz & Chuyển động",
    name: "Chuyển Động Thẳng Đều & Vectơ Vận Tốc Oxyz",
    subtitle: "Phương trình đường thẳng theo thời gian t, vectơ vận tốc v⃗, tốc độ & bài toán máy bay",
    icon: "🚀",
    interactiveHint: "💡 Điều chỉnh vị trí ban đầu M₀(x₀, y₀, z₀), vectơ vận tốc v⃗(v_x, v_y, v_z) và kéo thanh thời gian t (hoặc bấm Play) để quan sát chuyển động thực tế.",
    sliders: [
      { key: "t", label: "Thời gian (t)", min: -10, max: 10, step: 0.2, default: 0, unit: "s" },
      { key: "vx", label: "Vận tốc v_x", min: -5, max: 5, step: 0.5, default: 2, unit: "m/s" },
      { key: "vy", label: "Vận tốc v_y", min: -5, max: 5, step: 0.5, default: 1.5, unit: "m/s" },
      { key: "vz", label: "Vận tốc v_z", min: -5, max: 5, step: 0.5, default: 1, unit: "m/s" }
    ],
    definition:
      "Trong không gian Oxyz, một vật thể chuyển động thẳng đều với vận tốc không đổi v⃗ = (v_x; v_y; v_z) từ vị trí ban đầu M₀(x₀, y₀, z₀) tại thời điểm t = 0 sẽ có quỹ đạo là một đường thẳng. Vectơ vận tốc v⃗ đóng vai trò chính là vectơ chỉ phương của đường thẳng đó.",
    properties: [
      "Phương trình tham số của quỹ đạo theo thời gian t: x = x₀ + v_x·t ; y = y₀ + v_y·t ; z = z₀ + v_z·t.",
      "Vectơ vị trí tại thời điểm t: r⃗(t) = r⃗₀ + v⃗·t.",
      "Vectơ vận tốc v⃗ chỉ đúng hướng chuyển động của vật thể trong không gian 3 chiều và có độ dài bằng tốc độ.",
      "Tốc độ chuyển động của vật thể: v = |v⃗| = √(v_x² + v_y² + v_z²).",
      "Quãng đường vật thể đi được sau khoảng thời gian Δt là: s = v · Δt.",
      "Bài toán thực tế 2 vật thể (VD: 2 máy bay chuyển động theo 2 đường thẳng r⃗₁(t) và r⃗₂(t)): Khoảng cách tại thời điểm t là d(t) = |r⃗₁(t) - r⃗₂(t)|. Thời điểm tiếp cận gần nhất t_min tìm được bằng cách giải đạo hàm d'(t) = 0."
    ],
    formulas: [
      {
        title: "Phương trình quỹ đạo chuyển động thẳng đều",
        math: "\\begin{cases} x = x_0 + v_x \\cdot t \\\\ y = y_0 + v_y \\cdot t \\\\ z = z_0 + v_z \\cdot t \\end{cases}",
        note: "M₀(x₀; y₀; z₀) là vị trí tại t = 0; v⃗(v_x; v_y; v_z) là vectơ vận tốc."
      },
      {
        title: "Tốc độ chuyển động (Độ lớn vectơ vận tốc)",
        math: "v = |\\vec{v}| = \\sqrt{v_x^2 + v_y^2 + v_z^2}",
        note: "Đơn vị vận tốc thường là m/s hoặc km/h (1 m/s = 3.6 km/h)."
      },
      {
        title: "Vị trí vật thể tại thời điểm t",
        math: "M(t) = (x_0 + v_x \\cdot t;\\; y_0 + v_y \\cdot t;\\; z_0 + v_z \\cdot t)",
        note: "Mũi tên vectơ vận tốc v⃗ luôn đặt gốc tại M(t)."
      },
      {
        title: "Khoảng cách giữa hai vật thể chuyển động tại thời điểm t",
        math: "d(t) = \\sqrt{[x_1(t)-x_2(t)]^2 + [y_1(t)-y_2(t)]^2 + [z_1(t)-z_2(t)]^2}",
        note: "Dùng để kiểm tra nguy cơ va chạm giữa 2 đường bay trong bài toán thực tế THPT."
      }
    ],
    tips: [
      "Ứng dụng thực tế môn Toán 12: Đề thi THPT Quốc Gia mới thường cho tọa độ radar của máy bay tại 2 thời điểm t₁ và t₂ để yêu cầu lập vectơ vận tốc v⃗ = (r⃗₂ - r⃗₁)/(t₂ - t₁) và tính độ cao z(t) hoặc góc nghiêng so với mặt đất (mặt phẳng Oxy: z = 0)!"
    ]
  }
];
