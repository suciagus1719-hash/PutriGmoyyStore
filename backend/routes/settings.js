const { getMinimumDeposit, getAnnouncement } = require("../lib/settingsStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const key = String(req.query?.key || "").toLowerCase();
    if (!key) {
      return res.status(400).json({ error: "Key wajib diisi" });
    }
    if (key === "min_deposit") {
      try {
        const value = await getMinimumDeposit();
        return res.json({ key, value });
      } catch (err) {
        console.error("settings min_deposit error:", err);
        return res.status(500).json({ error: "Gagal mengambil minimal deposit" });
      }
    }
    if (key === "announcement") {
      try {
        const value = await getAnnouncement();
        return res.json({ key, value });
      } catch (err) {
        console.error("settings announcement error:", err);
        return res.status(500).json({ error: "Gagal mengambil pengumuman" });
      }
    }
    return res.status(404).json({ error: "Pengaturan tidak ditemukan" });
  }

  res.status(405).json({ error: "Method not allowed" });
};
