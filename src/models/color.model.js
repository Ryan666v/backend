const mongoose = require("mongoose");
const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, maxlength: 7 },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Color", colorSchema);
