process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0";
const { randomUUID } = require("crypto");
const { Pool } = require("pg");
const { normalizeIdentifier } = require("./accountStore");

const TABLE_NAME = process.env.ORDER_TABLE_NAME || "orders";
const CONNECTION_STRING =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  console.warn("[orderStore] POSTGRES_URL belum dikonfigurasi, status order tidak akan tersimpan.");
}

const pool = CONNECTION_STRING
  ? new Pool({
      connectionString: CONNECTION_STRING,
      ssl: { rejectUnauthorized: false },
    })
  : null;

let tablePromise = null;

async function ensureTable() {
  if (!pool) {
    throw new Error("Database orders belum siap");
  }
  if (tablePromise) return tablePromise;
  tablePromise = (async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT PRIMARY KEY,
        reseller_id TEXT,
        reseller_identifier TEXT,
        service_id TEXT,
        service_name TEXT,
        category TEXT,
        platform_id TEXT,
        platform_name TEXT,
        target TEXT,
        quantity INTEGER,
        custom_comments JSONB DEFAULT '[]'::jsonb,
        price NUMERIC DEFAULT 0,
        buyer JSONB,
        status TEXT,
        type TEXT,
        payment_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        panel_order_id TEXT,
        panel_status TEXT,
        start_count NUMERIC,
        remains NUMERIC,
        last_status_sync TIMESTAMP WITH TIME ZONE,
        metadata JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_reseller ON ${TABLE_NAME} (reseller_identifier);
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
    resellerId: row.reseller_id,
    resellerIdentifier: row.reseller_identifier,
    serviceId: row.service_id,
    serviceName: row.service_name,
    category: row.category,
    platformId: row.platform_id,
    platformName: row.platform_name,
    target: row.target,
    quantity: row.quantity,
    customComments: Array.isArray(row.custom_comments) ? row.custom_comments : [],
    price: Number(row.price || 0),
    buyer: row.buyer || {},
    status: row.status,
    type: row.type,
    paymentType: row.payment_type,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    panelOrderId: row.panel_order_id,
    panelStatus: row.panel_status,
    startCount: row.start_count,
    remains: row.remains,
    lastStatusSync: row.last_status_sync ? new Date(row.last_status_sync).toISOString() : null,
    metadata: row.metadata || {},
  };
}

function normalizeOrderPayload(order = {}) {
  return {
    id: order.id || `ORD-${Date.now()}`,
    resellerId: order.resellerId || order.reseller_id || null,
    resellerIdentifier: normalizeIdentifier(order.resellerIdentifier || order.reseller_identifier || ""),
    serviceId: order.serviceId || order.service_id || null,
    serviceName: order.serviceName || order.service_name || null,
    category: order.category || null,
    platformId: order.platformId || order.platform_id || null,
    platformName: order.platformName || order.platform_name || null,
    target: order.target || null,
    quantity: order.quantity != null ? Number(order.quantity) : null,
    customComments: Array.isArray(order.customComments) ? order.customComments : [],
    price: Number(order.price || 0),
    buyer: order.buyer || {},
    status: order.status || "processing",
    type: order.type || "midtrans",
    paymentType: order.paymentType || order.payment_type || null,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
    panelOrderId: order.panelOrderId || order.panel_order_id || null,
    panelStatus: order.panelStatus || order.panel_status || null,
    startCount: order.startCount != null ? Number(order.startCount) : null,
    remains: order.remains != null ? Number(order.remains) : null,
    lastStatusSync: order.lastStatusSync ? new Date(order.lastStatusSync).toISOString() : null,
    metadata: order.metadata || {},
  };
}

async function upsertOrder(order) {
  await ensureTable();
  const data = normalizeOrderPayload(order);
  const { rows } = await pool.query(
    `INSERT INTO ${TABLE_NAME} (
      id, reseller_id, reseller_identifier, service_id, service_name, category,
      platform_id, platform_name, target, quantity, custom_comments, price, buyer,
      status, type, payment_type, created_at, panel_order_id, panel_status, start_count,
      remains, last_status_sync, metadata
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,COALESCE($17,NOW()),$18,$19,$20,$21,$22,$23
    )
    ON CONFLICT (id) DO UPDATE SET
      reseller_id = EXCLUDED.reseller_id,
      reseller_identifier = EXCLUDED.reseller_identifier,
      service_id = EXCLUDED.service_id,
      service_name = EXCLUDED.service_name,
      category = EXCLUDED.category,
      platform_id = EXCLUDED.platform_id,
      platform_name = EXCLUDED.platform_name,
      target = EXCLUDED.target,
      quantity = EXCLUDED.quantity,
      custom_comments = EXCLUDED.custom_comments,
      price = EXCLUDED.price,
      buyer = EXCLUDED.buyer,
      status = EXCLUDED.status,
      type = EXCLUDED.type,
      payment_type = EXCLUDED.payment_type,
      panel_order_id = EXCLUDED.panel_order_id,
      panel_status = EXCLUDED.panel_status,
      start_count = EXCLUDED.start_count,
      remains = EXCLUDED.remains,
      last_status_sync = EXCLUDED.last_status_sync,
      metadata = EXCLUDED.metadata
    RETURNING *`,
    [
      data.id,
      data.resellerId,
      data.resellerIdentifier,
      data.serviceId,
      data.serviceName,
      data.category,
      data.platformId,
      data.platformName,
      data.target,
      data.quantity,
      JSON.stringify(data.customComments),
      data.price,
      JSON.stringify(data.buyer || {}),
      data.status,
      data.type,
      data.paymentType,
      data.createdAt,
      data.panelOrderId,
      data.panelStatus,
      data.startCount,
      data.remains,
      data.lastStatusSync,
      JSON.stringify(data.metadata || {}),
    ]
  );
  return mapRow(rows[0]);
}

async function appendOrder(order) {
  return await upsertOrder(order);
}

async function getOrder(id) {
  await ensureTable();
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1 LIMIT 1`, [id]);
  return mapRow(rows[0]);
}

async function updateOrder(id, patch = {}) {
  const existing = await getOrder(id);
  if (!existing) return null;
  const updated =
    typeof patch === "function" ? await patch({ ...existing }) : { ...existing, ...patch };
  return await upsertOrder(updated);
}

async function listOrders({ page = 1, limit = 10, status, search, identifier } = {}) {
  await ensureTable();
  const filters = [];
  const values = [];
  let idx = 1;
  if (status && status !== "all") {
    filters.push(`LOWER(status) = $${idx}`);
    values.push(String(status).toLowerCase());
    idx += 1;
  }
  if (identifier) {
    filters.push(`reseller_identifier = $${idx}`);
    values.push(normalizeIdentifier(identifier));
    idx += 1;
  }
  if (search) {
    filters.push(
      `(LOWER(id) LIKE $${idx} OR LOWER(target) LIKE $${idx} OR LOWER(service_id) LIKE $${idx})`
    );
    values.push(`%${search.toLowerCase()}%`);
    idx += 1;
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const offset = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const limitVal = Math.max(1, Number(limit));
  const countResult = await pool.query(`SELECT COUNT(*) FROM ${TABLE_NAME} ${where}`, values);
  const { rows } = await pool.query(
    `SELECT * FROM ${TABLE_NAME} ${where} ORDER BY created_at DESC LIMIT ${limitVal} OFFSET ${offset}`,
    values
  );
  return {
    total: Number(countResult.rows[0]?.count || 0),
    rows: rows.map(mapRow),
  };
}

async function listRecentOrders(limit = 15) {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC LIMIT $1`,
    [Math.max(1, Number(limit) || 15)]
  );
  return rows.map(mapRow);
}

async function deleteOlderOrders(identifier, days = 30) {
  await ensureTable();
  if (!identifier) return 0;
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return 0;
  const cutoff = new Date(Date.now() - Math.max(1, Number(days) || 30) * 24 * 60 * 60 * 1000);
  const { rowCount } = await pool.query(
    `DELETE FROM ${TABLE_NAME} WHERE reseller_identifier = $1 AND created_at < $2`,
    [normalized, cutoff]
  );
  return rowCount;
}

module.exports = {
  appendOrder,
  getOrder,
  updateOrder,
  listOrders,
  listRecentOrders,
  deleteOlderOrders,
};
