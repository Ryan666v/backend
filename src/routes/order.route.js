const express = require("express");
const orderRouter = express.Router({ mergeParams: true });
const orderController = require("../controllers/order.controller");
const orderValidation = require("../validations/order.validation");
const authMiddleware = require("../middlewares/auth.middleware");

orderRouter.get("/vnpay-return", orderController.vnpayReturn);
orderRouter.get("/vnpay-ipn", orderController.vnpayIpn);
orderRouter.post(
  "/create",
  authMiddleware.authUser,
  orderValidation.create,
  orderController.createOrder,
);
orderRouter.get(
  "/list",
  authMiddleware.authUser,
  orderValidation.getList,
  orderController.list,
);
orderRouter.get(
  "/:_id",
  authMiddleware.authUser,
  orderValidation.getDetail,
  orderController.getDetail,
);
orderRouter.patch(
  "/:_id/status",
  authMiddleware.authAdmin,
  orderValidation.getDetail,
  orderValidation.updateStatus,
  orderController.updateStatus,
);
orderRouter.patch(
  "/:_id/cancel",
  authMiddleware.authUser,
  orderValidation.getDetail,
  orderController.cancel,
);
module.exports = orderRouter;
