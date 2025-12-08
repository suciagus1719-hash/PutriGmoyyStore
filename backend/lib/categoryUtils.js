const CATEGORY_BLOCK_KEYWORDS = [];

function encodeCategoryKey(platformId, categoryName) {
  try {
    const payload = {
      platformId: platformId || null,
      categoryName: categoryName || "",
    };
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  } catch (e) {
    return categoryName;
  }
}

function decodeCategoryKey(key) {
  try {
    const json = Buffer.from(String(key), "base64").toString("utf8");
    const data = JSON.parse(json);
    return {
      platformId: data.platformId || null,
      categoryName: data.categoryName || "",
    };
  } catch (e) {
    return { platformId: null, categoryName: key };
  }
}

function isBlockedCategory(name) {
  const text = String(name || "").toLowerCase();
  if (!text) return false;
  return CATEGORY_BLOCK_KEYWORDS.some((kw) => text.includes(kw));
}

module.exports = {
  encodeCategoryKey,
  decodeCategoryKey,
  isBlockedCategory,
};
