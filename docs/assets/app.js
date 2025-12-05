const API_BASE = window.API_BASE_URL;

const PLATFORM_ICON_META = {
  instagram: { slug: "instagram", color: "#E1306C" },
  ig: { slug: "instagram", color: "#E1306C" },
  tiktok: { slug: "tiktok", color: "#000000" },
  youtube: { slug: "youtube", color: "#FF0000" },
  facebook: { slug: "facebook", color: "#1877F2" },
  telegram: { slug: "telegram", color: "#229ED9" },
  shopee: { slug: "shopee", color: "#F1582C" },
  threads: { slug: "threads", color: "#101010" },
  whatsapp: { slug: "whatsapp", color: "#25D366" },
  spotify: { slug: "spotify", color: "#1DB954" },
  discord: { slug: "discord", color: "#5865F2" },
  snackvideo: { logoUrl: "https://logo.clearbit.com/snackvideo.com", color: "#FFB400" },
  twitter: { slug: "twitter", color: "#1D9BF0" },
  x: { slug: "twitter", color: "#1D9BF0" },
  twitch: { slug: "twitch", color: "#9146FF" },
  soundcloud: { slug: "soundcloud", color: "#FF7700" },
  pinterest: { slug: "pinterest", color: "#E60023" },
  reddit: { slug: "reddit", color: "#FF4500" },
  quora: { slug: "quora", color: "#B92B27" },
  mobileapp: { slug: "googleplay", color: "#0F9D58" },
  kwai: { logoUrl: "https://logo.clearbit.com/kwai.com", color: "#FF6B00" },
  linkedin: { slug: "linkedin", color: "#0A66C2" },
  likee: { logoUrl: "https://logo.clearbit.com/likee.com", color: "#FF6E7F" },
  googleplay: { slug: "googleplay", color: "#0F9D58" },
  dailymotion: { slug: "dailymotion", color: "#0066DC" },
  audiomack: { slug: "audiomack", color: "#FF8F00" },
  other: { slug: "hashtag", color: "#6B7280" },
};

const FALLBACK_PLATFORMS = [
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "facebook", name: "Facebook" },
  { id: "telegram", name: "Telegram" },
  { id: "shopee", name: "Shopee" },
  { id: "threads", name: "Threads" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "spotify", name: "Spotify" },
  { id: "discord", name: "Discord" },
  { id: "snackvideo", name: "Snack Video" },
  { id: "twitter", name: "Twitter / X" },
  { id: "twitch", name: "Twitch" },
  { id: "soundcloud", name: "SoundCloud" },
  { id: "pinterest", name: "Pinterest" },
  { id: "reddit", name: "Reddit" },
  { id: "quora", name: "Quora" },
  { id: "mobileapp", name: "Mobile App Install" },
  { id: "kwai", name: "Kwai" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "likee", name: "Likee" },
  { id: "googleplay", name: "Google Play Review" },
  { id: "dailymotion", name: "Dailymotion" },
  { id: "audiomack", name: "Audiomack" },
];

// Elemen DOM
const platformList = document.getElementById("platform-list");
const categorySelect = document.getElementById("category-select");
const serviceSelect = document.getElementById("service-select");
const serviceDetail = document.getElementById("service-detail");
const servicePrice = document.getElementById("service-price");
const serviceMin = document.getElementById("service-min");
const serviceMax = document.getElementById("service-max");
const serviceNoteBox = document.getElementById("service-note-box");
const serviceNoteText = document.getElementById("service-note-text");
const targetInput = document.getElementById("target-input");
const quantityInput = document.getElementById("quantity-input");
const totalPriceText = document.getElementById("total-price");
const buyerName = document.getElementById("buyer-name");
const buyerWhatsapp = document.getElementById("buyer-whatsapp");
const buyerEmail = document.getElementById("buyer-email");
const payButton = document.getElementById("pay-button");
const errorMessage = document.getElementById("error-message");

// Reseller elements
const resellerName = document.getElementById("reseller-name");
const resellerWhatsapp = document.getElementById("reseller-whatsapp");
const resellerEmail = document.getElementById("reseller-email");
const resellerUsername = document.getElementById("reseller-username");
const resellerPassword = document.getElementById("reseller-password");
const resellerButton = document.getElementById("reseller-button");
const resellerMessage = document.getElementById("reseller-message");
const platformInfo = document.getElementById("platform-info");
const platformInfoIcon = document.getElementById("platform-info-icon");
const platformInfoText = document.getElementById("platform-info-text");

let selectedPlatform = null;
let selectedCategory = null;
let selectedService = null;

// Helper fetch
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error("Gagal komunikasi dengan server");
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Gagal komunikasi dengan server");
  return res.json();
}

function platformIcon(id) {
  const meta = PLATFORM_ICON_META[(id || "").toLowerCase()] || PLATFORM_ICON_META.other;
  const url =
    meta.logoUrl ||
    (meta.slug ? `https://cdn.simpleicons.org/${meta.slug}/ffffff` : "https://cdn.simpleicons.org/hashtag/ffffff");
  return {
    color: meta.color || "#6B7280",
    url,
  };
}

function renderPlatformButtons(list, { autoSelectFirst = true } = {}) {
  platformList.innerHTML = "";
  list.forEach((p, index) => {
    const btn = document.createElement("button");
    btn.className = "platform-btn";
    btn.type = "button";
    btn.dataset.platformId = p.id;

    const icon = platformIcon(p.id);
    btn.innerHTML = `
      <span class="logo" style="background:${icon.color}">
        <img src="${icon.url}" alt="${p.name}" loading="lazy" />
      </span>
      <span>${p.name}</span>
    `;
    btn.onclick = () => selectPlatform(p);
    platformList.appendChild(btn);
    if (index === 0 && autoSelectFirst) {
      selectPlatform(p);
    }
  });
}

// 1. Load platform
async function loadPlatforms() {
  // render fallback dulu supaya user langsung melihat pilihan
  if (!platformList.children.length) {
    renderPlatformButtons(FALLBACK_PLATFORMS, { autoSelectFirst: false });
  }
  try {
    const data = await apiGet("/api/platforms");
    const list = data.platforms?.length ? data.platforms : FALLBACK_PLATFORMS;
    renderPlatformButtons(list);
  } catch (e) {
    errorMessage.textContent = "Gagal memuat platform, gunakan daftar default.";
    renderPlatformButtons(FALLBACK_PLATFORMS, { autoSelectFirst: false });
  }
}

function clearActivePlatforms() {
  document.querySelectorAll(".platform-btn").forEach((b) => b.classList.remove("active"));
}

async function selectPlatform(platform) {
  selectedPlatform = platform;
  selectedCategory = null;
  selectedService = null;
  clearActivePlatforms();
  const buttons = Array.from(document.querySelectorAll(".platform-btn"));
  const btn = buttons.find((b) => b.dataset.platformId === platform.id);
  if (btn) btn.classList.add("active");

  categorySelect.innerHTML = `<option value="">Loading kategori...</option>`;
  serviceSelect.innerHTML = `<option value="">Pilih kategori dulu.</option>`;
  serviceDetail.classList.add("hidden");
  platformInfo.classList.add("hidden");
  try {
    const data = await apiGet(`/api/categories?platformId=${encodeURIComponent(platform.id)}`);
    categorySelect.innerHTML = `<option value="">Pilih kategori layanan</option>`;
    data.categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      categorySelect.appendChild(opt);
    });
    const icon = platformIcon(platform.id);
    platformInfo.classList.remove("hidden");
    platformInfoIcon.innerHTML = `<img src="${icon.url}" alt="${platform.name}" />`;
    platformInfoIcon.style.background = icon.color;
    platformInfoText.textContent = platform.name;
  } catch (e) {
    categorySelect.innerHTML = `<option value="">Gagal load kategori</option>`;
    errorMessage.textContent = e.message;
  }
}

// 2. Saat kategori berubah
categorySelect.addEventListener("change", async (e) => {
  const id = e.target.value;
  selectedCategory = id || null;
  selectedService = null;
  serviceSelect.innerHTML = `<option value="">Loading layanan...</option>`;
  serviceDetail.classList.add("hidden");
  if (!id) {
    serviceSelect.innerHTML = `<option value="">Pilih kategori dulu.</option>`;
    return;
  }
  try {
    const data = await apiGet(`/api/services?categoryId=${encodeURIComponent(id)}`);
    serviceSelect.innerHTML = `<option value="">Pilih layanan</option>`;
    data.services.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      serviceSelect.appendChild(opt);
    });
  } catch (e) {
    serviceSelect.innerHTML = `<option value="">Gagal load layanan</option>`;
    errorMessage.textContent = e.message;
  }
});

// 3. Saat layanan berubah
serviceSelect.addEventListener("change", async (e) => {
  const id = e.target.value;
  selectedService = null;
  serviceDetail.classList.add("hidden");
  serviceNoteBox.classList.add("hidden");
  serviceNoteText.textContent = "";
  selectedPricePer100 = 0;
  updateTotalPrice();
  if (!id) return;
  try {
    const data = await apiGet(`/api/service?id=${encodeURIComponent(id)}`);
    selectedService = data.service;
    const descText = data.service.description || "-";
    servicePrice.textContent = data.service.price_per_100 || data.service.price_display || `${data.service.rate || 0}/1000`;
    serviceMin.textContent = data.service.min || "-";
    serviceMax.textContent = data.service.max || "-";
    serviceDetail.classList.remove("hidden");
    if (descText && descText !== "-") {
      serviceNoteText.textContent = descText;
      serviceNoteBox.classList.remove("hidden");
    } else {
      serviceNoteText.textContent = "";
      serviceNoteBox.classList.add("hidden");
    }
    selectedPricePer100 = data.service.price_per_100_value || 0;
    updateTotalPrice();
    if (data.service.min) quantityInput.min = data.service.min;
  } catch (e) {
    errorMessage.textContent = e.message;
  }
});

function updateTotalPrice() {
  const qty = Number(quantityInput.value || 0);
  if (!selectedPricePer100 || !qty) {
    totalPriceText.textContent = "Rp0";
    return;
  }
  const total = (selectedPricePer100 / 100) * qty;
  totalPriceText.textContent = `Rp ${Math.round(total).toLocaleString("id-ID")}`;
}

quantityInput.addEventListener("input", updateTotalPrice);
quantityInput.addEventListener("change", updateTotalPrice);

// 4. Lanjutkan pembayaran
payButton.addEventListener("click", async () => {
  errorMessage.textContent = "";
  if (!selectedPlatform) return (errorMessage.textContent = "Pilih platform terlebih dahulu.");
  if (!selectedCategory) return (errorMessage.textContent = "Pilih kategori layanan.");
  if (!selectedService) return (errorMessage.textContent = "Pilih layanan.");

  const target = targetInput.value.trim();
  const qty = Number(quantityInput.value || 0);

  if (!target) return (errorMessage.textContent = "Target tidak boleh kosong.");
  if (!qty || qty <= 0) return (errorMessage.textContent = "Jumlah harus lebih dari 0.");

  try {
    payButton.disabled = true;
    payButton.textContent = "Membuat pesanan...";

    const payload = {
      platformId: selectedPlatform.id,
      categoryId: selectedCategory,
      serviceId: selectedService.id,
      target,
      quantity: qty,
      buyer: {
        name: buyerName.value.trim(),
        whatsapp: buyerWhatsapp.value.trim(),
        email: buyerEmail.value.trim(),
      },
    };

    const res = await apiPost("/api/create-order", payload);
    if (!res.redirectUrl) throw new Error("redirectUrl tidak ditemukan.");
    // Redirect ke payment page Midtrans Snap (akan menampilkan QR dinamis)
    window.location.href = res.redirectUrl;
  } catch (e) {
    errorMessage.textContent = e.message;
  } finally {
    payButton.disabled = false;
    payButton.textContent = "Lanjutkan Pembayaran";
  }
});

// 5. Daftar reseller
resellerButton.addEventListener("click", async () => {
  resellerMessage.textContent = "";
  const name = resellerName.value.trim();
  const wa = resellerWhatsapp.value.trim();
  const email = resellerEmail.value.trim();
  const username = resellerUsername.value.trim();
  const password = resellerPassword.value.trim();

  if (!name || !wa || !email || !username || !password) {
    resellerMessage.textContent = "Lengkapi semua data reseller.";
    return;
  }

  try {
    resellerButton.disabled = true;
    resellerButton.textContent = "Mengirim pendaftaran...";

    const res = await apiPost("/api/register-reseller", {
      name,
      whatsapp: wa,
      email,
      username,
      password,
    });

    if (res.success) {
      resellerMessage.textContent = "Pendaftaran reseller berhasil! Admin akan menghubungi kamu via WhatsApp.";
      resellerName.value = "";
      resellerWhatsapp.value = "";
      resellerEmail.value = "";
      resellerUsername.value = "";
      resellerPassword.value = "";
    } else {
      resellerMessage.textContent = res.error || "Gagal daftar reseller.";
    }
  } catch (e) {
    resellerMessage.textContent = e.message;
  } finally {
    resellerButton.disabled = false;
    resellerButton.textContent = "Daftar Reseller";
  }
});

loadPlatforms();
let selectedPricePer100 = 0;
