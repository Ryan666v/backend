const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const AppError = require("../utils/AppError");

const objectId = Joi.string().length(24).hex();

const blogPayloadSchema = Joi.object({
  title: Joi.string().trim().max(240).allow("").optional(),
  slug: Joi.string().trim().max(260).allow("").optional(),
  category: Joi.string()
    .valid("campaign", "collection", "style-guide", "behind-the-scenes")
    .optional(),
  status: Joi.string().valid("draft", "review", "ready", "published").optional(),
  summary: Joi.string().trim().max(4000).allow("").optional(),
  coverImageId: objectId.allow(null, "").optional(),
  coverUrl: Joi.string().trim().allow("").optional(),
  readTime: Joi.string().trim().max(60).allow("").optional(),
  content: Joi.string().allow("").optional(),
  seoTitle: Joi.string().trim().max(260).allow("").optional(),
  seoDescription: Joi.string().trim().max(4000).allow("").optional(),
  publishedAt: Joi.date().optional(),
}).unknown(false);

const getPublicList = async (req, res, next) => {
  try {
    await Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().trim().allow("").default(""),
      category: Joi.string()
        .valid("campaign", "collection", "style-guide", "behind-the-scenes")
        .optional(),
      all: Joi.boolean().default(false),
      sortBy: Joi.string()
        .valid("title", "slug", "createdAt", "updatedAt", "publishedAt")
        .default("publishedAt"),
      order: Joi.string().valid("asc", "desc").default("desc"),
    }).validateAsync(req.query, { abortEarly: false });
    next();
  } catch (error) {
    next(new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

const getPublicDetail = async (req, res, next) => {
  try {
    await Joi.object({
      slug: Joi.string().trim().required(),
    }).validateAsync(req.params, { abortEarly: false });
    next();
  } catch (error) {
    next(new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

const getAdminList = async (req, res, next) => {
  try {
    await Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().trim().allow("").default(""),
      category: Joi.string()
        .valid("campaign", "collection", "style-guide", "behind-the-scenes")
        .optional(),
      status: Joi.string().valid("draft", "review", "ready", "published").optional(),
      all: Joi.boolean().default(false),
      sortBy: Joi.string()
        .valid("title", "slug", "createdAt", "updatedAt", "publishedAt")
        .default("updatedAt"),
      order: Joi.string().valid("asc", "desc").default("desc"),
    }).validateAsync(req.query, { abortEarly: false });
    next();
  } catch (error) {
    next(new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

const getAdminDetail = async (req, res, next) => {
  try {
    await Joi.object({
      _id: objectId.required(),
    }).validateAsync(req.params, { abortEarly: false });
    next();
  } catch (error) {
    next(new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

const createNew = async (req, res, next) => {
  try {
    await blogPayloadSchema.min(1).validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

const update = async (req, res, next) => {
  try {
    await Joi.object({
      _id: objectId.required(),
    }).validateAsync(req.params, { abortEarly: false });
    await blogPayloadSchema.min(1).validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

const remove = async (req, res, next) => {
  try {
    await Joi.object({
      _ids: Joi.array().items(objectId).min(1).required(),
    }).validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

module.exports = {
  getPublicList,
  getPublicDetail,
  getAdminList,
  getAdminDetail,
  createNew,
  update,
  remove,
};
