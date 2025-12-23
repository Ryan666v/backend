const express = require("express");
const sizeRouter = express.Router();
const sizeController = require("../controllers/size.controller");
const sizeValidation = require("../validations/size.validation");
const authMiddleware = require("../middlewares/auth.middleware");
sizeRouter.post(
  "/create",
  authMiddleware.authAdmin,
  sizeValidation.createNew,
  sizeController.create
);
sizeRouter.get("/list", sizeValidation.getList, sizeController.get);
sizeRouter.get(
  "/:_id",
  authMiddleware.authAdmin,
  sizeValidation.getDetail,
  sizeController.getDetail
);
sizeRouter.patch(
  "/:_id",
  authMiddleware.authAdmin,
  sizeValidation.update,
  sizeController.update
);
sizeRouter.delete(
  "/",
  authMiddleware.authAdmin,
  sizeValidation.remove,
  sizeController.remove
);

module.exports = sizeRouter;
