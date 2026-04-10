const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/user.controller");
const userValidation = require("../validations/user.validation");
const authMiddleware = require("../middlewares/auth.middleware");
userRouter.post("/create", userValidation.createNew, userController.createUser);
userRouter.post(
  "/request-email-verification",
  userValidation.requestEmailVerification,
  userController.requestEmailVerification
);
userRouter.post(
  "/verify-email-code",
  userValidation.verifyEmailCode,
  userController.verifyEmailCode
);
userRouter.post("/login", userValidation.login, userController.login);
userRouter.post(
  "/forgot-password",
  userValidation.requestPasswordReset,
  userController.requestPasswordReset
);
userRouter.post(
  "/reset-password",
  userValidation.resetPasswordByCode,
  userController.resetPasswordByCode
);
userRouter.post("/google-login", userController.googleLogin);
userRouter.post("/logout", userController.logout);
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
userRouter.patch(
  "/:_id/change-password",
  authMiddleware.authUser,
  userValidation.changePassword,
  userController.changePassword
);
module.exports = userRouter;
