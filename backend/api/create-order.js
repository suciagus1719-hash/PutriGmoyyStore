const fetch = require("node-fetch");
const { callPanel } = require("./_smmClient");
const { normalizeServicesResponse } = require("./_platformUtils");
const { getServiceId, getServicePrice, getServiceName } = require("./_serviceParser");

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_SNAP_BASE_URL =
  process.env.MIDTRANS_SNAP_BASE_URL || "https://app.sandbox.midtrans.com";
const PUBLIC_FRONTEND_URL =
  process.env.PUBLIC_FRONTEND_URL || "https://suciagus1719-hash.github.io/PutriGmoyyStore/";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      platformId,
      categoryId,
      serviceId,
      target,
      quantity,
      buyer = {},
    } = req.body;

    if (!platformId || !categoryId || !serviceId || !target || !quantity) {
      return res.status(400).json({ error: "Data pesanan tidak lengkap" });
    }

    if (!MIDTRANS_SERVER_KEY) {
      return res.status(500).json({ error: "MIDTRANS_SERVER_KEY belum diset di ENV." });
    }

    // Ambil detail layanan untuk hitung total harga
    const panelRes = await callPanel({ action: "services" });
    const services = normalizeServicesResponse(panelRes);
    const svc = services.find((s) => String(getServiceId(s)) === String(serviceId));
    if (!svc) return res.status(400).json({ error: "Layanan tidak ditemukan" });

    const rate = getServicePrice(svc); // harga per 1000
    const qty = Number(quantity);
    const paymentAmount = Math.round((rate / 1000) * qty);

    const orderId = `GMYY-${Date.now()}`;

    const frontendBase = PUBLIC_FRONTEND_URL.endsWith("/")
      ? PUBLIC_FRONTEND_URL
      : `${PUBLIC_FRONTEND_URL}/`;
    const receiptParams = new URLSearchParams({
      order_id: orderId,
      service_id: String(serviceId),
      service_name: getServiceName(svc),
      category: svc.category || categoryId || "",
      target,
      quantity: String(quantity),
      gross_amount: String(paymentAmount),
      payment_type: "QRIS (GoPay)",
      request_time: new Date().toISOString(),
    }).toString();

    const body = {
      transaction_details: {
        order_id: orderId,
        gross_amount: paymentAmount,
      },
      customer_details: {
        first_name: buyer.name || "Guest",
        email: buyer.email || "noemail@example.com",
        phone: buyer.whatsapp || "08123456789",
      },
      enabled_payments: ["gopay"],
      item_details: [
        {
          id: String(serviceId),
          price: paymentAmount,
          quantity: 1,
          name: getServiceName(svc).substring(0, 50),
        },
      ],
      custom_field1: String(serviceId),
      custom_field2: target,
      custom_field3: String(quantity),
      callbacks: {
        finish: `${frontendBase}struk.html?${receiptParams}`,
        error: frontendBase,
      },
    };

    const snapUrl = `${MIDTRANS_SNAP_BASE_URL}/snap/v1/transactions`;
    const auth = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");

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
      console.error("Midtrans error:", midJson);
      return res.status(500).json({ error: "Gagal membuat transaksi Midtrans" });
    }

    res.json({
      redirectUrl: midJson.redirect_url,
      token: midJson.token,
      orderId,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Terjadi kesalahan saat membuat order" });
  }
};
