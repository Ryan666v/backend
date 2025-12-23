const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/user.controller");
const userValidation = require("../validations/user.validation");
const authMiddleware = require("../middlewares/auth.middleware");
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
