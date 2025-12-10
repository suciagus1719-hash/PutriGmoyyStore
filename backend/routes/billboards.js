const { list } = require("@vercel/blob");

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
const BILLBOARD_PREFIX = (process.env.BILLBOARD_BLOB_PREFIX || "billboard/").trim() || "billboard/";
const BILLBOARD_LIMIT = Number(process.env.BILLBOARD_BLOB_LIMIT || 8);
const RAW_ALLOWED_ORIGINS =
  process.env.CORS_ALLOW_ORIGIN ||
  "*";
const ALLOWED_ORIGINS = RAW_ALLOWED_ORIGINS
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function applyCors(req, res) {
  const origin = req.headers.origin || "";
  const allowsWildcard = ALLOWED_ORIGINS.includes("*");
  if (allowsWildcard) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    const matched =
      (origin && ALLOWED_ORIGINS.find((allowed) => allowed === origin)) ||
      ALLOWED_ORIGINS[0] ||
      origin ||
      "*";
    res.setHeader("Access-Control-Allow-Origin", matched);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function fetchFromBlob() {
  if (!BLOB_TOKEN) return [];
  try {
    const result = await list({
      token: BLOB_TOKEN,
      prefix: BILLBOARD_PREFIX,
      limit: BILLBOARD_LIMIT,
    });
    const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
    return blobs
      .filter((blob) => blob && (blob.url || blob.downloadUrl))
      .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
      .map((blob, index) => ({
        url: blob.url || blob.downloadUrl,
        alt: blob.pathname || `Billboard ${index + 1}`,
        size: blob.size || null,
        uploadedAt: blob.uploadedAt || null,
      }));
  } catch (err) {
    console.error("billboards:list error:", err);
    return [];
  }
}

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Metode tidak diizinkan" });
  }

  try {
    const images = await fetchFromBlob();
    res.setHeader("Cache-Control", "public, max-age=60");
    return send(res, 200, { images });
  } catch (err) {
    console.error("billboards route error:", err);
    return send(res, 500, { error: "Gagal memuat billboard" });
  }
};
