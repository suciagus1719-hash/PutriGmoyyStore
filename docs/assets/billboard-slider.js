(function () {
  const API_BASE = window.API_BASE_URL || "";
  const FALLBACK = [
    { url: "/img/billboard-01.jpg", alt: "Billboard 1" },
    { url: "/img/billboard-02.jpg", alt: "Billboard 2" },
    { url: "/img/billboard-03.jpg", alt: "Billboard 3" },
    { url: "/img/billboard-04.jpg", alt: "Billboard 4" },
  ];
  const AUTOPLAY_MS = 4000;

  let slider;
  let dotsWrap;
  let slides = [];
  let dots = [];
  let current = 0;
  let timer = null;

  const stopAuto = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  const setActive = (index) => {
    if (!slides.length) return;
    const total = slides.length;
    slides[current]?.classList.remove("active");
    dots[current]?.classList.remove("active");
    current = (index + total) % total;
    slides[current]?.classList.add("active");
    dots[current]?.classList.add("active");
  };

  const startAuto = () => {
    stopAuto();
    timer = setInterval(() => setActive(current + 1), AUTOPLAY_MS);
  };

  const attachInteractions = () => {
    dots.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        stopAuto();
        setActive(idx);
        startAuto();
      });
    });

    slider?.addEventListener("mouseenter", stopAuto);
    slider?.addEventListener("mouseleave", startAuto);

    let startX = 0;
    slider?.addEventListener(
      "touchstart",
      (evt) => {
        startX = evt.touches[0].clientX;
        stopAuto();
      },
      { passive: true }
    );

    slider?.addEventListener(
      "touchend",
      (evt) => {
        const delta = evt.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 40) {
          setActive(current + (delta < 0 ? 1 : -1));
        }
        startAuto();
      },
      { passive: true }
    );
  };

  const buildSlides = (images = []) => {
    slider.innerHTML = "";
    dotsWrap.innerHTML = "";

    images.forEach((img, idx) => {
      const article = document.createElement("article");
      article.className = `hero-slide hero-billboard${idx === 0 ? " active" : ""}`;
      article.innerHTML = `<img src="${img.url}" alt="${img.alt || `Billboard ${idx + 1}`}" class="hero-billboard-img" loading="lazy" />`;
      slider.appendChild(article);

      const dot = document.createElement("button");
      dot.className = `hero-dot${idx === 0 ? " active" : ""}`;
      dot.dataset.slide = idx;
      dot.setAttribute("aria-label", `Slide ${idx + 1}`);
      dotsWrap.appendChild(dot);
    });

    slides = Array.from(slider.querySelectorAll(".hero-slide"));
    dots = Array.from(dotsWrap.querySelectorAll(".hero-dot"));
    current = 0;
  };

  const fetchBillboards = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/billboards`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data.images) || !data.images.length) return FALLBACK;
      return data.images;
    } catch (err) {
      console.error("fetchBillboards error:", err);
      return FALLBACK;
    }
  };

  const init = async () => {
    slider = document.getElementById("hero-slider");
    dotsWrap = document.getElementById("hero-dots");
    if (!slider || !dotsWrap) return;

    const images = await fetchBillboards();
    buildSlides(images);
    attachInteractions();
    startAuto();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
