const fetch = require("node-fetch");
const crypto = require("crypto");
const { findUser, updateUser } = require("./_accountStore");

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;
const MIDTRANS_SNAP_BASE_URL =
  process.env.MIDTRANS_SNAP_BASE_URL || "https://app.sandbox.midtrans.com";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
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
        finish: `${process.env.PUBLIC_FRONTEND_URL || ""}deposit-success.html`,
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
    if (!midRes.ok || !midJson.token) {
      console.error("Midtrans deposit error:", midJson);
      return res.status(500).json({ error: "Gagal membuat transaksi deposit" });
    }

    res.json({
      token: midJson.token,
      redirectUrl: midJson.redirect_url,
      orderId,
      amount: numeric,
    });
  } catch (e) {
    console.error("create-deposit error:", e);
    res.status(500).json({ error: "Gagal membuat deposit" });
  }
};
