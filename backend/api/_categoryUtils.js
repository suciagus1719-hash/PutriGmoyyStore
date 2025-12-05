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

module.exports = {
  encodeCategoryKey,
  decodeCategoryKey,
};
