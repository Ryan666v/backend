const { StatusCodes } = require("http-status-codes");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const { default: mongoose } = require("mongoose");
const Image = require("../models/image.model");
const ProductVariant = require("../models/product-variant.model");
const ProductVariantItem = require("../models/product-variant-item.model");
const cloudinary = require("../configs/cloudinary");

const parseObjectIdList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => mongoose.Types.ObjectId.isValid(item));

const intersectIds = (left = null, right = []) => {
  const normalizedRight = right.map((id) => String(id));
  if (!left) return normalizedRight;
  return left.filter((id) => normalizedRight.includes(String(id)));
};

const create = async (newProduct) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Helper.validateCategoriesExist(newProduct.categories);
      const createdProduct = await Product.create(newProduct);
      if (createdProduct) {
        resolve({ message: "Product created successfully" });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const get = async (query) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        all = false,
        sortBy = "createdAt",
        order = "desc",
        category,
        size,
        color,
        minPrice,
        maxPrice,
      } = query;
      const filter = {};

      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      if (category) {
        filter.categories = category;
      }

      const sizeIds = parseObjectIdList(size);
      const colorIds = parseObjectIdList(color);
      let matchedProductIds = null;

      if (colorIds.length) {
        const colorMatchedProductIds = await ProductVariant.distinct("product", {
          color: { $in: colorIds },
        });
        matchedProductIds = intersectIds(matchedProductIds, colorMatchedProductIds);
      }

      if (sizeIds.length || minPrice !== undefined || maxPrice !== undefined) {
        const variantItemFilter = {};

        if (sizeIds.length) {
          variantItemFilter.size = { $in: sizeIds };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
          variantItemFilter.price = {};

          if (minPrice !== undefined) {
            variantItemFilter.price.$gte = Number(minPrice);
          }

          if (maxPrice !== undefined) {
            variantItemFilter.price.$lte = Number(maxPrice);
          }
        }

        const matchedVariantItemIds = await ProductVariantItem.find(variantItemFilter)
          .select("_id")
          .lean();

        const variantItemIds = matchedVariantItemIds.map((item) => item._id);
        const sizePriceMatchedProductIds = await ProductVariant.distinct("product", {
          items: { $in: variantItemIds },
        });

        matchedProductIds = intersectIds(matchedProductIds, sizePriceMatchedProductIds);
      }

      if (matchedProductIds) {
        filter._id = {
          $in: matchedProductIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }

      const allowedSortFields = ["name", "createdAt", "updatedAt"];
      const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";
      const sortOrder = order === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };
      if (all === true || all === "true") {
        const data = await Product.find(filter)
          .populate("categories", "name description")
          .populate({
            path: "variants",
            populate: [
              {
                path: "color",
                select: "name code",
              },
              {
                path: "items",
                populate: {
                  path: "size",
                  select: "name",
                },
              },
              {
                path: "images",
                select: "image_url public_id",
              },
            ],
          })
          .sort(sort)
          .lean();
        resolve({
          all: true,
          total: data.length,
          data,
        });
        return;
      }
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate("categories", "name description")
          .populate({
            path: "variants",
            populate: [
              {
                path: "color",
                select: "name code",
              },
              {
                path: "items",
                populate: {
                  path: "size",
                  select: "name",
                },
              },
              {
                path: "images",
                select: "image_url public_id",
              },
            ],
          })
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        Product.countDocuments(filter),
      ]);
      resolve({
        data: products,
        // data: [],
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDetail = async (_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedProduct = await Product.findById(_id)
        .populate("categories", "name description")
        .populate({
          path: "variants",
          populate: [
            {
              path: "color",
              select: "name code",
            },
            {
              path: "items",
              populate: {
                path: "size",
                select: "name",
              },
            },
            {
              path: "images",
              select: "image_url public_id",
            },
          ],
        });
      if (!checkedProduct) {
        throw new AppError(
          "Product with this ID does not exist",
          StatusCodes.NOT_FOUND,
        );
      }
      resolve(checkedProduct);
    } catch (error) {
      reject(error);
    }
  });
};

const update = async (_id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      if (payload?.categories) {
        await Helper.validateCategoriesExist(payload?.categories);
      }
      const updatedProduct = await Product.findByIdAndUpdate(
        _id,
        {
          $set: Helper.pickAllowedFields(payload, [
            "name",
            "description",
            "categories",
          ]),
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .populate("categories", "name description createdAt updatedAt")
        .lean();
      if (!updatedProduct) {
        throw new AppError("Product not found", StatusCodes.NOT_FOUND);
      }

      resolve(updatedProduct);
    } catch (error) {
      reject(error);
    }
  });
};

const remove = async (_ids) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    Helper.validateObjectIds(_ids);

    const products = await Product.find({
      _id: { $in: _ids },
    }).lean();

    if (!products.length) {
      throw new AppError("No products were deleted", StatusCodes.NOT_FOUND);
    }

    const variantIds = [
      ...new Set(products.flatMap((product) => product.variants || []).map(String)),
    ];

    const variants = variantIds.length
      ? await ProductVariant.find({
          _id: { $in: variantIds },
        }).lean()
      : [];

    const itemIds = [
      ...new Set(variants.flatMap((variant) => variant.items || []).map(String)),
    ];
    const imageIds = [
      ...new Set(variants.flatMap((variant) => variant.images || []).map(String)),
    ];

    const images = imageIds.length
      ? await Image.find({
          _id: { $in: imageIds },
        }).lean()
      : [];

    const result = await Product.deleteMany(
      {
        _id: { $in: _ids },
      },
      { session },
    );

    if (variantIds.length) {
      await ProductVariant.deleteMany(
        {
          _id: { $in: variantIds },
        },
        { session },
      );
    }

    if (itemIds.length) {
      await ProductVariantItem.deleteMany(
        {
          _id: { $in: itemIds },
        },
        { session },
      );
    }

    if (imageIds.length) {
      await Image.deleteMany(
        {
          _id: { $in: imageIds },
        },
        { session },
      );
    }

    await session.commitTransaction();

    await Promise.all(
      images.map((image) =>
        cloudinary.uploader.destroy(image.public_id).catch(() => null),
      ),
    );

    return { deletedCount: result.deletedCount };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const createMany = async (productsData, uploadedFiles) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let fileIndex = 0;
    console.log("run here")
    const expectedImageCount = (productsData || []).reduce(
      (total, product) =>
        total +
        (product.variants || []).reduce(
          (variantTotal, variant) => variantTotal + (variant.imageCount || 0),
          0,
        ),
      0,
    );

    if ((uploadedFiles?.length || 0) !== expectedImageCount) {
      throw new AppError(
        "Số lượng ảnh tải lên không khớp với dữ liệu biến thể",
        StatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    const imageDocs = [];
    const itemDocs = [];
    const variantDocs = [];
    const productDocs = [];

    for (const productData of productsData) {
      await Helper.validateCategoriesExist(productData.categories);
      const productId = new mongoose.Types.ObjectId();
      const variantIds = [];

      for (const variantData of productData.variants || []) {
        const imageCount = Number(variantData.imageCount || 0);

        if (imageCount < 1 || imageCount > 4) {
          throw new AppError(
            "Mỗi biến thể phải có từ 1 đến 4 hình ảnh",
            StatusCodes.UNPROCESSABLE_ENTITY,
          );
        }

        const variantFiles = uploadedFiles.slice(fileIndex, fileIndex + imageCount);
        fileIndex += imageCount;

        const imageIds = [];

        for (const file of variantFiles) {
          const _id = new mongoose.Types.ObjectId();

          imageDocs.push({
            _id,
            image_url: file.path,
            public_id: file.filename,
          });

          imageIds.push(_id);
        }

        const itemIds = [];

        for (const item of variantData.items || []) {
          const _id = new mongoose.Types.ObjectId();

          itemDocs.push({
            _id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
          });

          itemIds.push(_id);
        }

        const variantId = new mongoose.Types.ObjectId();

        variantDocs.push({
          _id: variantId,
          product: productId,
          name: variantData.name,
          color: variantData.color,
          images: imageIds,
          items: itemIds,
        });

        variantIds.push(variantId);
      }

      productDocs.push({
        _id: productId,
        name: productData.name,
        description: productData.description,
        categories: productData.categories,
        variants: variantIds,
      });
    }

    if (imageDocs.length) await Image.insertMany(imageDocs, { session });
    if (itemDocs.length) await ProductVariantItem.insertMany(itemDocs, { session });
    if (variantDocs.length) await ProductVariant.insertMany(variantDocs, { session });
    if (productDocs.length) await Product.insertMany(productDocs, { session });

    await session.commitTransaction();

    return productDocs;
  } catch (error) {
    await session.abortTransaction();

    if (uploadedFiles?.length) {
      await Promise.all(
        uploadedFiles.map((file) =>
          cloudinary.uploader.destroy(file.filename).catch(() => {}),
        ),
      );
    }

    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { create, get, getDetail, update, remove, createMany };
