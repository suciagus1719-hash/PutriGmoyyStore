const crypto = require("crypto");
const { callPanel } = require("../lib/smmClient");
const { listRecentOrders, updateOrder } = require("../lib/orderStore");
const { readUsers, updateUser, updateUserById, normalizeIdentifier } = require("../lib/accountStore");

const OWNER_PASSWORD = process.env.OWNER_PANEL_PASSWORD || "Senjasuci1719";

function sanitizeReseller(user) {
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

async function handleOrders(res) {
  const recentOrders = listRecentOrders(15);
  const rows = [];
  for (const order of recentOrders) {
    let latest = order;
    if (order.panelOrderId) {
      try {
        const panelRes = await callPanel({ action: "status", id: order.panelOrderId });
        const panelData = (panelRes && panelRes.data) || panelRes || {};
        latest =
          updateOrder(order.id, {
            status: panelData.status || order.status,
            panelStatus: panelData.status || order.panelStatus || null,
            startCount: panelData.start_count ?? order.startCount ?? null,
            remains: panelData.remains ?? order.remains ?? null,
            lastStatusSync: new Date().toISOString(),
          }) || order;
      } catch (err) {
        console.error("owner orders panel error:", err);
      }
    }
    rows.push({
      id: latest.id,
      type: latest.type || "public",
      serviceName: latest.serviceName || latest.serviceId || "-",
      target: latest.target || "-",
      price: Number(latest.price || 0),
      status: latest.panelStatus || latest.status || "processing",
      createdAt: latest.createdAt,
      lastUpdate: latest.lastStatusSync || latest.updatedAt || latest.createdAt,
      isReseller: latest.type === "reseller",
      resellerIdentifier: latest.resellerIdentifier || null,
      buyerName: latest.buyer?.name || null,
      detail: {
        orderId: latest.id,
        serviceId: latest.serviceId,
        serviceName: latest.serviceName || "-",
        category: latest.category || "-",
        platform: latest.platformName || latest.platformId || "-",
        target: latest.target || "-",
        quantity: latest.quantity || 0,
        customComments: Array.isArray(latest.customComments) ? latest.customComments : [],
        paymentType: latest.type === "reseller" ? "Saldo Reseller" : "Midtrans",
        grossAmount: Number(latest.price || 0),
        buyer: latest.buyer || {},
        panelOrderId: latest.panelOrderId || "-",
        panelStatus: latest.panelStatus || latest.status || "-",
        startCount: latest.startCount ?? null,
        remains: latest.remains ?? null,
        createdAt: latest.createdAt,
        updatedAt: latest.lastStatusSync || latest.updatedAt || latest.createdAt,
      },
    });
  }

  const stats = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc.revenue += Number(row.price || 0);
      if (row.isReseller) acc.reseller += 1;
      else acc.public += 1;
      const normalized = String(row.status || "").toLowerCase();
      if (normalized.includes("pending")) acc.pending += 1;
      else if (normalized.includes("error") || normalized.includes("partial")) acc.failed += 1;
      else if (
        normalized.includes("success") ||
        normalized.includes("selesai") ||
        normalized.includes("complete") ||
        normalized.includes("done")
      ) {
        acc.success += 1;
      }
      return acc;
    },
    { total: 0, public: 0, reseller: 0, pending: 0, success: 0, failed: 0, revenue: 0 }
  );

  return res.json({ rows, stats });
}

async function filterResellers(q) {
  const term = String(q || "").trim().toLowerCase();
  const users = await readUsers();
  let filtered = users;
  if (term) {
    filtered = users.filter((u) => {
      const ident = String(u.identifier || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const phone = String(u.phone || "").toLowerCase();
      return ident.includes(term) || email.includes(term) || phone.includes(term);
    });
  }
  const sorted = filtered.slice().sort((a, b) => {
    const balanceDiff = Number(b.balance || 0) - Number(a.balance || 0);
    if (balanceDiff !== 0) return balanceDiff;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  const summary = {
    total: users.length,
    blocked: users.filter((u) => u.blockedStatus && u.blockedStatus !== "none").length,
  };
  summary.active = summary.total - summary.blocked;
  return { rows: sorted.map(sanitizeReseller), summary };
}

async function updateReseller(payload = {}) {
  const {
    id,
    identifier,
    displayName,
    email,
    phone,
    newPassword,
    balanceDelta,
    blockedStatus,
  } = payload;
  if (!id && !identifier) throw new Error("Identifier wajib diisi");

  const applyChanges = (current) => {
    if (!current) throw new Error("Akun tidak ditemukan");
    const next = { ...current };
    if (displayName !== undefined) next.displayName = displayName ? displayName.trim() : next.displayName;
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
  };

  const patched =
    (id ? await updateUserById(id, applyChanges) : null) ||
    (identifier ? await updateUser(identifier, applyChanges) : null);
  if (!patched) throw new Error("Akun tidak ditemukan");
  return sanitizeReseller(patched);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const action = String(req.query.action || req.body?.action || "orders").toLowerCase();

    if (req.method === "GET" && action === "orders") {
      return handleOrders(res);
    }

    if (req.method === "GET" && action === "resellers") {
      const { rows, summary } = await filterResellers(req.query.q || "");
      return res.json({ rows, summary });
    }

    if (req.method === "POST" && action === "resellers") {
      try {
        const user = await updateReseller(req.body || {});
        return res.json({ success: true, user });
      } catch (e) {
        console.error("owner reseller update error:", e);
        return res.status(400).json({ error: e.message || "Gagal memperbarui reseller" });
      }
    }

    if (req.method === "POST" && action === "profile") {
      const { password } = req.body || {};
      if (!password || password !== OWNER_PASSWORD) {
        return res.status(401).json({ error: "Password owner salah" });
      }
      const panelRes = await callPanel({ action: "profile" });
      const profile = panelRes?.data || panelRes || {};
      return res.json({ profile });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("owner API error:", e);
    res.status(500).json({ error: "Terjadi kesalahan pada server owner" });
  }
};
