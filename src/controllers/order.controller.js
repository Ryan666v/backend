const vnpay = require("../configs/vnpay");
const { StatusCodes } = require("http-status-codes");
const env = require("../configs/environments");

const createOrder = async (req, res, next) => {
  console.log(req.headers["x-forwarded-for"]);
  console.log(req.connection.remoteAddress);
  console.log(req.socket.remoteAddress);
  console.log(req.ip);
  try {
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: 20000,
      vnp_IpAddr:
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip,
      vnp_TxnRef: Date.now().toString(),
      vnp_OrderInfo: `Thanh toan don hang ${Date.now().toString()}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: env.APP_HOST,
      vnp_Locale: "vn",
    });
    res.status(StatusCodes.CREATED).json({ paymentUrl });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder };
