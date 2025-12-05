module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Hardcode daftar platform, sesuaikan nama & jumlahnya
  const platforms = [
    { id: "instagram", name: "Instagram" },
    { id: "tiktok", name: "TikTok" },
    { id: "youtube", name: "YouTube" },
    { id: "facebook", name: "Facebook" },
    { id: "whatsapp", name: "WhatsApp" },
    { id: "telegram", name: "Telegram" },
    { id: "spotify", name: "Spotify" },
    { id: "twitter", name: "Twitter / X" }
  ];
  res.json({ platforms });
};
