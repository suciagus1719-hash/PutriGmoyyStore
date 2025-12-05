const { callPanel } = require("./_smmClient");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { platformId } = req.query;
  if (!platformId) return res.status(400).json({ error: "platformId wajib diisi" });

  try {
    // Contoh: action=services (lihat dokumentasi panel Anda)
    const panelRes = await callPanel({ action: "services" });

    const categoriesMap = new Map();

    (panelRes || []).forEach((s) => {
      const catName = s.category;
      if (!catName) return;

      // Contoh filter: kategori yang mengandung nama platform
      const p = platformId.toLowerCase();
      if (!catName.toLowerCase().includes(p)) return;

      if (!categoriesMap.has(catName)) {
        categoriesMap.set(catName, { id: catName, name: catName });
      }
    });

    res.json({ categories: Array.from(categoriesMap.values()) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal mengambil kategori" });
  }
};
