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
  if (openLogin && closeLogin && loginModal) {
    openLogin.addEventListener("click", () => {
      loginModal.classList.remove("hidden");
    });
    const closeModal = () => loginModal.classList.add("hidden");
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
      });
    }
    if (confirmModal) {
      confirmModal.addEventListener("click", (e) => {
        if (e.target === confirmModal) confirmModal.classList.add("hidden");
      });
      if (confirmEdit) {
        confirmEdit.addEventListener("click", () => {
          confirmModal.classList.add("hidden");
          loginInput?.focus();
        });
      }
      if (confirmRegister) {
        confirmRegister.addEventListener("click", () => {
          confirmModal.classList.add("hidden");
          loginModal.classList.add("hidden");
          document.getElementById("reseller-name")?.scrollIntoView({ behavior: "smooth" });
        });
      }
    }
  }
});
