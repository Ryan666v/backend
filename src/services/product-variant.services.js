const { StatusCodes } = require("http-status-codes");
const ProductVariant = require("../models/product-variant.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");

const create = async (productId, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Helper.validateProductVariantDependencies({
        product: productId,
        color: payload.color,
      });
      await Helper.validateVariantUnique({
        product: productId,
        color: payload.color,
      });
      const createdVariant = await ProductVariant.create({
        ...payload,
        product: productId,
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
      } = query;
      const filter = search ? { name: { $regex: search, $options: "i" } } : {};
      const allowedSortFields = ["name", "createdAt", "updatedAt"];
      const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";
      const sortOrder = order === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };
      if (all === true || all === "true") {
        const data = await ProductVariant.find(filter)
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
        resolve({
          all: true,
          total: data.length,
          data,
        });
      }
      const skip = (page - 1) * limit;

      const [variants, total] = await Promise.all([
        ProductVariant.find(filter)
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
      const updatedVariant = await ProductVariant.findByIdAndUpdate(
        { _id },
        {
          $set: Helper.pickAllowedFields(payload, ["name", "color"]),
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .populate("color", "name code")
        .lean();
      if (!updatedVariant) {
        throw new AppError("Product variant not found", StatusCodes.NOT_FOUND);
      }

      resolve(updatedVariant);
    } catch (error) {
      reject(error);
    }
  });
};
const remove = async (productId, _ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectIds(_ids);
      const result = await ProductVariant.deleteMany({
        _id: { $in: _ids },
        product: productId,
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

module.exports = { create, get, getDetail, update, remove };
