const express = require("express");
const colorRouter = express.Router();
const colorController = require("../controllers/color.controller");
const colorValidation = require("../validations/color.validation");
const authMiddleware = require("../middlewares/auth.middleware");
colorRouter.post(
  "/create",
  authMiddleware.authAdmin,
  colorValidation.createNew,
  colorController.create
);
colorRouter.get("/list", colorValidation.getList, colorController.list);
colorRouter.get("/:_id", colorValidation.getDetail, colorController.getDetail);
colorRouter.patch(
  "/:_id",
  authMiddleware.authAdmin,
  colorValidation.update,
  colorController.update
);
colorRouter.delete(
  "/",
  authMiddleware.authAdmin,
  colorValidation.remove,
  colorController.remove
);
module.exports = colorRouter;
