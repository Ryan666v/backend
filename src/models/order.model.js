const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    paymentMethod: {
      type: String,
      enum: ["COD", "VNPAY", "ZALOPAY"],
      required: true,
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"],
      required: true,
      default: "PENDING",
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"],
      required: true,
      default: "PENDING",
    },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    totalItems: { type: Number, required: true, min: 1 },
    inventoryReserved: { type: Boolean, required: true, default: true },
    paymentRef: { type: String, trim: true },
    paymentAppTransId: { type: String, trim: true, index: true },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
    orderItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Order", orderSchema);
