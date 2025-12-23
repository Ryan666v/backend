const mongoose = require("mongoose");
const AppError = require("./AppError");
const Category = require("../models/category.model");
const { StatusCodes } = require("http-status-codes");
const validateObjectId = (_id) => {
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new AppError("Invalid category id", StatusCodes.BAD_REQUEST);
  }
};
const validateObjectIds = (_ids) => {
  _ids.forEach((id) => validateObjectId(id));
};
const pickAllowedFields = (payload, allowedFields = []) => {
  return allowedFields.reduce((result, field) => {
    if (payload[field] !== undefined) {
      result[field] = payload[field];
    }
    return result;
  }, {});
};
const validateCategoriesExist = async (categoryIds = []) => {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) return;

  const existingCategories = await Category.find({
    _id: { $in: categoryIds },
  }).select("_id");

  if (existingCategories.length !== categoryIds.length) {
    throw new AppError(
      "One or more categories do not exist",
      StatusCodes.BAD_REQUEST
    );
  }
};
module.exports = {
  validateObjectId,
  validateObjectIds,
  pickAllowedFields,
  validateCategoriesExist,
};
