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

const POPULAR_PLATFORM_ORDER = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "whatsapp",
  "telegram",
  "threads",
  "twitter",
  "x",
  "shopee",
  "spotify",
  "discord",
  "twitch",
  "soundcloud",
  "pinterest",
  "reddit",
  "quora",
  "mobileapp",
  "kwai",
  "linkedin",
  "likee",
  "googleplay",
  "dailymotion",
  "audiomack",
  "snackvideo",
  "other",
];

const PLATFORM_ORDER_LOOKUP = POPULAR_PLATFORM_ORDER.reduce((acc, id, idx) => {
  acc[id] = idx;
  return acc;
}, {});

// DOM
const platformList = document.getElementById("platform-list");
const categorySelect = document.getElementById("category-select");
const serviceSelect = document.getElementById("service-select");
const serviceDetail = document.getElementById("service-detail");
const servicePrice = document.getElementById("service-price");
const serviceMin = document.getElementById("service-min");
const serviceMax = document.getElementById("service-max");
const serviceDescriptionRow = document.getElementById("service-description-row");
const serviceNoteText = document.getElementById("service-note-text");
const targetInput = document.getElementById("target-input");
const quantityInput = document.getElementById("quantity-input");
const totalPriceInput = document.getElementById("total-price");
const orderEmailInput = document.getElementById("order-email");
const buyerName = document.getElementById("buyer-name") || { value: "" };
const buyerWhatsapp = document.getElementById("buyer-whatsapp") || { value: "" };
const buyerEmail = document.getElementById("buyer-email") || { value: "" };
const payButton = document.getElementById("pay-button");
const errorMessage = document.getElementById("error-message");
const resellerName = document.getElementById("reseller-name");
const resellerWhatsapp = document.getElementById("reseller-whatsapp");
const resellerEmail = document.getElementById("reseller-email");
const resellerUsername = document.getElementById("reseller-username");
  const resellerPassword = document.getElementById("reseller-password");
  const resellerButton = document.getElementById("reseller-button");
  const resellerMessage = document.getElementById("reseller-message");
  const platformLoader = document.getElementById("platform-loader");
  const paymentLoader = document.getElementById("payment-loader");
  const platformInfo = document.getElementById("platform-info");
  const platformInfoIcon = document.getElementById("platform-info-icon");
const platformInfoText = document.getElementById("platform-info-text");

let selectedPlatform = null;
let selectedCategory = null;
let selectedService = null;
let selectedPricePer100 = 0;
let catalogPlatforms = [];
let catalogServices = [];

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
  return { color: meta.color || "#6B7280", url };
}

function sortPlatforms(list = []) {
  return [...list].sort((a, b) => {
    const idxA = PLATFORM_ORDER_LOOKUP[(a.id || "").toLowerCase()];
    const idxB = PLATFORM_ORDER_LOOKUP[(b.id || "").toLowerCase()];
    const scoreA = typeof idxA === "number" ? idxA : Number.MAX_SAFE_INTEGER;
    const scoreB = typeof idxB === "number" ? idxB : Number.MAX_SAFE_INTEGER;
    if (scoreA !== scoreB) return scoreA - scoreB;
    return (a.name || "").localeCompare(b.name || "");
  });
}

async function loadCatalog() {
  showPlatformLoader();
  try {
    const data = await apiGet("/api/catalog");
    const sourcePlatforms = data.platforms?.length ? data.platforms : FALLBACK_PLATFORMS;
    catalogPlatforms = sortPlatforms(sourcePlatforms);
    catalogServices = data.services || [];
  } catch (e) {
    errorMessage.textContent = "Gagal memuat katalog, gunakan daftar default.";
    catalogPlatforms = sortPlatforms(FALLBACK_PLATFORMS);
    catalogServices = [];
    showPlatformLoader("Gagal memuat dari server, menampilkan data bawaan...");
  } finally {
    renderPlatformButtons();
    hidePlatformLoader();
  }
}

function renderPlatformButtons(list = catalogPlatforms) {
  platformList.innerHTML = "";
  if (!list.length) {
    platformList.innerHTML = `<p>Tidak ada platform.</p>`;
    hidePlatformLoader();
    return;
  }
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
    if (index === 0) selectPlatform(p);
  });
}

function clearActivePlatforms() {
  document.querySelectorAll(".platform-btn").forEach((b) => b.classList.remove("active"));
}

function getCategoriesForPlatform(platformId) {
  const set = new Set();
  catalogServices.forEach((svc) => {
    if ((svc.platformId || "other") === (platformId || "other")) {
      if (svc.category) set.add(svc.category);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function getServicesForCategory(platformId, categoryName) {
  return catalogServices
    .filter(
      (svc) =>
        (svc.platformId || "other") === (platformId || "other") && svc.category === categoryName
    )
    .sort((a, b) => (a.sortPrice || 0) - (b.sortPrice || 0));
}

function selectPlatform(platform) {
  selectedPlatform = platform;
  selectedCategory = null;
  selectedService = null;
  selectedPricePer100 = 0;
  updateTotalPrice();
  clearActivePlatforms();
  const buttons = document.querySelectorAll(".platform-btn");
  buttons.forEach((btn) => {
    if (btn.dataset.platformId === platform.id) btn.classList.add("active");
  });

  const categories = getCategoriesForPlatform(platform.id);
  categorySelect.innerHTML = `<option value="">${categories.length ? "Pilih kategori layanan" : "Kategori tidak tersedia"}</option>`;
  serviceSelect.innerHTML = `<option value="">Pilih kategori dulu.</option>`;
  serviceDetail.classList.add("hidden");
  if (serviceDescriptionRow) serviceDescriptionRow.classList.add("hidden");
  if (serviceNoteText) serviceNoteText.textContent = "";

  categories.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    categorySelect.appendChild(opt);
  });

  const icon = platformIcon(platform.id);
  platformInfo.classList.remove("hidden");
  platformInfoIcon.innerHTML = `<img src="${icon.url}" alt="${platform.name}" />`;
  platformInfoIcon.style.background = icon.color;
  platformInfoText.textContent = platform.name;
}

categorySelect.addEventListener("change", (e) => {
  selectedCategory = e.target.value || null;
  selectedService = null;
  selectedPricePer100 = 0;
  updateTotalPrice();
  serviceDetail.classList.add("hidden");
  if (serviceDescriptionRow) serviceDescriptionRow.classList.add("hidden");
  if (serviceNoteText) serviceNoteText.textContent = "";

  if (!selectedCategory) {
    serviceSelect.innerHTML = `<option value="">Pilih kategori dulu.</option>`;
    return;
  }

  const data = getServicesForCategory(selectedPlatform?.id, selectedCategory);
  if (!data.length) {
    serviceSelect.innerHTML = `<option value="">Layanan tidak tersedia.</option>`;
    return;
  }

  serviceSelect.innerHTML = `<option value="">Pilih layanan</option>`;
  data.forEach((svc) => {
    const opt = document.createElement("option");
    const priceLabel = svc.pricePer100 ? `Rp ${svc.pricePer100.toLocaleString("id-ID")}` : "Rp0";
    opt.value = svc.id;
    opt.textContent = `${svc.id} - ${svc.name} - ${priceLabel}`;
    serviceSelect.appendChild(opt);
  });
});

serviceSelect.addEventListener("change", (e) => {
  const id = e.target.value;
  selectedService = null;
  serviceDetail.classList.add("hidden");
  if (serviceDescriptionRow) serviceDescriptionRow.classList.add("hidden");
  if (serviceNoteText) serviceNoteText.textContent = "";
  selectedPricePer100 = 0;
  updateTotalPrice();
  if (!id) return;

  const svc = catalogServices.find((s) => String(s.id) === String(id));
  if (!svc) {
    errorMessage.textContent = "Layanan tidak ditemukan.";
    return;
  }
  selectedService = svc;
  const priceLabel = svc.pricePer100
    ? `Rp ${svc.pricePer100.toLocaleString("id-ID")}`
    : svc.rate
    ? `Rp ${svc.rate.toLocaleString("id-ID")} / 1000`
    : "-";
  servicePrice.textContent = priceLabel;
  serviceMin.textContent = svc.min || "-";
  serviceMax.textContent = svc.max || "-";
  serviceDetail.classList.remove("hidden");

  if (svc.description && serviceDescriptionRow && serviceNoteText) {
    serviceNoteText.textContent = svc.description;
    serviceDescriptionRow.classList.remove("hidden");
  } else if (serviceDescriptionRow) {
    serviceDescriptionRow.classList.add("hidden");
  }

  selectedPricePer100 = svc.pricePer100 || 0;
  updateTotalPrice();
  if (svc.min) quantityInput.min = svc.min;
});

function updateTotalPrice() {
  const qty = Number(quantityInput.value || 0);
  if (!selectedPricePer100 || !qty) {
  totalPriceInput.value = "Rp0";
    return;
  }
  const total = (selectedPricePer100 / 100) * qty;
  totalPriceInput.value = `Rp ${Math.round(total).toLocaleString("id-ID")}`;
}

quantityInput.addEventListener("input", updateTotalPrice);
quantityInput.addEventListener("change", updateTotalPrice);
function showPaymentLoader(message = "Menyiapkan pembayaran...") {
  if (!paymentLoader) return;
  paymentLoader.classList.remove("hidden");
  const msg = paymentLoader.querySelector("p");
  if (msg) msg.textContent = message;
}

function hidePaymentLoader() {
  if (paymentLoader) paymentLoader.classList.add("hidden");
}






const safeValue = (input) => (input ? input.value.trim() : "");

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
    showPaymentLoader();
  const payload = {
    platformId: selectedPlatform.id,
    categoryId: selectedCategory,
    serviceId: selectedService.id,
    target,
    quantity: qty,
    buyer: {
      name: safeValue(buyerName),
      whatsapp: safeValue(buyerWhatsapp),
      email: safeValue(orderEmailInput) || safeValue(buyerEmail) || "noemail@example.com",
    },
  };
    const res = await apiPost("/api/create-order", payload);
    if (!res.redirectUrl) throw new Error("redirectUrl tidak ditemukan.");
    window.location.href = res.redirectUrl;
  } catch (e) {
    errorMessage.textContent = e.message;
  } finally {
    payButton.disabled = false;
    payButton.textContent = "Lanjutkan Pembayaran";
    hidePaymentLoader();
  }
});

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

loadCatalog();

function showPlatformLoader(message = "Sedang memuat platform...") {
  if (!platformLoader) return;
  platformLoader.classList.remove("hidden");
  const msg = platformLoader.querySelector("p");
  if (msg) msg.textContent = message;
}

function hidePlatformLoader() {
  if (platformLoader) platformLoader.classList.add("hidden");
}





