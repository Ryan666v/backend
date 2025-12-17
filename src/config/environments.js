require("dotenv").config({ quiet: true });

const env = {
  MONGODB_URL: process.env.MONGODB_URL,
  APP_HOST: process.env.APP_HOST,
  APP_PORT: process.env.APP_PORT,
  JWT_SECRET: process.env.JWT_SECRET,
};

module.exports = env;
