const mongoose = require("mongoose");
const AppError = require("./AppError");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const Color = require("../models/color.model");
const ProductVariant = require("../models/product-variant.model");
const Size = require("../models/size.model");
const { StatusCodes } = require("http-status-codes");

const validateObjectId = (_id, message = "Invalid object id") => {
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new AppError(message, StatusCodes.BAD_REQUEST);
  }
};

const validateObjectIds = (_ids, message = "Invalid object id") => {
  if (!Array.isArray(_ids) || _ids.length === 0) {
    throw new AppError("At least one id is required", StatusCodes.BAD_REQUEST);
  }

  _ids.forEach((id) => validateObjectId(id, message));
};

const pickAllowedFields = (payload, allowedFields = []) => {
  return allowedFields.reduce((result, field) => {
    if (payload[field] !== undefined) {
      result[field] = payload[field];
    }
    return result;
  }, {});
};

const validateDocumentsExist = async ({
  ids = [],
  model,
  invalidIdMessage = "Invalid object id",
  notFoundMessage = "One or more documents do not exist",
}) => {
  if (!Array.isArray(ids) || ids.length === 0) return;

  validateObjectIds(ids, invalidIdMessage);

  const uniqueIds = [...new Set(ids.map(String))];
  const existingDocuments = await model
    .find({
      _id: { $in: uniqueIds },
    })
    .select("_id")
    .lean();

  if (existingDocuments.length !== uniqueIds.length) {
    throw new AppError(notFoundMessage, StatusCodes.BAD_REQUEST);
  }
};

const validateDocumentExist = async ({
  id,
  model,
  invalidIdMessage = "Invalid object id",
  notFoundMessage = "Document not found",
}) => {
  validateObjectId(id, invalidIdMessage);

  const exists = await model.exists({ _id: id });
  if (!exists) {
    throw new AppError(notFoundMessage, StatusCodes.NOT_FOUND);
  }

  return true;
};

const validateCategoriesExist = async (categoryIds = []) => {
  return validateDocumentsExist({
    ids: categoryIds,
    model: Category,
    invalidIdMessage: "Invalid category id",
    notFoundMessage: "One or more categories do not exist",
  });
};

const validateProductExist = async (productId) => {
  return validateDocumentExist({
    id: productId,
    model: Product,
    invalidIdMessage: "Invalid product id",
    notFoundMessage: "Product not found",
  });
};

const validateColorExist = async (colorId) => {
  return validateDocumentExist({
    id: colorId,
    model: Color,
    invalidIdMessage: "Invalid color id",
    notFoundMessage: "Color not found",
  });
};

const validateVariantUnique = async ({ product, color, excludeId }) => {
  if (!product || !color) return true;

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

const validateProductVariantExist = async (variantId) => {
  return validateDocumentExist({
    id: variantId,
    model: ProductVariant,
    invalidIdMessage: "Product variant ID is invalid",
    notFoundMessage: "Product variant not found",
  });
};

const validateSizeExist = async (sizeId) => {
  return validateDocumentExist({
    id: sizeId,
    model: Size,
    invalidIdMessage: "Invalid size id",
    notFoundMessage: "Size not found",
  });
};

module.exports = {
  validateObjectId,
  validateObjectIds,
  pickAllowedFields,
  validateDocumentExist,
  validateDocumentsExist,
  validateCategoriesExist,
  validateProductVariantDependencies,
  validateVariantUnique,
  validateProductExist,
  validateProductVariantExist,
  validateSizeExist,
};
