const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
module.exports = mongoose.model("Product", productSchema);
