const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("../src/configs/environments");
const User = require("../src/models/user.model");

const API_BASE_URL = process.env.SEED_API_BASE_URL || `http://localhost:${env.APP_PORT || 5000}/api`;

const SIZES = [
  "XS", "S", "M", "L", "XL", "XXL",
  "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45",
];

const COLORS = [
  { name: "Red", code: "#FF0000" },
  { name: "Green", code: "#00FF00" },
  { name: "Blue", code: "#0000FF" },
  { name: "Yellow", code: "#FFFF00" },
  { name: "Black", code: "#000000" },
  { name: "White", code: "#FFFFFF" },
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
  if (!admin) throw new Error("No admin user found in database");
  return admin;
};

const getList = async (resource) => {
  const response = await fetch(`${API_BASE_URL}/${resource}/list?all=true`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${resource}: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload?.data || [];
};

const createOne = async (resource, cookie, body) => {
  const response = await fetch(`${API_BASE_URL}/${resource}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
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

    const [existingSizes, existingColors] = await Promise.all([
      getList("size"),
      getList("color"),
    ]);

    const sizeNames = new Set(existingSizes.map((item) => item.name));
    const colorNames = new Set(existingColors.map((item) => item.name.toLowerCase()));
    const colorCodes = new Set(existingColors.map((item) => item.code.toUpperCase()));

    const missingSizes = SIZES.filter((name) => !sizeNames.has(name));
    const colorPlan = COLORS.map((item) => {
      const matchedByName = existingColors.find((color) => color.name.toLowerCase() === item.name.toLowerCase());
      const matchedByCode = existingColors.find((color) => color.code.toUpperCase() === item.code.toUpperCase());

      if (matchedByName || matchedByCode) {
        return {
          ...item,
          skip: true,
          reason: matchedByName
            ? `name exists as ${matchedByName.name}`
            : `code exists as ${matchedByCode.name}`,
        };
      }

      return { ...item, skip: false };
    });

    const results = {
      sizes: {
        created: [],
        skipped: SIZES.filter((name) => sizeNames.has(name)),
      },
      colors: {
        created: [],
        skipped: colorPlan.filter((item) => item.skip).map((item) => ({ name: item.name, code: item.code, reason: item.reason })),
      },
    };

    for (const name of missingSizes) {
      await createOne("size", cookie, { name });
      results.sizes.created.push(name);
    }

    for (const color of colorPlan.filter((item) => !item.skip)) {
      await createOne("color", cookie, { name: color.name, code: color.code });
      results.colors.created.push(color.name);
      colorNames.add(color.name.toLowerCase());
      colorCodes.add(color.code.toUpperCase());
    }

    const [sizesAfter, colorsAfter] = await Promise.all([
      getList("size"),
      getList("color"),
    ]);

    console.log(JSON.stringify({
      admin: admin.email,
      created: results,
      totals: {
        sizes: sizesAfter.length,
        colors: colorsAfter.length,
      },
      current: {
        sizes: sizesAfter.map((item) => item.name),
        colors: colorsAfter.map((item) => ({ name: item.name, code: item.code })),
      },
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
