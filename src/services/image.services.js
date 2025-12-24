const { StatusCodes } = require("http-status-codes");
const Image = require("../models/image.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const cloudinary = require("../config/cloudinary");
const createMany = async (variantId, files) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Helper.validateProductVariantExist(variantId);

      if (!files || files.length === 0) {
        throw new AppError("No images uploaded", StatusCodes.BAD_REQUEST);
      }
      console.log(files)
      if (files.length > 4) {
        throw new AppError(
          "Maximum 4 images are allowed",
          StatusCodes.UNPROCESSABLE_ENTITY
        );
      }
      const imagesPayload = files.map((file) => ({
        image_url: file.path,
        public_id: file.filename,
        productVariant: variantId,
      }));

      const createdImages = await Image.insertMany(imagesPayload);

      resolve(createdImages);
    } catch (error) {
      reject(error);
    }
  });
};
const getByVariant = async (variantId) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Helper.validateProductVariantExist(variantId);

      const images = await Image.find({ productVariant: variantId })
        .sort({ createdAt: -1 })
        .lean();

      resolve({
        total: images.length,
        data: images,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDetail = async (_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);

      const image = await Image.findById(_id).lean();
      if (!image) {
        throw new AppError("Image not found", StatusCodes.NOT_FOUND);
      }

      resolve(image);
    } catch (error) {
      reject(error);
    }
  });
};

const removeMany = async (variantId, imageIds) => {
  return new Promise(async (resolve, reject) => {
    try {
      const images = await Image.find({
        _id: { $in: imageIds },
        productVariant: variantId,
      });

      if (!images.length) {
        throw new AppError("Images not found", StatusCodes.NOT_FOUND);
      }
      for (const img of images) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      const result = await Image.deleteMany({
        _id: { $in: imageIds },
        productVariant: variantId,
      });

      resolve({ deletedCount: result.deletedCount });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { createMany, getByVariant, getDetail, removeMany };
