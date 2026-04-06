const { StatusCodes } = require("http-status-codes");
const Size = require("../models/size.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const create = async (newSize) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedSize = await Size.findOne({
        name: newSize.name,
      });
      if (checkedSize) {
        throw new AppError(
          "Size with this name already exists",
          StatusCodes.CONFLICT
        );
      }
      const createdSize = await Size.create({
        ...newSize,
      });
      if (createdSize) {
        resolve({ message: "Size created successfully" });
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
        const data = await Size.find(filter)
          .sort(sort)
          .lean();

        return resolve({
          all: true,
          total: data.length,
          data,
        });
      }
      const skip = (page - 1) * limit;

      const [sizes, total] = await Promise.all([
        Size.find(filter).skip(skip).limit(limit).sort(sort).lean(),
        Size.countDocuments(filter),
      ]);
      resolve({
        data: sizes,
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
      const checkedSize = await Size.findOne({ _id: _id });
      if (!checkedSize) {
        throw new AppError(
          "Size with this ID does not exist",
          StatusCodes.NOT_FOUND
        );
      }
      resolve(checkedSize);
    } catch (error) {
      reject(error);
    }
  });
};
const update = async (_id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      const updatedSize = await Size.findByIdAndUpdate(
        _id,
        { $set: Helper.pickAllowedFields(payload, ["name"]) },
        {
          new: true,
          runValidators: true,
        }
      ).lean();
      if (!updatedSize) {
        throw new AppError("Size not found", StatusCodes.NOT_FOUND);
      }

      resolve(updatedSize);
    } catch (error) {
      reject(error);
    }
  });
};
const remove = async (_ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectIds(_ids);
      const result = await Size.deleteMany({
        _id: { $in: _ids },
      });

      if (result.deletedCount === 0) {
        throw new AppError("No sizes were deleted", StatusCodes.NOT_FOUND);
      }
      resolve({ deletedCount: result.deletedCount });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { create, get, getDetail, update, remove };
