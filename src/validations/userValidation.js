const { StatusCodes } = require("http-status-codes");
const validations = require("./validations");
const createNew = async (req, res, next) => {
  try {
    await validations?.createUser?.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
  }
};
const login = async (req, res, next) => {
  try {
    await validations.login.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
  }
};
const getUserInfo = async (req, res, next) => {
  try {
    await validations?.getUserInfo?.validateAsync(req.params, { abortEarly: false });
    next();
  } catch (error) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
  }
};
module.exports = { createNew, login, getUserInfo };
