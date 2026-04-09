const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const env = require("../configs/environments");
const jwtServices = require("./jwt.services");
const Helper = require("../utils/helper");

const sanitizeUsername = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);

const buildUniqueUsername = async ({ name, email }) => {
  const emailPrefix = email?.split("@")?.[0] || "user";
  const baseUsername = sanitizeUsername(name) || sanitizeUsername(emailPrefix) || "user";
  let candidate = baseUsername;
  let counter = 0;

  while (await User.exists({ username: candidate })) {
    counter += 1;
    candidate = `${baseUsername}${counter}`;
  }

  return candidate;
};

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
      if (!checkedUser.password) {
        throw new AppError(
          "This account uses Google sign-in",
          StatusCodes.BAD_REQUEST
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

const loginWithGoogle = async ({ googleId, email, name, picture, emailVerified }) => {
  if (!emailVerified) {
    throw new AppError("Google email is not verified", StatusCodes.UNAUTHORIZED);
  }

  let user =
    (googleId ? await User.findOne({ googleId }) : null) ||
    (email ? await User.findOne({ email }) : null);

  if (!user) {
    const username = await buildUniqueUsername({ name, email });
    user = await User.create({
      username,
      email,
      googleId,
      password: undefined,
      phone: "",
      gender: "",
      dob: null,
    });
  } else if (!user.googleId && googleId) {
    user.googleId = googleId;
    await user.save();
  }

  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    username: user.username,
    phone: user.phone || "",
    gender: user.gender || "",
    dob: user.dob || null,
    picture: picture || "",
  };
};

const update = async (actor, _id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      if (!actor?.userId) {
        throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
      }

      const isAdmin = actor.role === "admin";
      const isSelf = actor.userId === _id;

      if (!isAdmin && !isSelf) {
        throw new AppError("Access denied", StatusCodes.FORBIDDEN);
      }

      const allowedFields = ["username", "email", "phone", "gender", "dob"];
      if (isAdmin) {
        allowedFields.push("role");
      }

      const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
          $set: Helper.pickAllowedFields(payload, allowedFields),
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
const changePassword = async (actor, _id, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);
      if (!actor?.userId) {
        throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
      }

      const isAdmin = actor.role === "admin";
      const isSelf = String(actor.userId) === String(_id);

      if (!isAdmin && !isSelf) {
        throw new AppError("Access denied", StatusCodes.FORBIDDEN);
      }

      const user = await User.findById(_id);
      if (!user) {
        throw new AppError("User not found", StatusCodes.NOT_FOUND);
      }

      if (!isAdmin) {
        const isMatch = await bcrypt.compare(
          payload.currentPassword,
          user.password
        );

        if (!isMatch) {
          throw new AppError(
            "Current password is incorrect",
            StatusCodes.UNAUTHORIZED
          );
        }
      }

      user.password = await bcrypt.hash(payload.newPassword, 10);
      await user.save();

      resolve({ message: "Password changed successfully" });
    } catch (error) {
      reject(error);
    }
  });
};
module.exports = {
  createUser,
  login,
  loginWithGoogle,
  getUserInfo,
  refreshToken,
  update,
  changePassword,
};
