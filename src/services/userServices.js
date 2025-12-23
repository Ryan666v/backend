const { StatusCodes } = require("http-status-codes");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const env = require("../config/environments");
const jwtServices = require("./jwtServices");
const Helper = require("../utils/helper");
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
        username: checkedUser.username,
      });
    } catch (error) {
      reject(error);
    }
  });
};
const getUserInfo = (_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkedUser = await User.findOne({ _id: _id }).select("-password");
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
const refreshToken = (token) => {
  return new Promise(async (resolve, reject) => {
    try {
      jwt.verify(token, env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          throw new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
        }
        const access_token = jwtServices.generalAccessToken({
          userId: decoded.userId,
          role: decoded.role,
        });
        resolve({ access_token });
      });
    } catch (error) {
      reject(error);
    }
  });
};

const update = async (_id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
          $set: Helper.pickAllowedFields(payload, [
            "username",
            "email",
            "phone",
            "gender",
            "dob",
            "role",
          ]),
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .select("-password")
        .lean();

      if (!updatedUser) {
        throw new AppError("User not found", StatusCodes.NOT_FOUND);
      }
      resolve(updatedUser);
    } catch (error) {
      reject(error);
    }
  });
};
module.exports = { createUser, login, getUserInfo, refreshToken, update };
