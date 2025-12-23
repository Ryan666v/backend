const CategoryRouter = require("./categoryRoute");
const UserRoute = require("./userRoute");
const route = (app) => {
  app.use("/api/users", UserRoute);
  app.use("/api/category", CategoryRouter);
};

module.exports = route;
