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

    const nextSlide = () => {
      const next = (current + 1) % slides.length;
      setActive(next);
    };

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
  const openLogin = document.getElementById("open-login");
  const closeLogin = document.getElementById("close-login");
  const loginModal = document.getElementById("login-modal");
  const loginInput = document.getElementById("login-identifier");
  const nextBtn = document.querySelector(".next-btn");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmTitle = document.getElementById("confirm-title");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmIdentifier = document.getElementById("confirm-identifier");
  const confirmEdit = document.getElementById("confirm-edit");
  const confirmRegister = document.getElementById("confirm-register");
  const identifierStep = document.querySelector(".login-step-identifier");
  const passwordStep = document.querySelector(".login-step-password");
  const passwordInput = document.getElementById("password-input");
  const confirmPasswordInput = document.getElementById("confirm-password-input");
  const passwordError = document.getElementById("password-error");
  const createAccountBtn = document.getElementById("create-account-btn");
  const balancePill = document.getElementById("balance-pill");
  const toggleButtons = Array.from(document.querySelectorAll(".toggle-pass"));
  let pendingIdentifier = "";

  if (menuBtn && navPanel) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navPanel.classList.toggle("open");
    });

    navPanel.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener("click", () => {
      navPanel.classList.remove("open");
    });
  }
  const showIdentifierStep = () => {
    identifierStep?.classList.remove("hidden");
    passwordStep?.classList.add("hidden");
    passwordInput && (passwordInput.value = "");
    confirmPasswordInput && (confirmPasswordInput.value = "");
    passwordError?.classList.add("hidden");
    if (createAccountBtn) {
      createAccountBtn.disabled = true;
      createAccountBtn.classList.remove("ready");
    }
  };

  const showPasswordStep = () => {
    identifierStep?.classList.add("hidden");
    passwordStep?.classList.remove("hidden");
    passwordInput?.focus();
  };

  if (openLogin && closeLogin && loginModal) {
    openLogin.addEventListener("click", () => {
      loginModal.classList.remove("hidden");
      showIdentifierStep();
      loginInput && (loginInput.value = "");
      nextBtn && (nextBtn.disabled = true, nextBtn.classList.remove("ready"));
    });
    const closeModal = () => {
      loginModal.classList.add("hidden");
      showIdentifierStep();
    };
    closeLogin.addEventListener("click", closeModal);
    loginModal.addEventListener("click", (e) => {
      if (e.target === loginModal) closeModal();
    });
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
      nextBtn.addEventListener("click", () => {
        if (nextBtn.disabled) return;
        if (!confirmModal) return;
        const value = loginInput.value.trim();
        const isEmail = value.includes("@");
        confirmTitle.textContent = isEmail ? "Email Belum Terdaftar" : "Nomor Ini Belum Terdaftar";
        confirmMessage.textContent = isEmail ? "Lanjut daftar dengan email ini" : "Lanjut daftar dengan nomor ini";
        confirmIdentifier.textContent = value;
        confirmModal.classList.remove("hidden");
        pendingIdentifier = value;
      });
    }
    if (confirmModal) {
      confirmModal.addEventListener("click", (e) => {
        if (e.target === confirmModal) confirmModal.classList.add("hidden");
      });
      if (confirmEdit) {
        confirmEdit.addEventListener("click", () => {
          confirmModal.classList.add("hidden");
          showIdentifierStep();
          loginInput?.focus();
        });
      }
      if (confirmRegister) {
        confirmRegister.addEventListener("click", () => {
          confirmModal.classList.add("hidden");
          loginModal.classList.remove("hidden");
          showPasswordStep();
        });
      }
    }
    const validatePasswords = () => {
      if (!passwordInput || !confirmPasswordInput || !createAccountBtn || !passwordError) return;
      const pass = passwordInput.value.trim();
      const confirmPass = confirmPasswordInput.value.trim();
      const validLength = pass.length >= 6;
      const match = pass === confirmPass && confirmPass.length > 0;
      if (!match && confirmPass.length) {
        passwordError.classList.remove("hidden");
      } else {
        passwordError.classList.add("hidden");
      }
      if (validLength && match) {
        createAccountBtn.disabled = false;
        createAccountBtn.classList.add("ready");
      } else {
        createAccountBtn.disabled = true;
        createAccountBtn.classList.remove("ready");
      }
    };

    if (passwordInput && confirmPasswordInput) {
      passwordInput.addEventListener("input", validatePasswords);
      confirmPasswordInput.addEventListener("input", validatePasswords);
    }

    toggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target || "");
        if (!target) return;
        target.type = target.type === "password" ? "text" : "password";
        btn.textContent = target.type === "password" ? "👁" : "🙈";
      });
    });

    if (createAccountBtn) {
      createAccountBtn.addEventListener("click", () => {
        if (createAccountBtn.disabled) return;
        loginModal.classList.add("hidden");
        confirmModal?.classList.add("hidden");
        showIdentifierStep();
        const amount = Math.floor(Math.random() * 400000) + 50000;
        if (balancePill) {
          balancePill.textContent = `Saldo: Rp ${amount.toLocaleString("id-ID")}`;
          balancePill.classList.remove("hidden");
        }
        if (openLogin) openLogin.textContent = pendingIdentifier.includes("@") ? "Email Terdaftar" : "Akun Terdaftar";
      });
    }
  }
});
