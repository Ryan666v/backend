const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("../src/configs/environments");
const User = require("../src/models/user.model");

const API_BASE_URL = process.env.SEED_API_BASE_URL || `http://localhost:${env.APP_PORT || 5000}/api`;
const PRODUCT_COUNT = Number(process.env.SEED_PRODUCT_COUNT || 100);
const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE || 10);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";

const buildDescription = (name, categoryName, index) =>
  `${name} belongs to ${categoryName}. Seeded product #${index + 1} for admin catalog testing.`;

const createAuthCookie = (adminUserId) => {
  const accessToken = jwt.sign(
    { userId: String(adminUserId), role: "admin" },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
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

const getCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/category/list?all=true`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  const categories = payload?.data || [];
  if (!categories.length) {
    throw new Error("No categories available for product creation");
  }

  return categories;
};

const createProductPayload = (categories, index, runId) => {
  const category = categories[index % categories.length];
  const categoryId = category?._id;
  const categoryName = category?.name || `Category ${index + 1}`;
  const baseName = `${categoryName} Seed ${runId}-${String(index + 1).padStart(3, "0")}`;

  return {
    name: baseName,
    description: buildDescription(baseName, categoryName, index),
    categories: [categoryId],
    sku: `seed-${slugify(categoryName)}-${runId}-${index + 1}`,
  };
};

const createOneProduct = async (cookie, payload) => {
  const response = await fetch(`${API_BASE_URL}/product/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      categories: payload.categories,
    }),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = data?.message || text || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const run = async () => {
  await mongoose.connect(env.MONGODB_URL);

  try {
    const admin = await getAdminUser();
    const cookie = createAuthCookie(admin._id);
    const categories = await getCategories();
    const runId = Date.now();
    const results = { success: 0, failed: 0, errors: [] };

    console.log(`Using admin: ${admin.email}`);
    console.log(`Category count: ${categories.length}`);
    console.log(`Target products: ${PRODUCT_COUNT}`);

    for (let start = 0; start < PRODUCT_COUNT; start += BATCH_SIZE) {
      const batchIndexes = Array.from(
        { length: Math.min(BATCH_SIZE, PRODUCT_COUNT - start) },
        (_, offset) => start + offset,
      );

      const batchResults = await Promise.allSettled(
        batchIndexes.map((index) => createOneProduct(cookie, createProductPayload(categories, index, runId))),
      );

      batchResults.forEach((result, batchOffset) => {
        const absoluteIndex = batchIndexes[batchOffset];
        if (result.status === "fulfilled") {
          results.success += 1;
          return;
        }

        results.failed += 1;
        results.errors.push({
          index: absoluteIndex + 1,
          message: result.reason?.message || String(result.reason),
        });
      });

      console.log(`Processed ${Math.min(start + BATCH_SIZE, PRODUCT_COUNT)}/${PRODUCT_COUNT}`);
      await wait(150);
    }

    console.log(JSON.stringify(results, null, 2));

    if (results.failed > 0) {
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
