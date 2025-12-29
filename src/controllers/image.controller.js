const { StatusCodes } = require("http-status-codes");
const ImageServices = require("../services/image.services");
const createMany = async (req, res, next) => {
  try {
    const result = await ImageServices.createMany(
      req.params.variantId,
      req.files
    );
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};
const get = async (req, res, next) => {
  try {
    const result = await ImageServices.getByVariant(req.params.variantId);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
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
      req.params.variantId,
      req.body._ids
    );
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMany, remove, get, update, getDetail };
