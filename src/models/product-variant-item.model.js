const mongoose = require("mongoose");
const productVariantItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    productVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    size: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Size",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
module.exports = mongoose.model("ProductVariantItem", productVariantItemSchema);
