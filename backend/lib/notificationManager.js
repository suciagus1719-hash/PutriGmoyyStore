const { getOrder, updateOrder } = require("./orderStore");
const { sendMail } = require("./emailClient");

const STATUS_LABELS = {
  pending_payment: "Menunggu Pembayaran",
  processing: "Sedang Diproses",
  success: "Berhasil",
  complete: "Selesai",
  done: "Selesai",
  error: "Gagal",
  failed: "Gagal",
  partial: "Partial / Sebagian",
  refund: "Dikembalikan",
  refunded: "Dana Dikembalikan",
  cancel: "Dibatalkan",
  cancelled: "Dibatalkan",
  canceled: "Dibatalkan",
};

function buildEmailBody(order, label, options = {}) {
  const infoRows = [
    { label: "Order ID", value: order.id },
    { label: "Layanan", value: order.serviceName || order.serviceId },
    { label: "Target", value: order.target || "-" },
    { label: "Jumlah", value: order.quantity },
    { label: "Nominal", value: `Rp ${Number(order.price || 0).toLocaleString("id-ID")}` },
  ];
  const rowsHtml = infoRows
    .map(
      (item) =>
        `<tr><td style="padding:4px 8px;color:#6b7280;">${item.label}</td><td style="padding:4px 8px;font-weight:600;color:#111827;">${item.value}</td></tr>`
    )
    .join("");
  const extraMessage = options.message
    ? `<p style="margin:16px 0;color:#374151;">${options.message}</p>`
    : "";
  return {
    text: `Status pesanan ${order.id} berubah menjadi ${label}. Layanan: ${order.serviceName}. Target: ${order.target}.`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#f9fafb;padding:20px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:24px;border:1px solid #e5e7eb;">
          <h2 style="margin:0 0 6px;color:#111827;">Status Pesanan: ${label}</h2>
          <p style="margin:0 0 16px;color:#4b5563;">Halo ${
            order.buyer?.name || order.buyerName || "Customer"
          }, status pesanan kamu telah diperbarui.</p>
          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;overflow:hidden;">
            ${rowsHtml}
          </table>
          ${extraMessage}
          <p style="margin-top:18px;color:#6b7280;font-size:13px;">Putri Gmoyy Store &mdash; layanan otomatis 24/7.</p>
        </div>
      </div>
    `,
  };
}

async function notifyStatusChange(orderOrId, status, options = {}) {
  const order = typeof orderOrId === "object" ? orderOrId : getOrder(orderOrId);
  if (!order) return false;
  const normalized = String(status || order.status || "").toLowerCase();
  if (!normalized) return false;
  const email = order.buyer?.email || order.buyerEmail;
  if (!email || email === "noemail@example.com") return false;
  const last = (order.lastNotifiedStatus || "").toLowerCase();
  if (last === normalized && !options.force) return false;
  const label = STATUS_LABELS[normalized] || status || normalized;
  const { html, text } = buildEmailBody(order, label, options);
  const subject = `[Putri Gmoyy] Status Pesanan ${order.id} - ${label}`;
  const sent = await sendMail({ to: email, subject, html, text });
  if (sent) {
    updateOrder(order.id, {
      lastNotifiedStatus: normalized,
      lastNotifiedAt: new Date().toISOString(),
    });
  }
  return sent;
}

module.exports = {
  notifyStatusChange,
};
