const { StatusCodes } = require("http-status-codes");
const Color = require("../models/color.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");

const create = async (newColor) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedColor = await Color.findOne({ name: newColor.name });
      if (checkedColor) {
        throw new AppError(
          "Color with this name already exists",
          StatusCodes.CONFLICT
        );
      }
      const createdColor = await Color.create(newColor);
      if (createdColor) {
        resolve({ message: "Color created successfully" });
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
        const data = await Color.find(filter).sort(sort).lean();
        return resolve({
          all: true,
          total: data.length,
          data,
        });
      }
      const skip = (page - 1) * limit;

      const [colors, total] = await Promise.all([
        Color.find(filter).skip(skip).limit(limit).sort(sort).lean(),
        Color.countDocuments(filter),
      ]);
      resolve({
        data: colors,
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
      const checkedColor = await Color.findById(_id).lean();
      if (!checkedColor) {
        throw new AppError(
          "Color with this ID does not exist",
          StatusCodes.NOT_FOUND
        );
      }
      resolve(checkedColor);
    } catch (error) {
      reject(error);
    }
  });
};
const update = async (_id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      const updatedColor = await Color.findByIdAndUpdate(
        _id,
        {
          $set: Helper.pickAllowedFields(payload, ["name", "code"]),
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();
      if (!updatedColor) {
        throw new AppError("Color not found", StatusCodes.NOT_FOUND);
      }

      resolve(updatedColor);
    } catch (error) {
      reject(error);
    }
  });
};
const remove = async (_ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectIds(_ids);
      const result = await Color.deleteMany({
        _id: { $in: _ids },
      });

      if (result.deletedCount === 0) {
        throw new AppError("No colors were deleted", StatusCodes.NOT_FOUND);
      }
      resolve({ deletedCount: result.deletedCount });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { create, get, getDetail, update, remove };
