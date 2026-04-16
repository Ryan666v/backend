require("dotenv").config({ quiet: true });

const env = {
  MONGODB_URL: process.env.MONGODB_URL,
  APP_HOST: process.env.APP_HOST,
  APP_PORT: process.env.APP_PORT,
  CLIENT_URL: process.env.CLIENT_URL,
  API_PUBLIC_URL: process.env.API_PUBLIC_URL,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  EMAIL_TOKEN_SECRET: process.env.EMAIL_TOKEN_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  CLOUD_NAME: process.env.CLOUD_NAME,
  CLOUD_API_KEY: process.env.CLOUD_API_KEY,
  CLOUD_API_SECRET: process.env.CLOUD_API_SECRET,
  TMN_CODE: process.env.TMN_CODE,
  SECURE_SECRET: process.env.SECURE_SECRET,
  ZALOPAY_APP_ID: process.env.ZALOPAY_APP_ID,
  ZALOPAY_KEY1: process.env.ZALOPAY_KEY1,
  ZALOPAY_KEY2: process.env.ZALOPAY_KEY2,
  ZALOPAY_CREATE_ENDPOINT:
    process.env.ZALOPAY_CREATE_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create",
  ZALOPAY_QUERY_ENDPOINT:
    process.env.ZALOPAY_QUERY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/query",
};

module.exports = env;
