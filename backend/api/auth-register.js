const crypto = require("crypto");
const { readUsers, saveUsers, normalizeIdentifier } = require("./_accountStore");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { identifier, password } = req.body || {};
    const normalized = normalizeIdentifier(identifier);
    if (!normalized || !password || password.length < 6) {
      return res.status(400).json({ error: "Data registrasi tidak valid" });
    }

    const users = readUsers();
    if (users.some((u) => u.normalized === normalized)) {
      return res.status(400).json({ error: "Akun sudah terdaftar" });
    }

    const email = identifier.includes("@") ? identifier.trim().toLowerCase() : "";
    const phone = identifier.includes("@") ? "" : identifier.trim();
    const displayName = identifier.includes("@")
      ? identifier.split("@")[0]
      : `User${Date.now().toString().slice(-4)}`;

    const hashed = crypto.createHash("sha256").update(password).digest("hex");
    const user = {
      id: `USR-${Date.now()}`,
      identifier: identifier.trim(),
      normalized,
      password: hashed,
      balance: 0,
      createdAt: new Date().toISOString(),
      displayName,
      email,
      phone,
      avatarUrl: "",
      depositHistory: [],
    };
    users.push(user);
    saveUsers(users);

    res.json({
      success: true,
      user: {
        id: user.id,
        identifier: user.identifier,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        balance: user.balance,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal registrasi akun" });
  }
};
