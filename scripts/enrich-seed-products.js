const mongoose = require("mongoose");
const env = require("../src/configs/environments");
const Product = require("../src/models/product.model");
const ProductVariant = require("../src/models/product-variant.model");
const ProductVariantItem = require("../src/models/product-variant-item.model");
const Image = require("../src/models/image.model");
const Color = require("../src/models/color.model");
const Size = require("../src/models/size.model");
const cloudinary = require("../src/configs/cloudinary");

const TARGET_LIMIT = Number(process.env.SEED_VARIANT_PRODUCT_LIMIT || 100);
const VARIANTS_PER_PRODUCT = Number(process.env.SEED_VARIANTS_PER_PRODUCT || 2);
const ITEMS_PER_VARIANT = Number(process.env.SEED_ITEMS_PER_VARIANT || 2);

const buildImageSeedUrl = (productId, variantIndex) =>
  `https://picsum.photos/seed/ecom-${productId}-${variantIndex}/900/900`;

const uploadVariantImage = async (productId, variantIndex) => {
  const result = await cloudinary.uploader.upload(
    buildImageSeedUrl(productId, variantIndex),
    {
      folder: "ecommerce/seed-products",
      public_id: `product-${productId}-variant-${variantIndex + 1}-${Date.now()}`,
    },
  );

  return {
    image_url: result.secure_url,
    public_id: result.public_id,
  };
};

const buildVariantName = (productName, colorName) => `${productName} - ${colorName}`;

const buildItemPayload = ({ variantName, size, variantIndex, itemIndex, productIndex }) => ({
  name: `${variantName} - ${size.name}`,
  size: size._id,
  quantity: 10 + productIndex + variantIndex * 3 + itemIndex,
  price: 99000 + productIndex * 1000 + variantIndex * 5000 + itemIndex * 2500,
});

const enrichOneProduct = async ({ product, colors, sizes, productIndex }) => {
  const uploadedResources = [];
  const session = await mongoose.startSession();

  try {
    const selectedColors = Array.from({ length: VARIANTS_PER_PRODUCT }, (_, index) => colors[index % colors.length]);
    const selectedSizes = Array.from({ length: ITEMS_PER_VARIANT }, (_, index) => sizes[index % sizes.length]);

    const preparedVariants = [];

    for (let variantIndex = 0; variantIndex < selectedColors.length; variantIndex += 1) {
      const color = selectedColors[variantIndex];
      const uploadedImage = await uploadVariantImage(product._id, variantIndex);
      uploadedResources.push(uploadedImage.public_id);

      preparedVariants.push({
        color,
        image: uploadedImage,
        items: selectedSizes.map((size, itemIndex) =>
          buildItemPayload({
            variantName: buildVariantName(product.name, color.name),
            size,
            variantIndex,
            itemIndex,
            productIndex,
          }),
        ),
      });
    }

    session.startTransaction();

    const imageDocs = [];
    const itemDocs = [];
    const variantDocs = [];
    const variantIds = [];

    preparedVariants.forEach((variantData) => {
      const imageId = new mongoose.Types.ObjectId();
      imageDocs.push({
        _id: imageId,
        image_url: variantData.image.image_url,
        public_id: variantData.image.public_id,
      });

      const itemIds = variantData.items.map((item) => {
        const itemId = new mongoose.Types.ObjectId();
        itemDocs.push({
          _id: itemId,
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        });
        return itemId;
      });

      const variantId = new mongoose.Types.ObjectId();
      variantIds.push(variantId);
      variantDocs.push({
        _id: variantId,
        product: product._id,
        color: variantData.color._id,
        name: buildVariantName(product.name, variantData.color.name),
        images: [imageId],
        items: itemIds,
      });
    });

    if (imageDocs.length) await Image.insertMany(imageDocs, { session });
    if (itemDocs.length) await ProductVariantItem.insertMany(itemDocs, { session });
    if (variantDocs.length) await ProductVariant.insertMany(variantDocs, { session });

    await Product.updateOne(
      { _id: product._id },
      { $set: { variants: variantIds } },
      { session },
    );

    await session.commitTransaction();

    return {
      productId: String(product._id),
      variantCount: variantDocs.length,
      itemCount: itemDocs.length,
      imageCount: imageDocs.length,
    };
  } catch (error) {
    await session.abortTransaction();
    await Promise.all(uploadedResources.map((publicId) => cloudinary.uploader.destroy(publicId).catch(() => null)));
    throw error;
  } finally {
    session.endSession();
  }
};

const run = async () => {
  await mongoose.connect(env.MONGODB_URL);

  try {
    const [colors, sizes, products] = await Promise.all([
      Color.find().sort({ createdAt: 1 }).lean(),
      Size.find().sort({ createdAt: 1 }).lean(),
      Product.find({ name: /Seed/, $or: [{ variants: { $exists: false } }, { variants: { $size: 0 } }] })
        .sort({ createdAt: 1 })
        .limit(TARGET_LIMIT)
        .lean(),
    ]);

    if (colors.length < 1) throw new Error("No colors found");
    if (sizes.length < 1) throw new Error("No sizes found");
    if (!products.length) {
      console.log(JSON.stringify({ processed: 0, skipped: 0, message: "No seed products without variants found" }, null, 2));
      return;
    }

    const summary = {
      processed: 0,
      failed: 0,
      variantsCreated: 0,
      itemsCreated: 0,
      imagesCreated: 0,
      errors: [],
    };

    for (let index = 0; index < products.length; index += 1) {
      const product = products[index];
      try {
        const result = await enrichOneProduct({ product, colors, sizes, productIndex: index });
        summary.processed += 1;
        summary.variantsCreated += result.variantCount;
        summary.itemsCreated += result.itemCount;
        summary.imagesCreated += result.imageCount;
        console.log(`Enriched ${index + 1}/${products.length}: ${product.name}`);
      } catch (error) {
        summary.failed += 1;
        summary.errors.push({ productId: String(product._id), name: product.name, message: error.message });
        console.error(`Failed ${index + 1}/${products.length}: ${product.name} -> ${error.message}`);
      }
    }

    console.log(JSON.stringify(summary, null, 2));

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
