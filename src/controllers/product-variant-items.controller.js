const { StatusCodes } = require("http-status-codes");
const ProductVariantItemService = require("../services/product-variant-item.services");

const create = async (req, res, next) => {
  try {
    const result = await ProductVariantItemService.create(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getList = async (req, res, next) => {
  try {
    const result = await ProductVariantItemService.getList(req.query);

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { _id } = req.params;

    const result = await ProductVariantItemService.getDetail(_id);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { _id } = req.params;

    const result = await ProductVariantItemService.update(_id, req.body);

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
    const { _ids } = req.body;

    const result = await ProductVariantItemService.remove(_ids);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getList,
  getDetail,
  update,
  remove,
};
