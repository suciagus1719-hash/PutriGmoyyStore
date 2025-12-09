const { Pool } = require("pg");

const CONNECTION_STRING =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

const DEFAULT_MAX = Number(process.env.DB_POOL_SIZE || 5);

let pool = null;

function getPool() {
  if (!CONNECTION_STRING) return null;
  if (pool) return pool;
  pool = new Pool({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
    max: DEFAULT_MAX > 0 ? DEFAULT_MAX : 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
  pool.on("error", (err) => {
    console.error("[dbPool] Unexpected error on idle client", err);
  });
  return pool;
}

module.exports = { getPool };

