const fs = require("fs");
const path = require("path");

const DATA_DIR =
  process.env.ACCOUNT_DATA_DIR ||
  (process.env.VERCEL ? path.join("/tmp", "pg-users") : path.join(__dirname, "../data"));
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CACHE_KEY = "__PG_ACCOUNT_CACHE__";

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf8");
  }
}

function setCachedUsers(list) {
  globalThis[CACHE_KEY] = Array.isArray(list) ? list : [];
}

function getCachedUsers() {
  const cached = globalThis[CACHE_KEY];
  if (Array.isArray(cached)) {
    return cached;
  }
  return null;
}

function readUsers() {
  const cached = getCachedUsers();
  if (cached) return cached.map((item) => ({ ...item }));
  try {
    ensureFile();
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    setCachedUsers(list.map((item) => ({ ...item })));
    return list;
  } catch (e) {
    console.error("Gagal baca users.json:", e);
    setCachedUsers([]);
    return [];
  }
}

function saveUsers(users) {
  ensureFile();
  const normalized = Array.isArray(users) ? users : [];
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(normalized, null, 2), "utf8");
  } catch (err) {
    console.error("Gagal menulis users.json:", err);
  }
  setCachedUsers(normalized.map((item) => ({ ...item })));
}

function normalizeIdentifier(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return trimmed.replace(/\D+/g, "");
}

function findUser(identifier) {
  const normalized = normalizeIdentifier(identifier);
  const users = readUsers();
  const index = users.findIndex((u) => u.normalized === normalized);
  return { users, index, user: index >= 0 ? users[index] : null };
}

function findUserById(id) {
  const users = readUsers();
  const index = users.findIndex((u) => String(u.id) === String(id));
  return { users, index, user: index >= 0 ? users[index] : null };
}

function updateUser(identifier, updater) {
  const { users, index, user } = findUser(identifier);
  if (index < 0) return null;
  const patch = typeof updater === "function" ? updater({ ...user }) : updater;
  const updated = { ...user, ...patch };
  users[index] = updated;
  saveUsers(users);
  return updated;
}

function updateUserById(id, updater) {
  const { users, index, user } = findUserById(id);
  if (index < 0) return null;
  const patch = typeof updater === "function" ? updater({ ...user }) : updater;
  const updated = { ...user, ...patch };
  users[index] = updated;
  saveUsers(users);
  return updated;
}

module.exports = {
  readUsers,
  saveUsers,
  normalizeIdentifier,
  findUser,
  updateUser,
  findUserById,
  updateUserById,
};
