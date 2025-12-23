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

const updateUser = Joi.object({
  username: Joi.string().trim().min(3).max(50),
  email: Joi.string().email().lowercase(),
  phone: Joi.string().trim().min(8).max(15),
  gender: Joi.string().valid("male", "female", "other"),
  dob: Joi.date(),
  role: Joi.string().valid("user", "admin"),
}).min(1);

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
  all: Joi.boolean().default(false),
  sortBy: Joi.string()
    .valid("name", "createdAt", "updatedAt")
    .default("createdAt"),
  order: Joi.string().valid("asc", "desc").default("desc"),
});

const deleteManyCategories = Joi.object({
  _ids: Joi.array()
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
  updateUser,
  createCategory,
  updateCategory,
  categoryIdParam,
  getCategoriesQuery,
  deleteManyCategories,
};
