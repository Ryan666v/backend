const express = require("express");
const variantRouter = express.Router({ mergeParams: true });
const imageRouter = require("./image.route");
const variantController = require("../controllers/product-variant.controller");
const variantValidation = require("../validations/product-variant.validation");
const authMiddleware = require("../middlewares/auth.middleware");

variantRouter.post(
  "/create",
  authMiddleware.authAdmin,
  variantValidation.createNew,
  variantController.create
);
variantRouter.get("/list", variantValidation.getList, variantController.list);
variantRouter.get(
  "/:_id",
  variantValidation.getDetail,
  variantController.getDetail
);
variantRouter.patch(
  "/:_id",
  authMiddleware.authAdmin,
  variantValidation.update,
  variantController.update
);
variantRouter.delete(
  "/",
  authMiddleware.authAdmin,
  variantValidation.remove,
  variantController.remove
);
variantRouter.use("/:variantId/image", imageRouter);
module.exports = variantRouter;
