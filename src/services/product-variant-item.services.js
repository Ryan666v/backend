const { StatusCodes } = require("http-status-codes");
const ProductVariantItem = require("../models/product-variant-item.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");

const create = async (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Helper.validateSizeExist(payload.size);

      const exists = await ProductVariantItem.findOne({
        size: payload.size,
      });

      if (exists) {
        throw new AppError(
          "This size already exists in this variant",
          StatusCodes.CONFLICT,
        );
      }

      const createdItem = await ProductVariantItem.create({
        ...payload,
      });

      resolve(createdItem);
    } catch (error) {
      reject(error);
    }
  });
};

const getList = async (query) => {
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
        const data = await ProductVariantItem.find(filter)
          .populate("size", "name")
          .sort(sort)
          .lean();

        return resolve({
          all: true,
          total: data.length,
          data,
        });
      }

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        ProductVariantItem.find(filter)
          .populate("size", "name")
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        ProductVariantItem.countDocuments(filter),
      ]);

      resolve({
        data: items,
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

const getDetail = async (itemId) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(itemId);
      const item = await ProductVariantItem.findOne({
        _id: itemId,
      })
        .populate("size", "name")
        .lean();

      if (!item) {
        throw new AppError(
          "Product variant item not found",
          StatusCodes.NOT_FOUND,
        );
      }

      resolve(item);
    } catch (error) {
      reject(error);
    }
  });
};

const update = async (itemId, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(itemId);

      if (payload.size) {
        await Helper.validateSizeExist(payload.size);

        const exists = await ProductVariantItem.findOne({
          size: payload.size,
          _id: { $ne: itemId },
        });

        if (exists) {
          throw new AppError(
            "This size already exists in this variant",
            StatusCodes.CONFLICT,
          );
        }
      }

      const updatedItem = await ProductVariantItem.findOneAndUpdate(
        { _id: itemId },
        {
          $set: Helper.pickAllowedFields(payload, [
            "name",
            "price",
            "quantity",
            "size",
          ]),
        },
        { new: true, runValidators: true },
      )
        .populate("size", "name")
        .lean();

      if (!updatedItem) {
        throw new AppError(
          "Product variant item not found",
          StatusCodes.NOT_FOUND,
        );
      }

      resolve(updatedItem);
    } catch (error) {
      reject(error);
    }
  });
};

const remove = async (_ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectIds(_ids);

      const result = await ProductVariantItem.deleteMany({
        _id: { $in: _ids },
      });

      if (result.deletedCount === 0) {
        throw new AppError("No items were deleted", StatusCodes.NOT_FOUND);
      }

      resolve({ deletedCount: result.deletedCount });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  create,
  getList,
  getDetail,
  update,
  remove,
};
