const { StatusCodes } = require("http-status-codes");
const ColorServices = require("../services/color.services");
const create = async (req, res) => {
  try {
    const result = await ColorServices.create(req.body);
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
    const result = await ColorServices.get(req.query);
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
    const result = await ColorServices.getDetail(req.params._id);
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
    const result = await ColorServices.update(_id, req.body);
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
    const result = await ColorServices.remove(req.body._ids);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};

module.exports = { create, list, update, getDetail, remove };
