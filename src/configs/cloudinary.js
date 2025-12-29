const cloudinary = require("cloudinary").v2;
const env = require("./environments");
cloudinary.config({
  cloud_name: env.CLOUD_NAME,
  api_key: env.CLOUD_API_KEY,
  api_secret: env.CLOUD_API_SECRET,
});

module.exports = cloudinary;