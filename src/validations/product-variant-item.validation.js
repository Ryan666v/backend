const Joi = require("joi");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/AppError");

const objectId = Joi.string().length(24).hex();

const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(1).max(100).required().messages({
        "string.base": "Tên biến thể phải là chuỗi",
        "string.empty": "Tên biến thể không được để trống",
        "any.required": "Tên biến thể là bắt buộc",
      }),

      price: Joi.number().min(0).required().messages({
        "number.base": "Giá phải là số",
        "number.min": "Giá không được nhỏ hơn 0",
        "any.required": "Giá là bắt buộc",
      }),

      quantity: Joi.number().integer().min(0).required().messages({
        "number.base": "Số lượng phải là số",
        "number.min": "Số lượng không được nhỏ hơn 0",
        "any.required": "Số lượng là bắt buộc",
      }),

      size: objectId.required().messages({
        "string.length": "Size không hợp lệ",
        "string.hex": "Size không đúng định dạng ObjectId",
        "any.required": "Size là bắt buộc",
      }),
    }).validateAsync(req.body, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY)
    );
  }
};

const getList = async (req, res, next) => {
  try {
    await Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().trim().allow(""),
      all: Joi.boolean().default(false),
      sortBy: Joi.string()
        .valid("name", "price", "quantity", "createdAt", "updatedAt")
        .default("createdAt"),
      order: Joi.string().valid("asc", "desc").default("desc"),
    }).validateAsync(req.query, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY)
    );
  }
};

const getDetail = async (req, res, next) => {
  try {
    await Joi.object({
      _id: objectId.required().messages({
        "string.length": "ID không hợp lệ",
        "string.hex": "ID không đúng định dạng ObjectId",
      }),
    }).validateAsync(req.params, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY)
    );
  }
};

const update = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(1).max(100).optional(),

      price: Joi.number().min(0).optional(),

      quantity: Joi.number().integer().min(0).optional(),

      size: objectId.optional(),
    })
      .min(1)
      .validateAsync(req.body, {
        abortEarly: false,
      });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY)
    );
  }
};

const remove = async (req, res, next) => {
  try {
    await Joi.object({
      _ids: Joi.array().items(objectId).min(1).required().messages({
        "array.min": "Phải chọn ít nhất 1 item để xóa",
      }),
    }).validateAsync(req.body, {
      abortEarly: false,
    });

    next();
  } catch (error) {
    next(
      new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY)
    );
  }
};

module.exports = {
  createNew,
  getList,
  getDetail,
  update,
  remove,
};
