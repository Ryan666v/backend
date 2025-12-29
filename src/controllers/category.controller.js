const { StatusCodes } = require("http-status-codes");
const CategoryServices = require("../services/category.services");
const create = async (req, res, next) => {
  try {
    const result = await CategoryServices.create(req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};
const get = async (req, res, next) => {
  try {
    const result = await CategoryServices.get(req.query);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
const getDetail = async (req, res, next) => {
  try {
    const result = await CategoryServices.getDetail(req.params._id);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
const update = async (req, res, next) => {
  try {
    const { _id } = req.params;

    const result = await CategoryServices.update(_id, req.body);

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
    const result = await CategoryServices.remove(req.body._ids);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, get, getDetail, update, remove };
