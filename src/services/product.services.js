const { StatusCodes } = require("http-status-codes");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const { default: mongoose } = require("mongoose");
const Image = require("../models/image.model");
const ProductVariant = require("../models/product-variant.model");
const ProductVariantItem = require("../models/product-variant-item.model");
const cloudinary = require("../configs/cloudinary");

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
          .populate("categories", "name description")
          .populate({
            path: "variants",
            populate: [
              {
                path: "items",
                populate: {
                  path: "size",
                  select: "name",
                },
              },
              {
                path: "images",
                select: "image_url public_id",
              },
            ],
          })
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
          .populate("categories", "name description")
          .populate({
            path: "variants",
            populate: [
              {
                path: "items",
                populate: {
                  path: "size",
                  select: "name",
                },
              },
              {
                path: "images",
                select: "image_url public_id",
              },
            ],
          })
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
  console.log(_id)
  return new Promise(async (resolve, reject) => {
    try {
      const checkedProduct = await Product.findById(_id)
        .populate("categories", "name description")
        .populate({
          path: "variants",
          populate: [
            {
              path: "items",
              populate: {
                path: "size",
                select: "name",
              },
            },
            {
              path: "images",
              select: "image_url public_id",
            },
          ],
        });
      console.log(checkedProduct);
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let fileIndex = 0;

    const imageDocs = [];
    const itemDocs = [];
    const variantDocs = [];
    const productDocs = [];

    for (const productData of productsData) {
      const variantIds = [];

      for (const variantData of productData.variants || []) {
        const imageCount = variantData.imageCount || 0;
        const variantFiles = uploadedFiles.slice(
          fileIndex,
          fileIndex + imageCount,
        );
        fileIndex += imageCount;

        const imageIds = [];

        for (const file of variantFiles) {
          const _id = new mongoose.Types.ObjectId();

          imageDocs.push({
            _id,
            image_url: file.path,
            public_id: file.filename,
          });

          imageIds.push(_id);
        }

        const itemIds = [];

        for (const item of variantData.items || []) {
          const _id = new mongoose.Types.ObjectId();

          itemDocs.push({
            _id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
          });

          itemIds.push(_id);
        }

        const variantId = new mongoose.Types.ObjectId();

        variantDocs.push({
          _id: variantId,
          name: variantData.name,
          color: variantData.color,
          images: imageIds,
          items: itemIds,
        });

        variantIds.push(variantId);
      }

      const productId = new mongoose.Types.ObjectId();

      productDocs.push({
        _id: productId,
        name: productData.name,
        description: productData.description,
        categories: productData.categories,
        variants: variantIds,
      });
    }
    console.log("imageDocs", imageDocs);
    if (imageDocs.length) await Image.insertMany(imageDocs, { session });

    if (itemDocs.length)
      await ProductVariantItem.insertMany(itemDocs, { session });

    if (variantDocs.length)
      await ProductVariant.insertMany(variantDocs, { session });

    if (productDocs.length) await Product.insertMany(productDocs, { session });

    await session.commitTransaction();

    return productDocs;
  } catch (error) {
    await session.abortTransaction();

    if (uploadedFiles?.length) {
      await Promise.all(
        uploadedFiles.map((file) =>
          cloudinary.uploader.destroy(file.filename).catch(() => {}),
        ),
      );
    }

    throw error;
  } finally {
    session.endSession();
  }
};
module.exports = { create, get, getDetail, update, remove, createMany };
