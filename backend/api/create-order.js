const fetch = require("node-fetch");
const { callPanel } = require("../lib/smmClient");
const { normalizeServicesResponse } = require("../lib/platformUtils");
const {
  getServiceId,
  getServicePrice,
  getServiceName,
  getServiceDescription,
} = require("../lib/serviceParser");
const { findUser, updateUser } = require("../lib/accountStore");
const { appendOrder, updateOrder } = require("../lib/orderStore");

const PUBLIC_MARGIN = 0.4;
const RESELLER_MARGIN = 0.2;

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_SNAP_BASE_URL =
  process.env.MIDTRANS_SNAP_BASE_URL || "https://app.sandbox.midtrans.com";
const PUBLIC_FRONTEND_URL =
  process.env.PUBLIC_FRONTEND_URL || "https://suciagus1719-hash.github.io/PutriGmoyyStore/";

const COMMENT_TERMS = ["comment", "comments", "komentar", "komen"];
const COMMENT_MODE_TERMS = ["custom", "costum", "kostum", "costume", "manual", "isi sendiri"];

function requiresCustomComments(service) {
  const base = `${getServiceName(service) || ""} ${getServiceDescription(service) || ""}`.toLowerCase();
  if (!COMMENT_TERMS.some((term) => base.includes(term))) return false;
  return COMMENT_MODE_TERMS.some((term) => base.includes(term));
}

function normalizeComments(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(input || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

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
      useBalance,
      resellerIdentifier,
      customComments,
    } = req.body;

    if (!platformId || !categoryId || !serviceId || !target) {
      return res.status(400).json({ error: "Data pesanan tidak lengkap" });
    }

    const wantsBalance = Boolean(useBalance && resellerIdentifier);

    if (!wantsBalance && !MIDTRANS_SERVER_KEY) {
      return res.status(500).json({ error: "MIDTRANS_SERVER_KEY belum diset di ENV." });
    }

    // Ambil detail layanan untuk hitung total harga
    const panelRes = await callPanel({ action: "services" });
   const services = normalizeServicesResponse(panelRes);
    const svc = services.find((s) => String(getServiceId(s)) === String(serviceId));
    if (!svc) return res.status(400).json({ error: "Layanan tidak ditemukan" });

    const commentRequired = requiresCustomComments(svc);
    const commentList = commentRequired ? normalizeComments(customComments) : [];
    if (commentRequired && !commentList.length) {
      return res.status(400).json({ error: "Komentar wajib diisi untuk layanan ini." });
    }

    const qty = commentRequired ? commentList.length : Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: "Jumlah pesanan tidak valid." });
    }

    const rate = getServicePrice(svc); // harga per 1000
    const baseAmount = Math.round((rate / 1000) * qty);
    const margin = wantsBalance ? RESELLER_MARGIN : PUBLIC_MARGIN;
    const paymentAmount = Math.round(baseAmount * (1 + margin));

    const orderId = `GMYY-${Date.now()}`;

    const frontendBase = PUBLIC_FRONTEND_URL.endsWith("/")
      ? PUBLIC_FRONTEND_URL
      : `${PUBLIC_FRONTEND_URL}/`;
    const orderMeta = {
      target,
      quantity: qty,
    };
    if (commentList.length) {
      orderMeta.comments = commentList;
    }
    const orderMetaEncoded = Buffer.from(JSON.stringify(orderMeta)).toString("base64");

    const receiptParams = new URLSearchParams({
      order_id: orderId,
      service_id: String(serviceId),
      service_name: getServiceName(svc),
      category: svc.category || categoryId || "",
      target,
      quantity: String(qty),
      gross_amount: String(paymentAmount),
      payment_type: wantsBalance ? "Saldo Reseller" : "QRIS (GoPay)",
      request_time: new Date().toISOString(),
    }).toString();

    const orderRecord = {
      id: orderId,
      serviceId: String(serviceId),
      serviceName: getServiceName(svc),
      category: svc.category || "",
      platformId: svc.platformId || svc.platform,
      platformName: svc.platformName || "",
      target,
      quantity: qty,
      customComments: commentList,
      price: paymentAmount,
      buyer,
      status: wantsBalance ? "processing" : "pending_payment",
      type: wantsBalance ? "reseller" : "midtrans",
      createdAt: new Date().toISOString(),
      panelOrderId: null,
      panelStatus: null,
      startCount: null,
      remains: null,
      lastStatusSync: null,
      resellerIdentifier: resellerIdentifier || null,
    };
    appendOrder(orderRecord);

    if (wantsBalance) {
      const { user } = findUser(resellerIdentifier);
      if (!user) return res.status(404).json({ error: "Akun reseller tidak ditemukan" });
      const balance = Number(user.balance || 0);
      if (balance < paymentAmount) {
        return res.status(400).json({ error: "Saldo tidak mencukupi. Silakan deposit dulu." });
      }
      let panelResponse = null;
      try {
        const payload = {
          action: "order",
          service: serviceId,
          data: target,
          quantity: qty,
        };
        if (commentRequired && commentList.length) {
          const commentText = commentList.join("\n");
          payload.komen = commentText;
        }
        panelResponse = await callPanel(payload);
      } catch (e) {
        console.error("Gagal order panel via saldo:", e);
        return res.status(500).json({ error: "Gagal memproses pesanan ke panel." });
      }

      const updated = updateUser(resellerIdentifier, {
        balance: balance - paymentAmount,
      });
      const account = updated
        ? {
            id: updated.id,
            identifier: updated.identifier,
            displayName: updated.displayName,
            email: updated.email,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl,
            balance: updated.balance,
            coins: updated.coins || 0,
          }
        : null;

      const panelData = (panelResponse && panelResponse.data) || panelResponse || {};
      updateOrder(orderId, {
        status: panelData.status || "processing",
        panelStatus: panelData.status || null,
        panelOrderId: panelData.id || panelData.order_id || panelData.order || null,
        startCount: panelData.start_count ?? null,
        remains: panelData.remains ?? null,
        lastStatusSync: new Date().toISOString(),
        panelResponse: panelResponse || null,
      });

      return res.json({
        success: true,
        orderId,
        receiptUrl: `${frontendBase}struk.html?${receiptParams}`,
        account,
      });
    }

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
      item_details: [
        {
          id: String(serviceId),
          price: paymentAmount,
          quantity: 1,
          name: getServiceName(svc).substring(0, 50),
        },
      ],
      custom_field1: String(serviceId),
      custom_field2: orderMetaEncoded,
      custom_field3: String(qty),
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
