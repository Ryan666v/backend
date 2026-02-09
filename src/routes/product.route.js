const express = require("express");
const productRouter = express.Router();
const productController = require("../controllers/product.controller");
const productValidation = require("../validations/product.validation");
const authMiddleware = require("../middlewares/auth.middleware");
const productVariantRouter = require("./product-variant.route");
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
  bulkUpload.array("images", 1000),
  // productValidation.createMany,.
  productController.createMany,
);
productRouter.use("/:productId/variants", productVariantRouter);
module.exports = productRouter;
