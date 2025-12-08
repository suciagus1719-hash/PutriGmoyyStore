const { callPanel } = require("../lib/smmClient");
const { getOrder, updateOrder } = require("../lib/orderStore");
const { refundOrder } = require("../lib/refundManager");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "orderId wajib diisi" });
    const order = await getOrder(orderId);
    if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });
    const panelId = order.panelOrderId || order.panel_id;
    if (!panelId) {
      return res.status(400).json({ error: "Order ini belum memiliki ID panel" });
    }

    const panelRes = await callPanel({ action: "status", id: panelId });
    const panelData = (panelRes && panelRes.data) || panelRes || {};
    const updated = await updateOrder(orderId, {
      status: panelData.status || order.status,
      panelStatus: panelData.status || order.panelStatus || null,
      startCount: panelData.start_count ?? order.startCount ?? null,
      remains: panelData.remains ?? order.remains ?? null,
      lastStatusSync: new Date().toISOString(),
      panelOrderId: panelId,
    });
    let latestOrder = updated || order;
    const normalizedStatus = String(panelData.status || "").toLowerCase();
    if (["partial", "error", "cancel", "cancelled", "canceled"].includes(normalizedStatus)) {
      try {
        latestOrder = await refundOrder(latestOrder, {
          reason: `Panel status ${panelData.status || normalizedStatus}`,
        });
      } catch (refundErr) {
        console.error("Auto refund gagal:", refundErr);
      }
    }

    res.json({
      panel: panelData,
      order: latestOrder,
    });
  } catch (e) {
    console.error("order-status error:", e);
    res.status(500).json({ error: e.message || "Gagal memuat status panel" });
  }
};
