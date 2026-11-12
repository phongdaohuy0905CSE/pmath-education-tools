// ============================================================================
// PMATH EDUCATION TOOLS — Google Drive PDF Sync & Overwrite Engine (v4.1)
// Tải PDF từ liên kết Google Drive, chú thích bài giảng và ghi đè bản mới
// ============================================================================

const DEFAULT_GOOGLE_CLIENT_ID = "822575661977-978n9qm7u51e929goe2avddq721mrdvc.apps.googleusercontent.com";
const DRIVE_SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive";

const GoogleDriveState = {
  clientId: localStorage.getItem("pmath_google_client_id") || DEFAULT_GOOGLE_CLIENT_ID,
  accessToken: sessionStorage.getItem("pmath_gdrive_access_token") || "",
  tokenExpiresAt: parseInt(sessionStorage.getItem("pmath_gdrive_token_expires") || "0", 10),
  userEmail: sessionStorage.getItem("pmath_gdrive_user_email") || "",
  currentFile: null, // { fileId, fileName, canEdit, sourceUrl, lastLoaded, lastSynced }
  gisTokenClient: null
};

// Khôi phục tệp đang mở từ sessionStorage nếu có
try {
  const savedFile = sessionStorage.getItem("pmath_current_drive_file");
  if (savedFile) {
    GoogleDriveState.currentFile = JSON.parse(savedFile);
  }
} catch (e) {
  console.warn("[GDrive] Không thể khôi phục tệp lưu:", e);
}

// Trích xuất Google Drive File ID từ bất kỳ định dạng link hoặc chuỗi ID
function extractGoogleDriveFileId(input) {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();

  // 1. /file/d/{id} hoặc /d/{id} hoặc /document/d/{id}
  const m1 = str.match(/\/(?:file\/d|d|document\/d|presentation\/d|spreadsheets\/d)\/([a-zA-Z0-9_-]{25,})/);
  if (m1) return m1[1];

  // 2. id={id}
  const m2 = str.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
  if (m2) return m2[1];

  // 3. Chuỗi ID trần (25 - 60 ký tự)
  if (/^[a-zA-Z0-9_-]{25,60}$/.test(str)) {
    return str;
  }

  return null;
}

// Kiểm tra token còn hiệu lực hay không
function isTokenValid() {
  return (
    GoogleDriveState.accessToken &&
    GoogleDriveState.tokenExpiresAt > Date.now() + 60000 // Còn tối thiểu 1 phút
  );
}

// Thiết lập Google Identity Services Token Client
function initGisTokenClient() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) {
    try {
      GoogleDriveState.gisTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GoogleDriveState.clientId,
        scope: DRIVE_SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            GoogleDriveState.accessToken = tokenResponse.access_token;
            const expiresIn = (parseInt(tokenResponse.expires_in, 10) || 3600) * 1000;
            GoogleDriveState.tokenExpiresAt = Date.now() + expiresIn;

            sessionStorage.setItem("pmath_gdrive_access_token", GoogleDriveState.accessToken);
            sessionStorage.setItem("pmath_gdrive_token_expires", String(GoogleDriveState.tokenExpiresAt));

            // Lấy thông tin user
            fetchUserInfo(GoogleDriveState.accessToken);
            updateDriveUI();

            if (typeof showDriveToast === "function") {
              showDriveToast("✓ Đã kết nối Google Drive thành công!");
            }
          }
        }
      });
    } catch (err) {
      console.warn("[GDrive] Lỗi khởi tạo GIS Token Client:", err);
    }
  }
}

// Lấy email người dùng từ Google userinfo
async function fetchUserInfo(token) {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      GoogleDriveState.userEmail = data.email || "";
      sessionStorage.setItem("pmath_gdrive_user_email", GoogleDriveState.userEmail);
      updateDriveUI();
    }
  } catch (e) {
    // Không bắt buộc
  }
}

// Yêu cầu cấp quyền đăng nhập Google Drive
function requestGoogleDriveAuth() {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      alert("Thư viện Google Identity Services chưa tải xong hoặc mạng bị chặn. Vui lòng kiểm tra kết nối mạng hoặc nhập Access Token thủ công.");
      reject(new Error("GIS_NOT_LOADED"));
      return;
    }

    if (!GoogleDriveState.gisTokenClient) {
      initGisTokenClient();
    }

    if (!GoogleDriveState.gisTokenClient) {
      reject(new Error("GIS_INIT_FAILED"));
      return;
    }

    // Ghi đè callback để resolve promise
    const origCallback = GoogleDriveState.gisTokenClient.callback;
    GoogleDriveState.gisTokenClient.callback = (resp) => {
      if (typeof origCallback === "function") origCallback(resp);
      if (resp && resp.access_token) {
        resolve(resp.access_token);
      } else {
        reject(new Error("AUTH_CANCELLED"));
      }
    };

    GoogleDriveState.gisTokenClient.requestAccessToken({ prompt: "" });
  });
}

// Tra cứu thông tin & quyền truy cập của tệp trên Google Drive
async function checkDriveFileCapabilities(fileId, token) {
  const authToken = token || (isTokenValid() ? GoogleDriveState.accessToken : "");
  if (!authToken) {
    return { canEdit: null, fileName: null };
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,capabilities,size,shared,owners`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (res.ok) {
      const meta = await res.json();
      const canEdit = meta.capabilities ? !!meta.capabilities.canEdit : false;
      return {
        canEdit: canEdit,
        fileName: meta.name || null,
        size: parseInt(meta.size || "0", 10),
        mimeType: meta.mimeType || "application/pdf"
      };
    } else if (res.status === 403 || res.status === 404) {
      return { canEdit: false, errorStatus: res.status };
    }
  } catch (err) {
    console.warn("[GDrive] Không thể kiểm tra quyền tệp:", err);
  }

  return { canEdit: null, fileName: null };
}

// Tải mảng bytes PDF từ Google Drive (hỗ trợ cả link công khai và link có OAuth token)
async function fetchDrivePdfBytes(fileId, progressCallback) {
  if (typeof progressCallback === "function") progressCallback("Đang kết nối tới Google Drive...");

  const authToken = isTokenValid() ? GoogleDriveState.accessToken : "";

  // Phương thức 1: Nếu có Google OAuth Access Token, tải trực tiếp qua Google Drive API
  if (authToken) {
    try {
      if (typeof progressCallback === "function") progressCallback("Đang xác thực và tải PDF qua Google Drive API...");
      
      // Lấy metadata tên tệp và quyền canEdit
      const meta = await checkDriveFileCapabilities(fileId, authToken);

      const mediaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (res.ok) {
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        if (isPdfMagicBytes(bytes)) {
          return {
            bytes: bytes,
            fileName: meta.fileName || `Tài_liệu_Drive_${fileId.slice(0, 6)}.pdf`,
            canEdit: meta.canEdit
          };
        }
      } else if (res.status === 401) {
        console.warn("[GDrive] Token hết hạn, thử phương thức tải công khai");
      }
    } catch (apiErr) {
      console.warn("[GDrive] Lỗi tải qua Google API:", apiErr);
    }
  }

  // Phương thức 2: Tải liên kết chia sẻ công khai qua các cổng CORS Proxy an toàn
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const proxies = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u) => u // Direct fetch
  ];

  for (let i = 0; i < proxies.length; i++) {
    try {
      if (typeof progressCallback === "function") {
        progressCallback(`Đang nạp dữ liệu PDF (Kênh tải ${i + 1}/${proxies.length})...`);
      }

      const proxyUrl = proxies[i](directUrl);
      const res = await fetch(proxyUrl, {
        method: "GET",
        headers: { Accept: "application/pdf,*/*" }
      });

      if (res.ok) {
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);

        // Kiểm tra xem có phải định dạng PDF chuẩn không
        if (isPdfMagicBytes(bytes)) {
          let fileName = `Tai_lieu_Drive_${fileId.slice(0, 6)}.pdf`;
          const disp = res.headers.get("content-disposition");
          if (disp) {
            const m = disp.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
            if (m && m[1]) fileName = decodeURIComponent(m[1].trim());
          }

          return {
            bytes: bytes,
            fileName: fileName,
            canEdit: null // Chưa xác thực OAuth nên chưa rõ quyền ghi
          };
        } else {
          // Có thể Google Drive trả về trang HTML cảnh báo tệp dung lượng lớn cần xác nhận
          const text = new TextDecoder().decode(bytes.slice(0, 4000));
          const confirmMatch = text.match(/confirm=([0-9a-zA-Z_-]+)/) || text.match(/download_warning_([0-9a-zA-Z_-]+)/);
          if (confirmMatch && confirmMatch[1]) {
            const confirmedUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmMatch[1]}`;
            const res2 = await fetch(proxies[i](confirmedUrl));
            if (res2.ok) {
              const buf2 = await res2.arrayBuffer();
              const bytes2 = new Uint8Array(buf2);
              if (isPdfMagicBytes(bytes2)) {
                return {
                  bytes: bytes2,
                  fileName: `Tai_lieu_Drive_${fileId.slice(0, 6)}.pdf`,
                  canEdit: null
                };
              }
            }
          }
        }
      }
    } catch (proxyErr) {
      console.warn(`[GDrive] Kênh proxy ${i + 1} không phản hồi:`, proxyErr);
    }
  }

  throw new Error("Không thể tải tệp PDF từ Google Drive. Vui lòng kiểm tra lại liên kết, bật quyền 'Bất kỳ ai có liên kết đều có thể xem' hoặc Kết nối tài khoản Google.");
}

// Kiểm tra mã định danh magic bytes %PDF (0x25 0x50 0x44 0x46)
function isPdfMagicBytes(bytes) {
  if (!bytes || bytes.length < 5) return false;
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

// Nạp tệp PDF từ link Google Drive vào Bảng viết bài giảng
async function loadPdfFromDriveUrl(urlOrId) {
  const fileId = extractGoogleDriveFileId(urlOrId);
  if (!fileId) {
    throw new Error("Liên kết Google Drive không hợp lệ. Vui lòng dán link chia sẻ dạng https://drive.google.com/file/d/... hoặc mã ID tệp.");
  }

  const statusEl = document.getElementById("driveModalStatus");
  const setStatus = (msg, isError = false) => {
    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.style.color = isError ? "var(--excolor, #f43f5e)" : "var(--defcolor, #0284c7)";
      statusEl.textContent = msg;
    }
  };

  setStatus("Đang chuẩn bị nạp tệp từ Google Drive...");

  try {
    const result = await fetchDrivePdfBytes(fileId, setStatus);
    const { bytes, fileName, canEdit } = result;

    setStatus("Đang đưa tệp PDF vào Bảng viết bài giảng...");

    // Gọi hàm nạp PDF toàn cục vào NoteRenderer
    if (typeof window.pmathImportPdf === "function") {
      await window.pmathImportPdf(bytes);
    } else {
      throw new Error("Trình kết xuất bài giảng PMATH chưa sẵn sàng.");
    }

    // Lưu trạng thái tệp hiện tại
    GoogleDriveState.currentFile = {
      fileId: fileId,
      fileName: fileName,
      canEdit: canEdit,
      sourceUrl: urlOrId,
      lastLoaded: Date.now(),
      lastSynced: Date.now()
    };
    sessionStorage.setItem("pmath_current_drive_file", JSON.stringify(GoogleDriveState.currentFile));

    // Cập nhật giao diện thanh trạng thái
    updateDriveUI();

    // Đóng hộp thoại nạp nếu đang mở
    const dlg = document.getElementById("googleDriveDialog");
    if (dlg && typeof dlg.close === "function") {
      dlg.close();
    }

    showDriveToast(`✓ Đã nạp thành công "${fileName}" từ Google Drive!`);
    return GoogleDriveState.currentFile;
  } catch (err) {
    console.error("[GDrive] Lỗi nạp PDF:", err);
    setStatus(err.message || "Lỗi không xác định khi tải PDF", true);
    throw err;
  }
}

// Ghi đè bản mới lên Google Drive nếu quyền chia sẻ cho phép
async function overwriteDrivePdf() {
  const current = GoogleDriveState.currentFile;
  if (!current || !current.fileId) {
    alert("Chưa có tệp PDF Google Drive nào đang mở. Vui lòng nạp tài liệu từ Google Drive trước.");
    return;
  }

  // 1. Kiểm tra xác thực OAuth (Google yêu cầu OAuth token để ghi đè tệp)
  if (!isTokenValid()) {
    const confirmAuth = confirm(
      "Để ghi đè tệp lên Google Drive, Google yêu cầu xác thực tài khoản có quyền chỉnh sửa tệp.\n\n" +
      "Bạn có muốn kết nối tài khoản Google ngay bây giờ không?"
    );
    if (!confirmAuth) return;

    try {
      await requestGoogleDriveAuth();
    } catch (e) {
      showDriveToast("Chưa xác thực Google Drive. Không thể ghi đè.");
      return;
    }
  }

  showDriveToast("Đang xuất bài giảng và kiểm tra quyền ghi đè...", 4000);

  // 2. Xuất toàn bộ các trang PDF đã viết chú thích & giải toán
  let pdfResult;
  try {
    if (typeof window.__pmathGeneratePdf === "function") {
      pdfResult = await window.__pmathGeneratePdf();
    } else {
      throw new Error("Trình xuất PDF tự động chưa sẵn sàng.");
    }
  } catch (genErr) {
    alert("Lỗi khi kết xuất PDF: " + genErr.message);
    return;
  }

  if (!pdfResult || !pdfResult.bytes) {
    alert("Không tìm thấy dữ liệu trang bài giảng để xuất PDF.");
    return;
  }

  const { bytes } = pdfResult;
  const fileName = current.fileName || "Bai_giang_PMATH.pdf";

  // 3. Kiểm tra quyền canEdit của tệp trước khi upload
  const caps = await checkDriveFileCapabilities(current.fileId, GoogleDriveState.accessToken);
  if (caps.canEdit === false) {
    // Tệp chia sẻ ở chế độ CHỈ XEM (View-only), không được ghi đè
    const msg = 
      `⚠️ THÔNG BÁO VỀ QUYỀN TRUY CẬP:\n\n` +
      `Liên kết Google Drive của tệp "${fileName}" ở chế độ CHỈ XEM (View-only) hoặc tài khoản hiện tại không có quyền chỉnh sửa.\n\n` +
      `Hệ thống sẽ tự động tải bản PDF đã chú thích/giải bài tập về máy tính cho bạn!`;
    alert(msg);

    // Tự động tải về máy để bảo toàn dữ liệu bài giảng
    triggerLocalDownload(bytes, fileName);
    return;
  }

  // 4. Tiến hành gửi PATCH request để ghi đè nội dung tệp trên Google Drive
  showDriveToast(`Đang ghi đè bản mới lên Google Drive (${(bytes.length / 1024 / 1024).toFixed(2)} MB)...`, 5000);

  try {
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${current.fileId}?uploadType=media`;
    const res = await fetch(uploadUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${GoogleDriveState.accessToken}`,
        "Content-Type": "application/pdf"
      },
      body: bytes
    });

    if (res.ok) {
      current.lastSynced = Date.now();
      current.canEdit = true;
      sessionStorage.setItem("pmath_current_drive_file", JSON.stringify(current));
      updateDriveUI();

      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      showDriveToast(`✓ Đã ghi đè bản mới thành công lên Google Drive lúc ${timeStr}!`, 4500);
    } else if (res.status === 403) {
      // Bị từ chối quyền ghi
      alert(
        `⚠️ GOOGLE DRIVE TỪ CHỐI GHI ĐÈ (HTTP 403):\n\n` +
        `Bạn không có quyền chỉnh sửa tệp này trên Google Drive (người chia sẻ chỉ cấp quyền Xem).\n\n` +
        `Hệ thống sẽ tải tệp PDF đã sửa về máy tính cho bạn!`
      );
      triggerLocalDownload(bytes, fileName);
    } else if (res.status === 401) {
      showDriveToast("Phiên đăng nhập Google đã hết hạn. Vui lòng kết nối lại tài khoản.");
      sessionStorage.removeItem("pmath_gdrive_access_token");
      GoogleDriveState.accessToken = "";
      updateDriveUI();
    } else {
      const errText = await res.text();
      throw new Error(`Google API trả về mã lỗi ${res.status}: ${errText}`);
    }
  } catch (uploadErr) {
    console.error("[GDrive] Lỗi ghi đè:", uploadErr);
    alert("Lỗi khi ghi đè tệp lên Google Drive: " + uploadErr.message + "\n\nTệp PDF sẽ được tải về máy tính để tránh mất dữ liệu.");
    triggerLocalDownload(bytes, fileName);
  }
}

// Hàm tải tệp về máy cục bộ đề phòng mất bài giảng
function triggerLocalDownload(bytes, fileName) {
  try {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    showDriveToast("✓ Đã tải bản PDF về máy tính an toàn.");
  } catch (e) {
    console.error("[GDrive] Không thể tải về máy:", e);
  }
}

// Cập nhật giao diện đồng bộ Google Drive
function updateDriveUI() {
  const pill = document.getElementById("driveSyncPill");
  const fileNameDisp = document.getElementById("drivePillFileName");
  const btnUpdate = document.getElementById("btnDriveSyncUpdate");
  const modalStatus = document.getElementById("driveModalFileInfo");

  const current = GoogleDriveState.currentFile;

  if (pill && fileNameDisp) {
    if (current && current.fileId) {
      pill.style.display = "inline-flex";
      fileNameDisp.textContent = current.fileName || "Tệp Google Drive";
      
      const canEditBadge = current.canEdit === true 
        ? " (Quyền: Ghi đè)" 
        : current.canEdit === false 
        ? " (Chỉ xem)" 
        : "";
      fileNameDisp.title = `${current.fileName || ""}${canEditBadge} — Nhấn để xem chi tiết`;

      if (btnUpdate) {
        btnUpdate.title = current.canEdit === false 
          ? "Tệp ở chế độ chỉ xem, sẽ xuất tải về máy tính" 
          : "Ghi đè bản mới lên Google Drive";
      }
    } else {
      pill.style.display = "none";
    }
  }

  // Cập nhật trong dialog nếu đang mở
  if (modalStatus) {
    if (current && current.fileId) {
      const syncTime = current.lastSynced ? new Date(current.lastSynced).toLocaleTimeString("vi-VN") : "Chưa đồng bộ";
      const editLabel = current.canEdit === true
        ? `<span style="color:#10b981;font-weight:700;">✓ Cho phép ghi đè</span>`
        : current.canEdit === false
        ? `<span style="color:#f59e0b;font-weight:700;">⚠ Chỉ xem (Tự động tải về máy khi lưu)</span>`
        : `<span>Đang chờ kiểm tra khi ghi đè</span>`;

      modalStatus.innerHTML = `
        <div class="drive-file-card">
          <div style="font-weight:700; color:var(--text-color); margin-bottom:4px;">📄 ${current.fileName || "Tệp PDF"}</div>
          <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:2px;">Mã tệp: <code>${current.fileId}</code></div>
          <div style="font-size:0.82rem; margin-bottom:2px;">Quyền chỉnh sửa: ${editLabel}</div>
          <div style="font-size:0.82rem; color:var(--text-muted);">Lần đồng bộ gần nhất: <strong>${syncTime}</strong></div>
        </div>
      `;
    } else {
      modalStatus.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">Chưa có tệp Google Drive nào được nạp.</div>`;
    }
  }

  // Cập nhật thông tin tài khoản trong modal
  const accountInfo = document.getElementById("driveAccountInfo");
  if (accountInfo) {
    if (isTokenValid()) {
      accountInfo.innerHTML = `
        <span style="color:#10b981; font-weight:700;">✓ Đã kết nối Google Drive</span>
        ${GoogleDriveState.userEmail ? `<small style="color:var(--text-muted);">(${GoogleDriveState.userEmail})</small>` : ""}
      `;
    } else {
      accountInfo.innerHTML = `<span style="color:var(--text-muted);">Chưa kết nối tài khoản Google</span>`;
    }
  }
}

// Hiển thị thông báo Toast nhanh
function showDriveToast(msg, duration = 3500) {
  let toast = document.getElementById("pmathDriveToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pmathDriveToast";
    toast.className = "pmath-toast drive-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, duration);
}

// Khởi tạo các sự kiện giao diện cho Google Drive
function initGoogleDriveEvents() {
  // 1. Nút mở dialog trên Top dropdown
  const openDriveBtn = document.getElementById("topOpenDrivePdfBtn");
  const driveDialog = document.getElementById("googleDriveDialog");
  const closeDriveBtn = document.getElementById("closeGoogleDriveDialogBtn");

  if (openDriveBtn && driveDialog) {
    openDriveBtn.addEventListener("click", () => {
      updateDriveUI();
      driveDialog.showModal();
    });
  }

  if (closeDriveBtn && driveDialog) {
    closeDriveBtn.addEventListener("click", () => {
      driveDialog.close();
    });
  }

  // 2. Nút "Nạp tệp" trong dialog
  const btnLoad = document.getElementById("btnDriveSubmitLoad");
  const inputUrl = document.getElementById("drivePdfUrlInput");
  if (btnLoad && inputUrl) {
    btnLoad.addEventListener("click", async () => {
      const val = inputUrl.value.trim();
      if (!val) {
        alert("Vui lòng dán liên kết Google Drive của tệp PDF.");
        inputUrl.focus();
        return;
      }

      btnLoad.disabled = true;
      btnLoad.textContent = "Đang nạp PDF...";
      try {
        await loadPdfFromDriveUrl(val);
      } catch (e) {
        // Lỗi đã được hiển thị trên giao diện
      } finally {
        btnLoad.disabled = false;
        btnLoad.textContent = "Tải PDF vào Bảng viết";
      }
    });

    inputUrl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        btnLoad.click();
      }
    });
  }

  // 3. Nút "Cập nhật & Ghi đè" trên Sync Pill và trong dialog
  const btnSyncUpdate = document.getElementById("btnDriveSyncUpdate");
  const btnModalOverwrite = document.getElementById("btnDriveModalOverwrite");
  const onOverwriteClick = async () => {
    if (btnSyncUpdate) btnSyncUpdate.disabled = true;
    if (btnModalOverwrite) btnModalOverwrite.disabled = true;
    try {
      await overwriteDrivePdf();
    } finally {
      if (btnSyncUpdate) btnSyncUpdate.disabled = false;
      if (btnModalOverwrite) btnModalOverwrite.disabled = false;
    }
  };

  if (btnSyncUpdate) btnSyncUpdate.addEventListener("click", onOverwriteClick);
  if (btnModalOverwrite) btnModalOverwrite.addEventListener("click", onOverwriteClick);

  // 4. Nút đóng liên kết Drive hiện tại trên pill
  const btnClosePill = document.getElementById("btnDriveSyncClose");
  if (btnClosePill) {
    btnClosePill.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Đóng liên kết Google Drive hiện tại? (Nội dung trên bảng viết vẫn được giữ nguyên).")) {
        GoogleDriveState.currentFile = null;
        sessionStorage.removeItem("pmath_current_drive_file");
        updateDriveUI();
        showDriveToast("Đã đóng liên kết Google Drive.");
      }
    });
  }

  // 5. Nút kết nối Google OAuth
  const btnAuth = document.getElementById("btnDriveConnectGoogle");
  if (btnAuth) {
    btnAuth.addEventListener("click", async () => {
      try {
        btnAuth.disabled = true;
        btnAuth.textContent = "Đang kết nối...";
        await requestGoogleDriveAuth();
      } catch (err) {
        console.warn("[GDrive] Đăng nhập chưa hoàn tất:", err);
      } finally {
        btnAuth.disabled = false;
        btnAuth.textContent = "🔑 Kết nối tài khoản Google";
      }
    });
  }

  // 6. Lưu Access Token thủ công (tiện ích dự phòng)
  const btnSaveToken = document.getElementById("btnSaveManualDriveToken");
  const inputToken = document.getElementById("manualDriveTokenInput");
  if (btnSaveToken && inputToken) {
    btnSaveToken.addEventListener("click", () => {
      const tok = inputToken.value.trim();
      if (tok) {
        GoogleDriveState.accessToken = tok;
        GoogleDriveState.tokenExpiresAt = Date.now() + 3600 * 1000;
        sessionStorage.setItem("pmath_gdrive_access_token", tok);
        sessionStorage.setItem("pmath_gdrive_token_expires", String(GoogleDriveState.tokenExpiresAt));
        fetchUserInfo(tok);
        updateDriveUI();
        inputToken.value = "";
        showDriveToast("✓ Đã lưu Google Access Token!");
      }
    });
  }

  // 7. Nhấn vào Sync Pill để mở dialog quản lý
  const pill = document.getElementById("driveSyncPill");
  if (pill && driveDialog) {
    pill.addEventListener("click", (e) => {
      if (e.target && (e.target.id === "btnDriveSyncUpdate" || e.target.id === "btnDriveSyncClose")) return;
      updateDriveUI();
      driveDialog.showModal();
    });
  }

  // Khởi tạo trạng thái ban đầu
  initGisTokenClient();
  updateDriveUI();
}

// Xuất các hàm ra đối tượng toàn cục
window.PMATH_GDRIVE = {
  loadFromUrl: loadPdfFromDriveUrl,
  overwrite: overwriteDrivePdf,
  getState: () => ({ ...GoogleDriveState }),
  extractId: extractGoogleDriveFileId,
  requestAuth: requestGoogleDriveAuth
};

// Đăng ký sự kiện khi trang đã tải xong
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGoogleDriveEvents);
} else {
  initGoogleDriveEvents();
}
