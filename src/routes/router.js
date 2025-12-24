const UserRouter = require("./user.route");
const ProductRouter = require("./product.route");
const CategoryRouter = require("./category.route");
const SizeRouter = require("./size.route");
const ColorRouter = require("./color.route");
const VariantRouter = require("./product-variant.route");
const ImageRouter = require("./image.route");
const route = (app) => {
  app.use("/api/users", UserRouter);
  app.use("/api/category", CategoryRouter);
  app.use("/api/product", ProductRouter);
  app.use("/api/color", ColorRouter);
  app.use("/api/size", SizeRouter);
  app.use("/api/variants", VariantRouter);
  app.use("/api/image", ImageRouter);
};

module.exports = route;
