const nodemailer = require("nodemailer");

let transporter;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) {
    console.warn(
      "SMTP konfigurasi belum lengkap. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS untuk mengirim email notifikasi."
    );
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!to) return false;
  if (!transporter) {
    transporter = createTransporter();
    if (!transporter) return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (e) {
    console.error("Gagal mengirim email:", e);
    return false;
  }
}

module.exports = {
  sendMail,
};
