const { VNPay, ignoreLogger } = require("vnpay");
const env = require("./environments");
const vnpay = new VNPay({
  tmnCode: env.TMN_CODE,
  secureSecret: env.SECURE_SECRET,
  vnpayHost: "https://sandbox.vnpayment.vn",

  testMode: true,
  hashAlgorithm: "SHA512",
  enableLog: true,
  loggerFn: ignoreLogger,

  endpoints: {
    paymentEndpoint: "paymentv2/vpcpay.html",
    queryDrRefundEndpoint: "merchant_webapi/api/transaction",
    getBankListEndpoint: "qrpayauth/api/merchant/get_bank_list",
  },
});
module.exports = vnpay;