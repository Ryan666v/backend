const express = require("express");
const connectDB = require("./configs/db");
const corsMiddleware = require("./configs/cors");
const env = require("./configs/environments");
const cookieParser = require("cookie-parser");
const routes = require("./routes/router");
const {
  errorHandlingMiddleware,
} = require("./middlewares/error-handling.middleware");
const {
  IpnFailChecksum,
  IpnOrderNotFound,
  IpnInvalidAmount,
  InpOrderAlreadyConfirmed,
  IpnUnknownError,
  IpnSuccess,
} = require("vnpay");
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
app.get("/vnpay-ipn", async (req, res) => {
  try {
    console.log("run")
    const verify = vnpay.verifyIpnCall(req.query);
    if (!verify.isVerified) {
      return res.json(IpnFailChecksum);
    }

    if (!verify.isSuccess) {
      return res.json(IpnUnknownError);
    }

    if (verify.vnp_Amount !== foundOrder.amount) {
      return res.json(IpnInvalidAmount);
    }

    // Nếu đơn hàng đã được xác nhận trước đó
    if (foundOrder.status === "completed") {
      return res.json(InpOrderAlreadyConfirmed);
    }

    /**
     * Sau khi xác thực đơn hàng thành công,
     * bạn có thể cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
     */
    foundOrder.status = "completed";

    // Sau đó cập nhật trạng thái trở lại cho VNPay để họ biết bạn đã xác nhận đơn hàng
    return res.json(IpnSuccess);
  } catch (error) {
    /**
     * Xử lý các ngoại lệ
     * Ví dụ: dữ liệu không đủ, dữ liệu không hợp lệ, lỗi cập nhật cơ sở dữ liệu
     */
    console.log(`verify error: ${error}`);
    return res.json(IpnUnknownError);
  }
});
const port = process.env.PORT || env.APP_PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

