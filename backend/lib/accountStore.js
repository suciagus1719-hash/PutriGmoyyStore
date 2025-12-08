const { randomUUID } = require("crypto");
const { Pool } = require("pg");
const deasync = require("deasync");

const TABLE_NAME = process.env.ACCOUNT_TABLE_NAME || "resellers";
const CONNECTION_STRING =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  console.warn(
    "[accountStore] POSTGRES_URL_NON_POOLING / POSTGRES_URL belum diset. Data reseller akan hilang ketika instance restart."
  );
}

const pool = CONNECTION_STRING
  ? new Pool({
      connectionString: CONNECTION_STRING,
      max: 3,
      ssl:
        CONNECTION_STRING.includes("sslmode=require") || CONNECTION_STRING.includes("supabase.com")
          ? { rejectUnauthorized: false }
          : undefined,
    })
  : null;

let tableReady = false;

function syncAwait(promise) {
  if (!promise || typeof promise.then !== "function") return promise;
  let done = false;
  let result;
  let error;
  promise
    .then((res) => {
      result = res;
      done = true;
    })
    .catch((err) => {
      error = err;
      done = true;
    });
  deasync.loopWhile(() => !done);
  if (error) throw error;
  return result;
}

async function ensureTableAsync() {
  if (!pool || tableReady) return;
  const query = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      normalized TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      balance NUMERIC DEFAULT 0,
      coins NUMERIC DEFAULT 0,
      referral_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      display_name TEXT,
      email TEXT,
      phone TEXT,
      avatar_url TEXT,
      deposit_history JSONB DEFAULT '[]'::jsonb,
      referral_code TEXT,
      blocked_status TEXT DEFAULT 'none'
    );
    CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_identifier ON ${TABLE_NAME} (identifier);
    CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_normalized ON ${TABLE_NAME} (normalized);
  `;
  await pool.query(query);
  tableReady = true;
}

function ensureTable() {
  if (!pool) return;
  if (tableReady) return;
  syncAwait(ensureTableAsync());
}

function normalizeIdentifier(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return trimmed.replace(/\D+/g, "");
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    identifier: row.identifier,
    normalized: row.normalized,
    password: row.password,
    balance: Number(row.balance || 0),
    coins: Number(row.coins || 0),
    referralCount: Number(row.referral_count || 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    displayName: row.display_name || "",
    email: row.email || "",
    phone: row.phone || "",
    avatarUrl: row.avatar_url || "",
    depositHistory: Array.isArray(row.deposit_history) ? row.deposit_history : [],
    referralCode: row.referral_code || null,
    blockedStatus: row.blocked_status || "none",
  };
}

function normalizeRowForInsert(user) {
  if (!user.id) user.id = randomUUID();
  user.normalized = normalizeIdentifier(user.identifier || user.email || user.phone || user.id);
  return {
    id: user.id,
    identifier: user.identifier || "",
    normalized: user.normalized,
    password: user.password,
    balance: Number(user.balance || 0),
    coins: Number(user.coins || 0),
    referralCount: Number(user.referralCount || 0),
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    displayName: user.displayName || "",
    email: user.email || "",
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",
    depositHistory: Array.isArray(user.depositHistory) ? user.depositHistory : [],
    referralCode: user.referralCode || null,
    blockedStatus: user.blockedStatus || "none",
  };
}

function upsertUserRecord(user) {
  ensureTable();
  if (!pool) return user;
  const data = normalizeRowForInsert({ ...user });
  const result = syncAwait(
    pool.query(
      `INSERT INTO ${TABLE_NAME} (
        id, identifier, normalized, password, balance, coins, referral_count,
        created_at, display_name, email, phone, avatar_url, deposit_history, referral_code, blocked_status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,COALESCE($8,NOW()),$9,$10,$11,$12,$13,$14,$15
      )
      ON CONFLICT (id) DO UPDATE SET
        identifier = EXCLUDED.identifier,
        normalized = EXCLUDED.normalized,
        password = EXCLUDED.password,
        balance = EXCLUDED.balance,
        coins = EXCLUDED.coins,
        referral_count = EXCLUDED.referral_count,
        display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        deposit_history = EXCLUDED.deposit_history,
        referral_code = EXCLUDED.referral_code,
        blocked_status = EXCLUDED.blocked_status
      RETURNING *`,
      [
        data.id,
        data.identifier,
        data.normalized,
        data.password,
        data.balance,
        data.coins,
        data.referralCount,
        data.createdAt,
        data.displayName,
        data.email,
        data.phone,
        data.avatarUrl,
        JSON.stringify(data.depositHistory),
        data.referralCode,
        data.blockedStatus,
      ]
    )
  );
  return mapRow(result.rows[0]);
}

function readUsers() {
  ensureTable();
  if (!pool) return [];
  const result = syncAwait(
    pool.query(`SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`)
  );
  return result.rows.map(mapRow);
}

function saveUsers(users = []) {
  ensureTable();
  if (!pool) return;
  users.forEach((user) => upsertUserRecord(user));
}

function findUser(identifier) {
  ensureTable();
  if (!pool || !identifier) return { users: [], index: -1, user: null };
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return { users: [], index: -1, user: null };
  const result = syncAwait(
    pool.query(`SELECT * FROM ${TABLE_NAME} WHERE normalized = $1 LIMIT 1`, [normalized])
  );
  const row = result.rows[0];
  return {
    users: row ? [mapRow(row)] : [],
    index: row ? 0 : -1,
    user: mapRow(row),
  };
}

function findUserById(id) {
  ensureTable();
  if (!pool || !id) return { users: [], index: -1, user: null };
  const result = syncAwait(
    pool.query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1 LIMIT 1`, [id])
  );
  const row = result.rows[0];
  return {
    users: row ? [mapRow(row)] : [],
    index: row ? 0 : -1,
    user: mapRow(row),
  };
}

function updateUser(identifier, updater) {
  const { user } = findUser(identifier);
  if (!user) return null;
  const patch =
    typeof updater === "function" ? updater({ ...user }) : { ...user, ...(updater || {}) };
  return upsertUserRecord(patch);
}

function updateUserById(id, updater) {
  const { user } = findUserById(id);
  if (!user) return null;
  const patch =
    typeof updater === "function" ? updater({ ...user }) : { ...user, ...(updater || {}) };
  return upsertUserRecord(patch);
}

module.exports = {
  readUsers,
  saveUsers,
  normalizeIdentifier,
  findUser,
  findUserById,
  updateUser,
  updateUserById,
};
