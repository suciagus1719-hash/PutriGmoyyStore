const { callPanel } = require("../lib/smmClient");

const OWNER_PASSWORD = process.env.OWNER_PANEL_PASSWORD || "Senjasuci1719";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { password } = req.body || {};
    if (!password || password !== OWNER_PASSWORD) {
      return res.status(401).json({ error: "Password owner salah" });
    }

    const panelRes = await callPanel({ action: "profile" });
    const profile = panelRes?.data || panelRes || {};

    res.json({ profile });
  } catch (e) {
    console.error("panel-profile error:", e);
    res.status(500).json({ error: "Gagal mengambil profil panel" });
  }
};
