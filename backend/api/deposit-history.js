const { findUser } = require("./_accountStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const identifier = req.query.identifier;
    if (!identifier) return res.status(400).json({ error: "Identifier diperlukan" });

    const { user } = findUser(identifier);
    if (!user) return res.status(404).json({ error: "Akun tidak ditemukan" });

    res.json({
      history: Array.isArray(user.depositHistory) ? user.depositHistory : [],
      balance: user.balance || 0,
    });
  } catch (e) {
    console.error("deposit-history error:", e);
    res.status(500).json({ error: "Gagal memuat riwayat deposit" });
  }
};
