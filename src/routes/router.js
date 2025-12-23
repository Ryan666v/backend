const UserRouter = require("./user.route");
const ProductRouter = require("./product.route");
const CategoryRouter = require("./category.route");
const SizeRouter = require("./size.route");
const ColorRouter = require("./color.route");
const route = (app) => {
  app.use("/api/users", UserRouter);
  app.use("/api/category", CategoryRouter);
  app.use("/api/product", ProductRouter);
  app.use("/api/color", ColorRouter);
  app.use("/api/size", SizeRouter);
};

module.exports = route;
