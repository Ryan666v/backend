const { StatusCodes } = require("http-status-codes");
const validations = require("./validations");
const createNew = async (req, res, next) => {
  try {
    await validations?.createCategory?.validateAsync(req.body, {
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
    await validations?.getCategoriesQuery?.validateAsync(req.query, {
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
    await validations?.createCategory?.validateAsync(req.body, {
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
    await validations?.createCategory?.validateAsync(req.body, {
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
    await validations?.deleteManyCategories?.validateAsync(req.body, {
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
