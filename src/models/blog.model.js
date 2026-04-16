const mongoose = require("mongoose");

const BLOG_CATEGORIES = ["campaign", "collection", "style-guide", "behind-the-scenes"];
const BLOG_STATUSES = ["draft", "review", "ready", "published"];

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    slug: { type: String, trim: true, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: BLOG_CATEGORIES,
      default: "campaign",
    },
    status: {
      type: String,
      enum: BLOG_STATUSES,
      default: "draft",
    },
    summary: { type: String, trim: true, default: "" },
    coverImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      default: null,
    },
    coverUrl: { type: String, trim: true, default: "" },
    readTime: { type: String, trim: true, default: "5 phút" },
    content: { type: String, default: "" },
    seoTitle: { type: String, trim: true, default: "" },
    seoDescription: { type: String, trim: true, default: "" },
    publishedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = {
  Blog: mongoose.model("Blog", blogSchema),
  BLOG_CATEGORIES,
  BLOG_STATUSES,
};
