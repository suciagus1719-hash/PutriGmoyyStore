const fetch = require("node-fetch");
const { updateUser } = require("./accountStore");
const { getOrder, updateOrder } = require("./orderStore");

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const SNAP_BASE = process.env.MIDTRANS_SNAP_BASE_URL || "https://app.sandbox.midtrans.com";
const MIDTRANS_API_BASE_URL =
  process.env.MIDTRANS_API_BASE_URL ||
  (SNAP_BASE.includes("sandbox") ? "https://api.sandbox.midtrans.com" : "https://api.midtrans.com");

async function refundMidtrans(orderId, amount, reason) {
  if (!MIDTRANS_SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY belum disetel untuk refund.");
  }
  const endpoint = `${MIDTRANS_API_BASE_URL}/v2/${orderId}/refund`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Number(amount || 0),
      reason: reason || "Panel error",
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (json && json.status_message) || "Refund Midtrans gagal";
    throw new Error(message);
  }
  return json;
}

async function refundResellerBalance(identifier, amount) {
  const updated = updateUser(identifier, (current) => ({
    balance: Number(current.balance || 0) + Number(amount || 0),
  }));
  if (!updated) throw new Error("Gagal mengembalikan saldo reseller.");
  return {
    identifier: updated.identifier || identifier,
    balance: updated.balance,
  };
}

async function refundOrder(orderOrId, options = {}) {
  const order = typeof orderOrId === "object" ? orderOrId : getOrder(orderOrId);
  if (!order) throw new Error("Order tidak ditemukan");
  if (order.refundStatus === "completed") {
    return order;
  }
  const amount = Number(order.price || 0);
  if (!amount) throw new Error("Nominal refund tidak valid");
  const reason = options.reason || "Panel error";
  let refundResponse = null;
  if (order.type === "midtrans") {
    refundResponse = await refundMidtrans(order.id, amount, reason);
  } else if (order.type === "reseller" && order.resellerIdentifier) {
    refundResponse = await refundResellerBalance(order.resellerIdentifier, amount);
  } else {
    throw new Error("Metode refund tidak tersedia untuk order ini.");
  }
  const patch = updateOrder(order.id, {
    refundStatus: "completed",
    refundReason: reason,
    refundTime: new Date().toISOString(),
    refundedAmount: amount,
    refundResponse,
    status: options.status || "refunded",
    lastUpdate: new Date().toISOString(),
  });
  return patch || order;
}

module.exports = {
  refundOrder,
};
