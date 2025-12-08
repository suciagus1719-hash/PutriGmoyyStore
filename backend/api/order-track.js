const { callPanel } = require("../lib/smmClient");
const { getOrder, updateOrder } = require("../lib/orderStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "orderId wajib diisi" });
    const stored = getOrder(orderId);
    if (!stored) return res.status(404).json({ error: "Order tidak ditemukan" });
    const response = {
      order: stored,
      panel: null,
    };
    const panelId = stored.panelOrderId || stored.panel_id;
    if (!panelId) {
      return res.json(response);
    }
    try {
      const panelRes = await callPanel({ action: "status", id: panelId });
      const panelData = (panelRes && panelRes.data) || panelRes || {};
      updateOrder(orderId, {
        status: panelData.status || stored.status,
        panelStatus: panelData.status || stored.panelStatus || null,
        startCount: panelData.start_count ?? stored.startCount ?? null,
        remains: panelData.remains ?? stored.remains ?? null,
        lastStatusSync: new Date().toISOString(),
      });
      response.panel = {
        status: panelData.status || stored.panelStatus || null,
        start_count: panelData.start_count ?? null,
        remains: panelData.remains ?? null,
        charge: panelData.charge ?? null,
      };
      response.order = { ...stored, status: panelData.status || stored.status };
    } catch (err) {
      console.error("order-track panel error:", err);
    }
    res.json(response);
  } catch (e) {
    console.error("order-track error:", e);
    res.status(500).json({ error: "Gagal memuat status order" });
  }
};

