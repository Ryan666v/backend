const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");
const userValidation = require("../validations/userValidation");
const authMiddleware = require("../middlewares/authMiddleware");
userRouter.post("/create", userValidation.createNew, userController.createUser);
userRouter.post("/login", userValidation.login, userController.login);
userRouter.get(
  "/:_id",
  authMiddleware.authUser,
  userValidation.getUserInfo,
  userController.getUserInfo
);
module.exports = userRouter;
