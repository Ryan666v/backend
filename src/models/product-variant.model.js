const mongoose = require("mongoose");
const ProductVariant = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
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
