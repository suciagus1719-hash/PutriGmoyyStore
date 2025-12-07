const crypto = require("crypto");
const fetch = require("node-fetch");
const {
  readUsers,
  saveUsers,
  normalizeIdentifier,
  findUser,
  updateUser,
} = require("../lib/accountStore");

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_SNAP_BASE_URL =
  process.env.MIDTRANS_SNAP_BASE_URL || "https://app.sandbox.midtrans.com";
const PUBLIC_FRONTEND_URL =
  process.env.PUBLIC_FRONTEND_URL || "https://suciagus1719-hash.github.io/PutriGmoyyStore/";

function sanitizeUser(user) {
  if (!user) return null;
  const { password, depositHistory, ...rest } = user;
  return rest;
}

async function handleCheck(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { identifier } = req.body || {};
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return res.status(400).json({ error: "Identifier tidak valid" });
  const users = readUsers();
  const exists = users.some((u) => u.normalized === normalized);
  return res.json({ exists });
}

async function handleRegister(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
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
    coins: 0,
    createdAt: new Date().toISOString(),
    displayName,
    email,
    phone,
    avatarUrl: "",
    depositHistory: [],
  };
  users.push(user);
  saveUsers(users);
  res.json({ success: true, user: sanitizeUser(user) });
}

async function handleLogin(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { identifier, password } = req.body || {};
  const normalized = normalizeIdentifier(identifier);
  if (!normalized || !password) {
    return res.status(400).json({ error: "Data login tidak lengkap" });
  }
  const users = readUsers();
  const hashed = crypto.createHash("sha256").update(password).digest("hex");
  const user = users.find((u) => u.normalized === normalized && u.password === hashed);
  if (!user) return res.status(401).json({ error: "Email/nomor atau password salah" });
  res.json({ success: true, user: sanitizeUser(user) });
}

async function handleProfile(req, res) {
  if (req.method === "GET") {
    const identifier = normalizeIdentifier(req.query.identifier);
    if (!identifier) return res.status(400).json({ error: "Identifier tidak valid" });
    const { user } = findUser(identifier);
    if (!user) return res.status(404).json({ error: "Akun tidak ditemukan" });
    return res.json({ user: sanitizeUser(user) });
  }
  if (req.method === "POST") {
    const {
      identifier,
      displayName,
      email,
      phone,
      avatarUrl,
      newPassword,
    } = req.body || {};
    if (!identifier) return res.status(400).json({ error: "Identifier wajib diisi" });
    const { users, index, user } = findUser(identifier);
    if (index < 0) return res.status(404).json({ error: "Akun tidak ditemukan" });

    if (email) {
      if (!email.includes("@")) return res.status(400).json({ error: "Email tidak valid" });
      const normalizedEmail = normalizeIdentifier(email);
      const existing = users.find(
        (u, idx) => idx !== index && u.normalized === normalizedEmail
      );
      if (existing) return res.status(400).json({ error: "Email sudah digunakan" });
      user.identifier = email.trim().toLowerCase();
      user.normalized = normalizedEmail;
      user.email = email.trim().toLowerCase();
    }
    if (phone) user.phone = phone.trim();
    if (displayName) user.displayName = displayName.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password minimal 6 karakter" });
      }
      user.password = crypto.createHash("sha256").update(newPassword).digest("hex");
    }
    users[index] = user;
    saveUsers(users);
    return res.json({ success: true, user: sanitizeUser(user) });
  }
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleCreateDeposit(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { identifier, amount } = req.body || {};
  if (!identifier || !amount) return res.status(400).json({ error: "Data tidak lengkap" });
  const numeric = Number(amount);
  if (Number.isNaN(numeric) || numeric < 10000) {
    return res.status(400).json({ error: "Minimal deposit Rp 10.000" });
  }
  if (!MIDTRANS_SERVER_KEY) {
    return res.status(500).json({ error: "MIDTRANS_SERVER_KEY belum diset" });
  }
  const { user } = findUser(identifier);
  if (!user) return res.status(404).json({ error: "Akun tidak ditemukan" });

  const orderId = `DEPO-${Date.now()}`;
  const snapUrl = `${MIDTRANS_SNAP_BASE_URL}/snap/v1/transactions`;
  const auth = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");

  const body = {
    transaction_details: {
      order_id: orderId,
      gross_amount: numeric,
    },
    customer_details: {
      first_name: user.displayName || "Reseller",
      email: user.email || "noemail@example.com",
      phone: user.phone || "08123456789",
    },
    custom_field1: identifier,
    custom_field2: "DEPOSIT",
    custom_field3: String(numeric),
    callbacks: {
      finish: `${PUBLIC_FRONTEND_URL}deposit-success.html`,
    },
  };

  const midRes = await fetch(snapUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });
  const midJson = await midRes.json();
  if (!midRes.ok || !midJson.redirect_url) {
    console.error("Midtrans deposit error:", midJson);
    return res.status(500).json({ error: "Gagal membuat transaksi deposit" });
  }

  res.json({
    redirectUrl: midJson.redirect_url,
    token: midJson.token,
    orderId,
    amount: numeric,
  });
}

async function handleHistory(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const identifier = req.query.identifier;
  if (!identifier) return res.status(400).json({ error: "Identifier diperlukan" });
  const { user } = findUser(identifier);
  if (!user) return res.status(404).json({ error: "Akun tidak ditemukan" });
  res.json({
    history: Array.isArray(user.depositHistory) ? user.depositHistory : [],
    balance: user.balance || 0,
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = String(req.query.action || req.body?.action || "").toLowerCase();
  try {
    switch (action) {
      case "check":
        return handleCheck(req, res);
      case "register":
        return handleRegister(req, res);
      case "login":
        return handleLogin(req, res);
      case "profile":
        return handleProfile(req, res);
      case "create-deposit":
        return handleCreateDeposit(req, res);
      case "history":
        return handleHistory(req, res);
      default:
        return res.status(404).json({ error: "Action tidak dikenal" });
    }
  } catch (e) {
    console.error("Reseller API error:", e);
    res.status(500).json({ error: "Terjadi kesalahan pada server reseller" });
  }
};
