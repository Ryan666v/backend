const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(2).max(150).required().messages({
        "string.empty": "Tên sản phẩm không được để trống",
        "string.min": "Tên sản phẩm phải có ít nhất 2 ký tự",
      }),

      description: Joi.string().trim().min(10).max(2000).required().messages({
        "string.empty": "Mô tả sản phẩm không được để trống",
      }),

      categories: Joi.array()
        .items(Joi.string().length(24).hex())
        .min(1)
        .required()
        .messages({
          "array.min": "Sản phẩm phải thuộc ít nhất 1 category",
        }),
    }).validateAsync(req.body, {
      abortEarly: false,
    });
    next();
  } catch (error) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
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
      category: Joi.string().length(24).hex().optional(),
    }).validateAsync(req.query, {
      abortEarly: false,
    });
    next();
  } catch (error) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
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
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
  }
};
const update = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(2).max(150).optional(),

      description: Joi.string().trim().min(10).max(2000).optional(),

      categories: Joi.array()
        .items(Joi.string().length(24).hex())
        .min(1)
        .optional(),
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
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
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
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
  }
};
module.exports = {
  createNew,
  getList,
  getDetail,
  update,
  remove,
};
