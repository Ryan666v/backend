const { StatusCodes } = require("http-status-codes");
const BlogServices = require("../services/blog.services");

const listPublic = async (req, res, next) => {
  try {
    const result = await BlogServices.listPublicBlogs(req.query);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getPublicDetail = async (req, res, next) => {
  try {
    const result = await BlogServices.getPublicBlogDetail(req.params.slug);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const listAdmin = async (req, res, next) => {
  try {
    const result = await BlogServices.listAdminBlogs(req.query);
    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getAdminDetail = async (req, res, next) => {
  try {
    const result = await BlogServices.getAdminBlogDetail(req.params._id);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await BlogServices.createBlog(req.body, req.user);
    return res.status(StatusCodes.CREATED).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await BlogServices.updateBlog(req.params._id, req.body, req.user);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await BlogServices.removeBlogs(req.body._ids);
    return res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPublic,
  getPublicDetail,
  listAdmin,
  getAdminDetail,
  create,
  update,
  remove,
};
