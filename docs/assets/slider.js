if (window.__PG_SLIDER_INITED__) {
  console.warn("PG slider script already loaded, skipping duplicate init.");
} else {
  window.__PG_SLIDER_INITED__ = true;
(function () {
const ACCOUNT_KEY = "pg_account";
const API_BASE = window.API_BASE_URL || "";
const BRAND_AVATAR_CACHE_KEY = "pg_brand_avatar";

const requestDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeRequestError = (err) => {
  if (!err || !err.message) return new Error("Permintaan gagal.");
  if (err.message.toLowerCase().includes("failed to fetch")) {
    return new Error("Tidak dapat terhubung ke server. Silakan coba lagi.");
  }
  return err;
};

const requestJson = async (path, options = {}, attempts = 2) => {
  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || "Permintaan gagal");
    }
    return data;
  } catch (error) {
    const normalized = normalizeRequestError(error);
    if (attempts <= 1) throw normalized;
    await requestDelay(400);
    return requestJson(path, options, attempts - 1);
  }
};

function authPost(path, body, attempts = 1) {
  return requestJson(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    attempts
  );
}

function apiGet(path, attempts = 3) {
  return requestJson(path, {}, attempts);
}

function apiPost(path, body, attempts = 1) {
  return requestJson(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    attempts
  );
}

function apiDelete(path, body, attempts = 1) {
  return requestJson(
    path,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    attempts
  );
}

function initSliderApp() {
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  const heroSliderEl = document.getElementById("hero-slider");

  if (slides.length) {
    let current = 0;
    let autoTimer = null;
    const autoplayDelay = 4000;

    const setActive = (index) => {
      const total = slides.length;
      if (!total) return;
      slides[current]?.classList.remove("active");
      dots[current]?.classList.remove("active");
      current = (index + total) % total;
      slides[current]?.classList.add("active");
      dots[current]?.classList.add("active");
    };

    const startAuto = () => {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(() => setActive(current + 1), autoplayDelay);
    };

    const stopAuto = () => {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        stopAuto();
        setActive(index);
        startAuto();
      });
    });

    heroSliderEl?.addEventListener("mouseenter", stopAuto);
    heroSliderEl?.addEventListener("mouseleave", startAuto);

    let swipeStartX = 0;
    heroSliderEl?.addEventListener(
      "touchstart",
      (event) => {
        swipeStartX = event.touches[0].clientX;
        stopAuto();
      },
      { passive: true }
    );
    heroSliderEl?.addEventListener(
      "touchend",
      (event) => {
        const deltaX = event.changedTouches[0].clientX - swipeStartX;
        if (Math.abs(deltaX) > 40) {
          setActive(current + (deltaX < 0 ? 1 : -1));
        }
        startAuto();
      },
      { passive: true }
    );

    setActive(0);
    startAuto();
  }

  const menuBtn = document.getElementById("menu-toggle");
  const navPanel = document.getElementById("topbar-nav");
  const menuList = document.getElementById("menu-list");
  const avatarInput = document.getElementById("brand-avatar-input");
  const avatarTrigger = document.getElementById("brand-avatar-trigger");
  const platformSection = document.getElementById("platform-list");
  const loaderOverlay = document.getElementById("profile-loader");
  const loaderMessage = loaderOverlay?.querySelector("p");
  const showLoader = (message = "Memproses...") => {
    if (!loaderOverlay) return;
    loaderMessage && (loaderMessage.textContent = message);
    loaderOverlay.classList.remove("hidden");
  };
  const hideLoader = () => loaderOverlay?.classList.add("hidden");
  const OWNER_PASSWORD = "Senjasuci1719";
  const DEFAULT_MIN_DEPOSIT = 10000;
  const toastContainer = document.getElementById("global-toast");
  const toastMessageEl = document.getElementById("toast-message");
  const toastClose = document.getElementById("toast-close");
  const MONITOR_FETCH_LIMIT = Math.max(50, Number(window.MONITOR_FETCH_LIMIT || 120));
  let toastTimer = null;
  const showToast = (message = "", type = "success") => {
    if (!toastContainer || !toastMessageEl) {
      window.alert(message);
      return;
    }
    toastContainer.classList.remove("hidden", "success", "error", "info");
    const variant = type === "error" ? "error" : type === "info" ? "info" : "success";
    toastContainer.classList.add(variant);
    toastMessageEl.textContent = message;
    toastContainer.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastContainer.classList.add("hidden"), 3200);
  };
  toastClose?.addEventListener("click", () => {
    toastContainer?.classList.add("hidden");
    if (toastTimer) clearTimeout(toastTimer);
  });
  const loadStoredAvatar = () => {
    if (!brandAvatarEl) return;
    try {
      const stored = localStorage.getItem(BRAND_AVATAR_CACHE_KEY);
      if (stored) brandAvatarEl.src = stored;
    } catch (err) {
      console.warn("Tidak bisa membaca avatar brand:", err);
    }
  };
  loadStoredAvatar();
  avatarTrigger?.addEventListener("click", () => avatarInput?.click());
  avatarInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      showToast("Harap pilih file gambar.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (brandAvatarEl) brandAvatarEl.src = reader.result;
      try {
        localStorage.setItem(BRAND_AVATAR_CACHE_KEY, reader.result);
      } catch (err) {
        console.warn("Gagal menyimpan avatar:", err);
      }
    };
    reader.readAsDataURL(file);
  });
  const OWNER_TOKEN_KEY = "pg_owner_token";
  const BLOCKED_SERVICE_KEYWORDS = ["website traffic", "website social signal"];
  const MENU_ICON_SVGS = {
    login:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5.25v13.5A2.25 2.25 0 007.25 21H12"/><path d="M12 8.25H5"/><path d="M13.5 8.25L18 12l-4.5 3.75"/><path d="M18 12H9"/></svg>',
    register:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3.5"/><path d="M3.75 20.25a7.5 7.5 0 0110.5 0"/><path d="M19.5 8.25v6"/><path d="M16.5 11.25h6"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="5.75"/><path d="M14.5 14.5L21 21"/></svg>',
    price:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 5.25h7.5L21 14.25l-6.75 6.75H4.5z"/><circle cx="8.25" cy="8.25" r="1.25"/></svg>',
    phone:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.25 4.5l3-1.5L11.25 9 9 11.25a12 12 0 005.25 5.25L16.5 14.25l4.5 2.25-1.5 3.75a2.25 2.25 0 01-2.05 1.35A16.5 16.5 0 014.5 6.55 2.25 2.25 0 015.25 4.5z"/></svg>',
    guide:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.75c-2.121-1.273-4.379-2.25-6.75-2.25v12c2.371 0 4.629.977 6.75 2.25m0-12c2.121-1.273 4.379-2.25 6.75-2.25v12c-2.371 0-4.629.977-6.75 2.25m0-12v12"/></svg>',
    target:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7.75"/><circle cx="12" cy="12" r="4.25"/><circle cx="12" cy="12" r="1.5"/></svg>',
    gift:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.75" y="9" width="16.5" height="9.75" rx="1.5"/><path d="M12 4.5v14.25"/><path d="M3.75 9h16.5"/><path d="M9.75 4.5a2.25 2.25 0 10-2.25 2.25H12"/><path d="M14.25 4.5a2.25 2.25 0 112.25 2.25H12"/></svg>',
    crown:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14.25l2.25-7.5L9 12l3-6 3 6 3.75-4.5 3.25 7.5v4.5H3z"/></svg>',
    profile:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.25" r="3.5"/><path d="M6 20.25a6 6 0 0112 0"/><circle cx="12" cy="12" r="9"/></svg>',
    wallet:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.75" y="7.5" width="13.5" height="11.25" rx="2.25"/><path d="M17.25 11.25H21v7.5h-3.75"/><circle cx="17.25" cy="15" r="0.75"/></svg>',
    history:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.25"/><path d="M12 7.5v4.5l3 1.5"/><path d="M6 12H3"/></svg>',
    monitor:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18.75l4.5-6 3 3 5.25-7.5L21 13.5"/><path d="M3 5.25v15.5H21"/></svg>',
    status:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 4.5h8.25L20.25 8v11.25H8.25z"/><path d="M8.25 9.75H18"/><path d="M8.25 14.25h6.75"/><path d="M8.25 18.75h4.5"/></svg>',
    logout:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 5.25v13.5A1.5 1.5 0 006 20.25h5.25"/><path d="M13.5 12h8.25"/><path d="M18.75 8.25L21.75 12l-3 3.75"/></svg>',
  };
  const defaultMenu = [
    { action: "login", icon: "login", label: "Masuk Reseller", hidden: true },
    { action: "register", icon: "register", label: "Daftar Reseller", hidden: true },
    { action: "track", icon: "search", label: "Cek Status Order" },
    { action: "monitor", icon: "monitor", label: "Monitoring Sosmed" },
    { action: "prices", icon: "price", label: "Daftar Harga" },
    { action: "contact", icon: "phone", label: "Kontak" },
    { action: "guide", icon: "guide", label: "Cara Order" },
    { action: "target", icon: "target", label: "Target Pesanan" },
    { action: "reward", icon: "gift", label: "Menu Hadiah", hidden: true },
    { action: "owner", icon: "crown", label: "Owner" },
  ];

  const resellerMenu = [
    { action: "profile", icon: "profile", label: "Profil Reseller" },
    { action: "deposit", icon: "wallet", label: "Deposit Saldo" },
    { action: "history", icon: "history", label: "Riwayat Deposit" },
    { action: "monitor", icon: "monitor", label: "Monitoring Sosmed" },
    { action: "reward", icon: "gift", label: "Menu Hadiah" },
    { action: "prices", icon: "price", label: "Daftar Harga" },
    { action: "target", icon: "target", label: "Target Pesanan" },
    { action: "status", icon: "status", label: "Status Order" },
    { action: "contact", icon: "phone", label: "Kontak" },
    { action: "logout", icon: "logout", label: "Logout" },
  ];

  function renderMenuIcon(key) {
    const svg = MENU_ICON_SVGS[key];
    return `<span class="menu-icon">${svg || ""}</span>`;
  }

  let menuState = "guest";
  const renderMenu = () => {
    if (!menuList) return;
    const data = menuState === "reseller" ? resellerMenu : defaultMenu;
    menuList.innerHTML = data
      .map((item) => {
        const hiddenClass = item.hidden ? "hidden" : "";
        return `
        <li>
          <button type="button" class="menu-item ${hiddenClass}" data-action="${item.action}">
            ${renderMenuIcon(item.icon)} ${item.label}
          </button>
        </li>`;
      })
      .join("");
  };
  renderMenu();
  if (menuBtn && navPanel) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navPanel.classList.toggle("open");
    });
    navPanel.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => navPanel.classList.remove("open"));
  }
  const showInfoMessage = (label) => {
    showToast(`${label} segera tersedia. Admin akan mengumumkan jika sudah aktif.`, "info");
  };

  if (menuList) {
    menuList.addEventListener("click", (e) => {
      const action = e.target.closest(".menu-item")?.dataset?.action;
      if (!action) return;
      navPanel.classList.remove("open");
      if (action === "login") return openLogin?.click();
      if (action === "register") return openRegister?.click();
      if (action === "profile") return openProfileModal();
      if (action === "deposit") return openDepositModal();
      if (action === "history") return openHistoryModal();
      if (action === "monitor") return openMonitorModal();
      if (action === "track") return openTrackPage();
      if (action === "reward") return openRewardSection();
      if (action === "prices") return openPricesPage();
      if (action === "target") return openTargetPage();
      if (action === "status") return openStatusPage();
      if (action === "owner") return openOwnerPage();
      if (action === "contact") return switchPage("contact");
      if (action === "guide") return openGuidePage();
      if (action === "logout") return setLoggedOut();
      showInfoMessage("Menu");
    });
  }

  const openLogin = document.getElementById("open-login");
  const openRegister = document.getElementById("open-register");
  const goRegisterFromLogin = document.getElementById("go-register-from-login");
  const balancePill = document.getElementById("balance-pill");
  const coinPill = document.getElementById("coin-pill");
  const brandTitle = document.getElementById("brand-title");
  const brandSubtitle = document.getElementById("brand-subtitle");
  const defaultAvatar =
    brandAvatarEl?.src ||
    "https://ui-avatars.com/api/?name=PG&background=ac2acf&color=fff";

  const loginModal = document.getElementById("login-modal");
  const closeLogin = document.getElementById("close-login");
  const loginInput = document.getElementById("login-identifier");
  const nextBtn = document.querySelector(".next-btn");
  const loginError = document.getElementById("login-error");

  const identifierStep = document.querySelector(".login-step-identifier");
  const passwordStep = document.querySelector(".login-step-password");
  const registerStep = document.querySelector(".login-step-register");

  const passwordLabel = document.getElementById("password-step-label");
  const passwordTitle = document.getElementById("password-step-title");
  const passwordInput = document.getElementById("password-input");
  const confirmPasswordInput = document.getElementById("confirm-password-input");
  const passwordError = document.getElementById("password-error");
  const createAccountBtn = document.getElementById("create-account-btn");

  const registerIdentifierInput = document.getElementById("register-identifier");
  const registerPasswordInput = document.getElementById("register-password");
  const registerConfirmInput = document.getElementById("register-confirm");
  const registerSubmitBtn = document.getElementById("register-submit-btn");
  const registerError = document.getElementById("register-error");

  const confirmModal = document.getElementById("confirm-modal");
  const confirmTitle = document.getElementById("confirm-title");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmIdentifier = document.getElementById("confirm-identifier");
  const confirmEdit = document.getElementById("confirm-edit");
  const confirmRegister = document.getElementById("confirm-register");

  const profileModal = document.getElementById("profile-modal");
  const closeProfile = document.getElementById("close-profile");
  const profileNameInput = document.getElementById("profile-name");
  const profileEmailInput = document.getElementById("profile-email");
  const profilePhoneInput = document.getElementById("profile-phone");
  const profileAvatarInput = document.getElementById("profile-avatar");
  const profileAvatarPreview = document.getElementById("profile-avatar-preview");
  const profilePasswordInput = document.getElementById("profile-password");
  const profilePasswordConfirmInput = document.getElementById("profile-password-confirm");
  const profileError = document.getElementById("profile-error");
  const profileSaveBtn = document.getElementById("profile-save");
  const profileCancelBtn = document.getElementById("profile-cancel");

  const depositModal = document.getElementById("deposit-modal");
  const depositAmountInput = document.getElementById("deposit-amount");
  const depositError = document.getElementById("deposit-error");
  const depositSubmit = document.getElementById("deposit-submit");
  const closeDeposit = document.getElementById("close-deposit");
  const depositHintText = document.getElementById("deposit-hint");

  const historySection = document.getElementById("history-section");
  const historyList = document.getElementById("history-list");
  const historyBalance = document.getElementById("history-balance");
  const historyTableBody = document.getElementById("history-table-body");
  const historyLimitSelect = document.getElementById("history-limit");
  const historyStatusSelect = document.getElementById("history-status");
  const historySearchInput = document.getElementById("history-search");
  const historyFilterBtn = document.getElementById("history-filter-btn");
  const historyTotalText = document.getElementById("history-total");
  const historyPagination = document.getElementById("history-pagination");
  const historyDepositDeleteBtn = document.getElementById("history-deposit-delete");
  const monitorSection = document.getElementById("monitor-section");
  const rewardSection = document.getElementById("reward-section");
  const rewardCoins = document.getElementById("reward-coins");
  const rewardReferrals = document.getElementById("reward-referrals");
  const rewardCode = document.getElementById("reward-code");
  const rewardError = document.getElementById("reward-error");
  const rewardCopyBtn = document.getElementById("reward-copy");
  const rewardInviteBtn = document.getElementById("reward-invite");
  const rewardGameBtn = document.getElementById("reward-game");
  const rewardRedeemAmount = document.getElementById("reward-redeem-amount");
  const rewardRedeemBalance = document.getElementById("reward-redeem-balance");
  const rewardRedeemDana = document.getElementById("reward-redeem-dana");
  const statusTableBody = document.getElementById("status-table-body");
  const statusLimitSelect = document.getElementById("status-limit");
  const statusFilterSelect = document.getElementById("status-filter");
  const statusSearchInput = document.getElementById("status-search");
  const statusFilterBtn = document.getElementById("status-filter-btn");
  const statusTotalText = document.getElementById("status-total");
  const statusPagination = document.getElementById("status-pagination");
  const statusOrderModal = document.getElementById("status-order-modal");
  const statusOrderClose = document.getElementById("status-order-close");
  const statusOrderCloseBtn = document.getElementById("status-order-close-btn");
  const statusOrderTitle = document.getElementById("status-order-title");
  const statusOrderDetail = document.getElementById("status-order-detail");
  const monitorTableBody = document.getElementById("monitor-table-body");
  const monitorLimitSelect = document.getElementById("monitor-limit");
  const monitorStatusSelect = document.getElementById("monitor-status");
  const monitorPlatformSelect = document.getElementById("monitor-platform");
  const monitorCategorySelect = document.getElementById("monitor-category");
  const monitorSearchInput = document.getElementById("monitor-search");
  const monitorFilterBtn = document.getElementById("monitor-filter-btn");
  const monitorTotalText = document.getElementById("monitor-total");
  const monitorPagination = document.getElementById("monitor-pagination");
  const priceTableBody = document.getElementById("price-table-body");
  const priceLimitSelect = document.getElementById("price-limit");
  const priceCategorySelect = document.getElementById("price-category");
  const priceSearchInput = document.getElementById("price-search");
  const priceFilterBtn = document.getElementById("price-filter-btn");
  const priceTotalText = document.getElementById("price-total");
  const pricePagination = document.getElementById("price-pagination");
  const ownerError = document.getElementById("owner-error");
  const ownerProfileCard = document.getElementById("owner-profile-card");
  const ownerEmailEl = document.getElementById("owner-email");
  const ownerUsernameEl = document.getElementById("owner-username");
  const ownerFullnameEl = document.getElementById("owner-fullname");
  const ownerBalanceEl = document.getElementById("owner-balance");
  const ownerSummaryOrders = document.getElementById("owner-summary-orders");
  const ownerSummaryPending = document.getElementById("owner-summary-pending");
  const ownerSummaryRevenue = document.getElementById("owner-summary-revenue");
  const ownerSummarySuccess = document.getElementById("owner-summary-success");
  const ownerSummaryFailed = document.getElementById("owner-summary-failed");
  const ownerOrdersBody = document.getElementById("owner-orders-body");
  const ownerOrdersRefreshBtn = document.getElementById("owner-orders-refresh");
  const ownerResellerTotalChip = document.getElementById("owner-reseller-total");
  const ownerResellerActiveChip = document.getElementById("owner-reseller-active");
  const ownerResellerBlockedChip = document.getElementById("owner-reseller-blocked");
  const ownerResellerSearchInput = document.getElementById("owner-reseller-search");
  const ownerResellerBody = document.getElementById("owner-reseller-body");
  const ownerResellerRefreshBtn = document.getElementById("owner-reseller-refresh");
  const ownerResellerModal = document.getElementById("owner-reseller-modal");
  const ownerResellerClose = document.getElementById("owner-reseller-close");
  const ownerResellerForm = document.getElementById("owner-reseller-form");
  const ownerResellerLabel = document.getElementById("owner-reseller-label");
  const ownerResellerIdInput = document.getElementById("owner-reseller-id");
  const ownerResellerIdentifierInput = document.getElementById("owner-reseller-identifier");
  const ownerResellerDeleteBtn = document.getElementById("owner-reseller-delete");
  const ownerResellerNameInput = document.getElementById("owner-reseller-name");
  const ownerResellerEmailInput = document.getElementById("owner-reseller-email");
  const ownerResellerPhoneInput = document.getElementById("owner-reseller-phone");
  const ownerResellerPasswordCurrentInput = document.getElementById("owner-reseller-password-current");
  const ownerResellerPasswordInput = document.getElementById("owner-reseller-password");
  const ownerResellerBalanceType = document.getElementById("owner-reseller-balance-type");
  const ownerResellerBalanceAmount = document.getElementById("owner-reseller-balance-amount");
  const ownerResellerBlockSelect = document.getElementById("owner-reseller-block");
  const ownerResellerCancelBtn = document.getElementById("owner-reseller-cancel");
  const ownerOrderModal = document.getElementById("owner-order-modal");
  const ownerOrderClose = document.getElementById("owner-order-close");
  const ownerOrderCloseBtn = document.getElementById("owner-order-close-btn");
  const ownerOrderDetail = document.getElementById("owner-order-detail");
  const ownerOrderTitle = document.getElementById("owner-order-title");
  const ownerMinDepositModal = document.getElementById("owner-min-deposit-modal");
  const ownerMinDepositClose = document.getElementById("owner-min-deposit-close");
  const ownerMinDepositInput = document.getElementById("owner-min-deposit-input");
  const ownerMinDepositError = document.getElementById("owner-min-deposit-error");
  const ownerMinDepositCancel = document.getElementById("owner-min-deposit-cancel");
  const ownerMinDepositSave = document.getElementById("owner-min-deposit-save");
  const ownerHideServiceModal = document.getElementById("owner-hide-service-modal");
  const ownerHideServiceClose = document.getElementById("owner-hide-service-close");
  const ownerHideServiceInput = document.getElementById("owner-hide-service-input");
  const ownerHideServiceSearchBtn = document.getElementById("owner-hide-service-search");
  const ownerHideServiceResult = document.getElementById("owner-hide-service-result");
  const ownerHideServiceError = document.getElementById("owner-hide-service-error");
  const ownerHideServiceCancel = document.getElementById("owner-hide-service-cancel");
  const ownerHideServiceToggle = document.getElementById("owner-hide-service-toggle");
  const ownerHideFeedback = document.getElementById("owner-hide-feedback");
  const ownerHideFeedbackText = document.getElementById("owner-hide-feedback-text");
  const ownerHiddenListModal = document.getElementById("owner-hidden-list-modal");
  const ownerHiddenListClose = document.getElementById("owner-hidden-list-close");
  const ownerHiddenListContainer = document.getElementById("owner-hidden-list");
  const ownerHiddenListRefresh = document.getElementById("owner-hidden-list-refresh");
  const announcementBtn = document.getElementById("announcement-btn");
  const announcementPanel = document.getElementById("announcement-panel");
  const announcementMessageEl = document.getElementById("announcement-message");
  const announcementTimeEl = document.getElementById("announcement-time");
  const announcementClose = document.getElementById("announcement-close");
  const ownerAnnouncementModal = document.getElementById("owner-announcement-modal");
  const ownerAnnouncementClose = document.getElementById("owner-announcement-close");
  const ownerAnnouncementInput = document.getElementById("owner-announcement-input");
  const ownerAnnouncementError = document.getElementById("owner-announcement-error");
  const ownerAnnouncementCancel = document.getElementById("owner-announcement-cancel");
  const ownerAnnouncementSave = document.getElementById("owner-announcement-save");
  const ownerSettingsToggle = document.getElementById("owner-settings-toggle");
  const ownerSettingsMenu = document.getElementById("owner-settings-menu");
  const ownerPasswordModal = document.getElementById("owner-password-modal");
  const ownerPasswordInput = document.getElementById("owner-password-input");
  const ownerPasswordError = document.getElementById("owner-password-error");
  const ownerPasswordSubmit = document.getElementById("owner-password-submit");
  const ownerPasswordClose = document.getElementById("owner-password-close");
  const trackForm = document.getElementById("track-form");
  const trackServiceInput = document.getElementById("track-service-id");
  const trackError = document.getElementById("track-error");
  const trackResult = document.getElementById("track-result");
  const trackLoader = document.getElementById("track-loader");
  const trackSummary = document.getElementById("track-summary");
  const readOwnerToken = () => {
    try {
      const saved = sessionStorage.getItem(OWNER_TOKEN_KEY);
      return saved ? atob(saved) : "";
    } catch (e) {
      return "";
    }
  };
  const persistOwnerToken = (token) => {
    try {
      sessionStorage.setItem(OWNER_TOKEN_KEY, btoa(token));
    } catch (e) {
      // ignore storage issues
    }
  };
  let ownerToken = readOwnerToken();
  let ownerAccessCallback = null;
  const pageScreens = Array.from(document.querySelectorAll(".page-screen"));
  const pageBackButtons = document.querySelectorAll(".page-back-btn");

  const switchPage = (page = "default") => {
    pageScreens.forEach((screen) => {
      if (!screen?.id) return;
      const name = screen.id.replace("page-", "");
      screen.classList.toggle("active", name === page);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  pageBackButtons.forEach((btn) =>
    btn.addEventListener("click", () => switchPage(btn.dataset.target || "default"))
  );
  switchPage("default");

  const formatStatusCurrency = (value) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  const formatRelativeTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} bln lalu`;
    const years = Math.floor(months / 12);
    return `${years} thn lalu`;
  };
  const formatFullDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };
  const formatPanelBalance = (value) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

  const escapeHtml = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const updateDepositHint = () => {
    const label = `Pembayaran via QRIS otomatis saldo masuk ke akunmu. Minimal deposit Rp. ${Number(
      minDepositValue || DEFAULT_MIN_DEPOSIT
    ).toLocaleString("id-ID")}.`;
    if (depositHintText) depositHintText.textContent = label;
    if (depositAmountInput) {
      depositAmountInput.min = Math.max(1, minDepositValue || DEFAULT_MIN_DEPOSIT);
      depositAmountInput.placeholder = `Minimal Rp ${Number(minDepositValue || DEFAULT_MIN_DEPOSIT).toLocaleString(
        "id-ID"
      )}`;
    }
  };

const ensureMinDeposit = async (force = false) => {
    if (minDepositLoaded && !force) return minDepositValue;
    try {
      const res = await apiGet("/api/settings?key=min_deposit");
      const val = Number(res.value ?? DEFAULT_MIN_DEPOSIT);
      if (Number.isFinite(val) && val > 0) {
        minDepositValue = Math.round(val);
      } else {
        minDepositValue = DEFAULT_MIN_DEPOSIT;
      }
    } catch (err) {
      console.error("load min deposit error:", err);
      minDepositValue = DEFAULT_MIN_DEPOSIT;
    }
    minDepositLoaded = true;
    updateDepositHint();
  return minDepositValue;
};

const loadHiddenServices = async (force = false) => {
    if (hiddenServicesLoaded && !force) return hiddenServices;
    if (!ownerToken) return hiddenServices;
    try {
      const res = await apiPost("/api/owner", {
        action: "settings",
        key: "hidden_services",
        password: ownerToken,
      });
      const list = Array.isArray(res.list || res.value) ? res.list || res.value : [];
      hiddenServicesList = list;
      hiddenServices = new Set(list.map((id) => String(id).toLowerCase()));
      hiddenServicesLoaded = true;
    } catch (err) {
      console.error("load hidden services error:", err);
      hiddenServices = new Set();
    }
    return hiddenServices;
  };

  const openOwnerMinDepositModal = async () => {
    ownerMinDepositError?.classList.add("hidden");
    await ensureMinDeposit(true);
    if (ownerMinDepositInput) {
      ownerMinDepositInput.value = minDepositValue;
      ownerMinDepositInput.min = 1;
    }
    ownerMinDepositModal?.classList.remove("hidden");
    setTimeout(() => ownerMinDepositInput?.focus(), 50);
  };

  const closeOwnerMinDepositModal = () => {
    ownerMinDepositModal?.classList.add("hidden");
  };

  const openOwnerHideServiceModal = async () => {
    ownerHideServiceError?.classList.add("hidden");
    ownerHideServiceResult &&
      (ownerHideServiceResult.innerHTML = "Masukkan ID layanan lalu tekan ikon pencarian.");
    ownerHideServiceInput && (ownerHideServiceInput.value = "");
    ownerHideServiceToggle && (ownerHideServiceToggle.disabled = true);
    ownerHideServiceToggle && ownerHideServiceToggle.setAttribute("data-mode", "hide");
    ownerHideServiceToggle && (ownerHideServiceToggle.textContent = "Hide Layanan");
    ownerHideServiceData = null;
    resetOwnerHideFeedbackState();
    await loadHiddenServices(true);
    ownerHideServiceModal?.classList.remove("hidden");
    setTimeout(() => ownerHideServiceInput?.focus(), 50);
  };

  const closeOwnerHideServiceModal = () => {
    ownerHideServiceModal?.classList.add("hidden");
    ownerHideServiceError?.classList.add("hidden");
    ownerHideServiceResult &&
      (ownerHideServiceResult.textContent = "Masukkan ID layanan lalu tekan ikon pencarian.");
    ownerHideServiceData = null;
    ownerHideServiceToggle && (ownerHideServiceToggle.disabled = true);
    ownerHideServiceToggle && ownerHideServiceToggle.setAttribute("data-mode", "hide");
    resetOwnerHideFeedbackState();
  };

  const renderAnnouncementPanel = () => {
    if (!announcementMessageEl) return;
    if (!announcementData.message) {
      announcementMessageEl.textContent = "Belum ada pengumuman.";
      announcementTimeEl?.classList.add("hidden");
      announcementBtn?.classList.remove("active");
      return;
    }
    announcementMessageEl.textContent = announcementData.message;
    if (announcementData.updatedAt && announcementTimeEl) {
      const date = new Date(announcementData.updatedAt);
      if (!Number.isNaN(date.getTime())) {
        announcementTimeEl.textContent = `Diperbarui ${date.toLocaleString("id-ID")}`;
        announcementTimeEl.classList.remove("hidden");
      } else {
        announcementTimeEl.classList.add("hidden");
      }
    }
    announcementBtn?.classList.add("active");
  };

  const loadAnnouncement = async (force = false) => {
    if (announcementLoaded && !force) return announcementData;
    try {
      const res = await apiGet("/api/settings?key=announcement");
      const value = res.value || {};
      announcementData = {
        message: value.message || "",
        updatedAt: value.updatedAt || null,
      };
    } catch (err) {
      console.error("Announcement load error:", err);
      announcementData = { message: "", updatedAt: null };
    }
    announcementLoaded = true;
    renderAnnouncementPanel();
    return announcementData;
  };

  const openOwnerAnnouncementModal = async () => {
    ownerAnnouncementError?.classList.add("hidden");
    const current = await loadAnnouncement(true);
    if (ownerAnnouncementInput) ownerAnnouncementInput.value = current.message || "";
    ownerAnnouncementModal?.classList.remove("hidden");
    setTimeout(() => ownerAnnouncementInput?.focus(), 50);
  };

  const closeOwnerAnnouncementModal = () => {
    ownerAnnouncementModal?.classList.add("hidden");
  };

  const renderHiddenList = () => {
    if (!ownerHiddenListContainer) return;
    if (!hiddenServicesList.length) {
      ownerHiddenListContainer.innerHTML =
        "<p>Tidak ada layanan yang disembunyikan.</p>";
      return;
    }
    ownerHiddenListContainer.innerHTML = hiddenServicesList
      .map(
        (id) => `
        <div class="owner-hidden-item">
          <div>
            <span>#${escapeHtml(id)}</span>
            <small>klik tombol untuk menampilkan kembali</small>
          </div>
          <button type="button" data-unhide-service="${escapeHtml(id)}">Unhide</button>
        </div>
      `
      )
      .join("");
  };

  const openOwnerHiddenListModal = async () => {
    await loadHiddenServices(true);
    renderHiddenList();
    ownerHiddenListModal?.classList.remove("hidden");
  };

  const closeOwnerHiddenListModal = () => {
    ownerHiddenListModal?.classList.add("hidden");
  };

  const getPlatformKey = (row = {}) => {
    const raw = row.platformId || row.platform || row.platformName || row.category || "";
    return String(raw || "lainnya").toLowerCase();
  };

  const getPlatformLabel = (row = {}) => {
    return row.platformName || row.platform || row.category || "Lainnya";
  };

  const showOwnerPasswordModal = (callback) => {
    ownerAccessCallback = callback || null;
    ownerPasswordInput && (ownerPasswordInput.value = "");
    ownerPasswordError?.classList.add("hidden");
    ownerPasswordModal?.classList.remove("hidden");
    setTimeout(() => ownerPasswordInput?.focus(), 50);
  };

  const hideOwnerPasswordModal = (clearCallback = false) => {
    ownerPasswordModal?.classList.add("hidden");
    if (clearCallback) ownerAccessCallback = null;
  };

  const ensureOwnerAccess = (onSuccess) => {
    if (ownerToken === OWNER_PASSWORD) {
      onSuccess?.();
      return true;
    }
    showOwnerPasswordModal(onSuccess);
    return false;
  };

  const renderOwnerProfile = (profile = {}) => {
    if (ownerEmailEl) ownerEmailEl.textContent = profile.email || "-";
    if (ownerUsernameEl) ownerUsernameEl.textContent = profile.username || "-";
    if (ownerFullnameEl) ownerFullnameEl.textContent = profile.full_name || profile.fullname || "-";
    if (ownerBalanceEl) ownerBalanceEl.textContent = profile.balance != null ? formatPanelBalance(profile.balance) : "-";
    ownerProfileCard?.classList.remove("hidden");
  };

  const fetchOwnerProfile = async () => {
    ownerError?.classList.add("hidden");
    try {
      const response = await apiPost("/api/owner", { action: "profile", password: ownerToken });
      const profile = response.profile || response.data || {};
      renderOwnerProfile(profile);
    } catch (e) {
      ownerError && (ownerError.textContent = e.message || "Gagal mengambil profil panel.");
      ownerError?.classList.remove("hidden");
    }
  };

  const updateOwnerOrderSummary = (stats = {}) => {
    ownerSummaryOrders && (ownerSummaryOrders.textContent = Number(stats.total || 0));
    ownerSummaryPending && (ownerSummaryPending.textContent = Number(stats.pending || 0));
    ownerSummarySuccess && (ownerSummarySuccess.textContent = Number(stats.success || 0));
    ownerSummaryFailed && (ownerSummaryFailed.textContent = Number(stats.failed || 0));
    if (ownerSummaryRevenue) {
      ownerSummaryRevenue.textContent = formatStatusCurrency(stats.revenue || 0);
    }
  };

  const updateOwnerResellerSummary = (summary = {}) => {
    ownerResellerTotalChip && (ownerResellerTotalChip.textContent = Number(summary.total || 0));
    ownerResellerActiveChip && (ownerResellerActiveChip.textContent = Number(summary.active || 0));
    ownerResellerBlockedChip && (ownerResellerBlockedChip.textContent = Number(summary.blocked || 0));
  };

  const renderOwnerOrders = (rows = []) => {
    if (!ownerOrdersBody) return;
    ownerOrdersMap = {};
    if (!rows.length) {
      ownerOrdersBody.innerHTML = `<tr><td colspan="7">Belum ada data order.</td></tr>`;
      return;
    }
    ownerOrdersBody.innerHTML = rows
      .map((row) => {
        const buyerLabel = row.isReseller
          ? `Reseller (${row.resellerIdentifier || row.buyerName || "-"})`
          : "Publik";
        const statusText = formatTrackStatus(row.status);
        const statusClass = statusToClass(row.status);
        ownerOrdersMap[row.id] = row;
        const safeId = escapeHtml(row.id || "-");
        const safeBuyer = escapeHtml(buyerLabel);
        const safeService = escapeHtml(row.serviceName || "-");
        const safeStatus = escapeHtml(statusText);
        const detailId = escapeHtml(row.id || "");
        return `<tr>
          <td>${safeId}</td>
          <td>${safeBuyer}</td>
          <td>${safeService}</td>
          <td><span class="status-pill ${statusClass}">${safeStatus}</span></td>
          <td>${formatStatusCurrency(row.price || 0)}</td>
          <td>${formatRelativeTime(row.lastUpdate || row.createdAt)}</td>
          <td>
            <button type="button" class="owner-icon-btn owner-detail-btn" data-owner-order="${detailId}">
              <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="6"></circle>
                <line x1="16" y1="16" x2="21" y2="21"></line>
              </svg>
            </button>
          </td>
        </tr>`;
      })
      .join("");
  };

  const statusToClass = (status) => {
    const normalized = String(status || "processing").toLowerCase();
    if (
      normalized.includes("success") ||
      normalized.includes("selesai") ||
      normalized.includes("complete") ||
      normalized.includes("done")
    )
      return "success";
    if (normalized.includes("pending")) return "pending_payment";
    if (normalized.includes("error") || normalized.includes("fail") || normalized.includes("partial"))
      return "error";
    return "processing";
  };

  const loadOwnerOrders = async () => {
    if (!ownerOrdersBody) return;
    ownerOrdersBody.innerHTML = `<tr><td colspan="7">Memuat data order...</td></tr>`;
    try {
      const data = await apiGet("/api/owner?action=orders");
      renderOwnerOrders(data.rows || []);
      updateOwnerOrderSummary(data.stats || {});
      return data;
    } catch (e) {
      ownerOrdersBody.innerHTML = `<tr><td colspan="7">${escapeHtml(
        e.message || "Gagal memuat order."
      )}</td></tr>`;
      ownerOrdersMap = {};
      throw e;
    }
  };

  const ownerDetailItem = (label, value) => {
    const display =
      value === undefined || value === null || value === "" ? "-" : value;
    return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(
      String(display)
    )}</strong></div>`;
  };

  const renderOwnerOrderDetail = (row) => {
    if (!ownerOrderDetail) return;
    const detail = row.detail || {};
    const buyer = detail.buyer || {};
    const comments = Array.isArray(detail.customComments) ? detail.customComments : [];
    const commentList = comments.length
      ? `<ul class="comment-list">${comments.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>`
      : "";
    ownerOrderTitle && (ownerOrderTitle.textContent = row.id || "Detail Order");
    ownerOrderDetail.innerHTML = `
      <div class="detail-group">
        <h5>Informasi Layanan</h5>
        ${ownerDetailItem("Order ID", row.id)}
        ${ownerDetailItem("ID Layanan", detail.serviceId || row.serviceId || "-")}
        ${ownerDetailItem("Layanan", detail.serviceName || row.serviceName)}
        ${ownerDetailItem("Kategori", detail.category || row.category || "-")}
        ${ownerDetailItem("Platform", detail.platform || row.platformName || "-")}
        ${ownerDetailItem("Target", detail.target || row.target)}
        ${ownerDetailItem("Jumlah", detail.quantity || row.quantity)}
        ${
          comments.length
            ? `${ownerDetailItem("Total Komentar", `${comments.length} teks`)}${commentList}`
            : ""
        }
      </div>
      <div class="detail-group">
        <h5>Status & Pembayaran</h5>
        ${ownerDetailItem("Metode", detail.paymentType || (row.isReseller ? "Saldo Reseller" : "Midtrans"))}
        ${ownerDetailItem("Nominal", formatStatusCurrency(detail.grossAmount || row.price))}
        ${ownerDetailItem("Status Panel", detail.panelStatus || row.status)}
        ${ownerDetailItem("ID Panel", detail.panelOrderId || "-")}
        ${ownerDetailItem("Mulai Hitung", detail.startCount ?? "-")}
        ${ownerDetailItem("Sisa", detail.remains ?? "-")}
        ${ownerDetailItem("Dibuat", formatFullDateTime(detail.createdAt || row.createdAt))}
        ${ownerDetailItem("Update Terakhir", formatFullDateTime(detail.updatedAt || row.lastUpdate))}
      </div>
      <div class="detail-group">
        <h5>Pemesan</h5>
        ${ownerDetailItem("Tipe Pemesan", row.isReseller ? "Reseller" : "Publik")}
        ${ownerDetailItem("Identifier", row.resellerIdentifier || buyer.email || buyer.phone || "-")}
        ${ownerDetailItem("Nama", buyer.name || row.buyerName || "-")}
        ${ownerDetailItem("Email", buyer.email || "-")}
        ${ownerDetailItem("WhatsApp", buyer.phone || buyer.whatsapp || "-")}
      </div>
    `;
  };

  const renderStatusOrderDetail = (row = {}) => {
    if (!statusOrderDetail) return;
    const detail = row.detail || {};
    const buyer = detail.buyer || row.buyer || {};
    const commentsSource = Array.isArray(detail.customComments)
      ? detail.customComments
      : Array.isArray(row.customComments)
      ? row.customComments
      : [];
    const comments = commentsSource.filter((comment) => typeof comment === "string" && comment.trim().length);
    const commentList = comments.length
      ? `<ul class="comment-list">${comments.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>`
      : "";
    statusOrderTitle && (statusOrderTitle.textContent = row.id || "Detail Order");
    statusOrderDetail.innerHTML = `
      <div class="detail-group">
        <h5>Informasi Pesanan</h5>
        ${ownerDetailItem("Order ID", row.id || "-")}
        ${ownerDetailItem("ID Layanan", detail.serviceId || row.serviceId || "-")}
        ${ownerDetailItem("Nama Layanan", detail.serviceName || row.serviceName || "-")}
        ${ownerDetailItem("Target", detail.target || row.target || "-")}
        ${ownerDetailItem("Jumlah", detail.quantity || row.quantity || "-")}
        ${
          comments.length
            ? `${ownerDetailItem("Total Komentar", `${comments.length} teks`)}${commentList}`
            : ""
        }
      </div>
      <div class="detail-group">
        <h5>Status & Pembayaran</h5>
        ${ownerDetailItem("Status Sistem", formatTrackStatus(detail.status || row.status))}
        ${ownerDetailItem("Status Panel", detail.panelStatus || row.panelStatus || "-")}
        ${ownerDetailItem("ID Panel", detail.panelOrderId || row.panelOrderId || "-")}
        ${ownerDetailItem("Harga", formatStatusCurrency(detail.grossAmount || row.price || 0))}
        ${ownerDetailItem(
          "Metode",
          detail.paymentType || row.paymentType || (row.isReseller ? "Saldo Reseller" : "Midtrans")
        )}
        ${ownerDetailItem("Mulai Hitung", detail.startCount ?? row.startCount ?? "-")}
        ${ownerDetailItem("Sisa", detail.remains ?? row.remains ?? "-")}
        ${ownerDetailItem("Terakhir Sinkron", formatFullDateTime(row.lastStatusSync || row.createdAt))}
      </div>
      <div class="detail-group">
        <h5>Data Pemesan</h5>
        ${ownerDetailItem("Nama", buyer.name || buyer.displayName || row.buyerName || "-")}
        ${ownerDetailItem("Email", buyer.email || row.buyerEmail || "-")}
        ${ownerDetailItem("Nomor", buyer.phone || row.buyerPhone || "-")}
        ${ownerDetailItem("Dipesan", formatFullDateTime(row.createdAt))}
      </div>
    `;
  };

  const openStatusOrderModal = (row) => {
    if (!row) return;
    renderStatusOrderDetail(row);
    statusOrderModal?.classList.remove("hidden");
  };

  const closeStatusOrderModal = () => {
    statusOrderModal?.classList.add("hidden");
  };

  const toggleOwnerSettingsMenu = (force) => {
    if (!ownerSettingsMenu || !ownerSettingsToggle) return;
    const shouldOpen =
      typeof force === "boolean" ? force : !ownerSettingsMenu.classList.contains("open");
    ownerSettingsMenu.classList.toggle("open", shouldOpen);
    ownerSettingsToggle.classList.toggle("active", shouldOpen);
    ownerSettingsToggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  };

  const openOwnerOrderModal = (orderId) => {
    const row = ownerOrdersMap[orderId];
    if (!row) return;
    renderOwnerOrderDetail(row);
    ownerOrderModal?.classList.remove("hidden");
  };

  const closeOwnerOrderModal = () => {
    ownerOrderModal?.classList.add("hidden");
  };

  const renderOwnerResellers = (rows = []) => {
    if (!ownerResellerBody) return;
    ownerResellerMap = {};
    if (!rows.length) {
      ownerResellerBody.innerHTML = `<tr><td colspan="5">Belum ada data reseller.</td></tr>`;
      return;
    }
    ownerResellerBody.innerHTML = rows
      .map((row) => {
        const mapKey = row.id || row.identifier;
        ownerResellerMap[mapKey] = row;
        const status =
          row.blockedStatus === "temporary"
            ? { label: "Blokir Sementara", cls: "pending_payment" }
            : row.blockedStatus === "permanent"
            ? { label: "Diblokir Permanen", cls: "error" }
            : { label: "Aktif", cls: "success" };
        const safeName = escapeHtml(row.displayName || "-");
        const safeEmail = escapeHtml(row.email || "-");
        const safeIdentifier = escapeHtml(row.identifier || "");
        const safeKey = escapeHtml(mapKey || safeIdentifier);
        return `<tr>
          <td class="owner-reseller-user">
            <img src="${row.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(
              row.displayName || "R"
            )}&background=f3e8ff&color=7c3aed`}" alt="avatar" />
            ${safeName}
          </td>
          <td>${safeEmail}</td>
          <td>${formatStatusCurrency(row.balance || 0)}</td>
          <td><span class="status-pill ${status.cls}">${status.label}</span></td>
          <td><button class="owner-manage-btn" data-reseller="${safeKey}">Kelola</button></td>
        </tr>`;
      })
      .join("");
  };

  const loadOwnerResellers = async (term = "") => {
    if (!ownerResellerBody) return;
    ownerResellerBody.innerHTML = `<tr><td colspan="5">Memuat data reseller...</td></tr>`;
    try {
      const query = term ? `&q=${encodeURIComponent(term)}` : "";
      const data = await apiGet(`/api/owner?action=resellers${query}`);
      renderOwnerResellers(data.rows || []);
      updateOwnerResellerSummary(data.summary || {});
      return data;
    } catch (e) {
      ownerResellerBody.innerHTML = `<tr><td colspan="5">${escapeHtml(
        e.message || "Gagal memuat data."
      )}</td></tr>`;
      ownerResellerMap = {};
      throw e;
    }
  };

  const ownerRefreshButtons = [ownerOrdersRefreshBtn, ownerResellerRefreshBtn];

  const setOwnerRefreshLoading = (state) => {
    ownerRefreshButtons.forEach((btn) => {
      if (!btn) return;
      btn.disabled = state;
      btn.classList.toggle("loading", state);
    });
  };

  const refreshOwnerPanels = async () => {
    if (ownerRefreshPromise) return ownerRefreshPromise;
    setOwnerRefreshLoading(true);
    ownerRefreshPromise = (async () => {
      try {
        const results = await Promise.allSettled([
          loadOwnerOrders(),
          loadOwnerResellers(ownerResellerSearchTerm),
        ]);
        results.forEach((result, index) => {
          if (result.status === "rejected") {
            const label = index === 0 ? "orders" : "resellers";
            console.error(`Owner refresh ${label} gagal:`, result.reason);
          }
        });
      } finally {
        setOwnerRefreshLoading(false);
        ownerRefreshPromise = null;
      }
    })();
    return ownerRefreshPromise;
  };

  const requestOwnerRefresh = () => ensureOwnerAccess(() => refreshOwnerPanels());

  const deleteCurrentReseller = async () => {
    if (!ownerResellerEditing) return;
    showLoader("Menghapus akun...");
    try {
      await apiPost("/api/owner", {
        action: "resellers-delete",
        id: ownerResellerEditing.id,
        identifier: ownerResellerEditing.identifier,
      });
      closeOwnerResellerModal();
      await refreshOwnerPanels();
    } catch (err) {
      showToast(err.message || "Gagal menghapus akun reseller.", "error");
    } finally {
      hideLoader();
    }
  };

  const openOwnerPage = () => {
    ensureOwnerAccess(() => {
      switchPage("owner");
      fetchOwnerProfile();
      refreshOwnerPanels();
    });
  };

  const openOwnerResellerModal = (identifier) => {
    const data = ownerResellerMap[identifier];
    if (!data) return;
    ownerResellerEditing = data;
    ownerResellerLabel && (ownerResellerLabel.textContent = data.displayName || data.identifier);
    ownerResellerIdInput && (ownerResellerIdInput.value = data.id || "");
    ownerResellerIdentifierInput && (ownerResellerIdentifierInput.value = data.identifier || "");
    ownerResellerNameInput && (ownerResellerNameInput.value = data.displayName || "");
    ownerResellerEmailInput && (ownerResellerEmailInput.value = data.email || "");
    ownerResellerPhoneInput && (ownerResellerPhoneInput.value = data.phone || "");
    ownerResellerPasswordCurrentInput && (ownerResellerPasswordCurrentInput.value = data.passwordPreview || "");
    ownerResellerPasswordInput && (ownerResellerPasswordInput.value = "");
    ownerResellerBalanceAmount && (ownerResellerBalanceAmount.value = "");
    ownerResellerBalanceType && (ownerResellerBalanceType.value = "add");
    ownerResellerBlockSelect && (ownerResellerBlockSelect.value = data.blockedStatus || "none");
    ownerResellerModal?.classList.remove("hidden");
  };

  const closeOwnerResellerModal = () => {
    ownerResellerModal?.classList.add("hidden");
    ownerResellerForm?.reset();
    ownerResellerPasswordCurrentInput && (ownerResellerPasswordCurrentInput.value = "");
    ownerResellerEditing = null;
  };

  const resetTrackResult = () => {
    trackResult?.classList.add("hidden");
    trackSummary && (trackSummary.innerHTML = "");
    trackError?.classList.add("hidden");
    trackLoader?.classList.add("hidden");
  };

  const openTrackPage = () => {
    resetTrackResult();
    trackServiceInput && (trackServiceInput.value = "");
    switchPage("track");
  };

  function formatTrackStatus(status) {
    const map = {
      pending_payment: "Menunggu Pembayaran",
      processing: "Sedang Diproses",
      success: "Berhasil",
      complete: "Selesai",
      done: "Selesai",
      partial: "Partial",
      error: "Gagal",
      refund: "Dikembalikan",
    };
    const normalized = String(status || "").toLowerCase();
    return map[normalized] || status || "-";
  }

  const renderTrackResult = (payload = {}) => {
    if (!trackResult || !trackSummary) return;
    const order = payload.order || {};
    const panel = payload.panel || null;
    const panelId =
      payload.panelId ||
      payload.query?.serviceId ||
      order.panelOrderId ||
      order.serviceId ||
      order.id ||
      "-";
    const panelStatus = formatTrackStatus(panel?.status || order.panelStatus || order.status);
    const systemStatus = order.status ? formatTrackStatus(order.status) : null;
    const rows = [
      { label: "ID Layanan Panel", value: panelId || "-" },
    ];
    if (order.id) {
      rows.push({ label: "Order ID Sistem", value: order.id });
    }
    rows.push({ label: "Status Panel", value: panelStatus || "-" });
    if (systemStatus && systemStatus !== panelStatus) {
      rows.push({ label: "Status Sistem", value: systemStatus });
    }
    if (order.serviceName) rows.push({ label: "Layanan", value: order.serviceName });
    if (order.target) rows.push({ label: "Target", value: order.target });
    if (order.quantity != null) rows.push({ label: "Jumlah", value: order.quantity });
    if (order.createdAt) {
      rows.push({
        label: "Waktu Order",
        value: new Date(order.createdAt).toLocaleString("id-ID"),
      });
    }
    if (panel?.start_count != null) rows.push({ label: "Start Count", value: panel.start_count });
    if (panel?.remains != null) rows.push({ label: "Sisa (Remains)", value: panel.remains });
    if (panel?.charge != null) rows.push({ label: "Biaya Panel", value: formatStatusCurrency(panel.charge) });
    trackSummary.innerHTML = rows
      .map(
        (row) => `
        <li>
          <span>${row.label}</span>
          <strong>${row.value ?? "-"}</strong>
        </li>`
      )
      .join("");
    trackResult.classList.remove("hidden");
  };

  const renderStatusTable = (rows) => {
    if (!statusTableBody) return;
    if (!rows.length) {
      statusOrderMap = {};
      statusTableBody.innerHTML = `<tr><td colspan="8">Belum ada data order.</td></tr>`;
      return;
    }
    statusOrderMap = {};
    statusTableBody.innerHTML = rows
      .map((row, idx) => {
        const time = row.createdAt ? new Date(row.createdAt).toLocaleString("id-ID") : "-";
        const statusText = formatTrackStatus(row.status);
        const statusClass = statusToClass(row.status);
        const targetValue = row.target || "-";
        const hasPanel = Boolean(row.panelOrderId);
        const key = row.id || row.panelOrderId || `status-${idx}`;
        statusOrderMap[key] = row;
        const idText = row.id || "-";
        const serviceText = row.serviceId ? `#${row.serviceId}` : "-";
        const detailButton = `<button class="status-action-btn" data-status-detail="${escapeHtml(
          key
        )}" title="Detail order">&#128269;</button>`;
        const syncButton = hasPanel
          ? `<button class="status-action-btn" data-order="${escapeHtml(
              row.id || ""
            )}" title="Sinkron status">&#8635;</button>`
          : `<button class="status-action-btn" disabled title="Menunggu ID panel">&#9888;</button>`;
        return `<tr>
          <td>
            <div class="status-order-id">
              <strong>${escapeHtml(idText)}</strong>
              <span class="order-service-chip">${escapeHtml(serviceText)}</span>
            </div>
          </td>
          <td>${time}</td>
          <td>${escapeHtml(row.serviceName || "-")}</td>
          <td>
            <div class="status-target">
              <span>${escapeHtml(targetValue)}</span>
              ${
                targetValue && targetValue !== "-"
                  ? `<button class="status-action-btn" data-copy="${targetValue}" title="Salin target">&#128203;</button>`
                  : ""
              }
            </div>
          </td>
          <td>${row.quantity || "-"}</td>
          <td>${formatStatusCurrency(row.price || 0)}</td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(statusText)}</span></td>
          <td>
            <div class="status-actions">
              ${detailButton}
              ${syncButton}
            </div>
          </td>
        </tr>`;
      })
      .join("");
  };

  const renderStatusPagination = (total, current, limit) => {
    if (!statusPagination) return;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    let buttons = "";
    const btn = (label, page, active = false, disabled = false) =>
      `<button ${disabled ? "disabled" : ""} data-page="${page}" class="${active ? "active" : ""}">${label}</button>`;
    buttons += btn("&laquo;", Math.max(1, current - 1), false, current === 1);
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - current) <= 1) {
        buttons += btn(i, i, i === current);
      } else if (Math.abs(i - current) === 2) {
        buttons += "<span>...</span>";
      }
    }
    buttons += btn("&raquo;", Math.min(totalPages, current + 1), false, current === totalPages);
    statusPagination.innerHTML = buttons;
  };
  const updateMonitorCategoryOptions = () => {
    if (!monitorCategorySelect) return;
    const selectedPlatform = monitorState.platform || "all";
    if (!selectedPlatform || selectedPlatform === "all" || !monitorPlatformCategories.has(selectedPlatform)) {
      monitorCategorySelect.innerHTML = `<option value="all">Pilih platform dulu</option>`;
      monitorCategorySelect.disabled = true;
      monitorState.category = "all";
      return;
    }
    const categories = Array.from(monitorPlatformCategories.get(selectedPlatform) || []);
    const current = (monitorState.category || "all").toLowerCase();
    let hasMatch = current === "all";
    const optionList = categories.map((cat) => {
      const normalized = String(cat || "").toLowerCase();
      if (normalized === current) hasMatch = true;
      const selected = normalized === current ? " selected" : "";
      return `<option value="${escapeHtml(cat)}"${selected}>${escapeHtml(cat)}</option>`;
    });
    if (!hasMatch && current !== "all") {
      monitorState.category = "all";
    }
    const headerSelected = monitorState.category === "all" ? " selected" : "";
    monitorCategorySelect.innerHTML = `<option value="all"${headerSelected}>Semua Kategori</option>${optionList.join("")}`;
    monitorCategorySelect.disabled = false;
  };

  const rebuildMonitorFilters = () => {
    if (!monitorPlatformSelect) return;
    monitorPlatformLabels = new Map();
    monitorPlatformCategories = new Map();
    monitorData.forEach((row) => {
      const key = getPlatformKey(row);
      const label = getPlatformLabel(row);
      if (!monitorPlatformLabels.has(key)) {
        monitorPlatformLabels.set(key, label);
      }
      if (!monitorPlatformCategories.has(key)) {
        monitorPlatformCategories.set(key, new Set());
      }
      if (row.category) {
        monitorPlatformCategories.get(key).add(row.category);
      }
    });
    const current = monitorState.platform || "all";
    let options = `<option value="all">Semua Platform</option>`;
    monitorPlatformLabels.forEach((label, key) => {
      const selected = key === current ? " selected" : "";
      options += `<option value="${escapeHtml(key)}"${selected}>${escapeHtml(label)}</option>`;
    });
    monitorPlatformSelect.innerHTML = options;
    if (!monitorPlatformLabels.has(current)) {
      monitorState.platform = "all";
    }
    monitorPlatformSelect.value = monitorState.platform || "all";
    updateMonitorCategoryOptions();
  };

  const renderMonitorTable = () => {
    if (!monitorTableBody) return;
    const allRows = Array.isArray(monitorData) ? monitorData.slice() : [];
    let filtered = allRows;
    if (monitorState.status && monitorState.status !== "all") {
      filtered = filtered.filter(
        (item) => String(item.status || "").toLowerCase() === monitorState.status.toLowerCase()
      );
    }
    const normalizedPlatform = String(monitorState.platform || "all").toLowerCase();
    if (normalizedPlatform !== "all") {
      filtered = filtered.filter((item) => getPlatformKey(item) === normalizedPlatform);
    }
    const normalizedCategory = String(monitorState.category || "all").toLowerCase();
    if (normalizedCategory !== "all") {
      filtered = filtered.filter(
        (item) => String(item.category || "").toLowerCase() === normalizedCategory
      );
    }
    if (monitorState.search) {
      const term = monitorState.search.toLowerCase();
      filtered = filtered.filter((item) =>
        String(item.serviceId || "").toLowerCase().includes(term)
      );
    }
    const total = filtered.length;
    const start = (monitorState.page - 1) * monitorState.limit;
    const rowsPage = filtered.slice(start, start + monitorState.limit);
    monitorTotalText && (monitorTotalText.textContent = `Total: ${total}`);
    if (!rowsPage.length) {
      monitorTableBody.innerHTML = `<tr><td colspan="9">Belum ada data untuk filter ini.</td></tr>`;
      monitorPagination && (monitorPagination.innerHTML = "");
      return;
    }
    monitorTableBody.innerHTML = rowsPage
      .map((row) => {
        const time = row.createdAt ? new Date(row.createdAt).toLocaleString("id-ID") : "-";
        const statusText = formatTrackStatus(row.status);
        const statusClass = statusToClass(row.status);
        const modeLabel = String(row.type || "midtrans").toLowerCase() === "reseller" ? "Reseller" : "Publik";
        const modeClass = modeLabel === "Reseller" ? "reseller" : "public";
        const platformLabel = getPlatformLabel(row);
        const categoryLabel = row.category || "-";
        return `<tr>
          <td>${time}</td>
          <td>${escapeHtml(platformLabel)}</td>
          <td><span class="monitor-mode-pill ${modeClass}">${modeLabel}</span></td>
          <td>${escapeHtml(categoryLabel)}</td>
          <td>${escapeHtml(row.serviceId || "-")}</td>
          <td>${escapeHtml(row.serviceName || "-")}</td>
          <td>${row.quantity || "-"}</td>
          <td>${formatStatusCurrency(row.price || 0)}</td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(statusText)}</span></td>
        </tr>`;
      })
      .join("");
    renderMonitorPagination(total, monitorState.page, monitorState.limit);
  };

  const buildPriceCategories = () => {
    if (!priceCategorySelect) return;
    const categories = Array.from(
      new Set((priceServices || []).map((svc) => svc.category || "Tanpa Kategori"))
    ).sort((a, b) => a.localeCompare(b));
    priceCategorySelect.innerHTML = `<option value="all">Semua Kategori</option>`;
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      priceCategorySelect.appendChild(opt);
    });
  };

  const renderPriceTable = () => {
    if (!priceTableBody) return;
    if (!priceServices.length) {
      priceTableBody.innerHTML = `<tr><td colspan="8">Belum ada data layanan.</td></tr>`;
      priceTotalText && (priceTotalText.textContent = "Total: 0");
      if (pricePagination) pricePagination.innerHTML = "";
      return;
    }
    let filtered = priceServices.slice();
    if (priceState.category && priceState.category !== "all") {
      filtered = filtered.filter((svc) => (svc.category || "").toLowerCase() === priceState.category.toLowerCase());
    }
    if (priceState.search) {
      const term = priceState.search.toLowerCase();
      filtered = filtered.filter(
        (svc) =>
          String(svc.id || "").toLowerCase().includes(term) ||
          String(svc.name || "").toLowerCase().includes(term)
      );
    }
    const total = filtered.length;
    const start = (priceState.page - 1) * priceState.limit;
    const rows = filtered.slice(start, start + priceState.limit);
    priceTotalText && (priceTotalText.textContent = `Total: ${total}`);
    if (!rows.length) {
      priceTableBody.innerHTML = `<tr><td colspan="8">Tidak ada data untuk filter ini.</td></tr>`;
    } else {
      priceTableBody.innerHTML = rows
        .map((svc, idx) => {
          const priceValue =
            svc.publicPrice != null
              ? Number(svc.publicPrice)
              : svc.pricePer100
              ? Number(svc.pricePer100)
              : svc.rate
              ? Number(svc.rate) / 10
              : 0;
          return `<tr>
            <td>${start + idx + 1}</td>
            <td>${svc.id}</td>
            <td>${svc.category || "-"}</td>
            <td>${svc.name}</td>
            <td>${formatStatusCurrency(priceValue)}</td>
            <td>${svc.min || "-"}</td>
            <td>${svc.max || "-"}</td>
            <td>${svc.status || "Aktif"}</td>
          </tr>`;
        })
        .join("");
    }
    renderPricePagination(total);
  };

  const renderPricePagination = (total) => {
    if (!pricePagination) return;
    const totalPages = Math.max(1, Math.ceil(total / priceState.limit));
    let buttons = "";
    const btn = (label, page, active = false, disabled = false) =>
      `<button ${disabled ? "disabled" : ""} data-price-page="${page}" class="${active ? "active" : ""}">${label}</button>`;
    buttons += btn("&laquo;", Math.max(1, priceState.page - 1), false, priceState.page === 1);
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - priceState.page) <= 1) {
        buttons += btn(i, i, i === priceState.page);
      } else if (Math.abs(i - priceState.page) === 2) {
        buttons += "<span>...</span>";
      }
    }
    buttons += btn("&raquo;", Math.min(totalPages, priceState.page + 1), false, priceState.page === totalPages);
    pricePagination.innerHTML = buttons;
  };

  const renderMonitorPagination = (total, current, limit) => {
    if (!monitorPagination) return;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    let buttons = "";
    const btn = (label, page, active = false, disabled = false) =>
      `<button ${disabled ? "disabled" : ""} data-monitor-page="${page}" class="${active ? "active" : ""}">${label}</button>`;
    buttons += btn("&laquo;", Math.max(1, current - 1), false, current === 1);
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - current) <= 1) {
        buttons += btn(i, i, i === current);
      } else if (Math.abs(i - current) === 2) {
        buttons += "<span>...</span>";
      }
    }
    buttons += btn("&raquo;", Math.min(totalPages, current + 1), false, current === totalPages);
    monitorPagination.innerHTML = buttons;
  };

  const loadStatusOrders = async () => {
    if (!statusTableBody) return;
    try {
      statusTableBody.innerHTML = `<tr><td colspan="8">Memuat data...</td></tr>`;
      const params = new URLSearchParams({
        page: statusState.page,
        limit: statusState.limit,
        status: statusState.status,
        q: statusState.search,
      });
      const data = await apiGet(`/api/orders?${params.toString()}`);
      const rows = data.rows || [];
      renderStatusTable(rows);
      statusTotalText && (statusTotalText.textContent = `Total: ${Number(data.total || 0).toLocaleString("id-ID")}`);
      renderStatusPagination(Number(data.total || 0), statusState.page, statusState.limit);
    } catch (e) {
      statusTableBody.innerHTML = `<tr><td colspan="8">${e.message}</td></tr>`;
    }
  };

  const syncOrderStatus = async (orderId, triggerBtn) => {
    if (!orderId) return;
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.classList.add("loading");
    }
    try {
      await apiPost("/api/order-status", { orderId });
      showToast("Status pesanan diperbarui dari panel.");
      loadStatusOrders();
    } catch (e) {
      showToast(e.message || "Gagal mengambil status dari panel.", "error");
    } finally {
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.classList.remove("loading");
      }
    }
  };
  const loadMonitorOrders = async () => {
    if (!monitorTableBody) return;
    try {
      monitorTableBody.innerHTML = `<tr><td colspan="9">Memuat data...</td></tr>`;
      const params = new URLSearchParams({
        page: 1,
        limit: MONITOR_FETCH_LIMIT,
        scope: "all",
      });
      const data = await apiGet(`/api/orders?${params.toString()}`);
      monitorData = Array.isArray(data.rows) ? data.rows : [];
      monitorState = {
        ...monitorState,
        page: 1,
      };
      rebuildMonitorFilters();
      renderMonitorTable();
    } catch (e) {
      monitorTableBody.innerHTML = `<tr><td colspan="9">${e.message}</td></tr>`;
    }
  };

  const applyHistoryFilters = () => {
    const limit = Number(historyLimitSelect?.value || 10);
    historyState = {
      ...historyState,
      limit,
      status: historyStatusSelect?.value || "all",
      search: historySearchInput?.value.trim() || "",
      page: 1,
    };
    renderHistoryTable();
  };

  const renderHistoryTable = () => {
    if (!historyTableBody) return;
    if (!historyData.length) {
      historyTableBody.innerHTML = `<tr><td colspan="7">Belum ada data deposit.</td></tr>`;
      historyTotalText && (historyTotalText.textContent = "Total: 0");
      historyPagination && (historyPagination.innerHTML = "");
      return;
    }
    let filtered = historyData.slice();
    if (historyState.status && historyState.status !== "all") {
      filtered = filtered.filter(
        (item) =>
          String(item.status || "success").toLowerCase() === historyState.status.toLowerCase()
      );
    }
    if (historyState.search) {
      const term = historyState.search.toLowerCase();
      filtered = filtered.filter((item) =>
        String(item.orderId || "").toLowerCase().includes(term)
      );
    }
    const total = filtered.length;
    const start = (historyState.page - 1) * historyState.limit;
    const end = start + historyState.limit;
    const rows = filtered.slice(start, end);
    historyTotalText && (historyTotalText.textContent = `Total: ${total}`);

    if (!rows.length) {
      historyTableBody.innerHTML = `<tr><td colspan="7">Tidak ada data untuk filter ini.</td></tr>`;
    } else {
      historyTableBody.innerHTML = rows
        .map((row, idx) => {
          const time = row.time ? new Date(row.time).toLocaleString("id-ID") : "-";
          const statusClass = row.status || "success";
          return `<tr>
            <td>${start + idx + 1}</td>
            <td>${row.orderId || "-"}</td>
            <td>${time}</td>
            <td>${row.method || "-"}</td>
            <td>${formatStatusCurrency(row.amount || 0)}</td>
            <td><span class="status-pill ${statusClass}">${String(statusClass).replace("_", " ")}</span></td>
            <td><button class="status-action-btn" title="Detail">&#9776;</button></td>
          </tr>`;
        })
        .join("");
    }
    renderHistoryPagination(total);
  };

  const renderHistoryPagination = (total) => {
    if (!historyPagination) return;
    const totalPages = Math.max(1, Math.ceil(total / historyState.limit));
    let buttons = "";
    const btn = (label, page, active = false, disabled = false) =>
      `<button ${disabled ? "disabled" : ""} data-history-page="${page}" class="${active ? "active" : ""}">${label}</button>`;
    buttons += btn("&laquo;", Math.max(1, historyState.page - 1), false, historyState.page === 1);
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - historyState.page) <= 1) {
        buttons += btn(i, i, i === historyState.page);
      } else if (Math.abs(i - historyState.page) === 2) {
        buttons += "<span>...</span>";
      }
    }
    buttons += btn("&raquo;", Math.min(totalPages, historyState.page + 1), false, historyState.page === totalPages);
    historyPagination.innerHTML = buttons;
  };


  const reloadDepositHistory = async () => {
    if (!currentUser) return;
    try {
      const params = new URLSearchParams({ identifier: currentUser.identifier });
      const data = await apiGet(`/api/reseller?action=history&${params.toString()}`);
      historyData = Array.isArray(data.history) ? data.history.slice() : [];
      historyBalance && (historyBalance.textContent = `Saldo: Rp ${Number(data.balance || 0).toLocaleString("id-ID")}`);
      historyState.page = 1;
      renderHistoryTable();
    } catch (e) {
      historyData = [];
      if (historyTableBody) {
        historyTableBody.innerHTML = `<tr><td colspan="7">${e.message}</td></tr>`;
      }
    }
  };

  const forgotStep = loginModal?.querySelector(".login-step-forgot");
  const forgotUsernameInput = document.getElementById("forgot-username");
  const forgotIdentifierInput = document.getElementById("forgot-identifier");
  const forgotPasswordInput = document.getElementById("forgot-password");
  const forgotPasswordConfirmInput = document.getElementById("forgot-password-confirm");
  const forgotSubmitBtn = document.getElementById("forgot-submit");
  const forgotError = document.getElementById("forgot-error");
  const forgotLink = document.querySelector(".forgot-link a");

  const toggleButtons = Array.from(document.querySelectorAll(".toggle-pass"));
  let avatarData = "";
  const broadcastAccount = () => {
    window.currentAccount = currentUser ? { ...currentUser } : null;
    window.dispatchEvent(
      new CustomEvent("account:change", { detail: currentUser ? { ...currentUser } : null })
    );
  };

  let pendingIdentifier = "";
  let currentUser = null;
let authMode = "login"; // login, register
let statusState = {
  page: 1,
  limit: Number(statusLimitSelect?.value || 10),
  status: statusFilterSelect?.value || "all",
  search: "",
};
let statusOrderMap = {};
let monitorState = {
  page: 1,
  limit: Number(monitorLimitSelect?.value || 10),
  status: monitorStatusSelect?.value || "all",
  platform: monitorPlatformSelect?.value || "all",
  category: "all",
  search: "",
};
let monitorData = [];
let monitorPlatformLabels = new Map();
let monitorPlatformCategories = new Map();
let priceServices = [];
let priceState = {
  page: 1,
  limit: Number(priceLimitSelect?.value || 10),
  category: "all",
  search: "",
};
let ownerResellerRows = [];
let ownerResellerMap = {};
let ownerOrdersMap = {};
let ownerResellerSearchTerm = "";
let ownerResellerSearchTimer = null;
let ownerResellerEditing = null;
let ownerRefreshPromise = null;
let minDepositValue = 10000;
let minDepositLoaded = false;
let hiddenServices = new Set();
let hiddenServicesLoaded = false;
let ownerHideServiceData = null;
let hiddenServicesList = [];
const ownerHideStateClasses = ["is-loading", "is-success", "is-error"];
const setOwnerHideFeedbackState = (state = "idle", message = "") => {
  if (!ownerHideFeedback || !ownerHideFeedbackText) return;
  ownerHideFeedback.classList.remove("hidden", ...ownerHideStateClasses);
  if (!state || state === "idle") {
    ownerHideFeedbackText.textContent = "";
    ownerHideFeedback.classList.add("hidden");
    return;
  }
  ownerHideFeedback.classList.add(`is-${state}`);
  ownerHideFeedbackText.textContent = message || "";
};
const resetOwnerHideFeedbackState = () => setOwnerHideFeedbackState("idle");
let announcementData = { message: "", updatedAt: null };
let announcementLoaded = false;

  const isBlockedServiceClient = (svc = {}) => {
    const combined = `${svc.name || ""} ${svc.description || ""} ${svc.category || ""}`.toLowerCase();
    return BLOCKED_SERVICE_KEYWORDS.some((keyword) => combined.includes(keyword));
  };

  window.addEventListener("catalog:update", (event) => {
    const services = Array.isArray(event.detail?.services) ? event.detail.services : [];
    priceServices = services.filter((svc) => !isBlockedServiceClient(svc));
    buildPriceCategories();
    renderPriceTable();
  });
let historyData = [];
  let historyState = {
    page: 1,
    limit: Number(historyLimitSelect?.value || 10),
    status: historyStatusSelect?.value || "all",
    search: "",
  };

  statusFilterBtn?.addEventListener("click", () => {
    statusState = {
      ...statusState,
      page: 1,
      limit: Number(statusLimitSelect?.value || 10),
      status: statusFilterSelect?.value || "all",
      search: statusSearchInput?.value.trim() || "",
    };
    loadStatusOrders();
  });

  statusPagination?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-page]");
    if (!btn || btn.disabled) return;
    statusState.page = Number(btn.dataset.page) || 1;
    loadStatusOrders();
  });

  monitorFilterBtn?.addEventListener("click", () => {
    const selectedPlatform = monitorPlatformSelect?.value || "all";
    const selectedCategory =
      selectedPlatform === "all" ? "all" : monitorCategorySelect?.value || "all";
    monitorState = {
      ...monitorState,
      page: 1,
      limit: Number(monitorLimitSelect?.value || 10),
      status: monitorStatusSelect?.value || "all",
      platform: selectedPlatform,
      category: selectedCategory,
      search: monitorSearchInput?.value.trim() || "",
    };
    renderMonitorTable();
  });

  monitorPagination?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-monitor-page]");
    if (!btn || btn.disabled) return;
    monitorState.page = Number(btn.dataset.monitorPage) || 1;
    renderMonitorTable();
  });

  monitorPlatformSelect?.addEventListener("change", (e) => {
    monitorState.platform = e.target.value || "all";
    monitorState.category = "all";
    updateMonitorCategoryOptions();
  });

  monitorCategorySelect?.addEventListener("change", (e) => {
    monitorState.category = e.target.value || "all";
  });

  priceFilterBtn?.addEventListener("click", () => {
    priceState = {
      ...priceState,
      page: 1,
      limit: Number(priceLimitSelect?.value || 10),
      category: priceCategorySelect?.value || "all",
      search: priceSearchInput?.value.trim() || "",
    };
    renderPriceTable();
  });

  pricePagination?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-price-page]");
    if (!btn || btn.disabled) return;
    priceState.page = Number(btn.dataset.pricePage) || 1;
    renderPriceTable();
  });
  historyFilterBtn?.addEventListener("click", () => {
    historyState.limit = Number(historyLimitSelect?.value || 10);
    historyState.status = historyStatusSelect?.value || "all";
    historyState.search = historySearchInput?.value.trim() || "";
    historyState.page = 1;
    renderHistoryTable();
  });

  historyPagination?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-history-page]");
    if (!btn || btn.disabled) return;
    historyState.page = Number(btn.dataset.historyPage) || 1;
    renderHistoryTable();
  });


  const showStep = (step) => {
    identifierStep?.classList.add("hidden");
    passwordStep?.classList.add("hidden");
    registerStep?.classList.add("hidden");
    forgotStep?.classList.add("hidden");
    step?.classList.remove("hidden");
  };

  const openOverlay = (modal) => modal?.classList.remove("hidden");
  const closeOverlay = (modal) => modal?.classList.add("hidden");

  const showIdentifierStep = () => {
    showStep(identifierStep);
    loginError?.classList.add("hidden");
    loginError?.classList.remove("success");
    if (loginInput) loginInput.value = "";
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.classList.remove("ready");
    }
    resetForgotForm();
  };

  const showLoginPasswordStep = (mode) => {
    authMode = mode;
    showStep(passwordStep);
    passwordInput && (passwordInput.value = "");
    confirmPasswordInput && (confirmPasswordInput.value = "");
    passwordError?.classList.add("hidden");
    if (createAccountBtn) {
      createAccountBtn.disabled = true;
      createAccountBtn.classList.remove("ready");
      createAccountBtn.textContent = mode === "login" ? "Masuk" : "Buat & Masuk";
    }
    if (passwordLabel) {
      passwordLabel.textContent = mode === "login" ? "Masukkan Password" : "Buat Password";
    }
    if (passwordTitle) {
      passwordTitle.textContent = mode === "login" ? "Masuk ke Reseller Area" : "Aktifkan Akun";
    }
    passwordInput?.focus();
  };

  const showRegisterStep = () => {
    showStep(registerStep);
    registerError?.classList.add("hidden");
    registerIdentifierInput && (registerIdentifierInput.value = "");
    registerPasswordInput && (registerPasswordInput.value = "");
    registerConfirmInput && (registerConfirmInput.value = "");
    if (registerSubmitBtn) {
      registerSubmitBtn.disabled = true;
      registerSubmitBtn.classList.remove("ready");
    }
    registerIdentifierInput?.focus();
  };

  const validateForgotForm = () => {
    if (
      !forgotUsernameInput ||
      !forgotIdentifierInput ||
      !forgotPasswordInput ||
      !forgotPasswordConfirmInput ||
      !forgotSubmitBtn
    )
      return;
    const username = forgotUsernameInput.value.trim();
    const identifier = forgotIdentifierInput.value.trim();
    const pass = forgotPasswordInput.value.trim();
    const conf = forgotPasswordConfirmInput.value.trim();
    const ok = username && identifier && pass.length >= 6 && pass === conf;
    if (ok) {
      forgotSubmitBtn.disabled = false;
      forgotSubmitBtn.classList.add("ready");
    } else {
      forgotSubmitBtn.disabled = true;
      forgotSubmitBtn.classList.remove("ready");
    }
  };

  [forgotUsernameInput, forgotIdentifierInput, forgotPasswordInput, forgotPasswordConfirmInput].forEach((input) => {
    input?.addEventListener("input", validateForgotForm);
  });

  const closeLoginModal = () => {
    loginModal?.classList.add("hidden");
    showIdentifierStep();
  };

  const extractUsername = (identifier) => {
    if (!identifier) return "";
    if (identifier.includes("@")) return identifier.split("@")[0];
    return identifier;
  };

  const setLoggedIn = (user, persist = true) => {
    if (!user) return;
    currentUser = user;
    if (persist) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(user));
    if (balancePill) {
      balancePill.textContent = `Saldo: Rp ${Number(user.balance || 0).toLocaleString("id-ID")}`;
      balancePill.classList.remove("hidden");
    }
    if (coinPill) {
      coinPill.textContent = `Koin: ${Number(user.coins || 0).toLocaleString("id-ID")}`;
      coinPill.classList.remove("hidden");
    }
    openLogin?.classList.add("hidden");
    openRegister?.classList.add("hidden");
    menuState = "reseller";
    renderMenu();
    broadcastAccount();
    const username = user.displayName || extractUsername(user.identifier);
    brandTitle && (brandTitle.textContent = username || "PutriGmoyy");
    brandSubtitle && (brandSubtitle.textContent = "Akun Reseller");
    const avatarSrc =
      user.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(username || "PG")}&background=ac2acf&color=fff`;
    brandAvatarEl && (brandAvatarEl.src = avatarSrc);
    switchPage("default");
  };

  const setLoggedOut = () => {
    localStorage.removeItem(ACCOUNT_KEY);
    currentUser = null;
    balancePill?.classList.add("hidden");
    coinPill?.classList.add("hidden");
    openLogin?.classList.remove("hidden");
    openRegister?.classList.remove("hidden");
    menuState = "guest";
    renderMenu();
    broadcastAccount();
    brandTitle && (brandTitle.textContent = "PutriGmoyy");
    brandSubtitle && (brandSubtitle.textContent = "Store");
    brandAvatarEl && (brandAvatarEl.src = defaultAvatar);
    switchPage("default");
  };

  const syncCurrentAccount = async () => {
    if (!currentUser?.identifier) return;
    try {
      const params = new URLSearchParams({
        action: "profile",
        identifier: currentUser.identifier,
      });
      const data = await apiGet(`/api/reseller?${params.toString()}`, 2);
      if (data?.user) {
        setLoggedIn(data.user, true);
      }
    } catch (err) {
      console.warn("Gagal sinkron data reseller:", err);
    }
  };

  const loadAccount = () => {
    const saved = localStorage.getItem(ACCOUNT_KEY);
    if (!saved) return;
    try {
      const user = JSON.parse(saved);
      setLoggedIn(user, false);
      syncCurrentAccount();
    } catch (e) {
      console.warn("Gagal parse akun:", e);
      localStorage.removeItem(ACCOUNT_KEY);
    }
  };

  const handleLoginCheck = async () => {
    if (!loginInput || !nextBtn) return;
    const value = loginInput.value.trim();
    if (!value) return;
    try {
      loginError?.classList.add("hidden");
      loginError?.classList.remove("success");
      nextBtn.disabled = true;
      nextBtn.textContent = "Memeriksa...";
      const { exists } = await authPost("/api/reseller?action=check", { identifier: value });
      pendingIdentifier = value;
      if (exists) {
        showLoginPasswordStep("login");
      } else {
        const isEmail = value.includes("@");
        confirmTitle.textContent = isEmail ? "Email Belum Terdaftar" : "Nomor Ini Belum Terdaftar";
        confirmMessage.textContent = isEmail ? "Lanjut daftar dengan email ini" : "Lanjut daftar dengan nomor ini";
        confirmIdentifier.textContent = value;
        confirmModal?.classList.remove("hidden");
      }
    } catch (e) {
      loginError.textContent = e.message;
      loginError.classList.remove("hidden");
      loginError.classList.remove("success");
    } finally {
      nextBtn.textContent = "Selanjutnya";
      nextBtn.disabled = false;
    }
  };

  if (openLogin && loginModal) {
    openLogin.addEventListener("click", () => {
      loginModal.classList.remove("hidden");
      showIdentifierStep();
    });
  }

  if (openRegister && loginModal) {
    openRegister.addEventListener("click", () => {
      loginModal.classList.remove("hidden");
      showRegisterStep();
    });
  }

  if (goRegisterFromLogin) {
    goRegisterFromLogin.addEventListener("click", () => {
      showRegisterStep();
    });
  }

  if (closeLogin) {
    closeLogin.addEventListener("click", closeLoginModal);
    loginModal.addEventListener("click", (e) => {
      if (e.target === loginModal) closeLoginModal();
    });
  }

  if (loginInput && nextBtn) {
    loginInput.addEventListener("input", () => {
      if (loginInput.value.trim()) {
        nextBtn.disabled = false;
        nextBtn.classList.add("ready");
      } else {
        nextBtn.disabled = true;
        nextBtn.classList.remove("ready");
      }
    });
    nextBtn.addEventListener("click", handleLoginCheck);
  }

  if (confirmModal) {
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) confirmModal.classList.add("hidden");
    });
    confirmEdit?.addEventListener("click", () => {
      confirmModal.classList.add("hidden");
      showIdentifierStep();
      loginInput?.focus();
    });
    confirmRegister?.addEventListener("click", () => {
      confirmModal.classList.add("hidden");
      showLoginPasswordStep("register");
    });
  }

  document.addEventListener("click", (e) => {
    const detailBtn = e.target.closest(".status-action-btn[data-status-detail]");
    if (detailBtn) {
      const key = detailBtn.dataset.statusDetail;
      if (key && statusOrderMap[key]) {
        openStatusOrderModal(statusOrderMap[key]);
      }
      return;
    }
    const copyBtn = e.target.closest(".status-action-btn[data-copy]");
    if (copyBtn && navigator.clipboard) {
      navigator.clipboard.writeText(copyBtn.dataset.copy || "");
      showToast("Target disalin.");
      return;
    }
    const statusBtn = e.target.closest(".status-action-btn[data-order]");
    if (statusBtn) {
      const orderId = statusBtn.dataset.order;
      if (orderId) syncOrderStatus(orderId, statusBtn);
    }
  });

  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      showForgotStep();
    });
  }


  const handleOwnerPasswordSubmit = () => {
    const value = ownerPasswordInput?.value.trim();
    if (!value) {
      ownerPasswordError && (ownerPasswordError.textContent = "Password owner wajib diisi.");
      ownerPasswordError?.classList.remove("hidden");
      return;
    }
    if (value !== OWNER_PASSWORD) {
      ownerPasswordError && (ownerPasswordError.textContent = "Password owner salah.");
      ownerPasswordError?.classList.remove("hidden");
      return;
    }
    ownerToken = OWNER_PASSWORD;
    persistOwnerToken(OWNER_PASSWORD);
    ownerPasswordError?.classList.add("hidden");
    hideOwnerPasswordModal();
    const callback = ownerAccessCallback;
    ownerAccessCallback = null;
    callback?.();
  };

  ownerPasswordSubmit?.addEventListener("click", handleOwnerPasswordSubmit);
  ownerPasswordInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleOwnerPasswordSubmit();
    }
  });
  ownerPasswordClose?.addEventListener("click", () => hideOwnerPasswordModal(true));
  ownerPasswordModal?.addEventListener("click", (e) => {
    if (e.target === ownerPasswordModal) hideOwnerPasswordModal(true);
  });
  ownerResellerSearchInput?.addEventListener("input", (e) => {
    ownerResellerSearchTerm = e.target.value.trim();
    if (ownerResellerSearchTimer) clearTimeout(ownerResellerSearchTimer);
    ownerResellerSearchTimer = setTimeout(() => loadOwnerResellers(ownerResellerSearchTerm), 400);
  });
  ownerOrdersBody?.addEventListener("click", (e) => {
    const btn = e.target.closest(".owner-detail-btn[data-owner-order]");
    if (!btn) return;
    ensureOwnerAccess(() => openOwnerOrderModal(btn.dataset.ownerOrder));
  });

  ownerOrdersRefreshBtn?.addEventListener("click", requestOwnerRefresh);
  ownerResellerRefreshBtn?.addEventListener("click", requestOwnerRefresh);

  ownerResellerBody?.addEventListener("click", (e) => {
    const btn = e.target.closest(".owner-manage-btn[data-reseller]");
    if (!btn) return;
    ensureOwnerAccess(() => openOwnerResellerModal(btn.dataset.reseller));
  });
  ownerResellerClose?.addEventListener("click", closeOwnerResellerModal);
  ownerResellerCancelBtn?.addEventListener("click", closeOwnerResellerModal);
  ownerResellerModal?.addEventListener("click", (e) => {
    if (e.target === ownerResellerModal) closeOwnerResellerModal();
  });
  ownerResellerDeleteBtn?.addEventListener("click", () => {
    if (!ownerResellerEditing) return;
    ensureOwnerAccess(() => {
      const name = ownerResellerEditing.displayName || ownerResellerEditing.identifier;
      if (confirm(`Hapus akun ${name}?`)) deleteCurrentReseller();
    });
  });

  ownerOrderClose?.addEventListener("click", closeOwnerOrderModal);
  ownerOrderCloseBtn?.addEventListener("click", closeOwnerOrderModal);
  ownerOrderModal?.addEventListener("click", (e) => {
    if (e.target === ownerOrderModal) closeOwnerOrderModal();
  });
  statusOrderClose?.addEventListener("click", closeStatusOrderModal);
  statusOrderCloseBtn?.addEventListener("click", closeStatusOrderModal);
  statusOrderModal?.addEventListener("click", (e) => {
    if (e.target === statusOrderModal) closeStatusOrderModal();
  });
  ownerSettingsToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleOwnerSettingsMenu();
  });
  ownerSettingsMenu?.addEventListener("click", (e) => {
    e.stopPropagation();
    const item = e.target.closest(".owner-settings-item");
    if (!item) return;
    const setting = item.dataset.setting;
    if (setting === "min_deposit") {
      ensureOwnerAccess(() => {
        toggleOwnerSettingsMenu(false);
        openOwnerMinDepositModal();
      });
    } else if (setting === "hide_services") {
      ensureOwnerAccess(() => {
        toggleOwnerSettingsMenu(false);
        openOwnerHideServiceModal();
      });
    } else if (setting === "show_hidden") {
      ensureOwnerAccess(async () => {
        toggleOwnerSettingsMenu(false);
        await openOwnerHiddenListModal();
      });
    } else if (setting === "announcement") {
      ensureOwnerAccess(() => {
        toggleOwnerSettingsMenu(false);
        openOwnerAnnouncementModal();
      });
    }
  });
  document.addEventListener("click", (e) => {
    if (
      ownerSettingsMenu?.classList.contains("open") &&
      !ownerSettingsMenu.contains(e.target) &&
      !ownerSettingsToggle?.contains(e.target)
    ) {
      toggleOwnerSettingsMenu(false);
    }
  });
  ownerMinDepositClose?.addEventListener("click", closeOwnerMinDepositModal);
  ownerMinDepositCancel?.addEventListener("click", closeOwnerMinDepositModal);
  ownerMinDepositModal?.addEventListener("click", (e) => {
    if (e.target === ownerMinDepositModal) closeOwnerMinDepositModal();
  });
  ownerMinDepositSave?.addEventListener("click", async () => {
    if (!ownerMinDepositInput) return;
    const value = Number(ownerMinDepositInput.value || 0);
    if (!Number.isFinite(value) || value <= 0) {
      ownerMinDepositError.textContent = "Masukkan minimal deposit yang valid.";
      ownerMinDepositError.classList.remove("hidden");
      return;
    }
    try {
      ownerMinDepositError?.classList.add("hidden");
      await apiPost("/api/owner", {
        action: "settings",
        key: "min_deposit",
        mode: "set",
        value,
        password: ownerToken,
      });
      minDepositValue = Math.round(value);
      minDepositLoaded = true;
      updateDepositHint();
      closeOwnerMinDepositModal();
      showToast("Minimal deposit berhasil diperbarui.");
    } catch (err) {
      ownerMinDepositError.textContent = err.message || "Gagal menyimpan minimal deposit.";
      ownerMinDepositError.classList.remove("hidden");
    }
  });
  ownerHideServiceClose?.addEventListener("click", closeOwnerHideServiceModal);
  ownerHideServiceCancel?.addEventListener("click", closeOwnerHideServiceModal);
  ownerHideServiceModal?.addEventListener("click", (e) => {
    if (e.target === ownerHideServiceModal) closeOwnerHideServiceModal();
  });
  const handleServiceSearch = async () => {
    if (!ownerHideServiceInput) return;
    const id = ownerHideServiceInput.value.trim();
    if (!id) {
      ownerHideServiceError && (ownerHideServiceError.textContent = "Masukkan ID layanan terlebih dahulu.");
      ownerHideServiceError?.classList.remove("hidden");
      setOwnerHideFeedbackState("error", "ID layanan belum diisi.");
      return;
    }
    try {
      ownerHideServiceError?.classList.add("hidden");
      ownerHideServiceResult && (ownerHideServiceResult.textContent = "Mencari layanan...");
      setOwnerHideFeedbackState("loading", "Mencari layanan...");
      const res = await apiGet(`/api/service?id=${encodeURIComponent(id)}`);
      const svc = res.service;
      ownerHideServiceData = svc;
      await loadHiddenServices();
      const isHidden = hiddenServices.has(String(svc.id).toLowerCase());
      const statusText = isHidden ? "Status: Sedang disembunyikan" : "Status: Aktif & ditampilkan";
      ownerHideServiceResult &&
        (ownerHideServiceResult.innerHTML = `
        <strong>${escapeHtml(svc.name || "-")} (#${escapeHtml(svc.id || id)})</strong>
        <span>Kategori: ${escapeHtml(svc.category || "-")}</span>
        <span>Platform: ${escapeHtml(svc.platform || "-")}</span>
        <span>${statusText}</span>
      `);
      ownerHideServiceToggle.disabled = false;
      ownerHideServiceToggle.dataset.mode = isHidden ? "show" : "hide";
      ownerHideServiceToggle.textContent = isHidden ? "Tampilkan Layanan" : "Hide Layanan";
      setOwnerHideFeedbackState(
        "success",
        isHidden ? "Layanan ini sedang disembunyikan." : "Layanan aktif, siap disembunyikan."
      );
    } catch (err) {
      ownerHideServiceResult && (ownerHideServiceResult.textContent = err.message || "Layanan tidak ditemukan.");
      ownerHideServiceToggle.disabled = true;
      ownerHideServiceToggle.textContent = "Hide Layanan";
      ownerHideServiceToggle.dataset.mode = "hide";
      ownerHideServiceData = null;
      setOwnerHideFeedbackState("error", err.message || "Layanan tidak ditemukan.");
    }
  };
  ownerHideServiceSearchBtn?.addEventListener("click", handleServiceSearch);
  ownerHideServiceInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleServiceSearch();
    }
  });
  ownerHideServiceToggle?.addEventListener("click", async () => {
    if (!ownerHideServiceData) return;
    const mode = ownerHideServiceToggle.dataset.mode || "hide";
    const serviceId = ownerHideServiceData.id || ownerHideServiceInput?.value.trim();
    if (!serviceId) return;
    try {
      ownerHideServiceError?.classList.add("hidden");
      setOwnerHideFeedbackState(
        "loading",
        mode === "hide" ? "Menyembunyikan layanan..." : "Menampilkan layanan..."
      );
      await apiPost("/api/owner", {
        action: "settings",
        key: "hidden_services",
        mode: mode === "hide" ? "add" : "remove",
        value: serviceId,
        password: ownerToken,
      });
      await loadHiddenServices(true);
      const isHidden = hiddenServices.has(String(serviceId).toLowerCase());
      ownerHideServiceToggle.dataset.mode = isHidden ? "show" : "hide";
      ownerHideServiceToggle.textContent = isHidden ? "Tampilkan Layanan" : "Hide Layanan";
      ownerHideServiceResult &&
        (ownerHideServiceResult.innerHTML = `
        <strong>${escapeHtml(ownerHideServiceData.name || "-")} (#${escapeHtml(
        ownerHideServiceData.id || serviceId
      )})</strong>
        <span>Kategori: ${escapeHtml(ownerHideServiceData.category || "-")}</span>
        <span>Platform: ${escapeHtml(ownerHideServiceData.platform || "-")}</span>
        <span>${isHidden ? "Status: Sedang disembunyikan" : "Status: Aktif & ditampilkan"}</span>
      `);
      setOwnerHideFeedbackState(
        "success",
        isHidden ? "Layanan disembunyikan dari katalog." : "Layanan ditampilkan kembali."
      );
    } catch (err) {
      ownerHideServiceError && (ownerHideServiceError.textContent = err.message || "Gagal memperbarui status layanan.");
      ownerHideServiceError?.classList.remove("hidden");
      setOwnerHideFeedbackState("error", err.message || "Gagal memperbarui status layanan.");
    }
  });
  ownerHiddenListClose?.addEventListener("click", closeOwnerHiddenListModal);
  ownerHiddenListModal?.addEventListener("click", (e) => {
    if (e.target === ownerHiddenListModal) closeOwnerHiddenListModal();
  });
  ownerHiddenListRefresh?.addEventListener("click", async () => {
    await loadHiddenServices(true);
    renderHiddenList();
  });
  ownerHiddenListContainer?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-unhide-service]");
    if (!btn) return;
    const serviceId = btn.dataset.unhideService;
    if (!serviceId) return;
    try {
      showLoader("Menampilkan layanan...");
      await apiPost("/api/owner", {
        action: "settings",
        key: "hidden_services",
        mode: "remove",
        value: serviceId,
        password: ownerToken,
      });
      await loadHiddenServices(true);
      renderHiddenList();
      showToast(`Layanan #${serviceId} ditampilkan kembali.`);
    } catch (err) {
      showToast(err.message || "Gagal menampilkan layanan.", "error");
    } finally {
      hideLoader();
    }
  });
  ownerAnnouncementClose?.addEventListener("click", closeOwnerAnnouncementModal);
  ownerAnnouncementCancel?.addEventListener("click", closeOwnerAnnouncementModal);
  ownerAnnouncementModal?.addEventListener("click", (e) => {
    if (e.target === ownerAnnouncementModal) closeOwnerAnnouncementModal();
  });
  ownerAnnouncementSave?.addEventListener("click", async () => {
    if (!ownerAnnouncementInput) return;
    const message = ownerAnnouncementInput.value.trim();
    try {
      ownerAnnouncementError?.classList.add("hidden");
      showLoader("Menyimpan pengumuman...");
      await apiPost("/api/owner", {
        action: "settings",
        key: "announcement",
        mode: "set",
        value: message,
        password: ownerToken,
      });
      await loadAnnouncement(true);
      closeOwnerAnnouncementModal();
      showToast("Pengumuman disimpan.");
    } catch (err) {
      ownerAnnouncementError.textContent = err.message || "Gagal menyimpan pengumuman.";
      ownerAnnouncementError.classList.remove("hidden");
    } finally {
      hideLoader();
    }
  });
  announcementBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    await loadAnnouncement();
    announcementPanel?.classList.toggle("hidden");
  });
  announcementClose?.addEventListener("click", () => announcementPanel?.classList.add("hidden"));
  document.addEventListener("click", (e) => {
    if (
      announcementPanel &&
      !announcementPanel.classList.contains("hidden") &&
      !announcementPanel.contains(e.target) &&
      !announcementBtn?.contains(e.target)
    ) {
      announcementPanel.classList.add("hidden");
    }
  });
  ownerResellerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = ownerResellerIdInput?.value.trim();
    const identifier = ownerResellerIdentifierInput?.value.trim();
    if (!id && !identifier) return;
    const payload = {
      id: id || "",
      identifier,
      displayName: ownerResellerNameInput?.value.trim(),
      email: ownerResellerEmailInput?.value.trim(),
      phone: ownerResellerPhoneInput?.value.trim(),
      newPassword: ownerResellerPasswordInput?.value.trim(),
      blockedStatus: ownerResellerBlockSelect?.value || "none",
    };
    if (!payload.id) delete payload.id;
    if (!payload.identifier) delete payload.identifier;
    if (!payload.newPassword) delete payload.newPassword;
    const amount = Number(ownerResellerBalanceAmount?.value || 0);
    if (amount > 0) {
      payload.balanceDelta = ownerResellerBalanceType?.value === "sub" ? -amount : amount;
    }
    showLoader("Menyimpan perubahan reseller...");
    try {
      await apiPost("/api/owner", { action: "resellers", ...payload });
      closeOwnerResellerModal();
      await refreshOwnerPanels();
      showToast("Perubahan reseller disimpan.");
    } catch (err) {
      showToast(err.message || "Gagal menyimpan perubahan reseller.", "error");
    } finally {
      hideLoader();
    }
  });

  trackForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!trackServiceInput) return;
    const serviceId = trackServiceInput.value.trim();
    if (!serviceId) {
      trackError && (trackError.textContent = "Masukkan ID layanan panel terlebih dahulu.");
      trackError?.classList.remove("hidden");
      resetTrackResult();
      return;
    }
    trackError?.classList.add("hidden");
    trackLoader?.classList.remove("hidden");
    trackResult?.classList.add("hidden");
    try {
      const data = await apiPost("/api/order-track", { serviceId });
      renderTrackResult(data);
    } catch (err) {
      trackError && (trackError.textContent = err.message || "Layanan tidak ditemukan di panel.");
      trackError?.classList.remove("hidden");
      trackResult?.classList.add("hidden");
    } finally {
      trackLoader?.classList.add("hidden");
    }
  });

  const validatePasswords = () => {
    if (!passwordInput || !confirmPasswordInput || !createAccountBtn || !passwordError) return;
    const pass = passwordInput.value.trim();
    const confirmPass = confirmPasswordInput.value.trim();
    const validLength = pass.length >= 6;
    const match = pass === confirmPass && confirmPass.length > 0;
    if (!match && confirmPass.length) passwordError.classList.remove("hidden");
    else passwordError.classList.add("hidden");
    if (validLength && match) {
      createAccountBtn.disabled = false;
      createAccountBtn.classList.add("ready");
    } else {
      createAccountBtn.disabled = true;
      createAccountBtn.classList.remove("ready");
    }
  };

  [passwordInput, confirmPasswordInput].forEach((input) => {
    input?.addEventListener("input", validatePasswords);
  });

  const validateRegisterForm = () => {
    if (!registerIdentifierInput || !registerPasswordInput || !registerConfirmInput || !registerSubmitBtn) return;
    const id = registerIdentifierInput.value.trim();
    const pass = registerPasswordInput.value.trim();
    const conf = registerConfirmInput.value.trim();
    const ok = id && pass.length >= 6 && pass === conf;
    if (ok) {
      registerSubmitBtn.disabled = false;
      registerSubmitBtn.classList.add("ready");
    } else {
      registerSubmitBtn.disabled = true;
      registerSubmitBtn.classList.remove("ready");
    }
  };

  [registerIdentifierInput, registerPasswordInput, registerConfirmInput].forEach((input) => {
    input?.addEventListener("input", validateRegisterForm);
  });

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target || "");
      if (!target) return;
      target.type = target.type === "password" ? "text" : "password";
      btn.textContent = target.type === "password" ? "=���" : "=���";
    });
  });

  const finishLogin = (user) => {
    setLoggedIn(user);
    closeLoginModal();
    confirmModal?.classList.add("hidden");
  };

  forgotSubmitBtn?.addEventListener("click", async () => {
    if (!forgotUsernameInput || !forgotIdentifierInput || !forgotPasswordInput || !forgotSubmitBtn) return;
    const username = forgotUsernameInput.value.trim();
    const identifier = forgotIdentifierInput.value.trim();
    const password = forgotPasswordInput.value.trim();
    if (!username || !identifier || password.length < 6 || password !== forgotPasswordConfirmInput.value.trim()) {
      forgotError.textContent = "Periksa kembali input kamu.";
      forgotError.classList.remove("hidden");
      forgotError.classList.remove("success");
      return;
    }
    try {
      forgotError?.classList.add("hidden");
      forgotError?.classList.remove("success");
      forgotSubmitBtn.disabled = true;
      forgotSubmitBtn.textContent = "Mereset...";
      await authPost("/api/reseller?action=forgot-password", {
        username,
        identifier,
        newPassword: password,
      });
      showIdentifierStep();
      if (loginError) {
        loginError.textContent = "Password berhasil direset. Silakan login.";
        loginError.classList.remove("hidden");
        loginError.classList.add("success");
      }
    } catch (e) {
      forgotError.textContent = e.message;
      forgotError.classList.remove("hidden");
      forgotError.classList.remove("success");
    } finally {
      forgotSubmitBtn.disabled = false;
      forgotSubmitBtn.textContent = "Reset Password";
    }
  });

  const openProfileModal = () => {
    if (!currentUser) return;
    profileNameInput && (profileNameInput.value = currentUser.displayName || "");
    profileEmailInput && (profileEmailInput.value = currentUser.email || currentUser.identifier || "");
    profilePhoneInput && (profilePhoneInput.value = currentUser.phone || "");
    profilePasswordInput && (profilePasswordInput.value = "");
    profilePasswordConfirmInput && (profilePasswordConfirmInput.value = "");
    profileError?.classList.add("hidden");
    avatarData = currentUser.avatarUrl || "";
    if (profileAvatarPreview) {
      profileAvatarPreview.src = currentUser.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.displayName || "PG");
    }
    openOverlay(profileModal);
  };

  const openDepositModal = () => {
    ensureMinDeposit();
    if (depositAmountInput) {
      depositAmountInput.value = "";
      depositAmountInput.min = Math.max(1, minDepositValue);
    }
    depositError?.classList.add("hidden");
    openOverlay(depositModal);
  };

  const openHistoryModal = async () => {
    if (!currentUser) return;
    switchPage("history");
    try {
      const params = new URLSearchParams({ identifier: currentUser.identifier });
      const data = await apiGet(`/api/reseller?action=history&${params.toString()}`);
      historyData = Array.isArray(data.history) ? data.history.slice() : [];
      historyBalance && (historyBalance.textContent = `Saldo: Rp ${Number(data.balance || 0).toLocaleString("id-ID")}`);
      historyState.page = 1;
      renderHistoryTable();
    } catch (e) {
      historyData = [];
      if (historyTableBody) {
        historyTableBody.innerHTML = `<tr><td colspan="7">${e.message}</td></tr>`;
      }
    }
  };

  const showForgotStep = () => {
    showStep(forgotStep);
    resetForgotForm();
    forgotUsernameInput?.focus();
  };

  const resetForgotForm = () => {
    forgotUsernameInput && (forgotUsernameInput.value = "");
    forgotIdentifierInput && (forgotIdentifierInput.value = "");
    forgotPasswordInput && (forgotPasswordInput.value = "");
    forgotPasswordConfirmInput && (forgotPasswordConfirmInput.value = "");
    forgotError?.classList.add("hidden");
    forgotError?.classList.remove("success");
    if (forgotSubmitBtn) {
      forgotSubmitBtn.disabled = true;
      forgotSubmitBtn.classList.remove("ready");
    }
  };

  const openMonitorModal = () => {
    switchPage("monitor");
    loadMonitorOrders();
  };

  const openStatusPage = () => {
    switchPage("status");
    loadStatusOrders();
  };

  const openTargetPage = () => {
    switchPage("target");
  };

  const openGuidePage = () => {
    switchPage("guide");
  };

  const openPricesPage = () => {
    switchPage("prices");
    renderPriceTable();
  };

  const openRewardSection = async () => {
    if (!currentUser) return openLogin?.click();
    switchPage("reward");
    try {
      rewardError?.classList.add("hidden");
      const params = new URLSearchParams({ identifier: currentUser.identifier });
      const data = await apiGet(`/api/reseller?action=reward&${params.toString()}`);
      rewardCoins && (rewardCoins.textContent = Number(data.coins || 0).toLocaleString("id-ID"));
      rewardReferrals && (rewardReferrals.textContent = Number(data.referralCount || 0).toLocaleString("id-ID"));
      rewardCode && (rewardCode.textContent = data.referralCode || "-");
    } catch (e) {
      rewardError.textContent = e.message;
      rewardError.classList.remove("hidden");
    }
  };

  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 512;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal kompres gambar"));
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.75
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

  profileAvatarInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      avatarData = compressed;
      if (profileAvatarPreview) profileAvatarPreview.src = compressed;
    } catch (err) {
      console.error("Gagal kompres avatar", err);
      const reader = new FileReader();
      reader.onload = () => {
        avatarData = reader.result;
        if (profileAvatarPreview) profileAvatarPreview.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  });

  profileSaveBtn?.addEventListener("click", async () => {
    if (!currentUser) return;
    profileError?.classList.add("hidden");
    if (profilePasswordInput.value && profilePasswordInput.value !== profilePasswordConfirmInput.value) {
      profileError.textContent = "Password baru tidak cocok.";
      profileError.classList.remove("hidden");
      return;
    }
    try {
      showLoader("Menyimpan perubahan...");
      const payload = {
        identifier: currentUser.identifier,
        displayName: profileNameInput.value.trim(),
        email: profileEmailInput.value.trim(),
        phone: profilePhoneInput.value.trim(),
        avatarUrl: avatarData,
      };
      if (profilePasswordInput.value.trim()) {
        payload.newPassword = profilePasswordInput.value.trim();
      }
      const res = await authPost("/api/reseller?action=profile", payload);
      finishLogin(res.user);
      closeOverlay(profileModal);
    } catch (e) {
      profileError.textContent = e.message;
      profileError.classList.remove("hidden");
    } finally {
      hideLoader();
    }
  });

  profileCancelBtn?.addEventListener("click", () => {
    closeOverlay(profileModal);
  });
  closeProfile?.addEventListener("click", () => closeOverlay(profileModal));

  depositSubmit?.addEventListener("click", async () => {
    if (!currentUser) return;
    const amount = Number(depositAmountInput.value || 0);
    const minAllowed = await ensureMinDeposit(true);
    if (!amount || amount < minAllowed) {
      depositError.textContent = `Minimal deposit Rp ${Number(minAllowed).toLocaleString("id-ID")}`;
      depositError.classList.remove("hidden");
      return;
    }
    try {
      depositError.classList.add("hidden");
      depositSubmit.disabled = true;
      depositSubmit.textContent = "Memuat pembayaran...";
      showLoader("Memuat pembayaran...");
      const res = await apiPost("/api/reseller?action=create-deposit", {
        identifier: currentUser.identifier,
        amount,
      });
      try {
        localStorage.setItem(
          "PG_LAST_DEPOSIT",
          JSON.stringify({
            orderId: res.orderId,
            identifier: currentUser.identifier,
            amount,
            createdAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.warn("Gagal menyimpan info deposit:", err);
      }
      window.open(res.redirectUrl, "_blank");
      closeOverlay(depositModal);
    } catch (e) {
      depositError.textContent = e.message;
      depositError.classList.remove("hidden");
    } finally {
      hideLoader();
      depositSubmit.disabled = false;
      depositSubmit.textContent = "Lanjutkan Pembayaran";
    }
  });
  closeDeposit?.addEventListener("click", () => closeOverlay(depositModal));

  [profileModal, depositModal].forEach((modal) => {
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeOverlay(modal);
    });
  });

  const postReward = async (type, extra = {}) => {
    if (!currentUser) throw new Error("Login terlebih dahulu.");
    return apiPost("/api/reseller?action=reward-update", {
      identifier: currentUser.identifier,
      type,
      ...extra,
    });
  };

  rewardCopyBtn?.addEventListener("click", () => {
    if (!rewardCode) return;
    const code = rewardCode.textContent || "";
    navigator.clipboard?.writeText(code);
    rewardError.textContent = "Kode referral disalin.";
    rewardError.classList.remove("hidden");
    setTimeout(() => rewardError.classList.add("hidden"), 1500);
  });

  rewardInviteBtn?.addEventListener("click", async () => {
    try {
      rewardError.classList.add("hidden");
      const res = await postReward("referral");
      setLoggedIn(res.user, true);
      openRewardSection();
    } catch (e) {
      rewardError.textContent = e.message;
      rewardError.classList.remove("hidden");
    }
  });

  rewardGameBtn?.addEventListener("click", async () => {
    try {
      rewardError.classList.add("hidden");
      const res = await postReward("game");
      setLoggedIn(res.user, true);
      openRewardSection();
    } catch (e) {
      rewardError.textContent = e.message;
      rewardError.classList.remove("hidden");
    }
  });

  rewardRedeemBalance?.addEventListener("click", async () => {
    const coins = Math.floor(Number(rewardRedeemAmount?.value || 0));
    if (!coins || coins < 1000) {
      rewardError.textContent = "Minimal 1000 koin.";
      rewardError.classList.remove("hidden");
      return;
    }
    try {
      rewardError.classList.add("hidden");
      const res = await postReward("redeem_balance", { amount: coins });
      setLoggedIn(res.user, true);
      openRewardSection();
    } catch (e) {
      rewardError.textContent = e.message;
      rewardError.classList.remove("hidden");
    }
  });

  rewardRedeemDana?.addEventListener("click", async () => {
    const coins = Math.floor(Number(rewardRedeemAmount?.value || 0));
    if (!coins || coins < 1000) {
      rewardError.textContent = "Minimal 1000 koin.";
      rewardError.classList.remove("hidden");
      return;
    }
    try {
      rewardError.classList.add("hidden");
      const res = await postReward("redeem_dana", { amount: coins });
      setLoggedIn(res.user, true);
      rewardError.textContent = "Permintaan tukar DANA dikirim. Admin akan memprosesnya.";
      rewardError.classList.remove("hidden");
      openRewardSection();
    } catch (e) {
      rewardError.textContent = e.message;
      rewardError.classList.remove("hidden");
    }
  });

  if (createAccountBtn) {
    createAccountBtn.addEventListener("click", async () => {
      if (createAccountBtn.disabled) return;
      try {
        createAccountBtn.disabled = true;
        createAccountBtn.textContent = authMode === "login" ? "Masuk..." : "Mendaftarkan...";
        const payload = { identifier: pendingIdentifier, password: passwordInput.value.trim() };
        const res =
          authMode === "login"
            ? await authPost("/api/reseller?action=login", payload)
            : await authPost("/api/reseller?action=register", payload);
        finishLogin(res.user);
      } catch (e) {
        passwordError.textContent = e.message;
        passwordError.classList.remove("hidden");
      } finally {
        createAccountBtn.textContent = authMode === "login" ? "Masuk" : "Buat & Masuk";
        validatePasswords();
      }
    });
  }

  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener("click", async () => {
      if (registerSubmitBtn.disabled) return;
      const payload = {
        identifier: registerIdentifierInput.value.trim(),
        password: registerPasswordInput.value.trim(),
      };
      try {
        registerError.classList.add("hidden");
        registerSubmitBtn.disabled = true;
        registerSubmitBtn.textContent = "Mendaftarkan...";
        const res = await authPost("/api/reseller?action=register", payload);
        finishLogin(res.user);
      } catch (e) {
        registerError.textContent = e.message;
        registerError.classList.remove("hidden");
      } finally {
        registerSubmitBtn.textContent = "Daftar & Masuk";
        validateRegisterForm();
      }
    });
  }

  ensureMinDeposit();
  loadHiddenServices();
  loadAnnouncement();
  loadAccount();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSliderApp);
} else {
  initSliderApp();
}
})();
}












