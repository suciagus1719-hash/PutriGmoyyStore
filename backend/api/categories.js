const { callPanel } = require("./_smmClient");
const { detectPlatformDef } = require("./_platformUtils");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { platformId } = req.query;
  if (!platformId) return res.status(400).json({ error: "platformId wajib diisi" });

  try {
    // Contoh: action=services (lihat dokumentasi panel Anda)
    const panelRes = await callPanel({ action: "services" });
    const categoriesMap = new Map();
    (panelRes || []).forEach((svc) => {
      const detected = detectPlatformDef(svc);
      const belongToPlatform =
        (svc.platform && String(svc.platform).toLowerCase() === platformId.toLowerCase()) ||
        (detected && detected.id === platformId) ||
        (platformId === "other" && !detected);
      if (!belongToPlatform) return;
      const catName = svc.category || "Tanpa Kategori";
      if (!categoriesMap.has(catName)) {
        categoriesMap.set(catName, { id: catName, name: catName });
      }
    });

    res.json({ categories: Array.from(categoriesMap.values()) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal mengambil kategori" });
  }
};
