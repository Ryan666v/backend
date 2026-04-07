const express = require("express");
const variantItemRouter = express.Router();
const variantItemController = require("../controllers/product-variant-items.controller");
const variantItemValidation = require("../validations/product-variant-item.validation");
const authMiddleware = require("../middlewares/auth.middleware");

variantItemRouter.post(
  "/create",
  authMiddleware.authAdmin,
  variantItemValidation.createNew,
  variantItemController.create,
);

variantItemRouter.get(
  "/list",
  variantItemValidation.getList,
  variantItemController.getList,
);

variantItemRouter.get(
  "/:_id",
  variantItemValidation.getDetail,
  variantItemController.getDetail,
);

variantItemRouter.patch(
  "/:_id",
  authMiddleware.authAdmin,
  variantItemValidation.update,
  variantItemController.update,
);

variantItemRouter.delete(
  "/",
  authMiddleware.authAdmin,
  variantItemValidation.remove,
  variantItemController.remove,
);

module.exports = variantItemRouter;
