const mongoose = require("mongoose");
const imageSchema = new mongoose.Schema(
  {
    image_url: { type: String, required: true },
    productVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Image", imageSchema);
