const express = require("express");
const categoryRouter = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
categoryRouter.post(
  "/create",
  authMiddleware.authAdmin,
  categoryController.create
);
categoryRouter.get("/list", authMiddleware.authAdmin, categoryController.get);
categoryRouter.get(
  "/:_id",
  authMiddleware.authAdmin,
  categoryController.getDetail
);
categoryRouter.put(
  "/:_id",
  authMiddleware.authAdmin,
  categoryController.update
);
categoryRouter.delete(
  "/:_id",
  authMiddleware.authAdmin,
  categoryController.remove
);

module.exports = categoryRouter;
