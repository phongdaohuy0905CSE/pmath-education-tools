# HƯỚNG DẪN TRIỂN KHAI & DEPLOY ỨNG DỤNG PMATH EDUCATION TOOLS

Tài liệu hướng dẫn triển khai ứng dụng web **PMATH EDUCATION TOOLS** lên các nền tảng đám mây phổ biến nhất hiện nay (Firebase Hosting, Vercel, Netlify, GitHub Pages) kèm theo hướng dẫn cấu hình **Đăng nhập Google (Gmail / Google Identity Services)** cho tên miền tùy chỉnh.

---

## 1. TỔNG QUAN VỀ KIẾN TRÚC ỨNG DỤNG

- **Loại ứng dụng:** Single Page Application (SPA) hiệu năng cao, thuần HTML5 / Modern ES6 Modules / CSS3.
- **Lưu trữ dữ liệu:** Trực tiếp trên Client bằng **IndexedDB** & **LocalStorage**, có hỗ trợ sao lưu đám mây với tài khoản Google.
- **Tính năng PWA:** Hỗ trợ Service Worker (`sw.js`) và `manifest.json`, có thể cài đặt trực tiếp vào màn hình máy tính Windows / MacOS / Android / iOS để chạy Offline không cần mạng.
- **Không yêu cầu Backend Node.js phức tạp:** Có thể deploy ngay lập tức lên bất kỳ Web Server hoặc CDN tĩnh nào.

---

## 2. CÁCH 1: DEPLOY LÊN FIREBASE HOSTING (KHUYẾN NGHỊ)

Firebase Hosting mang lại tốc độ tải cực nhanh qua mạng CDN toàn cầu của Google, chứng chỉ SSL miễn phí và tích hợp hoàn hảo với hệ sinh thái Google.

### Bước 1: Cài đặt Firebase CLI (nếu chưa có)
Mở Terminal / PowerShell và chạy:
```bash
npm install -g firebase-tools
```

### Bước 2: Đăng nhập Firebase
```bash
firebase login
```

### Bước 3: Khởi tạo và Deploy
Thư mục dự án đã được tích hợp sẵn tệp cấu hình chuẩn [`firebase.json`](file:///C:/Users/huyda/.gemini/antigravity/scratch/geolab_interactive/firebase.json) và [`.firebaserc`](file:///C:/Users/huyda/.gemini/antigravity/scratch/geolab_interactive/.firebaserc). Bạn chỉ cần chạy:
```bash
# Chọn dự án Firebase của bạn
firebase use --add

# Deploy lên CDN toàn cầu
firebase deploy --only hosting
```
Sau vài giây, bạn sẽ nhận được đường dẫn trực tiếp:
`https://<project-id>.web.app` hoặc `https://<project-id>.firebaseapp.com`.

---

## 3. CÁCH 2: DEPLOY LÊN VERCEL (1-CLICK QUA GITHUB)

Vercel là nền tảng deploy nhanh nhất dành cho Frontend.

1. Đưa toàn bộ thư mục `geolab_interactive` lên một GitHub Repository của bạn.
2. Truy cập [vercel.com](https://vercel.com) và chọn **"Add New Project"**.
3. Chọn Repository vừa tạo.
4. Tại mục **Framework Preset**, chọn **Other** (hoặc để mặc định).
5. Tệp cấu hình [`vercel.json`](file:///C:/Users/huyda/.gemini/antigravity/scratch/geolab_interactive/vercel.json) đã được chuẩn bị sẵn với bộ nhớ đệm tối ưu.
6. Nhấp **Deploy**. Bạn sẽ có ngay trang web với tên miền `https://pmath-education-tools.vercel.app`.

---

## 4. CÁCH 3: DEPLOY LÊN NETLIFY HOẶC CLOUDFLARE PAGES

- **Netlify:**
  - Kéo và thả trực tiếp thư mục `geolab_interactive` vào giao diện [app.netlify.com/drop](https://app.netlify.com/drop).
  - Hoặc kết nối Git; tệp [`netlify.toml`](file:///C:/Users/huyda/.gemini/antigravity/scratch/geolab_interactive/netlify.toml) sẽ tự động cấu hình routing và headers.
- **Cloudflare Pages:**
  - Kết nối Git Repository trên Cloudflare Dashboard.
  - Build output directory: để trống (hoặc `.`).
  - Deploy và tận hưởng tốc độ CDN số 1 thế giới.

---

## 5. CÁCH 4: DEPLOY LÊN GITHUB PAGES

1. Khởi tạo Git repo và commit toàn bộ thư mục:
```bash
git init
git add .
git commit -m "Deploy PMATH Education Tools v2.5"
git branch -M main
git remote add origin https://github.com/<your-username>/pmath-tools.git
git push -u origin main
```
2. Vào **Settings** của Repo trên GitHub ➔ Mục **Pages**.
3. Chọn nguồn: **Deploy from a branch** ➔ Branch: `main` ➔ Thư mục: `/ (root)` ➔ Bấm **Save**.
4. Trang web sẽ hoạt động tại `https://<your-username>.github.io/pmath-tools/`.

---

## 6. HƯỚNG DẪN CẤU HÌNH GOOGLE SIGN-IN (OAUTH CLIENT ID) CHO TÊN MIỀN RIÊNG

Để tính năng **"Đăng nhập bằng Google Gmail"** hoạt động chính thức trên tên miền production của bạn:

1. Truy cập **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Chọn hoặc tạo một dự án mới (VD: `PMATH Education`).
3. Điều hướng tới **APIs & Services ➔ Credentials** (Thông tin xác thực).
4. Nhấp **Create Credentials ➔ OAuth Client ID**.
   - Application type: **Web application**.
   - Name: `PMATH Tools Web Client`.
   - **Authorized JavaScript origins (Nguồn gốc JavaScript được phép):**
     Thêm các domain của bạn:
     - `http://localhost:8000` (để test cục bộ)
     - `https://your-domain.web.app` (domain Firebase)
     - `https://pmath-tools.vercel.app` (domain Vercel)
     - `https://your-custom-domain.edu.vn` (nếu có tên miền riêng)
5. Nhấp **Create**. Bạn sẽ nhận được chuỗi **Client ID** (dạng `xxxx-yyyy.apps.googleusercontent.com`).
6. **Kích hoạt trong ứng dụng:**
   - Mở ứng dụng PMATH TOOLS ➔ Nhấp vào nút **Đăng nhập Google** trên thanh Header.
   - Chọn mục **"⚙️ Cấu hình Google Client ID"** ở dưới cùng hộp thoại.
   - Dán Client ID của bạn vào và bấm **Lưu Client ID**.
   - Hoặc chỉnh sửa trực tiếp giá trị `DEFAULT_GOOGLE_CLIENT_ID` trong tệp [`auth.js`](file:///C:/Users/huyda/.gemini/antigravity/scratch/geolab_interactive/auth.js).

---

## 7. KIỂM TRA PWA & CÀI ĐẶT ỨNG DỤNG CHẠY OFFLINE

- Trên trình duyệt Google Chrome hoặc Edge trên máy tính:
  - Khi mở ứng dụng, để ý biểu tượng **Cài đặt ứng dụng** (Install App icon 🖥️) ở thanh địa chỉ URL.
  - Bấm cài đặt để PMATH TOOLS trở thành một phần mềm độc lập trên Desktop chạy nhanh như ứng dụng native.
- Trên điện thoại thông minh (Android / iOS):
  - Mở trình duyệt Chrome / Safari ➔ Nhấp Menu ➔ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
