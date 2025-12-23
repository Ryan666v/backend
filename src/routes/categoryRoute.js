const express = require("express");
const categoryRouter = express.Router();
const categoryController = require("../controllers/categoryController");
const categoryValidation = require("../validations/categoryValidation");
const authMiddleware = require("../middlewares/authMiddleware");
categoryRouter.post(
  "/create",
  authMiddleware.authAdmin,
  categoryValidation.createNew,
  categoryController.create
);
categoryRouter.get("/list", authMiddleware.authAdmin, categoryValidation.getList, categoryController.get);
categoryRouter.get(
  "/:_id",
  authMiddleware.authAdmin,
  categoryValidation.getDetail,
  categoryController.getDetail
);
categoryRouter.patch(
  "/:_id",
  authMiddleware.authAdmin,
  categoryValidation.update,
  categoryController.update
);
categoryRouter.delete(
  "/",
  authMiddleware.authAdmin,
  categoryValidation.remove,
  categoryController.remove
);

module.exports = categoryRouter;
