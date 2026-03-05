const { StatusCodes } = require("http-status-codes");
const ProductServices = require("../services/product.services");
const create = async (req, res, next) => {
  try {
    const result = await ProductServices.create(req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};
const list = async (req, res, next) => {
  try {
    const result = await ProductServices.get(req.query);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const result = await ProductServices.getDetail(req.params._id);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const result = await ProductServices.update(_id, req.body);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await ProductServices.remove(req.body._ids);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
const createMany = async (req, res, next) => {
  try {
    const productsData = JSON.parse(req.body.products);
    const uploadedFiles = req.files;

    const result = await ProductServices.createMany(productsData, uploadedFiles);

    return res.status(StatusCodes.CREATED).json({ success: true, data: result });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      const cloudinary = require("../configs/cloudinary");
      await Promise.all(
        req.files.map((file) => cloudinary.uploader.destroy(file.filename)),
      );
    }
    next(error);
  }
};
module.exports = { create, list, update, getDetail, remove, createMany };
