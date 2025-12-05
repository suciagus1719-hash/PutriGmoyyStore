const PLATFORM_DEFS = [
  { id: "instagram", name: "Instagram", keywords: ["instagram", "ig"] },
  { id: "tiktok", name: "TikTok", keywords: ["tiktok", "tik tok"] },
  { id: "youtube", name: "YouTube", keywords: ["youtube", "yt"] },
  { id: "facebook", name: "Facebook", keywords: ["facebook", "fb"] },
  { id: "whatsapp", name: "WhatsApp", keywords: ["whatsapp", "wa"] },
  { id: "telegram", name: "Telegram", keywords: ["telegram"] },
  { id: "shopee", name: "Shopee", keywords: ["shopee"] },
  { id: "threads", name: "Threads", keywords: ["threads"] },
  { id: "spotify", name: "Spotify", keywords: ["spotify"] },
  { id: "discord", name: "Discord", keywords: ["discord"] },
  { id: "snackvideo", name: "Snack Video", keywords: ["snack video", "snackvideo"] },
  { id: "twitter", name: "Twitter / X", keywords: ["twitter", "x "] },
  { id: "twitch", name: "Twitch", keywords: ["twitch"] },
  { id: "soundcloud", name: "SoundCloud", keywords: ["soundcloud"] },
  { id: "pinterest", name: "Pinterest", keywords: ["pinterest"] },
  { id: "reddit", name: "Reddit", keywords: ["reddit"] },
  { id: "quora", name: "Quora", keywords: ["quora"] },
  { id: "mobileapp", name: "Mobile App Install", keywords: ["mobile app", "app install"] },
  { id: "kwai", name: "Kwai", keywords: ["kwai"] },
  { id: "linkedin", name: "LinkedIn", keywords: ["linkedin"] },
  { id: "likee", name: "Likee", keywords: ["likee"] },
  { id: "googleplay", name: "Google Play Review", keywords: ["google play", "play store"] },
  { id: "dailymotion", name: "Dailymotion", keywords: ["dailymotion"] },
  { id: "audiomack", name: "Audiomack", keywords: ["audiomack"] },
  { id: "other", name: "Lainnya", keywords: [] },
];

function normalizeText(service) {
  return `${service.platform || ""} ${service.category || ""} ${service.name || ""}`.toLowerCase();
}

function detectPlatformDef(service) {
  const text = normalizeText(service);
  for (const def of PLATFORM_DEFS) {
    if (def.id === "other") continue;
    if (def.keywords.some((kw) => text.includes(kw.trim()))) {
      return { id: def.id, name: def.name };
    }
  }
  return null;
}

function collectPlatforms(services) {
  const map = new Map();
  services.forEach((svc) => {
    const detected = detectPlatformDef(svc);
    if (detected) {
      map.set(detected.id, detected);
    } else if (!map.has("other")) {
      map.set("other", { id: "other", name: "Lainnya" });
    }
  });

  if (!map.size) {
    PLATFORM_DEFS.filter((d) => d.id !== "other").forEach((def) => {
      map.set(def.id, { id: def.id, name: def.name });
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeServicesResponse(panelRes) {
  if (Array.isArray(panelRes)) return panelRes;
  if (panelRes && Array.isArray(panelRes.data)) return panelRes.data;
  if (panelRes && Array.isArray(panelRes.services)) return panelRes.services;
  return [];
}

module.exports = {
  collectPlatforms,
  detectPlatformDef,
  normalizeServicesResponse,
};
