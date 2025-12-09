const { callPanel } = require("../lib/smmClient");
const {
  collectPlatforms,
  normalizeServicesResponse,
  detectPlatformDef,
} = require("../lib/platformUtils");
const {
  getServiceId,
  getServiceDescription,
  getServicePrice,
  getServicePricePer100,
  getServiceMin,
  getServiceMax,
  getServiceName,
  getServiceCategory,
} = require("../lib/serviceParser");
const { getHiddenServices } = require("../lib/settingsStore");

const BLOCKED_KEYWORDS = ["website traffic", "website social signal"];

function isBlockedService(rawService) {
  const name = String(getServiceName(rawService) || "");
  const description = String(getServiceDescription(rawService) || "");
  const category = String(getServiceCategory(rawService) || "");
  const combined = `${name} ${description} ${category}`.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => combined.includes(keyword));
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const panelRes = await callPanel({ action: "services" });
    const servicesRaw = normalizeServicesResponse(panelRes);
    const platforms = collectPlatforms(servicesRaw);

    const hiddenList = await getHiddenServices();
    const hiddenSet = new Set(hiddenList.map((id) => String(id).toLowerCase()));

    const services = servicesRaw
      .filter((svc) => !isBlockedService(svc))
      .map((svc) => {
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
      })
      .filter((svc) => !hiddenSet.has(String(svc.id).toLowerCase()));

    res.json({
      platforms,
      services,
    });
  } catch (e) {
    console.error("catalog error", e);
    res.status(500).json({ error: "Gagal memuat katalog layanan" });
  }
};
