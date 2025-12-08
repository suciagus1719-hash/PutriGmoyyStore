const { callPanel } = require("../lib/smmClient");
const { listRecentOrders, updateOrder } = require("../lib/orderStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const recentOrders = listRecentOrders(15);
    const rows = [];
    for (const order of recentOrders) {
      let latest = order;
      if (order.panelOrderId) {
        try {
          const panelRes = await callPanel({ action: "status", id: order.panelOrderId });
          const panelData = (panelRes && panelRes.data) || panelRes || {};
          latest =
            updateOrder(order.id, {
              status: panelData.status || order.status,
              panelStatus: panelData.status || order.panelStatus || null,
              startCount: panelData.start_count ?? order.startCount ?? null,
              remains: panelData.remains ?? order.remains ?? null,
              lastStatusSync: new Date().toISOString(),
            }) || order;
        } catch (err) {
          console.error("owner-orders panel error:", err);
        }
      }
      rows.push({
        id: latest.id,
        type: latest.type || "public",
        serviceName: latest.serviceName || latest.serviceId || "-",
        target: latest.target || "-",
        price: Number(latest.price || 0),
        status: latest.panelStatus || latest.status || "processing",
        createdAt: latest.createdAt,
        lastUpdate: latest.lastStatusSync || latest.updatedAt || latest.createdAt,
        isReseller: latest.type === "reseller",
        resellerIdentifier: latest.resellerIdentifier || null,
        buyerName: latest.buyer?.name || null,
      });
    }

    const stats = rows.reduce(
      (acc, row) => {
        acc.total += 1;
        acc.revenue += Number(row.price || 0);
        if (row.isReseller) acc.reseller += 1;
        else acc.public += 1;
        const normalized = String(row.status || "").toLowerCase();
        if (normalized.includes("pending")) acc.pending += 1;
        else if (normalized.includes("error") || normalized.includes("partial")) acc.failed += 1;
        else if (
          normalized.includes("success") ||
          normalized.includes("selesai") ||
          normalized.includes("complete") ||
          normalized.includes("done")
        ) {
          acc.success += 1;
        }
        return acc;
      },
      { total: 0, public: 0, reseller: 0, pending: 0, success: 0, failed: 0, revenue: 0 }
    );

    res.json({ rows, stats });
  } catch (e) {
    console.error("owner-orders error:", e);
    res.status(500).json({ error: "Gagal memuat riwayat order" });
  }
};
