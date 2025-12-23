const { StatusCodes } = require("http-status-codes");
const SizeServices = require("../services/size.services");
const create = async (req, res) => {
  try {
    const result = await SizeServices.create(req.body);
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
const get = async (req, res) => {
  try {
    const result = await SizeServices.get(req.query);
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
    const result = await SizeServices.getDetail(req.params._id);
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
    const { _id } = req.params;

    const result = await SizeServices.update(_id, req.body);

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
    const result = await SizeServices.remove(req.body._ids);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};

module.exports = { create, get, getDetail, update, remove };
