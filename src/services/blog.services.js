const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/AppError");
const { Blog } = require("../models/blog.model");

const sanitizeBlogSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const buildUniqueSlug = async (baseValue, currentId = null) => {
  const baseSlug = sanitizeBlogSlug(baseValue) || `blog-${Date.now()}`;
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Blog.findOne({ slug: candidate }).select("_id").lean();
    if (!existing || String(existing._id) === String(currentId || "")) {
      return candidate;
    }
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
};

const serializeBlog = (blog) => {
  if (!blog) {
    return null;
  }

  const source = typeof blog.toObject === "function" ? blog.toObject() : blog;
  const coverImage = source.coverImage;

  return {
    _id: source._id,
    id: String(source._id),
    title: source.title || "",
    slug: source.slug || "",
    category: source.category || "campaign",
    status: source.status || "draft",
    summary: source.summary || "",
    coverImageId: coverImage?._id ? String(coverImage._id) : source.coverImage ? String(source.coverImage) : "",
    coverUrl: source.coverUrl || coverImage?.image_url || "",
    readTime: source.readTime || "5 phút",
    content: source.content || "",
    seoTitle: source.seoTitle || "",
    seoDescription: source.seoDescription || "",
    publishedAt: source.publishedAt || "",
    createdAt: source.createdAt || "",
    updatedAt: source.updatedAt || "",
    createdBy: source.createdBy || null,
    updatedBy: source.updatedBy || null,
  };
};

const getBaseQueryOptions = ({ all = false, page = 1, limit = 10, sortBy = "updatedAt", order = "desc" }) => {
  const allowedSortFields = ["title", "slug", "createdAt", "updatedAt", "publishedAt"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "updatedAt";
  const sortOrder = order === "asc" ? 1 : -1;

  return {
    all: all === true || all === "true",
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort: { [sortField]: sortOrder },
  };
};

const buildFilters = ({ search = "", category, status, publishedOnly = false }) => {
  const filter = {};

  if (publishedOnly) {
    filter.status = "published";
  } else if (status) {
    filter.status = status;
  }

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
    ];
  }

  return filter;
};

const BLOG_POPULATE = [
  {
    path: "coverImage",
    select: "image_url",
  },
];

const listPublicBlogs = async (query = {}) => {
  const { all, page, limit, sort } = getBaseQueryOptions(query);
  const filter = buildFilters({ ...query, publishedOnly: true });

  if (all) {
    const data = await Blog.find(filter).populate(BLOG_POPULATE).sort(sort).lean();
    return {
      all: true,
      total: data.length,
      data: data.map(serializeBlog),
    };
  }

  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    Blog.find(filter).populate(BLOG_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Blog.countDocuments(filter),
  ]);

  return {
    data: blogs.map(serializeBlog),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPublicBlogDetail = async (slug) => {
  const blog = await Blog.findOne({
    slug: sanitizeBlogSlug(slug),
    status: "published",
  })
    .populate(BLOG_POPULATE)
    .lean();

  if (!blog) {
    throw new AppError("Blog post does not exist", StatusCodes.NOT_FOUND);
  }

  return serializeBlog(blog);
};

const listAdminBlogs = async (query = {}) => {
  const { all, page, limit, sort } = getBaseQueryOptions(query);
  const filter = buildFilters(query);

  if (all) {
    const data = await Blog.find(filter).populate(BLOG_POPULATE).sort(sort).lean();
    return {
      all: true,
      total: data.length,
      data: data.map(serializeBlog),
    };
  }

  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    Blog.find(filter).populate(BLOG_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Blog.countDocuments(filter),
  ]);

  return {
    data: blogs.map(serializeBlog),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAdminBlogDetail = async (_id) => {
  const blog = await Blog.findById(_id).populate(BLOG_POPULATE).lean();

  if (!blog) {
    throw new AppError("Blog post does not exist", StatusCodes.NOT_FOUND);
  }

  return serializeBlog(blog);
};

const createBlog = async (payload = {}, user = {}) => {
  const slug = await buildUniqueSlug(payload.slug || payload.title);
  const createdBlog = await Blog.create({
    title: payload.title || "",
    slug,
    category: payload.category || "campaign",
    status: payload.status || "draft",
    summary: payload.summary || "",
    coverImage: payload.coverImageId || null,
    coverUrl: payload.coverUrl || "",
    readTime: payload.readTime || "5 phút",
    content: payload.content || "",
    seoTitle: payload.seoTitle || "",
    seoDescription: payload.seoDescription || "",
    publishedAt: payload.status === "published" ? payload.publishedAt || new Date() : null,
    createdBy: user.userId || null,
    updatedBy: user.userId || null,
  });

  const blog = await Blog.findById(createdBlog._id).populate(BLOG_POPULATE).lean();
  return serializeBlog(blog);
};

const updateBlog = async (_id, payload = {}, user = {}) => {
  const existingBlog = await Blog.findById(_id).lean();

  if (!existingBlog) {
    throw new AppError("Blog post does not exist", StatusCodes.NOT_FOUND);
  }

  const nextStatus = payload.status || existingBlog.status || "draft";
  const nextSlug = await buildUniqueSlug(
    payload.slug !== undefined ? payload.slug : payload.title || existingBlog.slug,
    _id,
  );

  const nextPublishedAt =
    nextStatus === "published"
      ? payload.publishedAt || existingBlog.publishedAt || new Date()
      : existingBlog.publishedAt || null;

  const updatedBlog = await Blog.findByIdAndUpdate(
    _id,
    {
      $set: {
        title: payload.title !== undefined ? payload.title : existingBlog.title,
        slug: nextSlug,
        category: payload.category !== undefined ? payload.category : existingBlog.category,
        status: nextStatus,
        summary: payload.summary !== undefined ? payload.summary : existingBlog.summary,
        coverImage: payload.coverImageId !== undefined ? payload.coverImageId || null : existingBlog.coverImage,
        coverUrl: payload.coverUrl !== undefined ? payload.coverUrl : existingBlog.coverUrl,
        readTime: payload.readTime !== undefined ? payload.readTime : existingBlog.readTime,
        content: payload.content !== undefined ? payload.content : existingBlog.content,
        seoTitle: payload.seoTitle !== undefined ? payload.seoTitle : existingBlog.seoTitle,
        seoDescription:
          payload.seoDescription !== undefined ? payload.seoDescription : existingBlog.seoDescription,
        publishedAt: nextPublishedAt,
        updatedBy: user.userId || existingBlog.updatedBy || null,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate(BLOG_POPULATE)
    .lean();

  return serializeBlog(updatedBlog);
};

const removeBlogs = async (_ids = []) => {
  const result = await Blog.deleteMany({
    _id: { $in: _ids },
  });

  if (!result.deletedCount) {
    throw new AppError("No blog posts were deleted", StatusCodes.NOT_FOUND);
  }

  return {
    deletedCount: result.deletedCount,
  };
};

module.exports = {
  sanitizeBlogSlug,
  serializeBlog,
  listPublicBlogs,
  getPublicBlogDetail,
  listAdminBlogs,
  getAdminBlogDetail,
  createBlog,
  updateBlog,
  removeBlogs,
};
