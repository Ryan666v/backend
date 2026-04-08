const mongoose = require("mongoose");
const env = require("../src/configs/environments");
const Category = require("../src/models/category.model");
const Image = require("../src/models/image.model");
const cloudinary = require("../src/configs/cloudinary");

const TYPE_IMAGE_KEYWORDS = {
  shirt: "menswear-top",
  pants: "trousers-fashion",
  accessory: "fashion-accessories",
  price: "fashion-premium",
};

const slugify = (value) =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "category";

const buildImageUrl = (category) => {
  const keyword = TYPE_IMAGE_KEYWORDS[category.type] || "fashion";
  const seed = slugify(`${category.type}-${category.name}`);
  return `https://picsum.photos/seed/${seed}-${keyword}/1280/900`;
};

const uploadCategoryImage = async (category) => {
  const uploadResult = await cloudinary.uploader.upload(buildImageUrl(category), {
    folder: "ecommerce/categories",
    public_id: `category-${slugify(category.name)}`,
    overwrite: true,
    resource_type: "image",
  });

  return {
    image_url: uploadResult.secure_url || uploadResult.url,
    public_id: uploadResult.public_id,
  };
};

const run = async () => {
  await mongoose.connect(env.MONGODB_URL);

  try {
    const categories = await Category.find({})
      .populate({ path: "image", select: "_id image_url public_id" })
      .sort({ type: 1, name: 1 });

    const summary = {
      updated: 0,
      createdImages: 0,
      reusedImages: 0,
      errors: [],
    };

    for (const category of categories) {
      try {
        const imagePayload = await uploadCategoryImage(category);

        if (category.image?._id) {
          await Image.findByIdAndUpdate(category.image._id, {
            $set: imagePayload,
          });
          summary.reusedImages += 1;
        } else {
          const imageDoc = await Image.create(imagePayload);
          category.image = imageDoc._id;
          summary.createdImages += 1;
        }

        await category.save();
        summary.updated += 1;
      } catch (error) {
        summary.errors.push({
          categoryId: String(category._id),
          categoryName: category.name,
          message: error.message,
        });
      }
    }

    console.log(JSON.stringify(summary, null, 2));

    if (summary.errors.length > 0) {
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
