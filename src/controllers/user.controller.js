const { StatusCodes } = require("http-status-codes");
const UserServices = require("../services/user.services");
const jwtServices = require("../services/jwt.services");
const env = require("../configs/environments");

const setAuthCookies = (res, payload) => {
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
};

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
    setAuthCookies(res, payload);
    return res
      .status(StatusCodes.OK)
      .json({ message: "Login successful", data: user });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "GOOGLE_CLIENT_ID is not configured",
      });
    }

    const credential = req.body?.credential;
    const accessToken = req.body?.accessToken;

    if (!credential && !accessToken) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Google access token is required",
      });
    }

    let googleProfile;

    if (credential) {
      const googleResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
          credential
        )}`
      );

      if (!googleResponse.ok) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Google credential is invalid",
        });
      }

      googleProfile = await googleResponse.json();

      if (googleProfile.aud !== env.GOOGLE_CLIENT_ID) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Google credential audience mismatch",
        });
      }
    } else {
      const tokenInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(
          accessToken
        )}`
      );

      if (!tokenInfoResponse.ok) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Google access token is invalid",
        });
      }

      const tokenInfo = await tokenInfoResponse.json();

      if (tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Google access token audience mismatch",
        });
      }

      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Google user info could not be retrieved",
        });
      }

      googleProfile = await userInfoResponse.json();
    }

    const user = await UserServices.loginWithGoogle({
      googleId: googleProfile.sub,
      email: googleProfile.email,
      name: googleProfile.name,
      picture: googleProfile.picture,
      emailVerified:
        googleProfile.email_verified === true ||
        googleProfile.email_verified === "true",
    });

    setAuthCookies(res, {
      userId: user._id,
      role: user.role,
    });

    return res.status(StatusCodes.OK).json({
      message: "Google login successful",
      data: user,
    });
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
const logout = async (req, res, next) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
    return res.status(StatusCodes.OK).json({
      message: "Logout successful",
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
const changePassword = async (req, res, next) => {
  try {
    const result = await UserServices.changePassword(
      req.user,
      req.params._id,
      req.body
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createUser,
  login,
  googleLogin,
  getUserInfo,
  refreshToken,
  logout,
  update,
  changePassword,
};
