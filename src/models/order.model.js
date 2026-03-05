const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  city: { type: String, required: true },
  name: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, required: true, default: "Pending" },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Image",
    required: false,
  },
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
});

module.exports = mongoose.model("Order", orderSchema);
