const express = require("express");
const productRouter = express.Router();
const productController = require("../controllers/product.controller");
const productValidation = require("../validations/product.validation");
const authMiddleware = require("../middlewares/auth.middleware");
const { bulkUpload } = require("../middlewares/multer.middleware");

productRouter.post(
  "/create",
  authMiddleware.authAdmin,
  productValidation.createNew,
  productController.create,
);
productRouter.get("/list", productValidation.getList, productController.list);
productRouter.get(
  "/:_id",
  productValidation.getDetail,
  productController.getDetail,
);
productRouter.patch(
  "/:_id",
  authMiddleware.authAdmin,
  productValidation.update,
  productController.update,
);
productRouter.delete(
  "/",
  authMiddleware.authAdmin,
  productValidation.remove,
  productController.remove,
);
productRouter.post(
  "/bulk_create",
  authMiddleware.authAdmin,
  bulkUpload.any(),
  productValidation.createMany,
  productController.createMany,
);

module.exports = productRouter;
