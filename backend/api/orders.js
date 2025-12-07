const { listOrders } = require("../lib/orderStore");

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { page = 1, limit = 10, status = "all", q = "" } = req.query || {};
  try {
    const data = listOrders({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
      search: q,
    });
    res.json(data);
  } catch (e) {
    console.error("orders API error:", e);
    res.status(500).json({ error: "Gagal memuat status order" });
  }
};

