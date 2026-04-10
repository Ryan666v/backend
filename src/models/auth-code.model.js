const mongoose = require("mongoose");

const authCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: {
      type: String,
      enum: ["signup", "reset-password"],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

authCodeSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model("AuthCode", authCodeSchema);
