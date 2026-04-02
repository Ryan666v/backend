const { StatusCodes } = require("http-status-codes");
const ImageServices = require("../services/image.services");
const createMany = async (req, res, next) => {
  try {
    const result = await ImageServices.createMany(req.files);
    return res.status(StatusCodes.CREATED).json(result);
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

const getDetail = async (req, res, next) => {
  try {
    const result = await ImageServices.getDetail(req.params._id);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
const update = async (req, res, next) => {
  try {
    const { _id } = req.params;

    const result = await ImageServices.update(_id, req.files);

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
    const result = await ImageServices.removeMany(
      req.body._ids,
    );
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMany, remove, update, getDetail };
