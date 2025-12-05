const fetch = require("node-fetch");

const PANEL_URL = process.env.SMM_PANEL_API_URL;
const API_KEY = process.env.SMM_PANEL_API_KEY;
const SECRET = process.env.SMM_PANEL_SECRET;

// Helper umum untuk call panel SMM Anda.
// Sesuaikan field (key, secret, action, dll) dengan dokumentasi panel Anda.
async function callPanel(body) {
  if (!PANEL_URL || !API_KEY || !SECRET) {
    throw new Error("ENV SMM_PANEL_API_URL / SMM_PANEL_API_KEY / SMM_PANEL_SECRET belum diset.");
  }

  const form = new URLSearchParams({
    api_key: API_KEY,
    secret_key: SECRET,
    ...body,
  });

  const res = await fetch(PANEL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Panel HTTP error:", res.status, json);
    throw new Error("Gagal menghubungi panel");
  }

  if (json && json.status === false) {
    const msg = (json.data && json.data.msg) || json.error || "Panel mengembalikan error";
    throw new Error(msg);
  }

  return json;
}

module.exports = { callPanel };
