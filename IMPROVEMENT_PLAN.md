# KẾ HOẠCH CẢI TIẾN & ĐẶC TẢ KỸ THUẬT CHO AI AGENT (PMATH EDUCATION TOOLS)

> **Hướng dẫn dành cho AI Agent (Antigravity):**  
> Tài liệu này là bản đặc tả kỹ thuật (Master Execution Plan) để khắc phục triệt để **18 lỗi từ Báo cáo QA (`BUG-01` đến `BUG-18`)** đồng thời nâng cấp toàn bộ giao diện theo chuẩn **Taste Skill v2 (`@SKILL.md`)**.  
> Agent cần thực hiện tuần tự từ **Giai đoạn 1 (P0)** đến **Giai đoạn 4 (P3)**, chạy kiểm tra đối chiếu sau mỗi giai đoạn và tuyệt đối không bỏ sót bất kỳ ràng buộc toán học hay bảo mật nào.

---
@SKILL.md

Refactor and redesign the UI/UX for PMATH Education Tools (scientific & mathematical tool suite) into a premier, high-fidelity academic platform.

Follow all instructions in SKILL.md with strict adherence to Section 0 (Brief inference), Section 4 (The Locks), Section 5 (Animation skeletons), and Section 9 (Anti-slop bans).

### 1. Design Read & Aesthetic
- Direction: Editorial Scientific & Mathematical Lab. Clean, dense, rigorous, yet modern (inspired by ObservableHQ, Desmos Studio, and LaTeX typographic precision).
- Palette (Page Theme & Color Lock): 
  - Dark mode default with dual-mode support (off-black base #0D0F12, off-white contrast #F4F5F7).
  - Single Accent Lock: Scientific Electric Blue (#2563EB or #3B82F6) for interactive active states and focus rings. No random purple gradients or mesh blobs.
- Typography: Monospace accents for equations/data counters (JetBrains Mono / Fira Code), paired with crisp sans-serif (Geist / Inter) for UI, and LaTeX-style serif accents for mathematical symbols.
- Corner Radius Lock: Consistent 6px or 8px across all cards, inputs, and modals.

### 2. Layout & Structure
- Hero Section (Strict Hero Discipline):
  - Headline strictly max 2 lines: Focus on algorithmic and mathematical clarity.
  - Subtext strictly under 20 words.
  - Primary interactive tool/playground visible above the fold without scrolling.
  - No fake metrics or decorative version pills (e.g., no "v2.0 Beta" labels).
- Tool Grid & Workspace:
  - Do NOT use 3-equal-card feature rows. Use an asymmetric layout or a split interactive workbench (formula/input drawer on the left, reactive visual canvas/output on the right).
  - High information density with subtle divider lines; avoid `border-t + border-b` spamming.

### 3. Motion & Animation (Section 5)
- Use Framer Motion / Motion primitives. Zero `window.addEventListener('scroll')`.
- Micro-interactions: Spring-based easing (`damping: 24, stiffness: 260`) for active tabs, tool switches, and parameter sliders.
- Smooth mathematical transitions: Layout animations (`layoutId`) when switching between math modules (e.g., Function Plotter, Matrix Calculator, LaTeX formatter).
- Graph/Canvas transitions: Staggered reveal for formula results and interactive parameter cards.

### 4. Anti-Slop Ban Enforcement
- Strictly ban em-dashes (—) and en-dashes (–) across all UI copy; use standard hyphens (-) or restructure sentences.
- Zero decorative SVG fluff or arbitrary glowing blobs.
- No fake interactive previews: every displayed equation/tool must be functional or wired to reactive state.

Before writing the code, run Section 0 (Design Read declaration) and perform Section 14 (Hard Pre-flight Check). Output the refined React/Tailwind implementation.
## 0. ĐỊNH HƯỚNG THIẾT KẾ THEO TASTE SKILL V2 (SECTION 0 & SECTION 4 LOCKS)

Trước khi can thiệp vào mã nguồn giao diện, Agent phải áp dụng cố định các thông số thiết kế sau:

1. **Design Read (Section 0):**  
   *Scientific & Mathematical Editorial Workbench* - Bàn làm việc toán học và mô phỏng khoa học độ chính xác cao (lấy cảm hứng từ Desmos Studio, ObservableHQ và chuẩn sắp chữ $\text{\LaTeX}$). Mật độ thông tin khoa học, rõ ràng, không dùng hiệu ứng trang trí rườm rà.
2. **Page Theme & Single-Accent Lock (Section 4):**
   - **Light Mode (Mặc định học thuật):** Nền giấy `#F8FAFC`, bề mặt thẻ `#FFFFFF`, chữ chính `#0F172A`, chữ phụ `#475569`, viền `#E2E8F0`.
   - **Dark Mode (Phòng thí nghiệm đêm):** Nền chính `#0D0F12`, bề mặt thẻ/bảng `#15181E`, chữ chính `#F1F5F9`, chữ phụ `#94A3B8`, viền `#262B35`.
   - **Single Accent Lock:** Xanh lam khoa học (`#2563EB` trên nền Sáng, `#3B82F6` kèm chữ tối hoặc nền `#1D4ED8` chữ trắng `#FFFFFF` trên nền Tối để đảm bảo độ tương phản WCAG AA $\ge 4.5 : 1$).
3. **Typography & Math Font Lock:**
   - **UI Sans:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`.
   - **Monospace (Tọa độ, thông số, bộ đếm thời gian $t$):** `'JetBrains Mono', 'Fira Code', monospace` kèm thuộc tính `font-variant-numeric: tabular-nums`.
   - **Math & Symbol Stack (Chống lỗi ô vuông tofu):** Mọi công thức trong Bảng công thức và Cẩm nang lý thuyết phải được render bằng KaTeX hoặc dùng chuỗi font toán học chuẩn: `'KaTeX_Main', 'STIX Two Math', 'Cambria Math', 'Noto Sans Math', 'Segoe UI Symbol', serif`.
4. **Corner Radius & Border Lock:**
   - Bán kính bo góc đồng nhất `6px` cho nút bấm/input và `8px` cho thẻ/hộp thoại.
   - Viền đơn `1px solid`, không lạm dụng đổ bóng neon hay các khối cầu phát sáng vô nghĩa.
5. **Motion & Animation Skeletons (Section 5):**
   - Mọi chuyển động đóng/mở bảng điều khiển, chuyển tab, hoặc trải phẳng hình học 3D sử dụng đường cong vật lý `cubic-bezier(0.22, 1, 0.36, 1)` hoặc nội suy mượt qua `requestAnimationFrame`.
   - Tuyệt đối không gắn `window.addEventListener('scroll')` gây nghẽn luồng chính.
6. **Anti-Slop Enforcement (Section 9):**
   - Gỡ bỏ hoàn toàn thanh nút nổi `.floating-mode-switcher` ở góc dưới phải vì trùng lặp chức năng với thanh điều hướng trên cùng và che khuất vùng làm việc.
   - Không dùng dấu gạch ngang dài (em-dash) trong văn bản giao diện; dùng dấu gạch nối chuẩn `-` hoặc cấu trúc câu rõ nghĩa.

---

## GIAI ĐOẠN 1 (P0 - CRITICAL): BẢO MẬT XSS & AN TOÀN DỮ LIỆU

### 1.1. Vá lỗ hổng Stored DOM XSS (`BUG-01`, Mục `A1`, `D1`)
- **Nguyên nhân:** Các hàm `renderSceneObjectsTree()`, `openEditModal()`, bộ hiển thị Bảng công thức trong `app.js` và luồng nạp tệp `.json` nối trực tiếp chuỗi `obj.name`, `formula.title` vào `innerHTML`. Khi tên chứa `<img src=x onerror=alert(1)>`, mã độc thực thi ngay lập tức và bắn request mạng lỗi `GET /x` (`404`).
- **Hành động cụ thể cho Agent:**
  1. Tạo hàm tiện ích chuẩn hóa tại đầu file `app.js`:
     ```javascript
     function escapeHtml(str) {
       if (str === null || str === undefined) return "";
       return String(str)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#39;");
     }
     ```
  2. Rà soát toàn bộ các lệnh gán `.innerHTML` trong `app.js`, `formulas-data.js`, `knowledge-handbook.js`:
     - Bọc mọi biến đầu vào của người dùng (`obj.name`, `obj.expr`, `obj.label`, `item.title`, `item.desc`) qua `escapeHtml(...)` trước khi đưa vào template literal, hoặc chuyển sang tạo phần tử bằng `document.createElement` và gán `.textContent`.
  3. Trong hàm nhập tệp sao lưu `.json` (`importWorkspaceJson`):
     - Kiểm tra cấu trúc dữ liệu (Schema validation), ép kiểu `String` và làm sạch các trường văn bản trước khi nạp vào `state` và `localStorage`.

### 1.2. Loại bỏ sự kiện giả lập `Ctrl + S` làm bật hộp thoại Lưu sổ mỗi 10 giây (`BUG-06`, Mục `A1`, `B7`)
- **Nguyên nhân:** Hàm `triggerNoteRendererSave()` trong `app.js` bắn sự kiện `new KeyboardEvent("keydown", { key: "s", ctrlKey: true })` mỗi 10 giây. Khi người dùng đang ở tab **Bảng viết bài giảng** (hoặc đang bấm máy tính Casio ảo) mà chưa đặt tên lưu sổ, sự kiện này kích hoạt hộp thoại `"Lưu sổ"` nhảy đè lên màn hình.
- **Hành động cụ thể cho Agent:**
  1. **Xóa bỏ hoàn toàn** đoạn mã bắn `KeyboardEvent("keydown", { key: "s", ctrlKey: true })` trong `triggerNoteRendererSave()`.
  2. Thay thế bằng cơ chế lưu nháp ngầm (Silent Draft Auto-save):
     - Nếu phân hệ Sổ Tay đã có sẵn `currentNotebookId`, gọi trực tiếp hàm ghi IndexedDB ngầm mà không kích hoạt modal UI.
     - Nếu sổ chưa được đặt tên, lưu trạng thái trang vẽ vào kho nháp tạm `pmath_notebook_autosave_draft` trong `localStorage` / `IndexedDB`. Hộp thoại `"Lưu sổ"` chỉ được phép mở khi người dùng chủ động bấm nút **Lưu** hoặc nhấn tổ hợp phím `Ctrl + S` thật trên bàn phím.

### 1.3. Đồng bộ Đa Tab (Multi-Tab Sync) & Chống ghi đè `localStorage` (`BUG-05`, Mục `B9`)
- **Nguyên nhân:** Mỗi tab chạy độc lập `setInterval(runAutoSaveCycle, 10000)` và ghi đè thẳng biến `state` của riêng mình xuống `localStorage.setItem("pmath_studio_workspace", ...)`, làm mất dữ liệu của tab khác.
- **Hành động cụ thể cho Agent:**
  1. Thêm cờ đánh dấu thay đổi `state.isDirty = false` và mốc thời gian `state.lastModifiedAt = 0`. Chỉ khi người dùng thực hiện thao tác thêm/sửa/xóa/undo/redo đối tượng thì mới gán `state.isDirty = true` và cập nhật `state.lastModifiedAt = Date.now()`.
  2. Trong `runAutoSaveCycle()`:
     - Nếu `!state.isDirty`, tuyệt đối **không** ghi đè xuống `localStorage`.
     - Trước khi ghi, đọc `savedAt` hiện có trong `localStorage`. Nếu `savedAt > state.lastLoadedAt`, hiển thị thông báo nhẹ (toast/banner) hoặc hợp nhất thay vì ghi đè mù quáng.
  3. Lắng nghe sự kiện `window.addEventListener("storage", (e) => { ... })`:
     - Khi khóa `"pmath_studio_workspace"` thay đổi từ một tab khác, tự động cập nhật lại `state` trên tab đang không tương tác và gọi `renderAll()` để hai tab luôn đồng bộ thời gian thực.

### 1.4. Hộp thoại xác nhận trước khi "Xóa hết hình" (`BUG-13`, Mục `B10`)
- **Nguyên nhân:** Bấm `#clearSceneBtn` xóa trắng toàn bộ khung vẽ ngay lập tức mà không hỏi xác nhận.
- **Hành động cụ thể cho Agent:**
  - Khi người dùng bấm `#clearSceneBtn`, kiểm tra nếu tổng số đối tượng $> 0$ thì mở một hộp thoại xác nhận chuẩn UI (hoặc popover xác nhận 2 bước: *"Bạn có chắc muốn xóa toàn bộ $N$ đối tượng trên khung vẽ? (Có thể Hoàn tác sau khi xóa)"* kèm nút `Hủy` và `Xóa tất cả`). Vẫn gọi `saveHistory()` trước khi xóa để bảo toàn tính năng Hoàn tác (`#undoBtn`).

---

## GIAI ĐOẠN 2 (P1 - HIGH): NÂNG CẤP ENGINE TOÁN HỌC & VẬT LÝ CHÍNH XÁC

### 2.1. Sửa toàn diện bài toán "Hai máy bay trong không gian Oxyz" (`BUG-02`, Mục `B8`)
- **Bài toán chuẩn cần đạt:** Máy bay $A(0,0,0)$ với $\vec{v}_A = (100,0,0)\text{ m/s}$ và Máy bay $B(10000,500,0)\text{ m}$ với $\vec{v}_B = (-100,0,0)\text{ m/s}$ phải cho kết quả khoảng cách ngắn nhất $d_{\min} = 500\text{ m}$ tại thời điểm $t_{\min} = 50\text{ s}$.
- **Hành động cụ thể cho Agent:**
  1. **Đồng bộ đơn vị đo lường:**
     - Cho phép chọn hệ đơn vị nhất quán cho bài toán chuyển động (`m` & `m/s` hoặc `km` & `km/h`). Khi đang ở hệ mét (`m`, `m/s`), mọi nhãn hiển thị trên canvas 3D và trong bảng `#metricsGrid` phải hiển thị đúng đơn vị `m` (hoặc tự động quy đổi có chú thích rõ: $10000{,}01\text{ m} \approx 10{,}00\text{ km}$, $500{,}00\text{ m} = 0{,}50\text{ km}$). Tuyệt đối không gắn hậu tố cứng `"km"` vào giá trị số đang tính theo `"m"`.
  2. **Bộ giải giải tích khoảng cách cực tiểu (Analytical Closest Point of Approach - CPA):**
     - Với hai chuyển động thẳng đều $\vec{r}_A(t) = \vec{r}_{A0} + \vec{v}_A t$ và $\vec{r}_B(t) = \vec{r}_{B0} + \vec{v}_B t$, đặt $\Delta \vec{r}_0 = \vec{r}_{A0} - \vec{r}_{B0}$ và $\Delta \vec{v} = \vec{v}_A - \vec{v}_B$.
     - Tính ngay lập tức trước khi chạy mô phỏng:
       $$t_{\min} = \max\left(0, -\frac{\Delta \vec{r}_0 \cdot \Delta \vec{v}}{\|\Delta \vec{v}\|^2}\right), \quad d_{\min} = \|\Delta \vec{r}_0 + \Delta \vec{v} \cdot t_{\min}\|$$
     - Hiển thị cố định dòng phân tích giải tích trong bảng kết quả:
       `Khoảng cách gần nhất: d_min = 500,00 m tại t = 50,00 s`.
  3. **Ngưỡng cảnh báo va chạm/tiếp cận thông minh:**
     - Thay điều kiện cứng `const isAlert = dist < 3.0;` bằng ngưỡng an toàn phụ thuộc đơn vị (ví dụ: $d_{\text{alert}} = 1000\text{ m}$ khi tính bằng mét, hoặc $3{,}0\text{ km}$ khi tính bằng kilômét, có ô cho phép người dùng tùy chỉnh).
     - Cảnh báo sớm ngay trên bảng thông tin nếu $d_{\min} \le d_{\text{alert}}$ (với $d_{\min} = 500\text{ m} \le 1000\text{ m}$, bật trạng thái cảnh báo vàng/đỏ: `"CẢNH BÁO TIẾP CẬN GẦN: d_min = 500,00 m tại t = 50,00 s"`).
  4. **Mở khóa giới hạn thời gian $t$ và vòng lặp mô phỏng:**
     - Trong `startMotionLoop()`, xóa bỏ dòng `if (obj.t > 8) obj.t = -3.5;`.
     - Tự động thiết lập giới hạn thanh trượt thời gian `t` dựa trên $t_{\min}$: đặt `min = "0"` và `max = String(Math.max(20, Math.ceil(tMin * 1.5)))` (với $t_{\min} = 50\text{ s}$, thanh trượt tự động mở rộng tới $75\text{ s}$ và vòng lặp chạy từ $0\text{ s}$ đến $75\text{ s}$).
  5. **Sửa hàm `zoomToFit()` trong không gian 3D:**
     - Tính hình hộp bao (3D Bounding Box) chứa toàn bộ tọa độ các vật thể ở cả $t = 0$ và $t = t_{\min}$ (bao gồm tọa độ $x = 10000, y = 500$).
     - Dịch chuyển tâm xoay camera (`camera.target`) về tâm của Bounding Box $(5000, 250, 0)$ và tự động tính hệ số thu phóng `scale3D` dựa trên bán kính lớn nhất của Bounding Box để cả hai máy bay cùng quỹ đạo hiển thị trọn vẹn trong khung nhìn 3D.

### 2.2. Khảo sát hàm phân thức, Tiệm cận xiên, Cực trị & Điểm uốn (`BUG-04`, `BUG-10`, Mục `B1`–`B4`)
- **Hành động cụ thể cho Agent tại cả 2 phân hệ (`#geolabView` và `#root`):**
  1. **Tự động phát hiện & vẽ Tiệm cận đứng (TCĐ), Tiệm cận ngang (TCN), Tiệm cận xiên (TCX):**
     - Với hàm phân thức hoặc hàm bất kỳ $y = f(x)$:
       - **Tiệm cận ngang / xiên khi $x \to \pm\infty$:** Tính hệ số góc $a = \lim_{x \to \pm\infty} \frac{f(x)}{x}$ và tung độ gốc $b = \lim_{x \to \pm\infty} (f(x) - ax)$ bằng phương pháp nội suy Richardson tại $x = \pm 10^4, \pm 10^5$ kết hợp làm tròn số hữu tỉ gần nhất (sai số $< 10^{-6}$).
       - Nếu $|a| < 10^{-5}$ và $b$ hữu hạn: kết luận **TCN** $y = b$.
       - Nếu $a \ne 0$ hữu hạn và $b$ hữu hạn: kết luận **TCX** $y = ax + b$ (ví dụ với $y = \frac{x^2+x+1}{x-1}$ tìm ra chính xác TCX: $y = x + 2$).
       - **Tiệm cận đứng:** Dò nghiệm mẫu số hoặc điểm làm $|f(x)| \to +\infty$ đổi dấu/bùng nổ, dùng phương pháp chia đôi (bisection) để tìm chính xác $x = x_0$ (với $y = \frac{x^2+x+1}{x-1}$ tìm ra chính xác TCĐ: $x = 1$).
     - **Vẽ trực quan lên đồ thị:** Vẽ cả đường đứt nét của TCĐ $x = 1$ và đường đứt nét của TCX $y = x + 2$ kèm nhãn phương trình trên khung vẽ 2D.
     - **Loại bỏ kết quả đạo hàm rác tại điểm kỳ dị:** Trước khi hiển thị $f(x_0)$ và $f'(x_0)$ tại $x_0 = 1$, kiểm tra nếu $|f(x_0)| > 10^6$ hoặc không xác định thì hiển thị rõ: `Tại x = 1: Hàm số không xác định (Tiệm cận đứng x = 1)`, tuyệt đối không in ra `f'(1,00) = 30000000000,97`.
  2. **Thuật toán tìm Cực đại, Cực tiểu và Điểm uốn chuẩn xác:**
     - **Điều kiện Cực trị:** Chỉ kết luận $x_0$ là điểm cực trị khi $f(x)$ liên tục tại $x_0$, $f'(x_0) = 0$ (hoặc đổi dấu qua $x_0$) **VÀ** $f'(x)$ thực sự đổi dấu khi đi qua $x_0$:
       - Đổi dấu từ $-$ sang $+$: **Cực tiểu** (ví dụ $y = x^4$ có 1 điểm cực tiểu tại $(0; 0)$; $y = \frac{x^2+x+1}{x-1}$ có cực tiểu tại $(1+\sqrt{3}; 3+2\sqrt{3}) \approx (2{,}732; 6{,}464)$).
       - Đổi dấu từ $+$ sang $-$: **Cực đại** (ví dụ $y = \frac{x^2+x+1}{x-1}$ có cực đại tại $(1-\sqrt{3}; 3-2\sqrt{3}) \approx (-0{,}732; -0{,}464)$).
       - Với $y = x^3$: $y'(0) = 0$ nhưng $y'(x) = 3x^2 \ge 0$ không đổi dấu $\implies$ kết luận rõ: **`Không có cực trị`**.
     - **Điều kiện Điểm uốn:** Tìm nghiệm $f''(x_0) = 0$ mà tại đó $f''(x)$ **đổi dấu** khi đi qua $x_0$:
       - Với $y = x^3$: $y''(x) = 6x$ đổi dấu từ $-$ sang $+$ qua $x = 0 \implies$ kết luận và đánh dấu **`Điểm uốn I(0; 0)`**.
       - Với $y = x^4$: $y''(x) = 12x^2 \ge 0$ không đổi dấu qua $x = 0 \implies$ kết luận rõ: **`Không có điểm uốn`**.
     - **Mở rộng miền quét trong Sổ Tay (`#root`):** Khi người dùng bấm nút `Cực trị` hoặc `Điểm uốn`, quét nghiệm $f'(x) = 0$ và $f''(x) = 0$ trên miền rộng $x \in [-20, 20]$ mà không lọc bỏ các điểm có $|y| > 5{,}1$. Tự động co giãn khung nhìn dọc (`yMin`, `yMax`) hoặc hiển thị đầy đủ cả cực đại $A(-0{,}732; -0{,}464)$ lẫn cực tiểu $B(2{,}732; 6{,}464)$ cho hàm $y = \frac{x^2+x+1}{x-1}$.

### 2.3. Công cụ tính Diện tích hình phẳng giới hạn bởi hai đồ thị (`BUG-08`, Mục `B5`)
- **Bài toán chuẩn cần đạt:** Với $f(x) = x$ và $g(x) = x^3$, diện tích hình phẳng giới hạn bởi hai đồ thị phải tính ra đúng $S = \int_{-1}^{1} |x - x^3|\,\mathrm{d}x = \frac{1}{2} = 0{,}5$.
- **Hành động cụ thể cho Agent:**
  1. **Tại Không gian Oxyz & Đồ thị (`#geolabView`) và hộp thoại Đồ thị trong Sổ Tay (`#root`):**
     - Bổ sung tính năng **`Tích phân & Diện tích hình phẳng`**:
       - Cho phép chọn 2 hàm số $y = f(x)$ và $y = g(x)$ (hoặc trục $Ox$: $y = 0$).
       - Tự động tìm các hoành độ giao điểm $x_1 < x_2 < \dots < x_k$ của phương trình $f(x) - g(x) = 0$ (với $x$ và $x^3$, tìm ra $x \in \{-1, 0, 1\}$), lấy cận mặc định từ $a = x_1 = -1$ đến $b = x_k = 1$ (hoặc cho phép nhập cận $[a, b]$).
       - Tô màu bán trong suốt (`rgba(37, 99, 235, 0.18)`) miền phẳng nằm giữa $f(x)$ và $g(x)$ trên đoạn $[a, b]$.
       - Tính tích phân tách đoạn qua các nghiệm giao điểm bằng công thức Gauss-Legendre / Simpson thích nghi:
         $$S = \sum_{i=1}^{k-1} \int_{x_i}^{x_{i+1}} |f(x) - g(x)|\,\mathrm{d}x$$
       - Hiển thị rõ cả hai giá trị để học sinh phân biệt:
         - **Diện tích hình phẳng:** $S = \int_{-1}^{1} |x - x^3|\,\mathrm{d}x = \frac{1}{2} = 0{,}5$.
         - **Tích phân có hướng:** $I = \int_{-1}^{1} (x - x^3)\,\mathrm{d}x = 0$.
  2. **Trên Máy tính Casio ảo:**
     - Thêm gợi ý nhanh hoặc nút tắt `|f(x)|` ngay cạnh phím tích phân $\int \mathrm{d}x$ để nhắc học sinh sử dụng trị tuyệt đối (`Abs`) khi tính diện tích hình phẳng.

### 2.4. Đồng bộ tính năng Khối nón $r = 3, h = 4$ và Trải phẳng 3D $\to$ 2D (`BUG-09`, Mục `B6`)
- **Bài toán chuẩn cần đạt:** Khối nón có bán kính đáy $r = 3$, chiều cao $h = 4$ phải suy ra đường sinh $l = \sqrt{r^2 + h^2} = 5$, và khi trải phẳng thành hình quạt phải hiển thị bán kính quạt $R_{\text{quạt}} = l = 5$, góc ở tâm $\alpha = \frac{r}{l} \cdot 360^\circ = 216^\circ$, diện tích xung quanh $S_{\text{xq}} = \pi r l = 15\pi \approx 47{,}12$ và diện tích toàn phần $S_{\text{tp}} = 24\pi \approx 75{,}40$.
- **Hành động cụ thể cho Agent:**
  1. **Tại Không gian Oxyz & Đồ thị (`#geolabView`):**
     - Khi đối tượng đang chọn là Hình nón (`cone`) hoặc Hình trụ (`cylinder`), bổ sung nút **`Trải phẳng (Khai triển 2D)`** kèm thanh trượt hoạt ảnh mở phẳng $\tau \in [0, 1]$.
     - Hiển thị đầy đủ các thông số giải tích dưới dạng ký hiệu $\pi$ chính xác và số thập phân:
       - Đường sinh (bán kính hình quạt): $l = 5\text{ cm}$
       - Góc ở đỉnh hình quạt khi trải phẳng: $\alpha = \frac{r}{l} \cdot 360^\circ = 216^\circ$
       - Diện tích xung quanh: $S_{\text{xq}} = 15\pi \approx 47{,}12\text{ cm}^2$
       - Diện tích đáy: $S_{\text{đáy}} = 9\pi \approx 28{,}27\text{ cm}^2$
       - Thể tích: $V = 12\pi \approx 37{,}70\text{ cm}^3$
  2. **Tại Bảng viết bài giảng (`#root`):**
     - Khi chọn hình nón, thêm thanh nhập nhanh thông số `r = [ 3 ]`, `h = [ 4 ]` ngay trên thanh ngữ cảnh của hình nón.
     - Khi bấm **`Trải hình`**, vẽ nhãn trực tiếp lên hình khai triển:
       - Ghi bán kính quạt $l = 5$, góc quạt $\alpha = 216^\circ$, bán kính đáy $r = 3$, và công thức $S_{\text{xq}} = \pi r l = 15\pi$.

---

## GIAI ĐOẠN 3 (P1/P2): BỐ CỤC ĐÁP ỨNG (RESPONSIVE), HIỂN THỊ TOÁN HỌC & DARK MODE

### 3.1. Xóa bỏ thanh nút nổi `.floating-mode-switcher` & sửa chồng lấn trên Desktop `1366x768` (`BUG-11`, Mục `A2`)
- **Hành động cụ thể cho Agent:**
  1. **Gỡ bỏ `.floating-mode-switcher`:** Xóa phần tử `.floating-mode-switcher` khỏi DOM/CSS vì thanh `#pmathGlobalBar` trên cùng đã có sẵn bộ chuyển đổi tab rõ ràng. Việc gỡ bỏ phần tử này giải quyết triệt để lỗi đè lên bảng `#metricsGrid` ở `1366x768`, lỗi đè lên nút `#gridToggleBtn` / `#axesToggleBtn` ở `390x844`, và lỗi đè lên thông báo toast `"Đã xuất PDF"`.
  2. **Sửa lỗi cắt chữ trên thanh Header `#pmathGlobalBar` (`1366x768`):**
     - Tăng chiều cao `#pmathGlobalBar` lên `56px` (hoặc tinh chỉnh `line-height: 1.25`, `padding: 4px 10px` cho `.pmath-brand-row2` và `.pmath-tag-pill`) để không bị cắt viền trên/dưới.
  3. **Sửa lỗi Thumbnail trang 3 đè lên thanh `.sheet-bar` trong Sổ Tay (`1366x768`):**
     - Chuyển cột danh sách trang bên trái sang cấu trúc `display: flex; flex-direction: column; height: 100%;`: vùng chứa các `button.page-thumb` có `flex: 1; overflow-y: auto; padding-bottom: 16px;`, còn thanh `.sheet-bar` nằm cố định ở đáy cột (`flex-shrink: 0; position: relative; z-index: 2;`) để không bao giờ đè lên thumbnail trang.

### 3.2. Thiết kế lại giao diện Mobile `390x844` & Khôi phục thao tác chạm (`BUG-03`, `BUG-12`, Mục `A2`, `C3`)
- **Hành động cụ thể cho Agent:**
  1. **Trang chủ (`#homeView`) và `#pmathGlobalBar` trên màn hình `390x844` (`BUG-12`):**
     - Đặt `max-width: 100vw; overflow-x: hidden;` cho `body`.
     - Trên màn hình $\le 768\text{px}$, thu gọn `#pmathGlobalBar`: hiển thị Logo gọn + Bộ chuyển 3 phân hệ chính (dạng segmented control cuộn ngang mượt hoặc vừa khít `390px`) + Nút Menu `☰` gom nhóm các mục `Tra cứu`, `Tệp & Tùy chọn`, `Giao diện Sáng/Tối`. Đảm bảo `scrollWidth <= 390px`.
     - Sửa chân trang (`.footer-links`):
       ```css
       .footer-links {
         display: flex;
         flex-wrap: wrap;
         justify-content: center;
         align-items: center;
         gap: 12px 20px;
         padding: 16px;
         line-height: 1.5;
       }
       ```
       Đảm bảo 3 liên kết `Chính Sách Quyền Riêng Tư`, `Điều Khoản Dịch Vụ`, `Mã Nguồn Mở GitHub` tách dòng gọn gàng, diện tích chồng lấn $= 0\text{ px}^2$.
  2. **Sổ Tay (`#root`) trên màn hình `390x844` (`BUG-03`):**
     - Xóa bỏ các thuộc tính `min-width` cứng hoặc `transform` / `left` âm làm đẩy `#root` lệch sang `x = -170px`.
     - Áp dụng CSS responsive cho thanh công cụ của `#root` ở `@media (max-width: 768px)`:
       - Đặt khung `#root` `width: 100vw; left: 0; overflow: hidden;`.
       - Chuyển thanh công cụ trên cùng (Menu, Thư viện, Lưu, Hoàn tác, Bút, Tẩy, Hình học, Đồ thị, Máy tính) thành thanh cuộn ngang mượt (`display: flex; overflow-x: auto; max-width: 100vw; padding: 6px 8px; gap: 6px; scrollbar-width: none;`) hoặc chia thành 2 hàng gọn gàng để toàn bộ 54 nút đều có thể tiếp cận và bấm được trên màn hình `390x844`.
       - Thu gọn cột thumbnail trang bên trái thành ngăn kéo đóng/mở (drawer) trên màn hình di động.
  3. **Không gian Oxyz & Đồ thị (`#geolabView`) trên màn hình `390x844` (`BUG-03`):**
     - Chuyển cấu trúc 3 cột của Studio trên mobile thành giao diện ngăn kéo dưới đáy (Bottom Sheet / Tabs: `Khung vẽ`, `Đối tượng & Nhập liệu`, `Thông số`).
     - Thanh công cụ vẽ phía trên khung canvas cho phép cuộn ngang mượt (`overflow-x: auto; max-width: 100%;`) và giữ các nút điều khiển khung nhìn (`Lưới`, `Trục tọa độ`, `Khớp khung nhìn`) nằm gọn trong khung nhìn `390x844`.
  4. **Cho phép thao tác chạm/zoom hợp lý trên Mobile (`C3`):**
     - Chỉ áp dụng `touch-action: none` trực tiếp trên thẻ `<canvas>` vẽ hình để xử lý pan/zoom 2 ngón tay bên trong khung tọa độ, tuyệt đối không chặn sự kiện chạm/cuộn trên các thanh công cụ và hộp thoại UI.

### 3.3. Sửa lỗi ô vuông ký tự Toán học (`□`) & lỗi rớt dòng vector `v₁` (`BUG-07`, `BUG-16`, Mục `C1`)
- **Hành động cụ thể cho Agent:**
  1. **Xử lý triệt để ký tự ô vuông `□` trong `formulas-data.js` và `#cheatsheetDialog` (`BUG-07`):**
     - Nguyên nhân: Font chữ đang áp cho `.fh-formula-main`, `.fh-formula-sub`, `.fh-desc` không có glyph cho ký tự mũi tên kết hợp (`\u20d7`) và các toán tử (`\u22a5`, `\u21d4`, `\u2208`, `\u2282`).
     - Giải pháp 1 (Ưu tiên): Viết hàm formatter chuyển toàn bộ ký hiệu vector `u\u20d7`, `v\u20d7`, `n\u20d7`, `0\u20d7` thành thẻ HTML `<span class="math-vec">u</span>` sử dụng CSS pseudo-element vẽ mũi tên vector chuẩn phía trên đầu chữ, kết hợp render thông qua KaTeX hoặc bảng font toán học đầy đủ.
     - Giải pháp 2 (Bắt buộc đi kèm trong `styles.css`):
       ```css
       .fh-formula-main, .fh-formula-sub, .fh-desc, .math-vec {
         font-family: 'Inter', 'STIX Two Math', 'Cambria Math', 'Noto Sans Math', 'Segoe UI Symbol', 'Apple Symbols', sans-serif;
       }
       .math-vec {
         position: relative;
         display: inline-block;
         font-style: italic;
         font-weight: 600;
       }
       .math-vec::after {
         content: "";
         position: absolute;
         top: -0.15em;
         left: 0;
         right: 0;
         height: 1.5px;
         background: currentColor;
       }
       ```
  2. **Sửa lỗi rớt dòng chữ `v` trong ký hiệu `v₁` trên Trang chủ (`BUG-16`):**
     - Trong `styles.css`, sửa lớp `.vec-sym`:
       ```css
       .vec-sym {
         display: inline-block;
         vertical-align: baseline;
         line-height: 1;
       }
       ```
       Đảm bảo chuỗi `v₁ = (120; -80; 15) m/s` luôn nằm trên cùng một dòng ngang.

### 3.4. Đồng bộ Chế độ Tối (Dark Mode) & Đảm bảo độ tương phản WCAG AA $\ge 4.5 : 1$ (`BUG-14`, Mục `C2`)
- **Hành động cụ thể cho Agent:**
  1. **Sửa nhãn và biểu tượng nút `#themeToggleBtn`:**
     - Khi ở giao diện Sáng: hiển thị `🌙 Giao diện Tối`.
     - Khi ở giao diện Tối: hiển thị `☀️ Giao diện Sáng` (đổi icon mặt trời `☀️`).
  2. **Áp dụng Dark Mode cho Bảng viết bài giảng (`#root`):**
     - Khi `document.body.classList.contains("dark-theme")` (hoặc `[data-theme="dark"]`), truyền biến màu tối vào các thanh công cụ, cột trang tính, thanh trạng thái và hộp thoại của `#root` (giữ vùng giấy vẽ có tùy chọn nền tối `#15181E` hoặc giấy sáng dịu `#F1F5F9` không gây chói mắt).
  3. **Sửa lỗi tương phản thấp trong `#cheatsheetDialog` và các nút chính:**
     - Nút `#formulaImportantToggleBtn` (`★ Chỉ hiện trọng tâm`): Ở chế độ Tối, đặt nền `#1E293B`, viền `#334155`, chữ `#F8FAFC` (khi active: nền `#1D4ED8`, chữ `#FFFFFF`, đạt tương phản $> 7:1$ thay vì $1{,}09:1$).
     - Nút đóng `#closeCheatsheetBtn` (`✕`): Nền `#1E293B`, chữ `#E2E8F0` (tương phản $> 9:1$ thay vì $2{,}34:1$).
     - Huy hiệu `#eqModeBadge` (`ƒ(x,y,z) 3D`): Dùng nền xanh đậm `#065F46` với chữ `#ECFDF5` hoặc nền `#10B981` với chữ tối `#022C22` (tương phản $> 6:1$ thay vì $1{,}92:1$).
     - Các nút `.btn-primary`: Dùng màu nền `#2563EB` (hoặc `#1D4ED8`) với chữ `#FFFFFF` để đạt tỷ lệ tương phản $\ge 4{,}6:1$ chuẩn WCAG AA.

---

## GIAI ĐOẠN 4 (P2/P3): VIỆT HÓA, ĐỒNG NHẤT THUẬT NGỮ, XUẤT TỆP & OFFLINE PWA

### 4.1. Việt hóa 100%, xóa chữ tiếng Nga & chuẩn hóa tên gọi (`BUG-15`, Mục `C4`, `C5`)
- **Hành động cụ thể cho Agent:**
  1. **Sửa chữ tiếng Nga trong `data.js`:**
     - Tại dòng `381` và `534` của `data.js` (chuyên đề `line3d` và `line3d_velocity`), thay thế toàn bộ từ tiếng Nga **`вектор`** thành **`vectơ`**.
  2. **Khởi tạo mặc định tiếng Việt cho Sổ Tay (`#root`):**
     - Ngay ở đầu `index.html` hoặc đầu `app.js` (trước khi bundle của `#root` khởi chạy), thêm:
       ```javascript
       if (!localStorage.getItem("lang")) {
         localStorage.setItem("lang", "vi");
       }
       ```
     - Dịch nốt các chuỗi còn sót tiếng Anh trong Sổ Tay: `Sheet 1` $\to$ `Trang 1`, `Title` $\to$ `Tiêu đề bài giảng`, `Project` $\to$ `Dự án`, `Không thuộc project` $\to$ `Không thuộc dự án`.
  3. **Sửa lỗi cắt chữ `Không xá` và mã nội bộ lập trình viên:**
     - Trong bảng chỉnh sửa Bảng biến thiên, tăng `min-width: 145px` cho thẻ `<select>` để hiển thị trọn vẹn chữ **`Không xác định`**.
     - Trong danh sách đối tượng của Studio (`#sceneObjectsList`), ánh xạ các mã loại đối tượng sang nhãn tiếng Việt chuẩn:
       - `solid3d` $\to$ `Khối 3D`
       - `func2d` $\to$ `Hàm số 2D`
       - `line2d` $\to$ `Đường thẳng`
       - `polygon2d` $\to$ `Đa giác`
       - `circle2d` $\to$ `Đường tròn`
       - `point2d` / `point3d` $\to$ `Điểm`
  4. **Đồng nhất tên gọi và biểu tượng trên toàn ứng dụng (`C5`):**
     - Chỉ sử dụng **1 tên gọi duy nhất** cho mỗi phân hệ ở mọi vị trí (Header, Hero, Modal Sao lưu, Tooltip):
       1. `Không gian Oxyz & Đồ thị`
       2. `Bảng viết bài giảng`
       3. `Tài liệu 24 chuyên đề`
       4. `Bảng công thức`
     - Tách biệt icon cho 3 nút 3D trong Sổ Tay: dùng icon khối hộp xoay cho `Xoay 3D` (`turn3d`), icon mũi tên đẩy khối lên cho `Chuyển thành 3D` (`lift3d`), và icon trục quay tròn cho `Quay tròn xoay` (`spinPlay`).

### 4.2. Cải tiến ô Tiêu đề & Luồng xuất PNG/PDF thông minh (`BUG-17`, Mục `B12`)
- **Hành động cụ thể cho Agent:**
  1. Biến khung nét đứt `"Tiêu đề"` ở đầu trang Sổ Tay thành một vùng nhập liệu tiêu đề thực sự (khi nhấp vào cho phép gõ trực tiếp tiêu đề trang và tự động căn lề chuẩn bên trong khung).
  2. Đồng bộ nội dung ô tiêu đề này với tên sổ hiện tại. Khi người dùng xuất PNG hoặc PDF, tự động lấy tiêu đề trang để đặt tên file tải về (ví dụ: `Hình học không gian - Tam giác ABC.pdf` và `Hình học không gian - Tam giác ABC - trang 1.png`).
  3. Khi mở hộp thoại Xuất PDF, mặc định **chỉ đánh dấu chọn các trang thực sự có nét vẽ/đối tượng** (bỏ qua các trang 2, 3 đang trắng tinh trừ khi người dùng chủ động tích chọn), giúp giảm dung lượng file PDF từ `1,59 MB` xuống mức tối ưu.

### 4.3. Bổ sung Pre-cache Offline cho các thư viện PDF trong `sw.js` (`BUG-18`, Mục `E1`)
- **Hành động cụ thể cho Agent:**
  1. Mở file `sw.js`, nâng phiên bản bộ nhớ đệm lên `const CACHE_NAME = "pmath-cache-v2.8";`.
  2. Bổ sung đầy đủ các chunk nạp trễ trong thư mục `/assets/` vào mảng `STATIC_ASSETS`:
     ```javascript
     "/assets/pdf-VJcNm7C7.js",
     "/assets/pdfimport-OaRpQMT4.js",
     "/assets/pdf.worker-CI4BB1ED.js"
     ```
     *(Lưu ý: Nếu bước build Vite tạo hash mới cho các file trong `/assets/`, Agent cần cập nhật đúng tên file hash thực tế sau khi build vào `STATIC_ASSETS`).*

---

## GIAI ĐOẠN 5: MA TRẬN KIỂM THỬ NGHIỆM THU BẮT BUỘC (PRE-FLIGHT & QA VERIFICATION)

Sau khi hoàn tất các thay đổi mã nguồn, Agent **bắt buộc** chạy kiểm thử tự động (Playwright) ở cả 2 kích thước khung nhìn `1366x768` và `390x844` để xác nhận toàn bộ các tiêu chí sau đều đạt `PASS`:

| Mã kiểm thử | Nội dung kiểm tra | Tiêu chí đạt (Pass Criteria) |
| :--- | :--- | :--- |
| **VERIFY-01 (`BUG-01`)** | Đặt tên đối tượng và tiêu đề công thức là `<img src=x onerror=alert(1)>`, xuất ra `.json` rồi nạp lại. | Không có popup `alert(1)`, không có request mạng `GET /x` lỗi `404`, chuỗi hiển thị nguyên văn dưới dạng text an toàn. |
| **VERIFY-02 (`BUG-02`)** | Thiết lập 2 máy bay $A(0,0,0), \vec{v}_A=(100,0,0)\text{ m/s}$ và $B(10000,500,0)\text{ m}, \vec{v}_B=(-100,0,0)\text{ m/s}$. | Hiển thị đúng đơn vị `m`, báo trước $d_{\min} = 500\text{ m}$ tại $t = 50\text{ s}$ kèm cảnh báo tiếp cận gần; thanh trượt kéo được tới $t = 50\text{ s}$; bấm `Khớp khung nhìn` thấy rõ cả 2 máy bay trong 3D. |
| **VERIFY-03 (`BUG-03`, `11`, `12`)** | Kiểm tra bố cục tại `1366x768` và `390x844` trên cả 3 phân hệ. | Không còn `.floating-mode-switcher`; ở `390x844` không có nút nào bị đẩy sang tọa độ âm hoặc bị che khuất; liên kết ở Footer không chồng lấn; thumbnail trang 3 không đè lên thanh trang tính. |
| **VERIFY-04 (`BUG-04`, `10`)** | Nhập $y = x^4$, $y = x^3$, và $y = \frac{x^2+x+1}{x-1}$. | $y = x^4$: Cực tiểu $(0;0)$, không có điểm uốn.<br>$y = x^3$: Điểm uốn $(0;0)$, không có cực trị.<br>$y = \frac{x^2+x+1}{x-1}$: Vẽ đủ TCĐ $x = 1$ và TCX $y = x + 2$, tìm đủ 2 cực trị $1 \pm \sqrt{3}$, không hiện đạo hàm rác tại $x = 1$. |
| **VERIFY-05 (`BUG-05`, `06`)** | Mở 2 tab cùng lúc sửa khác nhau; mở máy Casio đợi hơn 15 giây khi chưa lưu sổ. | Hai tab đồng bộ qua sự kiện `storage` không mất dữ liệu; hộp thoại `"Lưu sổ"` không tự bật đè lên màn hình sau 10 giây. |
| **VERIFY-06 (`BUG-07`, `16`)** | Mở Bảng công thức và kiểm tra thẻ thông tin 3D trên trang chủ. | `0` ký tự ô vuông `□` (hiển thị chuẩn mũi tên vector $\vec{u}, \vec{v}, \vec{n}$ và $\perp, \iff, \in$); ký hiệu $v_1$ nằm trên cùng 1 dòng. |
| **VERIFY-07 (`BUG-08`, `09`)** | Tính diện tích giữa $y = x$ và $y = x^3$; tạo hình nón $r = 3, h = 4$ và trải phẳng. | Diện tích hình phẳng ra đúng $\frac{1}{2} = 0{,}5$ và tô miền giới hạn; hình nón trải phẳng hiện đúng bán kính quạt $l = 5$, góc $\alpha = 216^\circ$, $S_{\text{xq}} = 15\pi$. |
| **VERIFY-08 (`BUG-14`, `15`)** | Mở ứng dụng lần đầu ở trạng thái sạch `localStorage`; chuyển qua lại Giao diện Sáng/Tối. | Sổ Tay hiển thị 100% tiếng Việt; không còn chữ `вектор`; toàn bộ nút trong Bảng công thức và Sổ Tay ở chế độ Tối đạt độ tương phản $\ge 4{,}5 : 1$. |
| **VERIFY-09 (`BUG-17`, `18`)** | Nhập tiêu đề `"Hình học không gian - Tam giác ABC"`, ngắt mạng (Offline) và xuất PDF/PNG. | Xuất PDF/PNG thành công khi Offline; file tải về mang tên tiêu đề vừa đặt và chỉ xuất trang có nội dung. |