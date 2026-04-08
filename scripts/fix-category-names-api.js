const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("../src/configs/environments");
const User = require("../src/models/user.model");

const API_BASE_URL = process.env.SEED_API_BASE_URL || `http://localhost:${env.APP_PORT || 5000}/api`;

const CATEGORY_NAME_MAP = {
  shirt: [
    "\u00C1o S\u01A1 Mi",
    "\u00C1o S\u01A1 Mi Tr\u1EAFng",
    "\u00C1o Jacket",
    "\u00C1o Polo",
    "\u00C1o Blazer",
    "\u00C1o Len",
    "B\u1ED9 \u0110\u1ED3",
    "\u00C1o N\u1EC9",
    "\u00C1o T-Shirt",
    "\u00C1o Veston"
  ],
  pants: [
    "Qu\u1EA7n T\u00E2y",
    "Qu\u1EA7n Short",
    "Qu\u1EA7n Khaki",
    "Qu\u1EA7n Jogger",
    "Qu\u1EA7n Jeans",
    "Qu\u1EA7n N\u1EC9"
  ],
  accessory: [
    "\u0110\u1ED3 L\u00F3t",
    "C\u00E0 V\u1EA1t",
    "V\u00ED Da",
    "D\u00E2y L\u01B0ng",
    "T\u1EA5t"
  ]
};

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

const updateCategory = async (cookie, id, body) => {
  return requestJson(`${API_BASE_URL}/category/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });
};

const run = async () => {
  await mongoose.connect(env.MONGODB_URL);

  try {
    const admin = await getAdminUser();
    const cookie = createAuthCookie(admin._id);
    const categories = await getAllCategories();

    const grouped = categories.reduce((acc, category) => {
      if (!acc[category.type]) acc[category.type] = [];
      acc[category.type].push(category);
      return acc;
    }, {});

    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => String(a._id).localeCompare(String(b._id)));
    });

    const updates = [];
    for (const [type, expectedNames] of Object.entries(CATEGORY_NAME_MAP)) {
      const current = grouped[type] || [];
      if (current.length !== expectedNames.length) {
        throw new Error(`Type ${type} expected ${expectedNames.length} categories but found ${current.length}`);
      }

      current.forEach((category, index) => {
        updates.push({
          id: category._id,
          payload: {
            name: expectedNames[index],
            type: category.type,
            description: category.description || "",
            image: category.image?._id || category.image || null,
          },
        });
      });
    }

    const results = await Promise.allSettled(
      updates.map((item) => updateCategory(cookie, item.id, item.payload))
    );

    const summary = { updated: 0, failed: 0, errors: [] };
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        summary.updated += 1;
        return;
      }
      summary.failed += 1;
      summary.errors.push({
        id: updates[index].id,
        name: updates[index].payload.name,
        message: result.reason?.message || String(result.reason),
      });
    });

    const finalCategories = await getAllCategories();
    console.log(JSON.stringify({
      updated: summary.updated,
      failed: summary.failed,
      byType: finalCategories.reduce((acc, category) => {
        acc[category.type] = acc[category.type] || [];
        acc[category.type].push(category.name);
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
