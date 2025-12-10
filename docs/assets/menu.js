(function () {
  const btn = document.getElementById("menu-toggle");
  const panel = document.getElementById("topbar-nav");
  if (!btn || !panel) return;
  const close = () => panel.classList.remove("open");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("open");
  });
  panel.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", close);
})();
