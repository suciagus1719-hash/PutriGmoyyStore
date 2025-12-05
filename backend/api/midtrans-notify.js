const crypto = require("crypto");
const { callPanel } = require("./_smmClient");

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
    const serviceId = custom_field1;
    const target = custom_field2;
    const quantity = custom_field3;

    if (!serviceId || !target || !quantity) {
      console.error("Data layanan tidak lengkap di custom_field, cek create-order.js");
    } else {
      try {
        const payload = {
          action: "order", // sesuai dokumentasi PusatPanelSMM
          service: serviceId,
          data: target,
        };
        if (quantity) {
          payload.quantity = quantity;
        }
        const panelRes = await callPanel(payload);
        console.log("Order dikirim ke panel:", panelRes);
      } catch (e) {
        console.error("Gagal mengirim order ke panel:", e);
      }
    }

    res.status(200).json({ message: "Notification processed" });
  } catch (e) {
    console.error("Error di Midtrans notify:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};
