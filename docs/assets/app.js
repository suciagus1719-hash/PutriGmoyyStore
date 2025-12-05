const API_BASE = window.API_BASE_URL;

// Elemen DOM
const platformList = document.getElementById("platform-list");
const categorySelect = document.getElementById("category-select");
const serviceSelect = document.getElementById("service-select");
const serviceDetail = document.getElementById("service-detail");
const serviceDesc = document.getElementById("service-description");
const servicePrice = document.getElementById("service-price");
const serviceMin = document.getElementById("service-min");
const serviceMax = document.getElementById("service-max");
const targetInput = document.getElementById("target-input");
const quantityInput = document.getElementById("quantity-input");
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

// 1. Load platform
async function loadPlatforms() {
  try {
    const data = await apiGet("/api/platforms");
    platformList.innerHTML = "";
    if (!data.platforms?.length) {
      platformList.innerHTML = `<p>Tidak ada platform ditemukan.</p>`;
      return;
    }
    data.platforms.forEach((p, index) => {
      const btn = document.createElement("button");
      btn.className = "platform-btn";
      btn.dataset.platformId = p.id;
      btn.textContent = p.name;
      btn.onclick = () => selectPlatform(p);
      platformList.appendChild(btn);
      if (index === 0) {
        selectPlatform(p);
      }
    });
  } catch (e) {
    errorMessage.textContent = e.message;
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
  try {
    const data = await apiGet(`/api/categories?platformId=${encodeURIComponent(platform.id)}`);
    categorySelect.innerHTML = `<option value="">Pilih kategori layanan</option>`;
    data.categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      categorySelect.appendChild(opt);
    });
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
  if (!id) return;
  try {
    const data = await apiGet(`/api/service?id=${encodeURIComponent(id)}`);
    selectedService = data.service;
    serviceDesc.textContent = data.service.description || "-";
    servicePrice.textContent = data.service.price_display || `${data.service.rate}/1000`;
    serviceMin.textContent = data.service.min || "-";
    serviceMax.textContent = data.service.max || "-";
    serviceDetail.classList.remove("hidden");
    if (data.service.min) quantityInput.min = data.service.min;
  } catch (e) {
    errorMessage.textContent = e.message;
  }
});

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
