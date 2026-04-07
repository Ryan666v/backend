const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const AppError = require("../utils/AppError");

const categoryTypeSchema = Joi.string().valid(
  "shirt",
  "pants",
  "accessory",
  "price"
);

const imageIdSchema = Joi.alternatives().try(
  Joi.string().length(24).hex(),
  Joi.allow(null)
);

const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(2).max(100).required().messages({
        "string.base": "Ten category phai la chuoi",
        "string.empty": "Ten category khong duoc de trong",
        "any.required": "Ten category la bat buoc",
      }),
      description: Joi.string().trim().allow("").max(500).messages({
        "string.base": "Mo ta phai la chuoi",
      }),
      type: categoryTypeSchema.required().messages({
        "any.only": "Loai category khong hop le",
        "any.required": "Loai category la bat buoc",
      }),
      image: imageIdSchema.optional(),
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
        "string.length": "ID khong hop le",
        "string.hex": "ID khong dung dinh dang ObjectId",
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
      name: Joi.string().trim().min(2).max(100).optional(),
      description: Joi.string().trim().allow("").max(500).optional(),
      type: categoryTypeSchema.optional(),
      image: imageIdSchema.optional(),
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
          "array.min": "Phai chon it nhat 1 category de xoa",
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
