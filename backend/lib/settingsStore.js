const fetch = require("node-fetch");
const { put, head, BlobNotFoundError } = require("@vercel/blob");
const { getPool } = require("./dbPool");

const TABLE_NAME = process.env.SETTINGS_TABLE_NAME || "app_settings";
const DEFAULT_MIN_DEPOSIT = Number(process.env.DEFAULT_MIN_DEPOSIT || 10000);
const pool = getPool();
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
const HIDDEN_SERVICES_BLOB_PATH =
  process.env.HIDDEN_SERVICES_BLOB_PATH || "settings/hidden-services.json";
const HIDDEN_SERVICES_CACHE_MS = Number(process.env.HIDDEN_SERVICES_CACHE_MS || 15000);
const useBlobHiddenStore = Boolean(BLOB_TOKEN);

let hiddenServicesCache = null;
let hiddenServicesCacheAt = 0;

let tablePromise = null;

async function ensureTable() {
  if (!pool) throw new Error("Database settings belum siap");
  if (tablePromise) return tablePromise;
  tablePromise = (async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(query);
  })();
  return tablePromise;
}

async function getSetting(key, defaultValue = null) {
  await ensureTable();
  const { rows } = await pool.query(`SELECT value FROM ${TABLE_NAME} WHERE key = $1 LIMIT 1`, [key]);
  if (!rows.length) return defaultValue;
  return rows[0].value;
}

async function setSetting(key, value) {
  await ensureTable();
  const payload = JSON.stringify(value ?? null);
  await pool.query(
    `INSERT INTO ${TABLE_NAME} (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, payload]
  );
  return value;
}

function parseNumber(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "object" && value !== null) {
    if ("value" in value) return parseNumber(value.value, fallback);
    if ("number" in value) return parseNumber(value.number, fallback);
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function getMinimumDeposit() {
  const stored = await getSetting("min_deposit");
  const parsed = parseNumber(stored, DEFAULT_MIN_DEPOSIT);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MIN_DEPOSIT;
  return Math.round(parsed);
}

async function setMinimumDeposit(value) {
  let parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Nilai minimal deposit tidak valid.");
  }
  parsed = Math.round(parsed);
  await setSetting("min_deposit", parsed);
  return parsed;
}

function normalizeServiceId(id) {
  if (!id) return "";
  return String(id).trim();
}

function formatHiddenList(list = []) {
  return Array.from(
    new Set(
      (Array.isArray(list) ? list : [list])
        .map((item) => normalizeServiceId(item))
        .filter(Boolean)
    )
  );
}

async function readHiddenServicesFromBlob(force = false) {
  if (!useBlobHiddenStore) return null;
  const now = Date.now();
  if (!force && hiddenServicesCache && now - hiddenServicesCacheAt < HIDDEN_SERVICES_CACHE_MS) {
    return hiddenServicesCache;
  }
  try {
    const meta = await head(HIDDEN_SERVICES_BLOB_PATH, { token: BLOB_TOKEN });
    const response = await fetch(meta.downloadUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Gagal mengambil blob hidden services (${response.status})`);
    }
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : [];
    const list = Array.isArray(parsed?.list) ? parsed.list : Array.isArray(parsed) ? parsed : [];
    hiddenServicesCache = formatHiddenList(list);
    hiddenServicesCacheAt = now;
    return hiddenServicesCache;
  } catch (err) {
    if (err instanceof BlobNotFoundError) {
      hiddenServicesCache = [];
      hiddenServicesCacheAt = now;
      return hiddenServicesCache;
    }
    console.error("read hidden services blob error:", err);
    throw err;
  }
}

async function writeHiddenServicesToBlob(list = []) {
  if (!useBlobHiddenStore) return null;
  const normalized = formatHiddenList(list);
  const payload = JSON.stringify({
    list: normalized,
    updatedAt: new Date().toISOString(),
  });
  await put(HIDDEN_SERVICES_BLOB_PATH, payload, {
    token: BLOB_TOKEN,
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
  hiddenServicesCache = normalized;
  hiddenServicesCacheAt = Date.now();
  return normalized;
}

async function getHiddenServices(force = false) {
  if (useBlobHiddenStore) {
    try {
      return await readHiddenServicesFromBlob(force);
    } catch (err) {
      return [];
    }
  }
  const stored = await getSetting("hidden_services", []);
  if (!stored) return [];
  if (Array.isArray(stored)) return formatHiddenList(stored);
  if (typeof stored === "string") return formatHiddenList([stored]);
  return [];
}

async function setHiddenServices(list = []) {
  if (useBlobHiddenStore) {
    const saved = await writeHiddenServicesToBlob(list);
    if (saved) return saved;
  }
  const normalized = formatHiddenList(list);
  await setSetting("hidden_services", normalized);
  return normalized;
}

async function addHiddenService(id) {
  const normalized = normalizeServiceId(id);
  if (!normalized) throw new Error("ID layanan wajib diisi.");
  const list = await getHiddenServices();
  if (!list.includes(normalized)) {
    list.push(normalized);
    await setHiddenServices(list);
  }
  return list;
}

async function removeHiddenService(id) {
  const normalized = normalizeServiceId(id);
  if (!normalized) throw new Error("ID layanan wajib diisi.");
  const list = await getHiddenServices();
  const filtered = list.filter((item) => item !== normalized);
  await setHiddenServices(filtered);
  return filtered;
}

async function getAnnouncement() {
  const stored = await getSetting("announcement", null);
  if (!stored) return { message: "", updatedAt: null };
  if (typeof stored === "string") return { message: stored, updatedAt: null };
  if (typeof stored === "object" && stored !== null) {
    return {
      message: stored.message || "",
      updatedAt: stored.updatedAt || null,
    };
  }
  return { message: "", updatedAt: null };
}

async function setAnnouncement(message = "") {
  const payload = {
    message: String(message || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  await setSetting("announcement", payload);
  return payload;
}

module.exports = {
  getSetting,
  setSetting,
  getMinimumDeposit,
  setMinimumDeposit,
  DEFAULT_MIN_DEPOSIT,
  getHiddenServices,
  setHiddenServices,
  addHiddenService,
  removeHiddenService,
  getAnnouncement,
  setAnnouncement,
};
