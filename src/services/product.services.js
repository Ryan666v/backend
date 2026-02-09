const { StatusCodes } = require("http-status-codes");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const { default: mongoose } = require("mongoose");
const Image = require("../models/image.model");
const ProductVariant = require("../models/product-variant.model");
const ProductVariantItem = require("../models/product-variant-item.model");

const create = async (newProduct) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Helper.validateCategoriesExist(newProduct.categories);
      const createdProduct = await Product.create(newProduct);
      if (createdProduct) {
        resolve({ message: "Product created successfully" });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const get = async (query) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        all = false,
        sortBy = "createdAt",
        order = "desc",
      } = query;
      const filter = search ? { name: { $regex: search, $options: "i" } } : {};
      const allowedSortFields = ["name", "createdAt", "updatedAt"];
      const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";
      const sortOrder = order === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };
      if (all === true || all === "true") {
        const data = await Product.find(filter)
          .populate("categories", "name description createdAt updatedAt")
          .sort(sort)
          .lean();
        resolve({
          all: true,
          total: data.length,
          data,
        });
      }
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate("categories", "name description createdAt updatedAt")
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        Product.countDocuments(filter),
      ]);
      resolve({
        data: products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};
const getDetail = async (_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedProduct = await Product.findById(_id).populate(
        "categories",
        "name description createdAt updatedAt",
      );
      if (!checkedProduct) {
        throw new AppError(
          "Product with this ID does not exist",
          StatusCodes.NOT_FOUND,
        );
      }
      resolve(checkedProduct);
    } catch (error) {
      reject(error);
    }
  });
};
const update = async (_id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      if (payload?.categories) {
        await Helper.validateCategoriesExist(payload?.categories);
      }
      const updatedProduct = await Product.findByIdAndUpdate(
        _id,
        {
          $set: Helper.pickAllowedFields(payload, [
            "name",
            "description",
            "categories",
          ]),
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .populate("categories", "name description createdAt updatedAt")
        .lean();
      if (!updatedProduct) {
        throw new AppError("Product not found", StatusCodes.NOT_FOUND);
      }

      resolve(updatedProduct);
    } catch (error) {
      reject(error);
    }
  });
};
const remove = async (_ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectIds(_ids);
      const result = await Product.deleteMany({
        _id: { $in: _ids },
      });

      if (result.deletedCount === 0) {
        throw new AppError("No products were deleted", StatusCodes.NOT_FOUND);
      }
      resolve({ deletedCount: result.deletedCount });
    } catch (error) {
      reject(error);
    }
  });
};

const createMany = async (productsData, uploadedFiles) => {
  return new Promise(async (resolve, reject) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log("run")
      const createdProducts = [];
      let fileIndex = 0; // Track vị trí file trong mảng uploadedFiles

      for (const productData of productsData) {
        // 1. Tạo Product
        const product = await Product.create(
          [
            {
              name: productData.name,
              description: productData.description,
              categories: productData.categories,
            },
          ],
          { session },
        );
        console.log(product)
        const createdProduct = product[0];
        const createdVariants = [];

        // 2. Xử lý từng variant
        for (const variantData of productData.variants || []) {
          // 2.1. Tạo ProductVariant
          console.log('variantData',variantData)
          const variant = await ProductVariant.create(
            [
              {
                product: createdProduct._id,
                color: variantData.color,
                name: variantData.variantName,
              },
            ],
            { session },
          );

          const createdVariant = variant[0];
          console.log('createdVariant',createdVariant)

          // 2.2. Tạo Images từ uploadedFiles
          const imageCount = variantData.images?.length || 0;
          if (imageCount > 0) {
            const variantFiles = uploadedFiles.slice(
              fileIndex,
              fileIndex + imageCount,
            );
            fileIndex += imageCount;

            const imagesPayload = variantFiles.map((file) => ({
              image_url: file.path,
              public_id: file.filename,
              productVariant: createdVariant._id,
            }));

            await Image.insertMany(imagesPayload, { session });
          }

          // 2.3. Tạo ProductVariantItems
          if (variantData.items && variantData.items.length > 0) {
            const itemsPayload = variantData.items.map((item) => ({
              name: item.name,
              price: item.price,
              productVariant: createdVariant._id,
              quantity: item.quantity,
              size: item.size,
            }));

            await ProductVariantItem.insertMany(itemsPayload, { session });
          }

          createdVariants.push(createdVariant);
        }

        createdProducts.push({
          product: createdProduct,
          variants: createdVariants,
        });
      }
      console.log('createdProducts',createdProducts)
      await session.commitTransaction();
      resolve(createdProducts);
    } catch (error) {
      await session.abortTransaction();
      if (uploadedFiles && uploadedFiles.length > 0) {
        await Promise.all(
          uploadedFiles.map((file) =>
            cloudinary.uploader
              .destroy(file.filename)
              .catch((err) => console.error("Error deleting file:", err)),
          ),
        );
      }

      reject(error);
    } finally {
      session.endSession();
    }
  });
};
module.exports = { create, get, getDetail, update, remove, createMany };
