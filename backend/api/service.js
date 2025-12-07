const { callPanel } = require("../lib/smmClient");
const { normalizeServicesResponse, detectPlatformDef } = require("../lib/platformUtils");
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

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "id wajib diisi" });

  try {
    const panelRes = await callPanel({ action: "services" });
    const services = normalizeServicesResponse(panelRes);
    const svc = services.find((s) => String(getServiceId(s)) === String(id));
    if (!svc) return res.status(404).json({ error: "Layanan tidak ditemukan" });

    const rate = getServicePrice(svc);
    const per100 = getServicePricePer100(svc);
    const rawDesc = getServiceDescription(svc) || "";
    const formattedDesc = rawDesc.replace(/\r/g, "\n").replace(/\n{2,}/g, "\n\n");

    const service = {
      id: String(getServiceId(svc)),
      name: getServiceName(svc),
      description: formattedDesc,
      rate,
      price_display: per100 ? `Rp ${per100.toLocaleString("id-ID")} / 100` : "-",
      price_per_100: per100 ? `Rp ${per100.toLocaleString("id-ID")}` : null,
      price_per_100_value: per100 || 0,
      min: getServiceMin(svc),
      max: getServiceMax(svc),
      category: getServiceCategory(svc),
      platform: detectPlatformDef(svc)?.name || svc.platform || "Lainnya",
    };

    res.json({ service });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal mengambil detail layanan" });
  }
};
