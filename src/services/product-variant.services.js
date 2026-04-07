const { StatusCodes } = require("http-status-codes");
const ProductVariant = require("../models/product-variant.model");
const Product = require("../models/product.model");
const Image = require("../models/image.model");
const ProductVariantItem = require("../models/product-variant-item.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const cloudinary = require("../configs/cloudinary");
const { default: mongoose } = require("mongoose");

const create = async (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Helper.validateProductVariantDependencies({
        product: payload.product,
        color: payload.color,
      });
      await Helper.validateVariantUnique({
        product: payload.product,
        color: payload.color,
      });
      const createdVariant = await ProductVariant.create({
        ...payload,
      });
      resolve(createdVariant);
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
        product,
        color,
      } = query;
      const filter = search ? { name: { $regex: search, $options: "i" } } : {};
      if (product) {
        filter.product = product;
      }
      if (color) {
        filter.color = color;
      }
      const allowedSortFields = ["name", "createdAt", "updatedAt"];
      const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";
      const sortOrder = order === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };
      if (all === true || all === "true") {
        const data = await ProductVariant.find(filter)
          .populate("product", "name")
          .populate("color", "name code")
          .populate("images")
          .populate({
            path: "items",
            populate: {
              path: "size",
            },
          })
          .sort(sort)
          .lean();
        return resolve({
          all: true,
          total: data.length,
          data,
        });
      }
      const skip = (page - 1) * limit;

      const [variants, total] = await Promise.all([
        ProductVariant.find(filter)
          .populate("product", "name")
          .populate("color", "name code")
          .populate("images")
          .populate({
            path: "items",
            populate: {
              path: "size",
            },
          })
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        ProductVariant.countDocuments(filter),
      ]);
      resolve({
        data: variants,
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
      const variant = await ProductVariant.findOne({
        _id,
      })
        .populate("product", "name")
        .populate("color", "name code")
        .populate("images")
        .populate({
          path: "items",
          populate: {
            path: "size",
          },
        })
        .lean();
      if (!variant) {
        throw new AppError("Product variant not found", StatusCodes.NOT_FOUND);
      }
      resolve(variant);
    } catch (error) {
      reject(error);
    }
  });
};
const update = async (_id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      const currentVariant = await ProductVariant.findById(_id).lean();
      if (!currentVariant) {
        throw new AppError("Product variant not found", StatusCodes.NOT_FOUND);
      }

      const nextProduct = payload.product || currentVariant.product?.toString();
      const nextColor = payload.color || currentVariant.color?.toString();

      await Helper.validateProductVariantDependencies({
        product: nextProduct,
        color: nextColor,
      });
      await Helper.validateVariantUnique({
        product: nextProduct,
        color: nextColor,
        excludeId: _id,
      });

      const updatedVariant = await ProductVariant.findByIdAndUpdate(
        { _id },
        {
          $set: Helper.pickAllowedFields(payload, ["name", "product", "color"]),
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .populate("product", "name")
        .populate("color", "name code")
        .lean();

      resolve(updatedVariant);
    } catch (error) {
      reject(error);
    }
  });
};
const remove = async (_ids) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    Helper.validateObjectIds(_ids);

    const variants = await ProductVariant.find({
      _id: { $in: _ids },
    }).lean();

    if (!variants.length) {
      throw new AppError("No variants were deleted", StatusCodes.NOT_FOUND);
    }

    const imageIds = [...new Set(variants.flatMap((variant) => variant.images || []).map(String))];
    const itemIds = [...new Set(variants.flatMap((variant) => variant.items || []).map(String))];
    const productIds = [...new Set(variants.map((variant) => String(variant.product)))];

    const images = imageIds.length
      ? await Image.find({ _id: { $in: imageIds } }).lean()
      : [];

    const result = await ProductVariant.deleteMany(
      {
        _id: { $in: _ids },
      },
      { session },
    );

    if (itemIds.length) {
      await ProductVariantItem.deleteMany(
        {
          _id: { $in: itemIds },
        },
        { session },
      );
    }

    if (imageIds.length) {
      await Image.deleteMany(
        {
          _id: { $in: imageIds },
        },
        { session },
      );
    }

    if (productIds.length) {
      await Product.updateMany(
        {
          _id: { $in: productIds },
        },
        {
          $pull: {
            variants: { $in: _ids },
          },
        },
        { session },
      );
    }

    await session.commitTransaction();

    await Promise.all(
      images.map((image) =>
        cloudinary.uploader.destroy(image.public_id).catch(() => null),
      ),
    );

    return { deletedCount: result.deletedCount };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { create, get, getDetail, update, remove };
