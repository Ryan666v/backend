const { StatusCodes } = require("http-status-codes");
const ProductVariantServices = require("../services/product-variant.services");
const create = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await ProductVariantServices.create(productId, req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};
const list = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await ProductVariantServices.get(productId, req.query);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { productId, _id } = req.params;
    const result = await ProductVariantServices.getDetail(productId, _id);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { productId, _id } = req.params;
    const result = await ProductVariantServices.update(
      productId,
      _id,
      req.body
    );
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
    const { productId } = req.params;
    const { _ids } = req.body;
    const result = await ProductVariantServices.remove(productId, _ids);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, list, update, getDetail, remove };
