const env = require("../config/environments");
const jwt = require("jsonwebtoken");
const generalAccessToken = (data) => {
  const access_token = jwt.sign(data, env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1m",
  });
  return access_token;
};

const generalRefreshToken = (data) => {
  const refresh_token = jwt.sign(data, env.REFRESH_TOKEN_SECRET, {
    expiresIn: "365d",
  });
  return refresh_token;
};
module.exports = { generalAccessToken, generalRefreshToken };
