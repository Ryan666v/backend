const express = require("express");
const imageRouter = express.Router({ mergeParams: true });
const upload = require("../middlewares/multer.middleware");
const imageController = require("../controllers/image.controller");
const authMiddleware = require("../middlewares/auth.middleware");
imageRouter.post(
  "/create",
  authMiddleware.authAdmin,
  upload.array("images", 4),
  imageController.createMany
);
imageRouter.delete("/", authMiddleware.authAdmin, imageController.remove);
module.exports = imageRouter;
