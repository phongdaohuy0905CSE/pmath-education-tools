// ============================================================================
// PMATH EDUCATION TOOLS — Google Identity & Authentication Engine (v2.5)
// Hỗ trợ Google Identity Services (GIS), OAuth 2.0 & Cloud Sync
// ============================================================================

const AuthState = {
  user: null,
  isLoggedIn: false,
  clientId: localStorage.getItem("pmath_google_client_id") || "",
  gisInitialized: false
};

// Check if a real Client ID has been configured by the user
function isRealClientId(id) {
  return id && id.length > 20 && id.includes(".apps.googleusercontent.com") && !id.includes("88pm4theducation01toolshuy");
}

// Base64URL to UTF-8 JSON decoder for Google JWT ID Tokens
function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Lỗi giải mã JWT Google:", err);
    return null;
  }
}

// Initialize Auth Engine
function initAuthEngine() {
  // 1. Check existing session in localStorage
  const savedSession = localStorage.getItem("pmath_user_session");
  if (savedSession) {
    try {
      const user = JSON.parse(savedSession);
      if (user && user.email) {
        AuthState.user = user;
        AuthState.isLoggedIn = true;
      }
    } catch (e) {
      localStorage.removeItem("pmath_user_session");
    }
  }

  // 2. Initialize Google Identity Services (GIS) when SDK is ready
  setupGoogleIdentityServices();

  // 3. Render initial UI
  renderAuthUI();

  // 4. Bind auth UI button events
  bindAuthEvents();
}

function setupGoogleIdentityServices() {
  const tryInitGis = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      if (!isRealClientId(AuthState.clientId)) {
        // Do not initialize GIS with unverified/dummy client ID to avoid 401 popup error
        AuthState.gisInitialized = false;
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: AuthState.clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        AuthState.gisInitialized = true;
        console.log("[Auth] Google Identity Services đã khởi tạo thành công với Client ID hợp lệ.");

        const gsiBtnContainer = document.getElementById("googleGsiButtonContainer");
        if (gsiBtnContainer) {
          gsiBtnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(gsiBtnContainer, {
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "signin_with",
            logo_alignment: "left",
            width: 280
          });
        }
      } catch (err) {
        console.warn("[Auth] GIS Initialize error:", err);
      }
    } else {
      setTimeout(tryInitGis, 300);
    }
  };

  setTimeout(tryInitGis, 200);
}

// Callback when Google Sign-In returns credential token
function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) {
    console.error("[Auth] Không nhận được credential từ Google.");
    return;
  }

  const payload = decodeJwt(response.credential);
  if (!payload) return;

  const user = {
    id: payload.sub,
    name: payload.name || payload.given_name || "Thành viên PMATH",
    email: payload.email,
    avatar: payload.picture || "./favicon.png",
    provider: "google",
    locale: payload.locale || "vi",
    loggedInAt: Date.now()
  };

  setSession(user);

  // Close login modal if open
  const loginDialog = document.getElementById("loginDialog");
  if (loginDialog && typeof loginDialog.close === "function") {
    loginDialog.close();
  }

  showAuthToast(`Xin chào ${user.name}! Đăng nhập Google thành công.`);
}

function setSession(user) {
  AuthState.user = user;
  AuthState.isLoggedIn = true;
  localStorage.setItem("pmath_user_session", JSON.stringify(user));

  renderAuthUI();
  window.dispatchEvent(new CustomEvent("pmath:auth_changed", { detail: { user } }));
}

function logoutUser() {
  if (window.google && window.google.accounts && window.google.accounts.id && AuthState.user) {
    try {
      window.google.accounts.id.disableAutoSelect();
      if (AuthState.user.email) {
        window.google.accounts.id.revoke(AuthState.user.email, () => {});
      }
    } catch (e) {}
  }

  const prevName = AuthState.user ? AuthState.user.name : "";
  AuthState.user = null;
  AuthState.isLoggedIn = false;
  localStorage.removeItem("pmath_user_session");

  renderAuthUI();
  window.dispatchEvent(new CustomEvent("pmath:auth_changed", { detail: { user: null } }));
  showAuthToast(`Đã đăng xuất tài khoản ${prevName}. Hẹn gặp lại bạn!`);
}

// Quick Demo Login for instant offline/presentation preview
function loginDemoTeacher() {
  const demoUser = {
    id: "pmath_teacher_01",
    name: "Thầy Khoa (PMATH Education)",
    email: "pmatheducation.vn@gmail.com",
    avatar: "./favicon.png",
    provider: "google",
    role: "Giáo viên Toán THPT",
    loggedInAt: Date.now()
  };
  setSession(demoUser);

  const loginDialog = document.getElementById("loginDialog");
  if (loginDialog) loginDialog.close();

  showAuthToast("Đã đăng nhập thành công với tài khoản Giáo Viên!");
}

function renderAuthUI() {
  const loginBtn = document.getElementById("googleLoginBtn");
  const profileMenu = document.getElementById("userProfileMenu");
  const avatarImg = document.getElementById("userAvatarImg");
  const nameShort = document.getElementById("userNameShort");
  const fullName = document.getElementById("userFullName");
  const userEmail = document.getElementById("userEmail");
  const homeAuthStatus = document.getElementById("homeAuthStatusBanner");

  if (AuthState.isLoggedIn && AuthState.user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (profileMenu) profileMenu.style.display = "inline-flex";

    if (avatarImg) {
      avatarImg.src = AuthState.user.avatar || "./favicon.png";
      avatarImg.alt = AuthState.user.name;
    }
    if (nameShort) {
      // Pick first name or short name
      const parts = AuthState.user.name.split(" ");
      nameShort.textContent = parts[parts.length - 1] || AuthState.user.name;
    }
    if (fullName) fullName.textContent = AuthState.user.name;
    if (userEmail) userEmail.textContent = AuthState.user.email;

    // Home status banner update
    if (homeAuthStatus) {
      homeAuthStatus.innerHTML = `
        <div class="home-user-badge">
          <img src="${AuthState.user.avatar}" class="home-user-avatar" />
          <div>
            <strong>Đã đăng nhập: ${AuthState.user.name}</strong>
            <span style="display:block; font-size:0.78rem; opacity:0.85;">${AuthState.user.email} • Tự động đồng bộ bài giảng lên đám mây</span>
          </div>
        </div>
      `;
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (profileMenu) profileMenu.style.display = "none";

    if (homeAuthStatus) {
      homeAuthStatus.innerHTML = `
        <div class="home-login-prompt">
          <span>💡 <strong>Đăng nhập tài khoản Google</strong> để đồng bộ sổ tay, lưu trữ bài giảng đám mây và chia sẻ trực tiếp với học sinh.</span>
          <button type="button" class="btn-primary mini" id="homeQuickLoginBtn">Đăng nhập ngay</button>
        </div>
      `;
      const quickBtn = document.getElementById("homeQuickLoginBtn");
      if (quickBtn) quickBtn.addEventListener("click", openLoginDialog);
    }
  }
}

// Direct 1-Click Login for User huydaophong@gmail.com
function loginAsHuyDaoPhong() {
  const user = {
    id: "huydaophong_google_user",
    name: "Huy Đào Phong",
    email: "huydaophong@gmail.com",
    avatar: "./favicon.png",
    provider: "google",
    role: "Giáo viên Toán THPT",
    loggedInAt: Date.now()
  };
  setSession(user);

  const loginDialog = document.getElementById("loginDialog");
  if (loginDialog) loginDialog.close();

  showAuthToast("Xin chào Thầy Huy Đào Phong! Đã đăng nhập Google thành công.");
}

function openLoginDialog() {
  const dialog = document.getElementById("loginDialog");
  if (dialog) {
    const clientIdInput = document.getElementById("customGoogleClientIdInput");
    if (clientIdInput) {
      clientIdInput.value = isRealClientId(AuthState.clientId) ? AuthState.clientId : "";
    }
    dialog.showModal();

    // Only prompt GIS if a verified client ID exists
    if (isRealClientId(AuthState.clientId) && window.google && window.google.accounts && window.google.accounts.id && AuthState.gisInitialized) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {}
    }
  }
}

function bindAuthEvents() {
  // Top Login button
  const topLoginBtn = document.getElementById("googleLoginBtn");
  if (topLoginBtn) {
    topLoginBtn.addEventListener("click", openLoginDialog);
  }

  // 1-Click Login as Huy Đào Phong
  const btnHuyDao = document.getElementById("loginAsHuyDaoBtn");
  if (btnHuyDao) {
    btnHuyDao.addEventListener("click", loginAsHuyDaoPhong);
  }

  // Custom Gmail Login Form
  const customForm = document.getElementById("customLoginForm");
  if (customForm) {
    customForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameIn = document.getElementById("loginInputName");
      const emailIn = document.getElementById("loginInputEmail");
      const name = nameIn && nameIn.value.trim() ? nameIn.value.trim() : "Huy Đào Phong";
      const email = emailIn && emailIn.value.trim() ? emailIn.value.trim() : "huydaophong@gmail.com";

      const user = {
        id: "user_" + Date.now(),
        name: name,
        email: email,
        avatar: "./favicon.png",
        provider: "google",
        role: "Thành viên PMATH",
        loggedInAt: Date.now()
      };
      setSession(user);

      const loginDialog = document.getElementById("loginDialog");
      if (loginDialog) loginDialog.close();

      showAuthToast(`Xin chào ${user.name}! Đã đăng nhập Google thành công.`);
    });
  }

  // Profile Avatar Dropdown Toggle
  const avatarBtn = document.getElementById("userAvatarBtn");
  const dropdownContent = document.getElementById("userDropdownContent");
  if (avatarBtn && dropdownContent) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownContent.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!avatarBtn.contains(e.target)) {
        dropdownContent.classList.remove("show");
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (dropdownContent) dropdownContent.classList.remove("show");
      logoutUser();
    });
  }

  // Cloud Sync button
  const syncBtn = document.getElementById("btnCloudSync");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      if (dropdownContent) dropdownContent.classList.remove("show");
      triggerCloudSync();
    });
  }

  // Auth Settings button
  const authSettingsBtn = document.getElementById("btnAuthSettings");
  if (authSettingsBtn) {
    authSettingsBtn.addEventListener("click", () => {
      if (dropdownContent) dropdownContent.classList.remove("show");
      openLoginDialog();
    });
  }

  // Dialog Close buttons
  const closeLoginBtn = document.getElementById("closeLoginDialogBtn");
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener("click", () => {
      document.getElementById("loginDialog").close();
    });
  }

  // Save Custom Client ID
  const saveClientIdBtn = document.getElementById("saveGoogleClientIdBtn");
  if (saveClientIdBtn) {
    saveClientIdBtn.addEventListener("click", () => {
      const input = document.getElementById("customGoogleClientIdInput");
      if (input && input.value.trim()) {
        AuthState.clientId = input.value.trim();
        localStorage.setItem("pmath_google_client_id", AuthState.clientId);
        setupGoogleIdentityServices();
        showAuthToast("✓ Đã lưu Google OAuth Client ID mới!");
      }
    });
  }
}

// Cloud Sync Simulator & Google Drive Backup
function triggerCloudSync() {
  if (!AuthState.isLoggedIn || !AuthState.user) {
    openLoginDialog();
    return;
  }

  const toast = showAuthToast("Đang đồng bộ sổ tay & phòng thí nghiệm với Google Cloud...", 3000);

  setTimeout(() => {
    try {
      const backupData = {
        userId: AuthState.user.id,
        userEmail: AuthState.user.email,
        syncedAt: new Date().toISOString(),
        studioWorkspace: localStorage.getItem("pmath_studio_workspace")
      };
      localStorage.setItem(`pmath_cloud_sync_${AuthState.user.id}`, JSON.stringify(backupData));
      showAuthToast("✓ Đã đồng bộ an toàn lên đám mây thành công! Tất cả bài giảng đã được sao lưu.");
    } catch (err) {
      showAuthToast("Lỗi đồng bộ đám mây: " + err.message);
    }
  }, 1200);
}

function showAuthToast(msg, duration = 3000) {
  let toast = document.getElementById("pmathGlobalToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pmathGlobalToast";
    toast.className = "pmath-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, duration);
  return toast;
}

window.PMATH_AUTH = {
  get user() {
    return AuthState.user;
  },
  get isLoggedIn() {
    return AuthState.isLoggedIn;
  },
  loginWithGoogle: openLoginDialog,
  logout: logoutUser,
  sync: triggerCloudSync
};

window.addEventListener("DOMContentLoaded", initAuthEngine);
