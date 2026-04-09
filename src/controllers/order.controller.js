const { StatusCodes } = require("http-status-codes");
const OrderServices = require("../services/order.services");

const createOrder = async (req, res, next) => {
  try {
    const result = await OrderServices.create(req.user, req.body, req);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await OrderServices.getList(req.user, req.query);
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
    const result = await OrderServices.getDetail(req.user, req.params._id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const result = await OrderServices.updateStatus(req.params._id, req.body);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    const result = await OrderServices.bulkUpdateStatus(req.body);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    const result = await OrderServices.cancel(req.user, req.params._id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const vnpayReturn = async (req, res, next) => {
  try {
    const result = await OrderServices.applyVnpayResult(req.query, "return");
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const vnpayIpn = async (req, res) => {
  const result = await OrderServices.applyVnpayResult(req.query, "ipn");
  return res.status(StatusCodes.OK).json(result);
};

module.exports = {
  createOrder,
  list,
  getDetail,
  updateStatus,
  bulkUpdateStatus,
  cancel,
  vnpayReturn,
  vnpayIpn,
};
