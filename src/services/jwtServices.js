const jwt = require("jsonwebtoken");
const generateAccessToken = (payload, secret, options) => {
  return jwt.sign(payload, secret, options);
};

const generateRefreshToken = (payload, secret, options) => {
  return jwt.sign(payload, secret, options);
};
module.exports = { generateAccessToken, generateRefreshToken };