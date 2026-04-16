const Joi = require("joi");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/AppError");

const objectId = Joi.string().length(24).hex();

const create = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(2).max(150).required(),
      phone: Joi.string()
        .trim()
        .pattern(/^[0-9]{9,11}$/)
        .required(),
      city: Joi.string().trim().min(2).max(120).required(),
      district: Joi.string().trim().min(2).max(120).required(),
      ward: Joi.string().trim().min(1).max(120).required(),
      address: Joi.string().trim().min(5).max(255).required(),
      note: Joi.string().trim().max(500).allow("").optional(),
      paymentMethod: Joi.string().valid("COD", "VNPAY", "ZALOPAY").default("COD"),
      items: Joi.array()
        .items(
          Joi.object({
            productVariantItem: objectId.required(),
            quantity: Joi.number().integer().min(1).required(),
          }),
        )
        .min(1)
        .required(),
    }).validateAsync(req.body, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY),
    );
  }
};

const getList = async (req, res, next) => {
  try {
    await Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      all: Joi.boolean().default(false),
      search: Joi.string().trim().allow("").default(""),
      createdFrom: Joi.date().optional(),
      createdTo: Joi.date().optional(),
      sortBy: Joi.string()
        .valid("createdAt", "updatedAt", "total", "status", "paymentStatus")
        .default("createdAt"),
      order: Joi.string().valid("asc", "desc").default("desc"),
      status: Joi.string()
        .valid("PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED")
        .optional(),
      paymentStatus: Joi.string()
        .valid("PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED")
        .optional(),
      paymentMethod: Joi.string().valid("COD", "VNPAY", "ZALOPAY").optional(),
      user: objectId.optional(),
    }).validateAsync(req.query, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY),
    );
  }
};

const getDetail = async (req, res, next) => {
  try {
    await Joi.object({
      _id: objectId.required(),
    }).validateAsync(req.params, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY),
    );
  }
};

const updateStatus = async (req, res, next) => {
  try {
    await Joi.object({
      status: Joi.string()
        .valid("PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED")
        .required(),
    }).validateAsync(req.body, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY),
    );
  }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    await Joi.object({
      ids: Joi.array().items(objectId).min(1).required(),
      status: Joi.string()
        .valid("PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED")
        .required(),
    }).validateAsync(req.body, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY),
    );
  }
};

module.exports = {
  create,
  getList,
  getDetail,
  updateStatus,
  bulkUpdateStatus,
};
