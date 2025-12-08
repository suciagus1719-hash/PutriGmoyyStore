process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0";
const { randomUUID } = require("crypto");
const { Pool } = require("pg");
const { normalizeIdentifier } = require("./accountStore");

const TABLE_NAME = process.env.DEPOSIT_TABLE_NAME || "reseller_deposits";
const CONNECTION_STRING =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  console.warn("[depositStore] POSTGRES_URL belum dikonfigurasi. Riwayat deposit tidak akan tersimpan.");
}

const pool = CONNECTION_STRING
  ? new Pool({
      connectionString: CONNECTION_STRING,
      ssl: { rejectUnauthorized: false },
    })
  : null;

let tablePromise = null;

async function ensureTable() {
  if (!pool) throw new Error("Database deposit belum siap");
  if (tablePromise) return tablePromise;
  tablePromise = (async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        amount NUMERIC DEFAULT 0,
        method TEXT,
        status TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_identifier ON ${TABLE_NAME} (identifier);
      CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_created ON ${TABLE_NAME} (created_at DESC);
    `;
    await pool.query(query);
  })();
  return tablePromise;
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.id,
    method: row.method || "midtrans",
    amount: Number(row.amount || 0),
    status: row.status || "success",
    time: row.created_at ? new Date(row.created_at).toISOString() : null,
    metadata: row.metadata || {},
  };
}

async function recordDeposit({ id, identifier, amount, method, status, metadata, createdAt }) {
  await ensureTable();
  if (!pool) return null;
  const normalized = normalizeIdentifier(identifier);
  const entryId = id || `DEPO-${Date.now()}`;
  const { rows } = await pool.query(
    `INSERT INTO ${TABLE_NAME} (id, identifier, amount, method, status, metadata, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,NOW()))
     ON CONFLICT (id) DO UPDATE SET
       amount = EXCLUDED.amount,
       method = EXCLUDED.method,
       status = EXCLUDED.status,
       metadata = EXCLUDED.metadata
     RETURNING *`,
    [entryId, normalized, Number(amount || 0), method || "midtrans", status || "success", metadata || {}, createdAt]
  );
  return mapRow(rows[0]);
}

async function listDeposits(identifier, { limit = 50, status } = {}) {
  await ensureTable();
  if (!pool || !identifier) return [];
  const normalized = normalizeIdentifier(identifier);
  const filters = ["identifier = $1"];
  const values = [normalized];
  if (status && status !== "all") {
    filters.push("LOWER(status) = $2");
    values.push(String(status).toLowerCase());
  }
  const limitVal = Math.max(1, Number(limit) || 50);
  const query = `SELECT * FROM ${TABLE_NAME} WHERE ${filters.join(" AND ")} ORDER BY created_at DESC LIMIT ${limitVal}`;
  const { rows } = await pool.query(query, values);
  return rows.map(mapRow);
}

module.exports = {
  recordDeposit,
  listDeposits,
};
