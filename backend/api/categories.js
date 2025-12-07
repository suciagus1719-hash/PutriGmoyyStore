const { callPanel } = require("../lib/smmClient");
const { normalizeServicesResponse, belongsToPlatform } = require("../lib/platformUtils");
const { encodeCategoryKey, isBlockedCategory } = require("../lib/categoryUtils");
const { getServiceCategory } = require("../lib/serviceParser");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { platformId } = req.query;
  if (!platformId) return res.status(400).json({ error: "platformId wajib diisi" });

  try {
    // Contoh: action=services (lihat dokumentasi panel Anda)
    const panelRes = await callPanel({ action: "services" });
    const services = normalizeServicesResponse(panelRes);
    const categoriesMap = new Map();
    services.forEach((svc) => {
      if (!belongsToPlatform(svc, platformId)) return;
      const catName = getServiceCategory(svc) || "Tanpa Kategori";
      if (isBlockedCategory(catName)) return;
      if (!categoriesMap.has(catName)) {
        categoriesMap.set(catName, {
          id: encodeCategoryKey(platformId, catName),
          name: catName,
        });
      }
    });

    res.json({ categories: Array.from(categoriesMap.values()) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal mengambil kategori" });
  }
};
