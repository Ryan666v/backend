const { StatusCodes } = require("http-status-codes");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const createUser = (newUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedUser = await User.findOne({ email: newUser.email });
      if (checkedUser) {
        throw new AppError(
          "User with this email already exists",
          StatusCodes.CONFLICT
        );
      }
      const hashedPassword = await bcrypt.hash(newUser.password, 10);
      const createdUser = await User.create({
        ...newUser,
        password: hashedPassword,
      });
      if (createdUser) {
        resolve({ message: "User created successfully" });
      }
    } catch (error) {
      reject(error);
    }
  });
};
const login = (newUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedUser = await User.findOne({ email: newUser.email });
      console.log(checkedUser);
      if (!checkedUser) {
        throw new AppError(
          "User with this email does not exist",
          StatusCodes.NOT_FOUND
        );
      }
      const comparedPassword = await bcrypt.compare(
        newUser.password,
        checkedUser.password
      );
      if (!comparedPassword) {
        throw new AppError("Incorrect password", StatusCodes.UNAUTHORIZED);
      }
      resolve({
        _id: checkedUser._id,
        email: checkedUser.email,
        role: checkedUser.role,
      });
    } catch (error) {
      reject(error);
    }
  });
};
const getUserInfo = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedUser = await User.findOne({ _id: req.params._id }).select("-password");
      if (!checkedUser) {
        throw new AppError(
          "User with this ID does not exist",
          StatusCodes.NOT_FOUND
        );
      }
      resolve(checkedUser);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { createUser, login, getUserInfo };
