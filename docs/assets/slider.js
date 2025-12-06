document.addEventListener("DOMContentLoaded", () => {
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  if (!slides.length) return;

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
});
