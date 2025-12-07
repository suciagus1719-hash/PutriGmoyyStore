const ACCOUNT_KEY = "pg_account";
const API_BASE = window.API_BASE_URL || "";

function authPost(path, body) {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || "Permintaan gagal");
    }
    return data;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));

  if (slides.length) {
    let current = 0;
    let timer;

    const setActive = (index) => {
      slides[current]?.classList.remove("active");
      dots[current]?.classList.remove("active");
      current = index;
      slides[current]?.classList.add("active");
      dots[current]?.classList.add("active");
    };

    const nextSlide = () => setActive((current + 1) % slides.length);
    const startAuto = () => {
      stopAuto();
      timer = setInterval(nextSlide, 3000);
    };
    const stopAuto = () => {
      if (timer) clearInterval(timer);
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        stopAuto();
        setActive(index);
        startAuto();
      });
    });

    setActive(0);
    startAuto();
  }

  const menuBtn = document.getElementById("menu-toggle");
  const navPanel = document.getElementById("topbar-nav");
  const menuList = document.getElementById("menu-list");
  const defaultMenu = [
    { action: "login", icon: "◇", label: "Masuk Reseller" },
    { action: "register", icon: "✉", label: "Daftar Reseller" },
    { action: "prices", icon: "💰", label: "Daftar Harga" },
    { action: "contact", icon: "☎", label: "Kontak" },
    { action: "guide", icon: "📘", label: "Cara Order" },
    { action: "target", icon: "🎯", label: "Target Pesanan" },
    { action: "status", icon: "📈", label: "Status Order" },
  ];
  const resellerMenu = [
    { action: "profile", icon: "👤", label: "Profil Reseller" },
    { action: "deposit", icon: "💳", label: "Deposit Saldo" },
    { action: "history", icon: "🧾", label: "Riwayat Deposit" },
    { action: "monitor", icon: "📊", label: "Monitoring Sosmed" },
    { action: "logout", icon: "🚪", label: "Logout" },
  ];
  let menuState = "guest";
  const renderMenu = () => {
    if (!menuList) return;
    const data = menuState === "reseller" ? resellerMenu : defaultMenu;
    menuList.innerHTML = data
      .map(
        (item) => `
        <li>
          <button type="button" class="menu-item" data-action="${item.action}">
            <span class="icon">${item.icon}</span> ${item.label}
          </button>
        </li>`
      )
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
      if (action === "logout") return setLoggedOut();
      alert("Menu akan segera tersedia.");
    });
  }

  const openLogin = document.getElementById("open-login");
  const openRegister = document.getElementById("open-register");
  const goRegisterFromLogin = document.getElementById("go-register-from-login");
  const logoutBtn = document.getElementById("logout-btn");
  const accountSection = document.getElementById("account-section");
  const balancePill = document.getElementById("balance-pill");
  const accountPill = document.getElementById("account-pill");
  const brandTitle = document.getElementById("brand-title");
  const brandSubtitle = document.getElementById("brand-subtitle");

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

  const historySection = document.getElementById("history-section");
  const historyList = document.getElementById("history-list");
  const historyBalance = document.getElementById("history-balance");
  const monitorSection = document.getElementById("monitor-section");

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

  const showStep = (step) => {
    identifierStep?.classList.add("hidden");
    passwordStep?.classList.add("hidden");
    registerStep?.classList.add("hidden");
    step?.classList.remove("hidden");
  };

  const openOverlay = (modal) => modal?.classList.remove("hidden");
  const closeOverlay = (modal) => modal?.classList.add("hidden");

  const showIdentifierStep = () => {
    showStep(identifierStep);
    loginError?.classList.add("hidden");
    if (loginInput) loginInput.value = "";
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.classList.remove("ready");
    }
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
    if (accountPill) {
      accountPill.textContent = user.displayName || user.identifier;
      accountPill.classList.remove("hidden");
    }
    openLogin?.classList.add("hidden");
    openRegister?.classList.add("hidden");
    accountSection?.classList.remove("hidden");
    logoutBtn?.classList.remove("hidden");
    menuState = "reseller";
    renderMenu();
    broadcastAccount();
    const username = extractUsername(user.identifier);
    brandTitle && (brandTitle.textContent = username || "PutriGmoyy");
    brandSubtitle && (brandSubtitle.textContent = "Akun Reseller");
  };

  const setLoggedOut = () => {
    localStorage.removeItem(ACCOUNT_KEY);
    currentUser = null;
    balancePill?.classList.add("hidden");
    accountPill?.classList.add("hidden");
    openLogin?.classList.remove("hidden");
    openRegister?.classList.remove("hidden");
    accountSection?.classList.add("hidden");
    logoutBtn?.classList.add("hidden");
    menuState = "guest";
    renderMenu();
    broadcastAccount();
    brandTitle && (brandTitle.textContent = "PutriGmoyy");
    brandSubtitle && (brandSubtitle.textContent = "Store");
  };

  const loadAccount = () => {
    const saved = localStorage.getItem(ACCOUNT_KEY);
    if (!saved) return;
    try {
      const user = JSON.parse(saved);
      setLoggedIn(user, false);
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
      nextBtn.disabled = true;
      nextBtn.textContent = "Memeriksa...";
      const { exists } = await authPost("/api/auth-check", { identifier: value });
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
      btn.textContent = target.type === "password" ? "👁" : "🙈";
    });
  });

  const finishLogin = (user) => {
    setLoggedIn(user);
    closeLoginModal();
    confirmModal?.classList.add("hidden");
  };

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
    depositAmountInput && (depositAmountInput.value = "");
    depositError?.classList.add("hidden");
    openOverlay(depositModal);
  };

  const openHistoryModal = async () => {
    if (!currentUser) return;
    try {
      const params = new URLSearchParams({ identifier: currentUser.identifier });
      const data = await apiGet(`/api/deposit-history?${params.toString()}`);
      const history = data.history || [];
      historyBalance && (historyBalance.textContent = `Saldo: Rp ${Number(data.balance || 0).toLocaleString("id-ID")}`);
      historyList.innerHTML = history.length
        ? history
            .slice()
            .reverse()
            .map(
              (item) => `<li><span>Rp ${Number(item.amount || 0).toLocaleString("id-ID")}</span><span>${new Date(
                item.time
              ).toLocaleString("id-ID")}</span></li>`
            )
            .join("")
        : "<li><span>Belum ada riwayat.</span></li>";
    } catch (e) {
      historyList.innerHTML = `<li><span>${e.message}</span></li>`;
    }
    historySection?.classList.remove("hidden");
    historySection?.scrollIntoView({ behavior: "smooth" });
  };

  const openMonitorModal = () => {
    monitorSection?.classList.remove("hidden");
    monitorSection?.scrollIntoView({ behavior: "smooth" });
  };

  profileAvatarInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatarData = reader.result;
      if (profileAvatarPreview) profileAvatarPreview.src = reader.result;
    };
    reader.readAsDataURL(file);
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
      const res = await authPost("/api/profile", payload);
      finishLogin(res.user);
      closeOverlay(profileModal);
    } catch (e) {
      profileError.textContent = e.message;
      profileError.classList.remove("hidden");
    }
  });

  profileCancelBtn?.addEventListener("click", () => {
    closeOverlay(profileModal);
  });
  closeProfile?.addEventListener("click", () => closeOverlay(profileModal));

  depositSubmit?.addEventListener("click", async () => {
    if (!currentUser) return;
    const amount = Number(depositAmountInput.value || 0);
    if (!amount || amount < 10000) {
      depositError.textContent = "Minimal deposit Rp 10.000";
      depositError.classList.remove("hidden");
      return;
    }
    try {
      depositError.classList.add("hidden");
      depositSubmit.disabled = true;
      depositSubmit.textContent = "Membuka Midtrans...";
      const res = await apiPost("/api/create-deposit", {
        identifier: currentUser.identifier,
        amount,
      });
      window.open(res.redirectUrl, "_blank");
      closeOverlay(depositModal);
    } catch (e) {
      depositError.textContent = e.message;
      depositError.classList.remove("hidden");
    } finally {
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

  if (createAccountBtn) {
    createAccountBtn.addEventListener("click", async () => {
      if (createAccountBtn.disabled) return;
      try {
        createAccountBtn.disabled = true;
        createAccountBtn.textContent = authMode === "login" ? "Masuk..." : "Mendaftarkan...";
        const payload = { identifier: pendingIdentifier, password: passwordInput.value.trim() };
        const res =
          authMode === "login"
            ? await authPost("/api/auth-login", payload)
            : await authPost("/api/auth-register", payload);
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
        const res = await authPost("/api/auth-register", payload);
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

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      setLoggedOut();
    });
  }

  loadAccount();
});
