const { callPanel } = require("../lib/smmClient");
const { collectPlatforms, normalizeServicesResponse } = require("../lib/platformUtils");

const FALLBACK_PLATFORMS = [
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "facebook", name: "Facebook" },
  { id: "telegram", name: "Telegram" },
  { id: "shopee", name: "Shopee" },
  { id: "threads", name: "Threads" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "spotify", name: "Spotify" },
  { id: "discord", name: "Discord" },
  { id: "snackvideo", name: "Snack Video" },
  { id: "twitter", name: "Twitter / X" },
  { id: "twitch", name: "Twitch" },
  { id: "soundcloud", name: "SoundCloud" },
  { id: "pinterest", name: "Pinterest" },
  { id: "reddit", name: "Reddit" },
  { id: "quora", name: "Quora" },
  { id: "mobileapp", name: "Mobile App Install" },
  { id: "kwai", name: "Kwai" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "likee", name: "Likee" },
  { id: "googleplay", name: "Google Play Review" },
  { id: "dailymotion", name: "Dailymotion" },
  { id: "audiomack", name: "Audiomack" },
];

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const panelRes = await callPanel({ action: "services" });
    const services = normalizeServicesResponse(panelRes);
    const platforms = collectPlatforms(services);
    res.json({ platforms });
  } catch (e) {
    console.error("platforms error", e);
    res.status(200).json({ platforms: FALLBACK_PLATFORMS, fallback: true });
  }
};
