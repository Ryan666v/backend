const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const AuthCode = require("../models/auth-code.model");
const Product = require("../models/product.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const env = require("../configs/environments");
const jwtServices = require("./jwt.services");
const Helper = require("../utils/helper");
const MailServices = require("./mail.services");

const AUTH_CODE_EXPIRES_IN_MS = 10 * 60 * 1000;
const SIGNUP_VERIFICATION_TOKEN_EXPIRES_IN = "15m";

const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

const hashCode = (code) =>
  crypto.createHash("sha256").update(String(code)).digest("hex");

const issueSignupVerificationToken = (email) =>
  jwt.sign(
    { email, purpose: "signup-verification" },
    env.EMAIL_TOKEN_SECRET || env.ACCESS_TOKEN_SECRET,
    { expiresIn: SIGNUP_VERIFICATION_TOKEN_EXPIRES_IN },
  );

const verifySignupVerificationToken = (token) =>
  jwt.verify(token, env.EMAIL_TOKEN_SECRET || env.ACCESS_TOKEN_SECRET);

const createAuthCode = async ({ email, purpose }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const code = generateOtpCode();

  await AuthCode.deleteMany({ email: normalizedEmail, purpose });

  await AuthCode.create({
    email: normalizedEmail,
    purpose,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + AUTH_CODE_EXPIRES_IN_MS),
  });

  return code;
};

const consumeAuthCode = async ({ email, purpose, code }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const authCode = await AuthCode.findOne({
    email: normalizedEmail,
    purpose,
  });

  if (!authCode || authCode.expiresAt.getTime() < Date.now()) {
    throw new AppError("Verification code has expired", StatusCodes.UNAUTHORIZED);
  }

  if (authCode.codeHash !== hashCode(code)) {
    throw new AppError("Verification code is invalid", StatusCodes.UNAUTHORIZED);
  }

  await AuthCode.deleteOne({ _id: authCode._id });

  return true;
};

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

const serializeFavoriteIds = (favorites = []) =>
  favorites.map((favorite) => String(favorite?._id || favorite));

const serializeUserPayload = (user, extra = {}) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  username: user.username,
  phone: user.phone || "",
  gender: user.gender || "",
  dob: user.dob || null,
  favorites: serializeFavoriteIds(user.favorites || []),
  ...extra,
});

const createUser = (newUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      let verificationPayload;
      try {
        verificationPayload = verifySignupVerificationToken(
          newUser.verificationToken,
        );
      } catch (error) {
        throw new AppError(
          "Email verification is invalid or expired",
          StatusCodes.UNAUTHORIZED,
        );
      }

      if (
        verificationPayload?.purpose !== "signup-verification" ||
        verificationPayload?.email !== String(newUser.email).trim().toLowerCase()
      ) {
        throw new AppError(
          "Email verification is required before creating account",
          StatusCodes.UNAUTHORIZED,
        );
      }

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
        email: String(newUser.email).trim().toLowerCase(),
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
      const checkedUser = await User.findOne({
        email: String(newUser.email).trim().toLowerCase(),
      });
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
        ...serializeUserPayload(checkedUser),
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
      resolve({
        ...checkedUser.toObject(),
        favorites: serializeFavoriteIds(checkedUser.favorites || []),
      });
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

const requestEmailVerification = async ({ email }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail }).lean();

  if (existingUser) {
    throw new AppError(
      "User with this email already exists",
      StatusCodes.CONFLICT,
    );
  }

  const code = await createAuthCode({
    email: normalizedEmail,
    purpose: "signup",
  });

  await MailServices.sendVerificationCodeMail({
    email: normalizedEmail,
    code,
  });

  return { message: "Verification code sent successfully" };
};

const verifyEmailCode = async ({ email, code }) => {
  const normalizedEmail = String(email).trim().toLowerCase();

  await consumeAuthCode({
    email: normalizedEmail,
    purpose: "signup",
    code,
  });

  return {
    message: "Email verified successfully",
    verificationToken: issueSignupVerificationToken(normalizedEmail),
  };
};

const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    return {
      message: "If this email exists, a reset code has been sent",
    };
  }

  const code = await createAuthCode({
    email: normalizedEmail,
    purpose: "reset-password",
  });

  await MailServices.sendResetPasswordCodeMail({
    email: normalizedEmail,
    code,
  });

  return {
    message: "If this email exists, a reset code has been sent",
  };
};

const resetPasswordByCode = async ({
  email,
  code,
  newPassword,
}) => {
  const normalizedEmail = String(email).trim().toLowerCase();

  await consumeAuthCode({
    email: normalizedEmail,
    purpose: "reset-password",
    code,
  });

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError("User with this email does not exist", StatusCodes.NOT_FOUND);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return {
    message: "Password reset successfully",
  };
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
    ...serializeUserPayload(user),
    picture: picture || "",
  };
};

const getFavoriteProducts = async (userId) => {
  const user = await User.findById(userId).select("favorites").lean();

  if (!user) {
    throw new AppError("User with this ID does not exist", StatusCodes.NOT_FOUND);
  }

  const favoriteIds = serializeFavoriteIds(user.favorites || []);

  if (!favoriteIds.length) {
    return [];
  }

  const products = await Product
    .find({ _id: { $in: favoriteIds } })
    .populate({
      path: "variants",
      populate: [
        { path: "color", select: "name code" },
        { path: "images" },
        {
          path: "items",
          populate: { path: "size", select: "name" },
        },
      ],
    })
    .populate("categories", "name type")
    .lean();

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  return favoriteIds.map((id) => productMap.get(id)).filter(Boolean);
};

const toggleFavorite = async (actor, productId) => {
  if (!actor?.userId) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  Helper.validateObjectId(productId, "Invalid product id");
  await Helper.validateProductExist(productId);

  const user = await User.findById(actor.userId);

  if (!user) {
    throw new AppError("User with this ID does not exist", StatusCodes.NOT_FOUND);
  }

  const productIdString = String(productId);
  user.favorites = user.favorites || [];

  const existingIndex = user.favorites.findIndex(
    (favorite) => String(favorite) === productIdString
  );

  let isFavorite = false;

  if (existingIndex >= 0) {
    user.favorites.splice(existingIndex, 1);
  } else {
    user.favorites.push(productId);
    isFavorite = true;
  }

  await user.save();

  return {
    isFavorite,
    favoriteIds: serializeFavoriteIds(user.favorites || []),
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
  requestEmailVerification,
  verifyEmailCode,
  requestPasswordReset,
  resetPasswordByCode,
  loginWithGoogle,
  getUserInfo,
  refreshToken,
  update,
  changePassword,
  getFavoriteProducts,
  toggleFavorite,
};
