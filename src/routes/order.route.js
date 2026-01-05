const express = require("express");
const orderRouter = express.Router({ mergeParams: true });
const orderController = require("../controllers/order.controller");
orderRouter.post("/create", orderController.createOrder);
module.exports = orderRouter;