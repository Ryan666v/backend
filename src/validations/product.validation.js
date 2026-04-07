const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const AppError = require("../utils/AppError");

const objectId = Joi.string().length(24).hex();

const createNew = async (req, res, next) => {
  try {
    await Joi.object({
      name: Joi.string().trim().min(2).max(150).required().messages({
        "string.empty": "Tên sản phẩm không được để trống",
        "string.min": "Tên sản phẩm phải có ít nhất 2 ký tự",
      }),

      description: Joi.string().trim().min(10).max(2000).required().messages({
        "string.empty": "Mô tả sản phẩm không được để trống",
      }),

      categories: Joi.array()
        .items(objectId)
        .min(1)
        .required()
        .messages({
          "array.min": "Sản phẩm phải thuộc ít nhất 1 category",
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
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().trim().allow("").default(""),
      all: Joi.boolean().default(false),
      sortBy: Joi.string()
        .valid("name", "createdAt", "updatedAt")
        .default("createdAt"),
      order: Joi.string().valid("asc", "desc").default("desc"),
      category: objectId.optional(),
      size: Joi.string().trim().allow("").optional(),
      color: Joi.string().trim().allow("").optional(),
      minPrice: Joi.number().min(0).optional(),
      maxPrice: Joi.number().min(0).optional(),
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
      _id: objectId.required().messages({
        "string.length": "ID không hợp lệ",
        "string.hex": "ID không đúng định dạng ObjectId",
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
      name: Joi.string().trim().min(2).max(150).optional(),
      description: Joi.string().trim().min(10).max(2000).optional(),
      categories: Joi.array().items(objectId).min(1).optional(),
    })
      .min(1)
      .unknown(false)
      .messages({
        "object.min": "Phải có ít nhất 1 trường để cập nhật",
      })
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
        .items(objectId)
        .min(1)
        .required()
        .messages({
          "array.min": "Phải chọn ít nhất 1 sản phẩm để xóa",
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

const createManySchema = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().trim().min(2).max(150).required(),
      description: Joi.string().trim().min(1).max(2000).required(),
      categories: Joi.array().items(objectId).min(1).required(),
      variants: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().trim().min(2).max(200).required(),
            color: objectId.required(),
            imageCount: Joi.number().integer().min(1).max(4).required(),
            items: Joi.array()
              .items(
                Joi.object({
                  name: Joi.string().trim().min(2).max(220).required(),
                  size: objectId.required(),
                  quantity: Joi.number().integer().min(0).required(),
                  price: Joi.number().min(0).required(),
                })
              )
              .min(1)
              .required(),
          })
        )
        .min(1)
        .required(),
    })
  )
  .min(1)
  .required();

const createMany = async (req, res, next) => {
  try {
    let products;

    try {
      if (Array.isArray(req.body.products)) {
        products = req.body.products;
      } else if (typeof req.body.products === "string") {
        products = JSON.parse(req.body.products || "[]");
      } else if (req.body.products && typeof req.body.products === "object") {
        products = req.body.products;
      } else {
        products = [];
      }
    } catch (error) {
      throw new AppError("Dữ liệu sản phẩm không đúng định dạng JSON", StatusCodes.BAD_REQUEST);
    }

    await createManySchema.validateAsync(products, { abortEarly: false });

    const expectedImageCount = products.reduce(
      (total, product) =>
        total +
        (product.variants || []).reduce(
          (variantTotal, variant) => variantTotal + (variant.imageCount || 0),
          0,
        ),
      0,
    );

    const uploadedCount = req.files?.length || 0;

    if (uploadedCount !== expectedImageCount) {
      throw new AppError(
        "Số lượng ảnh tải lên không khớp với dữ liệu biến thể",
        StatusCodes.UNPROCESSABLE_ENTITY,
      );
    }
    req.body.products = products;
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(new Error(error).message, StatusCodes.UNPROCESSABLE_ENTITY)
    );
  }
};

module.exports = {
  createNew,
  getList,
  getDetail,
  update,
  remove,
  createMany,
};
