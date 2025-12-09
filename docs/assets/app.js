if (window.__PG_APP_INITED__) {
  console.warn("PG app script already loaded, skipping duplicate init.");
} else {
  window.__PG_APP_INITED__ = true;
(() => {
const API_BASE = window.API_BASE_URL || "";

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

const CATALOG_CACHE_KEY = "pg_catalog_cache_v1";
const SIMPLE_ICONS_VERSION = "11.0.0";
const PUBLIC_PROFIT_MARGIN = 0.4;
const RESELLER_MARGIN = 0.2;

function readCatalogCache() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Gagal membaca cache katalog:", e);
    return null;
  }
}

function writeCatalogCache(platforms = [], services = []) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({
        platforms,
        services,
        savedAt: Date.now(),
      })
    );
  } catch (e) {
    console.warn("Gagal menyimpan cache katalog:", e);
  }
}


function initOrderApp() {
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
const commentsInput = document.getElementById("comments-input");
const commentBlock = document.getElementById("comment-block");
const quantityHint = document.getElementById("quantity-hint");
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
  let platformLoader = document.getElementById("platform-loader");
  if (platformLoader) {
    platformLoader.remove();
    platformLoader = null;
  }
  const paymentLoader = document.getElementById("payment-loader");
  const platformInfo = document.getElementById("platform-info");
  const platformInfoIcon = document.getElementById("platform-info-icon");
const platformInfoText = document.getElementById("platform-info-text");
if (!platformList || !categorySelect || !serviceSelect) {
  console.warn("Elemen utama platform tidak ditemukan, melewati initOrderApp.");
  return;
}

const createInputStub = () => ({
  value: "",
  min: 0,
  readOnly: false,
  addEventListener() {},
  setAttribute() {},
  removeAttribute() {},
  focus() {},
});
const createButtonStub = () => ({
  disabled: false,
  textContent: "",
  addEventListener() {},
});
const createMessageStub = () => ({
  textContent: "",
  classList: { add() {}, remove() {} },
});

const BLOCKED_SERVICE_KEYWORDS = ["website traffic", "website social signal"];

const targetField = targetInput || createInputStub();
const quantityField = quantityInput || createInputStub();
const totalPriceField = totalPriceInput || createInputStub();
const orderEmailField = orderEmailInput || createInputStub();
const commentField = commentsInput || createInputStub();
const commentBlockEl = commentBlock || null;
const quantityHintEl = quantityHint || null;
const payButtonEl = payButton || createButtonStub();
const errorMessageEl = errorMessage || createMessageStub();

function notifyCatalogUpdate() {
  window.dispatchEvent(new CustomEvent("catalog:update", { detail: { services: catalogServices } }));
}

let selectedPlatform = null;
let selectedCategory = null;
let selectedService = null;
let selectedPricePer100 = 0;
let commentModeActive = false;
let catalogPlatforms = [];
let catalogServices = [];
let resellerAccount = window.currentAccount || null;

const isBlockedService = (svc = {}) => {
  const combined = `${svc.name || ""} ${svc.description || ""} ${svc.category || ""}`.toLowerCase();
  return BLOCKED_SERVICE_KEYWORDS.some((keyword) => combined.includes(keyword));
};

window.addEventListener("account:change", (e) => {
  resellerAccount = e.detail || null;
  refreshServicePricing();
});

const requestDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeRequestError = (err) => {
  if (!err || !err.message) return new Error("Permintaan gagal.");
  if (err.message.toLowerCase().includes("failed to fetch")) {
    return new Error("Tidak dapat terhubung ke server. Silakan coba lagi.");
  }
  return err;
};

async function requestJson(path, options = {}, attempts = 2) {
  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || "Gagal komunikasi dengan server.");
    }
    return data;
  } catch (error) {
    const normalized = normalizeRequestError(error);
    if (attempts <= 1) throw normalized;
    await requestDelay(400);
    return requestJson(path, options, attempts - 1);
  }
}

async function apiGet(path) {
  return requestJson(path, {}, 3);
}

async function apiPost(path, body, attempts = 1) {
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

function platformIcon(id) {
  const meta = PLATFORM_ICON_META[(id || "").toLowerCase()] || PLATFORM_ICON_META.other;
  if (meta.logoUrl) {
    return { color: meta.color || "#6B7280", url: meta.logoUrl };
  }
  const slug = (meta.slug || "hashtag").toLowerCase();
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_VERSION}/icons/${encodeURIComponent(
    slug
  )}.svg`;
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

function isResellerActive() {
  return Boolean(resellerAccount);
}

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function getBasePricePer100(service) {
  if (service.pricePer100) return Number(service.pricePer100);
  if (service.rate) return Number(service.rate) / 10;
  return 0;
}

const COMMENT_TERMS = ["comment", "comments", "komentar", "komen"];
const COMMENT_MODE_TERMS = ["custom", "costum", "kostum", "costume", "manual", "isi sendiri"];

function serviceRequiresCustomComments(service) {
  if (!service) return false;
  const text = `${service.name || ""} ${service.description || ""}`.toLowerCase();
  if (!COMMENT_TERMS.some((term) => text.includes(term))) return false;
  return COMMENT_MODE_TERMS.some((term) => text.includes(term));
}

function parseCustomComments(value = "") {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function syncCommentQuantity() {
  if (!commentModeActive) return;
  const comments = parseCustomComments(commentField.value);
  quantityField.value = comments.length ? String(comments.length) : "";
  updateTotalPrice();
}

function toggleCommentMode(enabled) {
  commentModeActive = Boolean(enabled);
  if (commentModeActive) {
    if (commentBlockEl) commentBlockEl.classList.remove("hidden");
    if (quantityHintEl) quantityHintEl.classList.remove("hidden");
    if (quantityField?.setAttribute) quantityField.setAttribute("readonly", "readonly");
    quantityField.readOnly = true;
    quantityField.placeholder = "Otomatis dari jumlah komentar";
    syncCommentQuantity();
  } else {
    if (commentBlockEl) commentBlockEl.classList.add("hidden");
    if (quantityHintEl) quantityHintEl.classList.add("hidden");
    commentField.value = "";
    if (quantityField?.removeAttribute) quantityField.removeAttribute("readonly");
    quantityField.readOnly = false;
    quantityField.placeholder = "Jumlah";
  }
}

async function loadCatalog() {
  showPlatformLoader();
  const cached = readCatalogCache();
  if (cached?.platforms?.length) {
    catalogPlatforms = sortPlatforms(cached.platforms);
    catalogServices = Array.isArray(cached.services)
      ? cached.services.filter((svc) => !isBlockedService(svc))
      : [];
  } else {
    catalogPlatforms = sortPlatforms(FALLBACK_PLATFORMS);
  }
  renderPlatformButtons();
  ensurePlatformSelection();
  notifyCatalogUpdate();
  try {
    const data = await apiGet("/api/catalog");
    const sourcePlatforms = data.platforms?.length ? data.platforms : FALLBACK_PLATFORMS;
    catalogPlatforms = sortPlatforms(sourcePlatforms);
    if (Array.isArray(data.services) && data.services.length) {
      catalogServices = data.services.filter((svc) => !isBlockedService(svc));
      writeCatalogCache(
        sourcePlatforms,
        catalogServices.map((svc) => ({ ...svc }))
      );
    } else if (!catalogServices.length) {
      catalogServices = [];
    }
  } catch (e) {
    console.error("Gagal memuat katalog:", e);
    if (!catalogServices.length) {
      errorMessageEl.textContent = "Gagal memuat katalog, gunakan daftar default.";
    }
  } finally {
    renderPlatformButtons();
    ensurePlatformSelection();
    notifyCatalogUpdate();
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
  const currentId = selectedPlatform?.id;
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
    if (currentId && currentId === p.id) {
      btn.classList.add("active");
    }
    platformList.appendChild(btn);
  });
}

function ensurePlatformSelection() {
  if (!catalogPlatforms.length) return;
  if (!selectedPlatform) {
    selectPlatform(catalogPlatforms[0]);
    return;
  }
  const match = catalogPlatforms.find((p) => p.id === selectedPlatform.id);
  if (match) {
    selectPlatform(match, { preserveSelection: true });
  } else {
    selectPlatform(catalogPlatforms[0]);
  }
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

function selectPlatform(platform, options = {}) {
  if (!platform) return;
  const preserve = Boolean(options.preserveSelection);
  const previousCategory = preserve ? selectedCategory : null;
  const previousServiceId =
    preserve && selectedService ? String(selectedService.id) : null;

  selectedPlatform = platform;
  if (!preserve) {
    selectedCategory = null;
    selectedService = null;
    selectedPricePer100 = 0;
    serviceDetail.classList.add("hidden");
    if (serviceDescriptionRow) serviceDescriptionRow.classList.add("hidden");
    if (serviceNoteText) serviceNoteText.textContent = "";
    updateTotalPrice();
  }
  clearActivePlatforms();
  document.querySelectorAll(".platform-btn").forEach((btn) => {
    if (btn.dataset.platformId === platform.id) btn.classList.add("active");
  });

  const categories = getCategoriesForPlatform(platform.id);
  categorySelect.innerHTML = `<option value="">${
    categories.length ? "Pilih kategori layanan" : "Kategori tidak tersedia"
  }</option>`;

  categories.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (previousCategory && previousCategory === name) {
      opt.selected = true;
    }
    categorySelect.appendChild(opt);
  });

  if (preserve && previousCategory && categories.includes(previousCategory)) {
    selectedCategory = previousCategory;
    buildServiceOptions(previousServiceId);
  } else {
    selectedCategory = null;
    selectedService = null;
    serviceSelect.innerHTML = `<option value="">Pilih kategori dulu.</option>`;
    serviceDetail.classList.add("hidden");
    if (serviceDescriptionRow) serviceDescriptionRow.classList.add("hidden");
    if (serviceNoteText) serviceNoteText.textContent = "";
    selectedPricePer100 = 0;
    updateTotalPrice();
  }

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

  buildServiceOptions();
});

function buildServiceOptions(preserveServiceId = null) {
  if (!selectedPlatform || !selectedCategory) {
    serviceSelect.innerHTML = `<option value="">Pilih kategori dulu.</option>`;
    return;
  }

  const data = getServicesForCategory(selectedPlatform.id, selectedCategory);
  if (!data.length) {
    serviceSelect.innerHTML = `<option value="">Layanan tidak tersedia.</option>`;
    return;
  }

  serviceSelect.innerHTML = `<option value="">Pilih layanan</option>`;
  let matchedId = null;
  data.forEach((svc) => {
    const opt = document.createElement("option");
    const basePrice = getBasePricePer100(svc);
    const margin = isResellerActive() ? RESELLER_MARGIN : PUBLIC_PROFIT_MARGIN;
    const displayPrice = basePrice * (1 + margin);
    const priceLabel = displayPrice ? formatCurrency(displayPrice) : "Rp0";
    opt.value = svc.id;
    opt.textContent = `${svc.id} - ${svc.name} - ${priceLabel}${isResellerActive() ? " (Reseller)" : ""}`;
    if (preserveServiceId && String(preserveServiceId) === String(svc.id)) {
      opt.selected = true;
      matchedId = svc.id;
    }
    serviceSelect.appendChild(opt);
  });
  if (matchedId) {
    serviceSelect.value = matchedId;
    applyServiceSelection(matchedId, { silent: true });
  } else {
    serviceSelect.value = "";
    applyServiceSelection("");
  }
}

function refreshServicePricing() {
  if (!selectedPlatform || !selectedCategory) return;
  const current = serviceSelect.value;
  buildServiceOptions(current);
  if (current) {
    applyServiceSelection(current, { silent: true });
  }
}

function applyServiceSelection(id, options = {}) {
  const silent = Boolean(options.silent);
  selectedService = null;
  serviceDetail.classList.add("hidden");
  if (serviceDescriptionRow) serviceDescriptionRow.classList.add("hidden");
  if (serviceNoteText) serviceNoteText.textContent = "";
  selectedPricePer100 = 0;
  updateTotalPrice();
  toggleCommentMode(false);
  if (!id) {
    quantityField.min = 0;
    if (quantityField?.removeAttribute) quantityField.removeAttribute("max");
    return;
  }

  const svc = catalogServices.find((s) => String(s.id) === String(id));
  if (!svc) {
    if (!silent) errorMessageEl.textContent = "Layanan tidak ditemukan.";
    return;
  }
  selectedService = svc;
  const basePrice = getBasePricePer100(svc);
  const margin = isResellerActive() ? RESELLER_MARGIN : PUBLIC_PROFIT_MARGIN;
  const displayPrice = basePrice ? basePrice * (1 + margin) : 0;
  const priceLabel = displayPrice ? formatCurrency(displayPrice) : "-";
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

  selectedPricePer100 = basePrice || 0;
  const requiresComments = serviceRequiresCustomComments(svc);
  toggleCommentMode(requiresComments);
  updateTotalPrice();
  quantityField.min = svc.min || 0;
  quantityField.max = svc.max || "";
  if (svc.max && quantityField?.setAttribute) {
    quantityField.setAttribute("max", svc.max);
  } else if (quantityField?.removeAttribute) {
    quantityField.removeAttribute("max");
  }
}

serviceSelect.addEventListener("change", (e) => {
  applyServiceSelection(e.target.value);
});

function updateTotalPrice() {
  const qty = Number(quantityField.value || 0);
  if (!selectedPricePer100 || !qty) {
    totalPriceField.value = "Rp0";
    return;
  }
  const baseTotal = (selectedPricePer100 / 100) * qty;
  const margin = isResellerActive() ? RESELLER_MARGIN : PUBLIC_PROFIT_MARGIN;
  const total = baseTotal * (1 + margin);
  totalPriceField.value = formatCurrency(Math.round(total));
}

quantityField.addEventListener("input", updateTotalPrice);
quantityField.addEventListener("change", updateTotalPrice);
commentField.addEventListener("input", () => {
  if (commentModeActive) syncCommentQuantity();
});
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

payButtonEl.addEventListener("click", async () => {
  errorMessageEl.textContent = "";
  if (!selectedPlatform) return (errorMessageEl.textContent = "Pilih platform terlebih dahulu.");
  if (!selectedCategory) return (errorMessageEl.textContent = "Pilih kategori layanan.");
  if (!selectedService) return (errorMessageEl.textContent = "Pilih layanan.");

  const target = targetField.value.trim();
  const commentLines = commentModeActive ? parseCustomComments(commentField.value) : [];
  const qty = commentModeActive ? commentLines.length : Number(quantityField.value || 0);

  if (!target) return (errorMessageEl.textContent = "Target tidak boleh kosong.");
  if (commentModeActive && !commentLines.length) {
    return (errorMessageEl.textContent = "Masukkan daftar komentar terlebih dahulu.");
  }
  if (!qty || qty <= 0) return (errorMessageEl.textContent = "Jumlah harus lebih dari 0.");
  const minQty = Number(selectedService?.min || 0);
  if (minQty && qty < minQty) {
    return (errorMessageEl.textContent = `Jumlah minimal untuk layanan ini adalah ${minQty}.`);
  }
  const maxQty = Number(selectedService?.max || 0);
  if (maxQty && qty > maxQty) {
    return (errorMessageEl.textContent = `Jumlah maksimal untuk layanan ini adalah ${maxQty}.`);
  }

  const useResellerBalance = isResellerActive();
  try {
    payButtonEl.disabled = true;
    payButtonEl.textContent = useResellerBalance ? "Memproses saldo..." : "Membuat pesanan...";

    showPaymentLoader();
    const payload = {
      platformId: selectedPlatform.id,
      categoryId: selectedCategory,
      serviceId: selectedService.id,
      target,
      quantity: qty,
      customComments: commentModeActive ? commentLines : undefined,
      useBalance: Boolean(resellerAccount),
      resellerIdentifier: resellerAccount?.identifier || null,
      buyer: {
        name: safeValue(buyerName),
        whatsapp: safeValue(buyerWhatsapp),
        email: safeValue(orderEmailField) || safeValue(buyerEmail) || "noemail@example.com",
      },
    };
    const res = await apiPost("/api/create-order", payload, 1);
    if (res.receiptUrl) {
      if (res.account) {
        window.dispatchEvent(new CustomEvent("account:change", { detail: res.account }));
      }
      window.location.href = res.receiptUrl;
      return;
    }
    if (!res.redirectUrl) throw new Error("redirectUrl tidak ditemukan.");
    window.location.href = res.redirectUrl;
  } catch (e) {
    errorMessageEl.textContent = e.message;
  } finally {
    payButtonEl.disabled = false;
    payButtonEl.textContent = "Lanjutkan Pembayaran";
    hidePaymentLoader();
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOrderApp);
} else {
  initOrderApp();
}
})();
}
