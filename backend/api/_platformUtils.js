const PLATFORM_DEFS = [
  { id: "instagram", name: "Instagram", keywords: ["instagram", "ig"] },
  { id: "tiktok", name: "TikTok", keywords: ["tiktok", "tik tok"] },
  { id: "youtube", name: "YouTube", keywords: ["youtube", "yt"] },
  { id: "facebook", name: "Facebook", keywords: ["facebook", "fb"] },
  { id: "whatsapp", name: "WhatsApp", keywords: ["whatsapp", "wa"] },
  { id: "telegram", name: "Telegram", keywords: ["telegram"] },
  { id: "spotify", name: "Spotify", keywords: ["spotify"] },
  { id: "twitter", name: "Twitter / X", keywords: ["twitter", "x "] },
  { id: "shopee", name: "Shopee", keywords: ["shopee"] },
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

module.exports = {
  collectPlatforms,
  detectPlatformDef,
};
