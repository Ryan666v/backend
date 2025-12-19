const Joi = require("joi");
const createUser = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("user", "admin").optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{9,11}$/)
    .required(),
  dob: Joi.date().less("now").required(),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
const getUserInfo = Joi.object({
  _id: Joi.string().required(),
});

const createCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.base": "Tên category phải là chuỗi",
    "string.empty": "Tên category không được để trống",
    "any.required": "Tên category là bắt buộc",
  }),

  description: Joi.string().trim().allow("").max(500).messages({
    "string.base": "Mô tả phải là chuỗi",
  }),
});

const updateCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),

  description: Joi.string().trim().allow("").max(500).optional(),
}).min(1);

const categoryIdParam = Joi.object({
  id: Joi.string().length(24).hex().required().messages({
    "string.length": "ID không hợp lệ",
    "string.hex": "ID không đúng định dạng ObjectId",
  }),
});

const getCategoriesQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow(""),
});

const deleteManyCategories = Joi.object({
  ids: Joi.array()
    .items(Joi.string().length(24).hex())
    .min(1)
    .required()
    .messages({
      "array.min": "Phải chọn ít nhất 1 category để xóa",
    }),
});

module.exports = {
  createUser,
  login,
  getUserInfo,
  createCategory,
  updateCategory,
  categoryIdParam,
  getCategoriesQuery,
  deleteManyCategories,
};
