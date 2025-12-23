const { StatusCodes } = require("http-status-codes");
const ProductVariantServices = require("../services/product-variant.services");
const create = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await ProductVariantServices.create(productId, req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
  }
};
const list = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await ProductVariantServices.get(productId, req.query);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
  }
};

const getDetail = async (req, res) => {
  try {
    const { productId, id } = req.params;
    const result = await ProductVariantServices.getDetail(productId, id);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};

const update = async (req, res) => {
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
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { productId } = req.params;
    const { _ids } = req.body;
    const result = await ProductVariantServices.remove(productId, _ids);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};

module.exports = { create, list, update, getDetail, remove };
