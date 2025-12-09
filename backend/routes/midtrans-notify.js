const crypto = require("crypto");
const { callPanel } = require("../lib/smmClient");
const { updateUser } = require("../lib/accountStore");
const { recordDeposit } = require("../lib/depositStore");
const { updateOrder, getOrder } = require("../lib/orderStore");
const { refundOrder } = require("../lib/refundManager");

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

// Endpoint untuk menerima HTTP notification dari Midtrans
module.exports = async (req, res) => {
  try {
    let data = req.body;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // ignore parse error
      }
    }

    console.log("Midtrans notify:", data);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      custom_field1,
      custom_field2,
      custom_field3,
    } = data;

    if (!MIDTRANS_SERVER_KEY) {
      console.error("MIDTRANS_SERVER_KEY belum diset");
      return res.status(500).json({ error: "Server key tidak ada" });
    }

    // Validasi signature
    const serverSig = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (serverSig !== signature_key) {
      console.error("Signature tidak valid");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const successStatuses = ["capture", "settlement"];
    if (!successStatuses.includes(transaction_status)) {
      console.log("Transaksi belum sukses:", transaction_status);
      return res.status(200).json({ message: "Not success, ignored" });
    }

    // Ambil data layanan dari custom_field
    const field1 = custom_field1;
    const rawField2 = custom_field2;
    const field3 = custom_field3;

    // Jika custom_field2 berisi tanda deposit, tambahkan saldo
    if (rawField2 === "DEPOSIT") {
      const identifier = field1;
      const amount = Number(field3);
      if (!identifier || Number.isNaN(amount)) {
        console.error("Data deposit tidak valid");
      } else {
        const updated = await updateUser(identifier, (current) => {
          const history = Array.isArray(current.depositHistory)
            ? current.depositHistory
            : [];
          history.push({
            orderId: order_id,
            amount,
            method: data.payment_type || "midtrans",
            status: "success",
            time: new Date().toISOString(),
          });
          return {
            balance: Number(current.balance || 0) + amount,
            depositHistory: history,
          };
        });
        if (!updated) console.error("Gagal memperbarui saldo deposit");
        try {
          await recordDeposit({
            id: order_id,
            identifier,
            amount,
            method: data.payment_type || "midtrans",
            status: "success",
            metadata: data,
            createdAt: new Date().toISOString(),
          });
        } catch (depErr) {
          console.error("Gagal menyimpan riwayat deposit:", depErr);
        }
      }
    } else if (!field1 || !rawField2 || !field3) {
      console.error("Data layanan tidak lengkap di custom_field, cek create-order.js");
    } else {
      let parsedTarget = rawField2;
      let parsedQuantity = field3;
      let parsedComments = null;
      if (rawField2 && rawField2 !== "DEPOSIT") {
        try {
          const decoded = JSON.parse(Buffer.from(String(rawField2), "base64").toString("utf8"));
          if (decoded && typeof decoded === "object") {
            if (decoded.target) parsedTarget = decoded.target;
            if (decoded.quantity) parsedQuantity = decoded.quantity;
            if (Array.isArray(decoded.comments)) parsedComments = decoded.comments;
          }
        } catch (err) {
          // treat as plain text
        }
      }

      try {
        await updateOrder(order_id, {
          status: "processing",
          paymentType: data.payment_type || "midtrans",
          paidAt: new Date().toISOString(),
        });
        const payload = {
          action: "order", // sesuai dokumentasi PusatPanelSMM
          service: field1,
          data: parsedTarget,
        };
        if (parsedQuantity) {
          payload.quantity = parsedQuantity;
        }
        const existing = await getOrder(order_id);
        const commentsList = parsedComments?.length
          ? parsedComments
          : existing?.customComments || [];
        if (commentsList.length) {
          const commentText = commentsList.join("\n");
          payload.komen = commentText;
        }
        const panelRes = await callPanel(payload);
        console.log("Order dikirim ke panel:", panelRes);
        const panelData = (panelRes && panelRes.data) || panelRes || {};
        await updateOrder(order_id, {
          panelResponse: panelRes,
          panelOrderId: panelData.id || panelData.order_id || panelData.order || null,
          status: panelData.status || "processing",
          panelStatus: panelData.status || null,
          startCount: panelData.start_count ?? null,
          remains: panelData.remains ?? null,
          lastStatusSync: new Date().toISOString(),
        });
        const normalizedStatus = String(panelData.status || "").toLowerCase();
        if (["partial", "error", "cancel", "cancelled", "canceled"].includes(normalizedStatus)) {
          try {
            await refundOrder(order_id, {
              reason: `Panel status ${panelData.status || normalizedStatus}`,
            });
          } catch (refundErr) {
            console.error("Auto refund gagal:", refundErr);
          }
        }
      } catch (e) {
        console.error("Gagal mengirim order ke panel:", e);
        await updateOrder(order_id, {
          status: "error",
          errorMessage: String(e.message || e),
          lastUpdate: new Date().toISOString(),
        });
        try {
          await refundOrder(order_id, { reason: `Gagal order panel: ${e.message || e}` });
        } catch (refundErr) {
          console.error("Auto refund gagal:", refundErr);
        }
      }
    }

    res.status(200).json({ message: "Notification processed" });
  } catch (e) {
    console.error("Error di Midtrans notify:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};
