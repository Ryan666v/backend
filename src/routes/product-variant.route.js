const express = require("express");
const variantRouter = express.Router();
const variantController = require("../controllers/product-variant.controller");
const variantValidation = require("../validations/product-variant.validation");
const authMiddleware = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer.middleware");

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
  upload.array("images", 4),
  variantController.update
);
variantRouter.delete(
  "/",
  authMiddleware.authAdmin,
  variantValidation.remove,
  variantController.remove
);
module.exports = variantRouter;
