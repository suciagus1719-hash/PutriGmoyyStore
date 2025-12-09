process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { randomUUID } = require("crypto");
const { getPool } = require("./dbPool");

const TABLE_NAME = process.env.ACCOUNT_TABLE_NAME || "resellers";
const pool = getPool();

if (!pool) {
  console.warn(
    "[accountStore] Database belum dikonfigurasi, data reseller tidak akan tersimpan."
  );
}

let tablePromise = null;

async function ensureTable() {
  if (!pool) {
    throw new Error("Database belum dikonfigurasi. Pastikan POSTGRES_URL tersedia.");
  }
  if (tablePromise) return tablePromise;
  tablePromise = (async () => {
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
  })();
  return tablePromise;
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

async function upsertUserRecord(user) {
  await ensureTable();
  if (!pool) return user;
  const data = normalizeRowForInsert({ ...user });
  const { rows } = await pool.query(
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
  );
  return mapRow(rows[0]);
}

async function readUsers() {
  await ensureTable();
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`);
  return rows.map(mapRow);
}

async function saveUsers(users = []) {
  await ensureTable();
  for (const user of users) {
    await upsertUserRecord(user);
  }
}

async function findUser(identifier) {
  await ensureTable();
  if (!identifier) return { users: [], index: -1, user: null };
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return { users: [], index: -1, user: null };
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE normalized = $1 LIMIT 1`, [
    normalized,
  ]);
  const row = rows[0];
  return {
    users: row ? [mapRow(row)] : [],
    index: row ? 0 : -1,
    user: mapRow(row),
  };
}

async function findUserById(id) {
  await ensureTable();
  if (!id) return { users: [], index: -1, user: null };
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1 LIMIT 1`, [id]);
  const row = rows[0];
  return {
    users: row ? [mapRow(row)] : [],
    index: row ? 0 : -1,
    user: mapRow(row),
  };
}

async function updateUser(identifier, updater) {
  const { user } = await findUser(identifier);
  if (!user) return null;
  const patch =
    typeof updater === "function" ? await updater({ ...user }) : { ...user, ...(updater || {}) };
  return upsertUserRecord(patch);
}

async function updateUserById(id, updater) {
  const { user } = await findUserById(id);
  if (!user) return null;
  const patch =
    typeof updater === "function" ? await updater({ ...user }) : { ...user, ...(updater || {}) };
  return upsertUserRecord(patch);
}

async function deleteUser(identifier) {
  await ensureTable();
  if (!identifier) return false;
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return false;
  const { rowCount } = await pool.query(`DELETE FROM ${TABLE_NAME} WHERE normalized = $1`, [normalized]);
  return rowCount > 0;
}

async function deleteUserById(id) {
  await ensureTable();
  if (!id) return false;
  const { rowCount } = await pool.query(`DELETE FROM ${TABLE_NAME} WHERE id = $1`, [id]);
  return rowCount > 0;
}

module.exports = {
  readUsers,
  saveUsers,
  normalizeIdentifier,
  findUser,
  findUserById,
  updateUser,
  updateUserById,
  deleteUser,
  deleteUserById,
};
