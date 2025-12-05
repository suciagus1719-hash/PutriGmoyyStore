const { callPanel } = require("./_smmClient");
const {
  collectPlatforms,
  normalizeServicesResponse,
  detectPlatformDef,
} = require("./_platformUtils");
const {
  getServiceId,
  getServiceDescription,
  getServicePrice,
  getServicePricePer100,
  getServiceMin,
  getServiceMax,
  getServiceName,
  getServiceCategory,
} = require("./_serviceParser");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const panelRes = await callPanel({ action: "services" });
    const servicesRaw = normalizeServicesResponse(panelRes);
    const platforms = collectPlatforms(servicesRaw);

    const services = servicesRaw.map((svc) => {
      const detected = detectPlatformDef(svc);
      const platformId =
        (detected && detected.id) ||
        (svc.platform ? String(svc.platform).toLowerCase() : "other");
      const platformName =
        (detected && detected.name) || svc.platform || "Lainnya";

      const rate = getServicePrice(svc);
      const per100 = getServicePricePer100(svc);
      const description = (getServiceDescription(svc) || "")
        .replace(/\r/g, "\n")
        .trim();

      return {
        id: String(getServiceId(svc)),
        name: getServiceName(svc),
        description,
        category: getServiceCategory(svc) || "Tanpa Kategori",
        platformId,
        platformName,
        min: getServiceMin(svc),
        max: getServiceMax(svc),
        rate,
        pricePer100: per100,
        sortPrice: per100 || 0,
      };
    });

    res.json({
      platforms,
      services,
    });
  } catch (e) {
    console.error("catalog error", e);
    res.status(500).json({ error: "Gagal memuat katalog layanan" });
  }
};
