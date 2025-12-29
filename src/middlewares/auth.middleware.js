const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const env = require("../configs/environments");
const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Access token is required"
      });
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid or expired token"
    });
  }
};

const authUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "user" || req.user.role === "admin") {
      return next();
    }
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "Access denied"
    });
  });
};

const authAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "admin") {
      return next();
    }

    return res.status(StatusCodes.FORBIDDEN).json({
      message: "Admin access only"
    });
  });
};

module.exports = {
  verifyToken,
  authUser,
  authAdmin
};
