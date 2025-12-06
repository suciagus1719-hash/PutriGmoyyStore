const crypto = require("crypto");
const { readUsers, normalizeIdentifier } = require("./_accountStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { identifier, password } = req.body || {};
    const normalized = normalizeIdentifier(identifier);
    if (!normalized || !password) {
      return res.status(400).json({ error: "Data login tidak lengkap" });
    }

    const users = readUsers();
    const hashed = crypto.createHash("sha256").update(password).digest("hex");
    const user = users.find((u) => u.normalized === normalized && u.password === hashed);
    if (!user) {
      return res.status(401).json({ error: "Email/nomor atau password salah" });
    }

    res.json({
      success: true,
      user: { id: user.id, identifier: user.identifier, balance: user.balance },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal login" });
  }
};
