const fs = require("fs");
const path = require("path");

const DATA_DIR =
  process.env.ACCOUNT_DATA_DIR ||
  (process.env.VERCEL ? path.join("/tmp", "pg-users") : path.join(__dirname, "../data"));
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
  }
}

function readOrders() {
  try {
    ensureFile();
    const raw = fs.readFileSync(ORDERS_FILE, "utf8");
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Gagal baca orders.json:", e);
    return [];
  }
}

function saveOrders(list) {
  ensureFile();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(list, null, 2), "utf8");
}

function appendOrder(order) {
  const list = readOrders();
  const existingIndex = list.findIndex((item) => item.id === order.id);
  if (existingIndex >= 0) {
    list.splice(existingIndex, 1);
  }
  list.unshift(order);
  if (list.length > 15) {
    list.length = 15;
  }
  saveOrders(list);
  return order;
}

function getOrder(id) {
  const list = readOrders();
  return list.find((item) => item.id === id) || null;
}

function updateOrder(id, patch = {}) {
  const list = readOrders();
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const updated =
    typeof patch === "function" ? patch({ ...list[index] }) : { ...list[index], ...patch };
  list[index] = updated;
  saveOrders(list);
  return updated;
}

function listOrders({ page = 1, limit = 10, status, search } = {}) {
  const list = readOrders();
  let filtered = list;
  if (status && status !== "all") {
    filtered = filtered.filter((item) => String(item.status).toLowerCase() === status.toLowerCase());
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        String(item.id).toLowerCase().includes(term) ||
        String(item.target || "").toLowerCase().includes(term)
    );
  }
  const total = filtered.length;
  const start = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const end = start + Math.max(1, Number(limit));
  const rows = filtered.slice(start, end);
  return {
    total,
    rows,
  };
}

function listRecentOrders(limit = 15) {
  const list = readOrders();
  return list.slice(0, Math.max(0, Number(limit) || 0));
}

module.exports = {
  appendOrder,
  getOrder,
  updateOrder,
  listOrders,
  listRecentOrders,
};
