const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./configs/db");
const corsMiddleware = require("./configs/cors");
const env = require("./configs/environments");
const routes = require("./routes/router");
const {
  errorHandlingMiddleware,
} = require("./middlewares/error-handling.middleware");

const app = express();

connectDB();

app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

routes(app);

app.use(errorHandlingMiddleware);

const port = process.env.PORT || env.APP_PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
