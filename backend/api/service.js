const { callPanel } = require("./_smmClient");
const { normalizeServicesResponse, detectPlatformDef } = require("./_platformUtils");
const {
  getServiceId,
  getServiceDescription,
  getServicePrice,
  getServiceMin,
  getServiceMax,
  getServiceName,
  getServiceCategory,
} = require("./_serviceParser");

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
    const service = {
      id: String(getServiceId(svc)),
      name: getServiceName(svc),
      description: getServiceDescription(svc),
      rate,
      price_display: rate ? `Rp ${rate.toLocaleString("id-ID")} / 1000` : "-",
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
