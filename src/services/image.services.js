const { StatusCodes } = require("http-status-codes");
const Image = require("../models/image.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const cloudinary = require("../config/cloudinary");
const createMany = async (variantId, files) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Helper.validateProductVariantExist(variantId);

      if (!Array.isArray(files) || files.length === 0) {
        throw new AppError("No images uploaded", StatusCodes.BAD_REQUEST);
      }

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
      if (Array.isArray(files) && files.length > 0) {
        console.log("run");
        await Promise.all(
          files.map((file) => cloudinary.uploader.destroy(file.filename))
        );
      }

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
      await Promise.all(
        images.map((image) => {
          cloudinary.uploader.destroy(image.public_id);
        })
      );
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
const update = async (_id, files) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);

      if (!files || files.length === 0) {
        throw new AppError("No image uploaded", StatusCodes.BAD_REQUEST);
      }

      const file = files[0];

      const existingImage = await Image.findById(_id);
      if (!existingImage) {
        throw new AppError("Image not found", StatusCodes.NOT_FOUND);
      }

      if (existingImage.public_id) {
        await cloudinary.uploader.destroy(existingImage.public_id);
      }

      existingImage.image_url = file.path;
      existingImage.public_id = file.filename;

      await existingImage.save();

      resolve(existingImage);
    } catch (error) {
      if (files && files[0]?.filename) {
        await cloudinary.uploader.destroy(files[0].filename);
      }
      reject(error);
    }
  });
};

module.exports = { createMany, getByVariant, getDetail, removeMany, update };
