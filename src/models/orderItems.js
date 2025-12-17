const mongoose = require("mongoose");
const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productVariantItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariantItem",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("OrderItem", orderItemSchema);
