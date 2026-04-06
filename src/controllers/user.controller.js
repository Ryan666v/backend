const { StatusCodes } = require("http-status-codes");
const UserServices = require("../services/user.services");
const jwtServices = require("../services/jwt.services");
const createUser = async (req, res, next) => {
  try {
    const result = await UserServices.createUser(req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};
const login = async (req, res, next) => {
  try {
    const user = await UserServices.login(req.body);
    const payload = {
      userId: user._id,
      role: user.role,
    };
    const accessToken = jwtServices.generalAccessToken(payload);
    const refreshToken = jwtServices.generalRefreshToken(payload);
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res
      .status(StatusCodes.OK)
      .json({ message: "Login successful", data: user });
  } catch (error) {
    next(error);
  }
};
const getUserInfo = async (req, res, next) => {
  try {
    const user = await UserServices.getUserInfo(req?.user?.userId);
    return res
      .status(StatusCodes.OK)
      .json({ message: "User info retrieved successfully", data: user });
  } catch (error) {
    next(error);
  }
};
const refreshToken = async (req, res, next) => {
  try {
    const rfToken = req.cookies?.refresh_token;
    if (!rfToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Refresh token is required",
      });
    }
    const { access_token } = await UserServices.refreshToken(rfToken);
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    return res.status(StatusCodes.OK).json({
      message: "New access token generated",
    });
  } catch (error) {
    next(error);
  }
};
const update = async (req, res, next) => {
  try {
    const result = await UserServices.update(req.user, req.params._id, req.body);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = { createUser, login, getUserInfo, refreshToken, update };
