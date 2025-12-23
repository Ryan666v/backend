const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(1).max(100).required().messages({
        "string.base": "Tên kích cỡ phải là chuỗi",
        "string.empty": "Tên kích cỡ không được để trống",
        "any.required": "Tên kích cỡ là bắt buộc",
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
      search: Joi.string().trim().allow(""),
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
      name: Joi.string().trim().min(1).max(100).optional(),
    })
      .min(1)
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
          "array.min": "Phải chọn ít nhất 1 kích cỡ để xóa",
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
