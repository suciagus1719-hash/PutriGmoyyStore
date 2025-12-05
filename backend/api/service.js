const { callPanel } = require("./_smmClient");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "id wajib diisi" });

  try {
    const panelRes = await callPanel({ action: "services" });
    const svc = (panelRes || []).find((s) => String(s.service) === String(id));
    if (!svc) return res.status(404).json({ error: "Layanan tidak ditemukan" });

    const service = {
      id: svc.service,
      name: svc.name,
      description: svc.description,
      rate: Number(svc.rate),
      price_display: `Rp ${Number(svc.rate).toLocaleString("id-ID")} / 1000`,
      min: Number(svc.min),
      max: Number(svc.max),
    };

    res.json({ service });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal mengambil detail layanan" });
  }
};
