const express = require("express");
const imageRouter = express.Router({ mergeParams: true });
const { upload } = require("../middlewares/multer.middleware");
const imageController = require("../controllers/image.controller");
const authMiddleware = require("../middlewares/auth.middleware");
imageRouter.post(
  "/create",
  authMiddleware.authAdmin,
  upload.array("images", 4),
  imageController.createMany,
);
imageRouter.get("/list", imageController.get);
imageRouter.get("/:_id", imageController.getDetail);
imageRouter.patch(
  "/:_id",
  authMiddleware.authAdmin,
  upload.array("images", 1),
  imageController.update,
);
imageRouter.delete("/", authMiddleware.authAdmin, imageController.remove);
module.exports = imageRouter;
