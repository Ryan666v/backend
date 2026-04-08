const mongoose = require("mongoose");
const env = require("../src/configs/environments");
const Product = require("../src/models/product.model");
const Category = require("../src/models/category.model");

const run = async () => {
  await mongoose.connect(env.MONGODB_URL);

  try {
    const categories = await Category.find({})
      .select("_id name type")
      .sort({ type: 1, name: 1 })
      .lean();

    if (!categories.length) {
      throw new Error("No categories found to remap products");
    }

    const products = await Product.find({})
      .select("_id name categories createdAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    if (!products.length) {
      console.log(JSON.stringify({ updated: 0, total: 0, byType: {} }, null, 2));
      return;
    }

    const operations = products.map((product, index) => {
      const category = categories[index % categories.length];
      return {
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { categories: [category._id] } },
        },
      };
    });

    const result = await Product.bulkWrite(operations);

    const verification = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "resolvedCategories",
        },
      },
      { $unwind: "$resolvedCategories" },
      {
        $group: {
          _id: "$resolvedCategories.type",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log(
      JSON.stringify(
        {
          matched: result.matchedCount,
          modified: result.modifiedCount,
          totalProducts: products.length,
          byType: verification.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
