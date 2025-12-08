const { listOrders, deleteOlderOrders } = require("../lib/orderStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    const {
      page = 1,
      limit = 10,
      status = "all",
      q = "",
      identifier,
      scope = "account",
    } = req.query || {};
    const scopedIdentifier = String(scope).toLowerCase() === "all" ? undefined : identifier;
    try {
      const data = await listOrders({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status,
        search: q,
        identifier: scopedIdentifier,
      });
      return res.json(data);
    } catch (e) {
      console.error("orders API error:", e);
      return res.status(500).json({ error: "Gagal memuat status order" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { identifier, days = 30 } = req.body || {};
      if (!identifier) return res.status(400).json({ error: "Identifier wajib diisi" });
      const deleted = await deleteOlderOrders(identifier, days);
      return res.json({ success: true, deleted });
    } catch (e) {
      console.error("orders delete error:", e);
      return res.status(500).json({ error: "Gagal menghapus status order" });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};
