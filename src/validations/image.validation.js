const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const AppError = require("../utils/AppError");

const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      image_url: Joi.string().uri().required().messages({
        "string.base": "Đường dẫn ảnh phải là chuỗi",
        "string.uri": "Đường dẫn ảnh không hợp lệ",
        "string.empty": "Đường dẫn ảnh không được để trống",
        "any.required": "Đường dẫn ảnh là bắt buộc",
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
      variantId: Joi.string().length(24).hex().required().messages({
        "string.length": "Variant ID không hợp lệ",
        "string.hex": "Variant ID không đúng định dạng ObjectId",
        "any.required": "Variant ID là bắt buộc",
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

const getDetail = async (req, res, next) => {
  try {
    await Joi.object({
      _id: Joi.string().length(24).hex().required().messages({
        "string.length": "ID ảnh không hợp lệ",
        "string.hex": "ID ảnh không đúng định dạng ObjectId",
        "any.required": "ID ảnh là bắt buộc",
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
      image_url: Joi.string().uri().optional().messages({
        "string.base": "Đường dẫn ảnh phải là chuỗi",
        "string.uri": "Đường dẫn ảnh không hợp lệ",
      }),
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
      _ids: Joi.array()
        .items(Joi.string().length(24).hex())
        .min(1)
        .required()
        .messages({
          "array.min": "Phải chọn ít nhất 1 ảnh để xóa",
          "any.required": "Danh sách ID ảnh là bắt buộc",
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
