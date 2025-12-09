const { callPanel } = require("../lib/smmClient");
const {
  getOrder,
  updateOrder,
  findOrderByPanelId,
  findOrderByServiceId,
} = require("../lib/orderStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { serviceId } = req.body || {};
    const lookup = typeof serviceId === "string" ? serviceId.trim() : String(serviceId || "");
    if (!lookup) return res.status(400).json({ error: "ID layanan wajib diisi" });

    let stored = null;
    try {
      stored = await getOrder(lookup);
    } catch (err) {
      console.error("order-track lookup error:", err);
    }
    if (!stored) stored = await findOrderByPanelId(lookup);
    if (!stored) stored = await findOrderByServiceId(lookup);

    const panelId = stored?.panelOrderId || lookup;
    const response = {
      order: stored,
      panel: null,
      panelId,
      query: { serviceId: lookup },
    };

    try {
      const panelRes = await callPanel({ action: "status", id: panelId });
      const panelData = (panelRes && panelRes.data) || panelRes || {};
      response.panel = {
        status: panelData.status || null,
        start_count: panelData.start_count ?? null,
        remains: panelData.remains ?? null,
        charge: panelData.charge ?? null,
      };
      if (stored?.id) {
        const updated = await updateOrder(stored.id, {
          status: panelData.status || stored.status,
          panelStatus: panelData.status || stored.panelStatus || null,
          startCount: panelData.start_count ?? stored.startCount ?? null,
          remains: panelData.remains ?? stored.remains ?? null,
          lastStatusSync: new Date().toISOString(),
        });
        if (updated) response.order = updated;
        else
          response.order = {
            ...stored,
            status: panelData.status || stored.status,
            panelStatus: panelData.status || stored.panelStatus || null,
            startCount: panelData.start_count ?? stored.startCount ?? null,
            remains: panelData.remains ?? stored.remains ?? null,
            lastStatusSync: new Date().toISOString(),
          };
      }
      return res.json(response);
    } catch (err) {
      console.error("order-track panel error:", err);
      return res.status(404).json({ error: err.message || "Layanan tidak ditemukan di panel" });
    }
  } catch (e) {
    console.error("order-track error:", e);
    res.status(500).json({ error: "Gagal memuat status order" });
  }
};
