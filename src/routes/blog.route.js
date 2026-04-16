const express = require("express");
const blogRouter = express.Router();
const BlogController = require("../controllers/blog.controller");
const BlogValidation = require("../validations/blog.validation");
const authMiddleware = require("../middlewares/auth.middleware");

blogRouter.get("/list", BlogValidation.getPublicList, BlogController.listPublic);
blogRouter.get("/slug/:slug", BlogValidation.getPublicDetail, BlogController.getPublicDetail);

blogRouter.get(
  "/admin/list",
  authMiddleware.authAdmin,
  BlogValidation.getAdminList,
  BlogController.listAdmin,
);
blogRouter.get(
  "/admin/:_id",
  authMiddleware.authAdmin,
  BlogValidation.getAdminDetail,
  BlogController.getAdminDetail,
);
blogRouter.post(
  "/create",
  authMiddleware.authAdmin,
  BlogValidation.createNew,
  BlogController.create,
);
blogRouter.patch(
  "/:_id",
  authMiddleware.authAdmin,
  BlogValidation.update,
  BlogController.update,
);
blogRouter.delete(
  "/",
  authMiddleware.authAdmin,
  BlogValidation.remove,
  BlogController.remove,
);

module.exports = blogRouter;
