const { Pool } = require("pg");

const TABLE_NAME = process.env.SETTINGS_TABLE_NAME || "app_settings";
const CONNECTION_STRING =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

const DEFAULT_MIN_DEPOSIT = Number(process.env.DEFAULT_MIN_DEPOSIT || 10000);

const pool = CONNECTION_STRING
  ? new Pool({
      connectionString: CONNECTION_STRING,
      ssl: { rejectUnauthorized: false },
    })
  : null;

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

async function getHiddenServices() {
  const stored = await getSetting("hidden_services", []);
  if (!stored) return [];
  if (Array.isArray(stored)) return stored.map((item) => normalizeServiceId(item)).filter(Boolean);
  if (typeof stored === "string") return [normalizeServiceId(stored)].filter(Boolean);
  return [];
}

async function setHiddenServices(list = []) {
  const normalized = Array.from(
    new Set(
      (Array.isArray(list) ? list : [list])
        .map((item) => normalizeServiceId(item))
        .filter(Boolean)
    )
  );
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
