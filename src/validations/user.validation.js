const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");

const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      role: Joi.string().valid("user", "admin").optional(),
      gender: Joi.string().valid("male", "female", "other").optional(),
      phone: Joi.string()
        .pattern(/^[0-9]{9,11}$/)
        .required(),
      dob: Joi.date().less("now").required(),
    })?.validateAsync(req.body, {
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
const login = async (req, res, next) => {
  try {
    await Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    }).validateAsync(req.body, { abortEarly: false });
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
    await Joi.object({
      _id: Joi.string().required(),
    })?.validateAsync(req.params, {
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
      username: Joi.string().trim().min(3).max(50),
      email: Joi.string().email().lowercase(),
      phone: Joi.string().trim().min(8).max(15),
      gender: Joi.string().valid("male", "female", "other"),
      dob: Joi.date(),
      role: Joi.string().valid("user", "admin"),
    })
      .min(1)
      ?.validateAsync(req.body, {
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
module.exports = { createNew, login, getUserInfo, update };
