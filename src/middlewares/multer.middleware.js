const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "ecommerce_images",
    format: "jpg",
    public_id: `variant-${req.params.variantId}-${Date.now()}`,
  }),
});

const upload = multer({
  storage,
  limits: {
    files: 4,
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Chỉ cho phép upload file ảnh"), false);
    } else {
      cb(null, true);
    }
  },
});

module.exports = upload;
