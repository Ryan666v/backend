const Joi = require("joi");
const { StatusCodes } = require("http-status-codes");
const createNew = async (req, res, next) => {
  const correctConditions = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("user", "admin").optional(),
    phone: Joi.string()
      .pattern(/^[0-9]{9,11}$/)
      .required(),
    dob: Joi.date().less("now").required(),
  });
  try {
    await correctConditions.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: "Validation Error",
      errors: new Error(error).message,
    });
  }
};
module.exports = { createNew };
