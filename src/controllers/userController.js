const { StatusCodes } = require("http-status-codes");
const UserServices = require("../services/userServices");
const jwtServices = require("../services/jwtServices");
const createUser = async (req, res) => {
  try {
    const result = await UserServices.createUser(req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
  }
};
const login = async (req, res) => {
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
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(StatusCodes.OK).json({ message: "Login successful" });
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
  }
};
const getUserInfo = async (req, res) => {
  try {
    const user = await UserServices.getUserInfo(req);
    return res
      .status(StatusCodes.OK)
      .json({ message: "User info retrieved successfully", data: user });
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
  }
};

module.exports = { createUser, login, getUserInfo };
