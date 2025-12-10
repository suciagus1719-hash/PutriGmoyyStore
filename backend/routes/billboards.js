const { list } = require("@vercel/blob");

const FALLBACK_IMAGES = [
  { url: "/img/billboard-01.jpg", alt: "Billboard 1" },
  { url: "/img/billboard-02.jpg", alt: "Billboard 2" },
  { url: "/img/billboard-03.jpg", alt: "Billboard 3" },
  { url: "/img/billboard-04.jpg", alt: "Billboard 4" },
];

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
const BILLBOARD_PREFIX = process.env.BILLBOARD_BLOB_PREFIX || "billboards/";
const BILLBOARD_LIMIT = Number(process.env.BILLBOARD_BLOB_LIMIT || 8);

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Metode tidak diizinkan" });
  }

  try {
    let images = await fetchFromBlob();
    if (!images.length) {
      images = FALLBACK_IMAGES;
    }
    res.setHeader("Cache-Control", "public, max-age=60");
    return send(res, 200, { images });
  } catch (err) {
    console.error("billboards route error:", err);
    return send(res, 500, { error: "Gagal memuat billboard" });
  }
};
