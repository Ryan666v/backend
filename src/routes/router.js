const UserRoute = require("./userRoute");
const route = (app) => {
  app.use("/api/users", UserRoute);
};

module.exports = route;
