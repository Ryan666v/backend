const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phone: { type: String, required: true },
    dob: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("User", userSchema);
