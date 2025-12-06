const { readUsers, normalizeIdentifier } = require("./_accountStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { identifier } = req.body || {};
    const normalized = normalizeIdentifier(identifier);
    if (!normalized) {
      return res.status(400).json({ error: "Identifier tidak valid" });
    }
    const users = readUsers();
    const exists = users.some((u) => u.normalized === normalized);
    res.json({ exists });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal memeriksa akun" });
  }
};
