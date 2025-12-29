const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const AppError = require("../utils/AppError");

const hexColor = Joi.string()
  .trim()
  .pattern(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
  .messages({
    "string.pattern.base": "Mã màu phải là HEX hợp lệ (vd: #FFF hoặc #FFFFFF)",
  });
const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(2).max(50).required().messages({
        "string.empty": "Tên màu không được để trống",
      }),

      code: hexColor.required().messages({
        "any.required": "Mã màu là bắt buộc",
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
      search: Joi.string().trim().allow("").default(""),
      all: Joi.boolean().default(false),
      sortBy: Joi.string()
        .valid("name", "createdAt", "updatedAt")
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
      _id: Joi.string().length(24).hex().required().messages({
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
      name: Joi.string().trim().min(2).max(50).optional(),
      code: hexColor.optional(),
    })
      .min(1)
      .unknown(false)
      .messages({
        "object.min": "Phải có ít nhất 1 trường để cập nhật",
      })
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
      _ids: Joi.array()
        .items(Joi.string().length(24).hex())
        .min(1)
        .required()
        .messages({
          "array.min": "Phải chọn ít nhất 1 sản phẩm để xóa",
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
