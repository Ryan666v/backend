const { StatusCodes } = require("http-status-codes");
const ProductVariantItemService = require("../services/product-variant-item.services");

const create = async (req, res) => {
  try {
    const { variantId } = req.params;

    const result = await ProductVariantItemService.create(
      variantId,
      req.body
    );

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

const getList = async (req, res) => {
  try {
    const { variantId } = req.params;

    const result = await ProductVariantItemService.getList(
      variantId,
      req.query
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

const getDetail = async (req, res) => {
  try {
    const { variantId, _id } = req.params;

    const result = await ProductVariantItemService.getDetail(
      variantId,
      _id
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { variantId, _id } = req.params;

    const result = await ProductVariantItemService.update(
      variantId,
      _id,
      req.body
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { _ids } = req.body;

    const result = await ProductVariantItemService.remove(
      variantId,
      _ids
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  create,
  getList,
  getDetail,
  update,
  remove,
};
