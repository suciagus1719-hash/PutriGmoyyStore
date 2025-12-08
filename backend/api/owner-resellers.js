const crypto = require("crypto");
const {
  readUsers,
  updateUser,
  normalizeIdentifier,
} = require("../lib/accountStore");

function sanitizeAdminUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    identifier: user.identifier,
    displayName: user.displayName || "",
    email: user.email || "",
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",
    balance: Number(user.balance || 0),
    blockedStatus: user.blockedStatus || "none",
    createdAt: user.createdAt,
  };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    try {
      const q = String(req.query?.q || "").trim().toLowerCase();
      const users = readUsers();
      let filtered = users;
      if (q) {
        filtered = users.filter((u) => {
          const ident = String(u.identifier || "").toLowerCase();
          const email = String(u.email || "").toLowerCase();
          const phone = String(u.phone || "").toLowerCase();
          return ident.includes(q) || email.includes(q) || phone.includes(q);
        });
      }
      const sorted = filtered
        .slice()
        .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));
      const rows = sorted.slice(0, 10).map(sanitizeAdminUser);
      const total = users.length;
      const blocked = users.filter((u) => u.blockedStatus && u.blockedStatus !== "none").length;
      const summary = {
        total,
        active: total - blocked,
        blocked,
      };
      res.json({ rows, summary });
    } catch (e) {
      console.error("owner-resellers GET error:", e);
      res.status(500).json({ error: "Gagal memuat data reseller" });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      const {
        identifier,
        displayName,
        email,
        phone,
        newPassword,
        balanceDelta,
        blockedStatus,
      } = req.body || {};
      if (!identifier) return res.status(400).json({ error: "Identifier wajib diisi" });

      const patched = updateUser(identifier, (current) => {
        if (!current) throw new Error("Akun tidak ditemukan");
        const next = { ...current };
        if (displayName) next.displayName = displayName.trim();
        if (email) {
          next.email = email.trim().toLowerCase();
          next.identifier = email.trim().toLowerCase();
          next.normalized = normalizeIdentifier(email);
        }
        if (phone !== undefined) next.phone = phone.trim();
        if (typeof balanceDelta === "number" && !Number.isNaN(balanceDelta)) {
          next.balance = Math.max(0, Number(next.balance || 0) + balanceDelta);
        }
        if (newPassword) {
          if (newPassword.length < 6) throw new Error("Password minimal 6 karakter");
          next.password = crypto.createHash("sha256").update(newPassword).digest("hex");
        }
        if (blockedStatus) next.blockedStatus = blockedStatus;
        return next;
      });
      if (!patched) return res.status(404).json({ error: "Akun tidak ditemukan" });
      res.json({ success: true, user: sanitizeAdminUser(patched) });
    } catch (e) {
      console.error("owner-resellers POST error:", e);
      res.status(400).json({ error: e.message || "Gagal memperbarui reseller" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};

