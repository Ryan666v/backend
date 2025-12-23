const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");
const userValidation = require("../validations/userValidation");
const authMiddleware = require("../middlewares/authMiddleware");
userRouter.post("/create", userValidation.createNew, userController.createUser);
userRouter.post("/login", userValidation.login, userController.login);
userRouter.post("/refresh_token", userController.refreshToken);
userRouter.get(
  "/user_info",
  authMiddleware.authUser,
  userController.getUserInfo
);
userRouter.patch(
  "/:_id",
  authMiddleware.authUser,
  userValidation.update,
  userController.update
);
module.exports = userRouter;
