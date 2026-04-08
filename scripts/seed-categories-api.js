const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("../src/configs/environments");
const User = require("../src/models/user.model");

const API_BASE_URL = process.env.SEED_API_BASE_URL || `http://localhost:${env.APP_PORT || 5000}/api`;

const CATEGORY_SEED = [
  { type: "shirt", name: "\u00C1o S\u01A1 Mi" },
  { type: "shirt", name: "\u00C1o S\u01A1 Mi Tr\u1EAFng" },
  { type: "shirt", name: "\u00C1o Jacket" },
  { type: "shirt", name: "\u00C1o Blazer" },
  { type: "shirt", name: "\u00C1o Polo" },
  { type: "shirt", name: "\u00C1o T-Shirt" },
  { type: "shirt", name: "\u00C1o Veston" },
  { type: "shirt", name: "\u00C1o Len" },
  { type: "shirt", name: "B\u1ED9 \u0110\u1ED3" },
  { type: "shirt", name: "\u00C1o N\u1EC9" },
  { type: "pants", name: "Qu\u1EA7n T\u00E2y" },
  { type: "pants", name: "Qu\u1EA7n Short" },
  { type: "pants", name: "Qu\u1EA7n Khaki" },
  { type: "pants", name: "Qu\u1EA7n Jeans" },
  { type: "pants", name: "Qu\u1EA7n Jogger" },
  { type: "pants", name: "Qu\u1EA7n N\u1EC9" },
  { type: "accessory", name: "\u0110\u1ED3 L\u00F3t" },
  { type: "accessory", name: "T\u1EA5t" },
  { type: "accessory", name: "D\u00E2y L\u01B0ng" },
  { type: "accessory", name: "V\u00ED Da" },
  { type: "accessory", name: "C\u00E0 V\u1EA1t" }
];

const createAuthCookie = (adminUserId) => {
  const accessToken = jwt.sign(
    { userId: String(adminUserId), role: "admin" },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  return `access_token=${accessToken}`;
};

const getAdminUser = async () => {
  const admin = await User.findOne({ role: "admin" }).select("_id email username").lean();
  if (!admin) {
    throw new Error("No admin user found in database");
  }
  return admin;
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(payload?.message || text || `Request failed with status ${response.status}`);
  }

  return payload;
};

const getAllCategories = async () => {
  const payload = await requestJson(`${API_BASE_URL}/category/list?all=true`);
  return payload?.data || [];
};

const deleteCategories = async (cookie, ids) => {
  if (!ids.length) return { deletedCount: 0 };

  const payload = await requestJson(`${API_BASE_URL}/category/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ _ids: ids }),
  });

  return payload?.data || payload;
};

const createCategory = async (cookie, category) => {
  return requestJson(`${API_BASE_URL}/category/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      name: category.name,
      type: category.type,
      description: "",
      image: null,
    }),
  });
};

const run = async () => {
  await mongoose.connect(env.MONGODB_URL);

  try {
    const admin = await getAdminUser();
    const cookie = createAuthCookie(admin._id);
    const existingCategories = await getAllCategories();
    const existingIds = existingCategories.map((category) => category._id);

    console.log(`Using admin: ${admin.email}`);
    console.log(`Existing categories: ${existingIds.length}`);

    const deleteResult = await deleteCategories(cookie, existingIds);
    console.log(`Deleted categories: ${deleteResult.deletedCount || 0}`);

    const results = await Promise.allSettled(
      CATEGORY_SEED.map((category) => createCategory(cookie, category))
    );

    const summary = {
      success: 0,
      failed: 0,
      errors: [],
    };

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        summary.success += 1;
        return;
      }

      summary.failed += 1;
      summary.errors.push({
        index: index + 1,
        name: CATEGORY_SEED[index].name,
        type: CATEGORY_SEED[index].type,
        message: result.reason?.message || String(result.reason),
      });
    });

    const finalCategories = await getAllCategories();

    console.log(JSON.stringify({
      deleted: deleteResult.deletedCount || 0,
      created: summary.success,
      failed: summary.failed,
      totalAfter: finalCategories.length,
      byType: finalCategories.reduce((acc, category) => {
        acc[category.type] = (acc[category.type] || 0) + 1;
        return acc;
      }, {}),
      errors: summary.errors,
    }, null, 2));

    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
