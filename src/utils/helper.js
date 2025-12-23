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

const validateProductExist = async (productId) => {
  validateObjectId(productId, "Invalid product id");

  const exists = await Product.exists({ _id: productId });
  if (!exists) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }
};

const validateColorExist = async (colorId) => {
  validateObjectId(colorId, "Invalid color id");

  const exists = await Color.exists({ _id: colorId });
  if (!exists) {
    throw new AppError("Color not found", StatusCodes.NOT_FOUND);
  }
};


const validateVariantUnique = async ({ product, color, excludeId }) => {
  const filter = { product, color };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const exists = await ProductVariant.exists(filter);
  if (exists) {
    throw new AppError(
      "This product already has a variant with this color",
      StatusCodes.CONFLICT
    );
  }
};

const validateProductVariantDependencies = async ({ product, color }) => {
  if (product) await validateProductExist(product);
  if (color) await validateColorExist(color);
};
module.exports = {
  validateObjectId,
  validateObjectIds,
  pickAllowedFields,
  validateCategoriesExist,
  validateProductVariantDependencies,
  validateVariantUnique,
};
