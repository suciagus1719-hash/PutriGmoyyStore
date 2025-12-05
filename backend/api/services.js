const { callPanel } = require("./_smmClient");
const { detectPlatformDef, normalizeServicesResponse } = require("./_platformUtils");
const { decodeCategoryKey } = require("./_categoryUtils");
const { getServiceCategory, getServiceId, getServiceName } = require("./_serviceParser");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "categoryId wajib diisi" });

  try {
    const { platformId, categoryName } = decodeCategoryKey(categoryId);
    const targetCategory = categoryName || categoryId;
    const platformKey = platformId ? String(platformId).toLowerCase() : null;
    const panelRes = await callPanel({ action: "services" });
    const servicesFromPanel = normalizeServicesResponse(panelRes);

    const filtered = servicesFromPanel.filter((svc) => {
      const catName = getServiceCategory(svc);
      if (catName !== targetCategory) return false;
      if (!platformKey) return true;
      const detected = detectPlatformDef(svc);
      const svcPlatform = svc.platform ? String(svc.platform).toLowerCase() : null;
      if (platformKey === "other") return !detected;
      return (svcPlatform && svcPlatform === platformKey) || (detected && detected.id === platformKey);
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
