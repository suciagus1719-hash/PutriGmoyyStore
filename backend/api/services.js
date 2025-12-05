const { callPanel } = require("./_smmClient");
const { normalizeServicesResponse, belongsToPlatform } = require("./_platformUtils");
const { decodeCategoryKey, isBlockedCategory } = require("./_categoryUtils");
const { getServiceCategory, getServiceId, getServiceName } = require("./_serviceParser");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "categoryId wajib diisi" });

  try {
    const { platformId, categoryName } = decodeCategoryKey(categoryId);
    const targetCategory = categoryName || categoryId;
    if (isBlockedCategory(targetCategory)) {
      return res.json({ services: [] });
    }
    const platformKey = platformId ? String(platformId).toLowerCase() : null;
    const panelRes = await callPanel({ action: "services" });
    const servicesFromPanel = normalizeServicesResponse(panelRes);

    const filtered = servicesFromPanel.filter((svc) => {
      const catName = getServiceCategory(svc);
      if (catName !== targetCategory) return false;
      return belongsToPlatform(svc, platformKey || platformId);
    });

    const services = filtered.map((svc) => ({
      id: String(getServiceId(svc)),
      name: getServiceName(svc),
    }));

    res.json({ services });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal mengambil layanan" });
  }
};
