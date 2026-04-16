const mongoose = require("mongoose");
const imageSchema = new mongoose.Schema(
  {
    image_url: { type: String, required: true },
    public_id: { type: String, required: true },
    scope: {
      type: String,
      enum: ["product", "landing", "branding", "content"],
      default: "product",
    },
    slotKey: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
module.exports = mongoose.model("Image", imageSchema);
