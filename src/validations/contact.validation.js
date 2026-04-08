const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const AppError = require("../utils/AppError");

const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      email: Joi.string().trim().email().max(255).required(),
      phone: Joi.string().trim().min(8).max(20).required(),
      message: Joi.string().trim().min(10).max(2000).required(),
    }).validateAsync(req.body, {
      abortEarly: false,
    });
    next();
  } catch (error) {
    next(new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

module.exports = { createNew };
