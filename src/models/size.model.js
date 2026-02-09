const mongoose = require("mongoose");
const sizeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
module.exports = mongoose.model("Size", sizeSchema);
