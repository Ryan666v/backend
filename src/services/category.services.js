const { StatusCodes } = require("http-status-codes");
const Category = require("../models/category.model");
const Image = require("../models/image.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const cloudinary = require("../configs/cloudinary");

const categoryImagePopulate = {
  path: "image",
  select: "image_url public_id createdAt updatedAt",
};

const create = async (newCategory) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedCategory = await Category.findOne({
        name: newCategory.name,
      });
      if (checkedCategory) {
        throw new AppError(
          "Category with this name already exists",
          StatusCodes.CONFLICT
        );
      }
      const createdCategory = await Category.create({
        ...newCategory,
      });
      if (createdCategory) {
        resolve({ message: "Category created successfully" });
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
        const data = await Category.find(filter)
          .select("_id name description type image createdAt updatedAt")
          .populate(categoryImagePopulate)
          .sort(sort)
          .lean();

        return resolve({
          all: true,
          total: data.length,
          data,
        });
      }

      const skip = (page - 1) * limit;

      const [categories, total] = await Promise.all([
        Category.find(filter)
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .populate(categoryImagePopulate)
          .lean(),
        Category.countDocuments(filter),
      ]);
      resolve({
        data: categories,
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
      const checkedCategory = await Category.findOne({ _id }).populate(
        categoryImagePopulate
      );
      if (!checkedCategory) {
        throw new AppError(
          "Category with this ID does not exist",
          StatusCodes.NOT_FOUND
        );
      }
      resolve(checkedCategory);
    } catch (error) {
      reject(error);
    }
  });
};

const update = async (_id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      const updatedCategory = await Category.findByIdAndUpdate(
        _id,
        {
          $set: Helper.pickAllowedFields(payload, [
            "name",
            "description",
            "type",
            "image",
          ]),
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(categoryImagePopulate)
        .lean();
      if (!updatedCategory) {
        throw new AppError("Category not found", StatusCodes.NOT_FOUND);
      }

      resolve(updatedCategory);
    } catch (error) {
      reject(error);
    }
  });
};

const remove = async (_ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectIds(_ids);

      const categories = await Category.find({
        _id: { $in: _ids },
      })
        .select("image")
        .populate(categoryImagePopulate)
        .lean();

      const imageDocs = categories
        .map((category) => category.image)
        .filter(Boolean);

      if (imageDocs.length) {
        await Promise.all(
          imageDocs.map((image) =>
            cloudinary.uploader.destroy(image.public_id).catch(() => null)
          )
        );

        await Image.deleteMany({
          _id: { $in: imageDocs.map((image) => image._id) },
        });
      }

      const result = await Category.deleteMany({
        _id: { $in: _ids },
      });

      if (result.deletedCount === 0) {
        throw new AppError("No categories were deleted", StatusCodes.NOT_FOUND);
      }
      resolve({ deletedCount: result.deletedCount });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { create, get, getDetail, update, remove };
