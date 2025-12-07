const fs = require("fs");
const path = require("path");

const DATA_DIR =
  process.env.ACCOUNT_DATA_DIR ||
  (process.env.VERCEL ? path.join("/tmp", "pg-users") : path.join(__dirname, "../data"));
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf8");
  }
}

function readUsers() {
  try {
    ensureFile();
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Gagal baca users.json:", e);
    return [];
  }
}

function saveUsers(users) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
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

function updateUser(identifier, updater) {
  const { users, index, user } = findUser(identifier);
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
};
