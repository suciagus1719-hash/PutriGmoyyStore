const { callPanel } = require("./_smmClient");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { categoryId } = req.query;
  if (!categoryId) return res.status(400).json({ error: "categoryId wajib diisi" });

  try {
    const panelRes = await callPanel({ action: "services" });

    const services = (panelRes || [])
      .filter((s) => s.category === categoryId)
      .map((s) => ({
        id: s.service,
        name: s.name,
      }));

    res.json({ services });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal mengambil layanan" });
  }
};
