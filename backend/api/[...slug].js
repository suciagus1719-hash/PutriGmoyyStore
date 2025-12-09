const { URL } = require("url");

const routeHandlers = {
  "catalog": require("../routes/catalog"),
  "categories": require("../routes/categories"),
  "create-order": require("../routes/create-order"),
  "midtrans-notify": require("../routes/midtrans-notify"),
  "order-status": require("../routes/order-status"),
  "order-track": require("../routes/order-track"),
  "orders": require("../routes/orders"),
  "owner": require("../routes/owner"),
  "platforms": require("../routes/platforms"),
  "reseller": require("../routes/reseller"),
  "settings": require("../routes/settings"),
  "service": require("../routes/service"),
  "services": require("../routes/services"),
};

function extractPath(req) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let path = url.pathname.replace(/^\/api\/?/, "");
  path = path.replace(/\/$/, "");
  return path.toLowerCase();
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  const path = extractPath(req);
  if (!path) {
    return sendJson(res, 200, { ok: true, message: "PutriGmoyy API ready" });
  }

  const handler = routeHandlers[path];
  if (!handler) {
    return sendJson(res, 404, { error: `Endpoint ${path} tidak ditemukan` });
  }

  try {
    await handler(req, res);
    if (!res.writableEnded) {
      res.end();
    }
  } catch (err) {
    console.error(`Router error on ${path}:`, err);
    if (res.writableEnded) return;
    sendJson(res, 500, { error: "Terjadi kesalahan pada server" });
  }
};
