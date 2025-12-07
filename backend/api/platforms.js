const { callPanel } = require("../lib/smmClient");
const { collectPlatforms, normalizeServicesResponse } = require("../lib/platformUtils");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const panelRes = await callPanel({ action: "services" });
    const services = normalizeServicesResponse(panelRes);
    const platforms = collectPlatforms(services);
    res.json({ platforms });
  } catch (e) {
    console.error("platforms error", e);
    res.status(500).json({ error: "Gagal mengambil platform dari panel" });
  }
};
