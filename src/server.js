const express = require("express");
const connectDB = require("./configs/db");
const corsMiddleware = require("./configs/cors");
const env = require("./configs/environments");
const cookieParser = require("cookie-parser");
const routes = require("./routes/router");
const { errorHandlingMiddleware } = require("./middlewares/error-handling.middleware");
const app = express();
connectDB();
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(errorHandlingMiddleware);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
routes(app);

app.listen(env.APP_PORT, () => {
  console.log(`Server running on port ${env.APP_PORT}`);
});
