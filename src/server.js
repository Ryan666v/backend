const express = require("express");
const connectDB = require("./config/db");
const corsMiddleware  = require("./config/cors");
const env = require("./config/environments");
const cookieParser = require("cookie-parser");
const routes = require("./routes/router");
const app = express();
app.use(corsMiddleware);
connectDB();
app.use(express.json());
app.use(cookieParser());
routes(app);
app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.listen(env.APP_PORT, () => {
  console.log(`Server running on port ${env.APP_PORT}`);
});
