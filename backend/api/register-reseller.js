const { callPanel } = require("./_smmClient");

// Endpoint pendaftaran reseller
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { name, whatsapp, email, username, password } = req.body;
    if (!name || !whatsapp || !email || !username || !password) {
      return res.status(400).json({ error: "Data belum lengkap" });
    }

    // Contoh kirim ke panel. SESUAIKAN dengan dokumentasi panel Anda.
    // Bisa juga diganti kirim email / simpan database.
    let panelResponse;
    try {
      panelResponse = await callPanel({
        action: "register_reseller", // ganti sesuai API panel
        name,
        whatsapp,
        email,
        username,
        password,
      });
      console.log("Reseller register result:", panelResponse);
    } catch (e) {
      console.error("Gagal kirim ke panel, tapi request diterima:", e);
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Terjadi kesalahan" });
  }
};
