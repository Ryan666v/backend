const mongoose = require("mongoose");
const ProductVariant = mongoose.Schema(
  {
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: true,
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
        required: true,
      },
    ],
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariantItem",
        required: true,
      },
    ],
    name: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
module.exports = mongoose.model("ProductVariant", ProductVariant);
