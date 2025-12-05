const { callPanel } = require("./_smmClient");
const { detectPlatformDef, normalizeServicesResponse } = require("./_platformUtils");
const { encodeCategoryKey } = require("./_categoryUtils");
const { getServiceCategory } = require("./_serviceParser");

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
    const requestedPlatform = platformId.toLowerCase();

    services.forEach((svc) => {
      const detected = detectPlatformDef(svc);
      const belongToPlatform =
        (svc.platform && String(svc.platform).toLowerCase() === requestedPlatform) ||
        (detected && detected.id === requestedPlatform) ||
        (requestedPlatform === "other" && !detected);
      if (!belongToPlatform) return;
      const catName = getServiceCategory(svc) || "Tanpa Kategori";
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
