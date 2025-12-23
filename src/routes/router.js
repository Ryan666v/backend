const UserRouter = require("./user.route");
const ProductRouter = require("./product.route");
const CategoryRouter = require("./category.route");
const route = (app) => {
  app.use("/api/users", UserRouter);
  app.use("/api/category", CategoryRouter);
  app.use("/api/product", ProductRouter);
};

module.exports = route;
