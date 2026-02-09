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
    name: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
module.exports = mongoose.model("ProductVariant", ProductVariant);
