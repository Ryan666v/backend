const { StatusCodes } = require("http-status-codes");
const { default: mongoose } = require("mongoose");
const {
  IpnFailChecksum,
  IpnInvalidAmount,
  IpnOrderNotFound,
  InpOrderAlreadyConfirmed,
  IpnSuccess,
  IpnUnknownError,
} = require("vnpay");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItems.model");
const ProductVariantItem = require("../models/product-variant-item.model");
const AppError = require("../utils/AppError");
const Helper = require("../utils/helper");
const vnpay = require("../configs/vnpay");
const env = require("../configs/environments");

const ORDER_POPULATE = [
  {
    path: "user",
    select: "username email phone",
  },
  {
    path: "orderItems",
    populate: {
      path: "productVariantItem",
      populate: {
        path: "size",
        select: "name",
      },
    },
  },
];

const buildOrderCode = () =>
  `ORD_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const getClientIp = (req) =>
  req.headers["x-forwarded-for"] ||
  req.connection?.remoteAddress ||
  req.socket?.remoteAddress ||
  req.ip;

const aggregateItems = (items = []) => {
  const itemMap = new Map();

  items.forEach((item) => {
    const key = String(item.productVariantItem);
    const current = itemMap.get(key) || {
      productVariantItem: key,
      quantity: 0,
    };

    current.quantity += Number(item.quantity || 0);
    itemMap.set(key, current);
  });

  return Array.from(itemMap.values());
};

const populateOrderQuery = (query) =>
  ORDER_POPULATE.reduce(
    (current, populateConfig) => current.populate(populateConfig),
    query,
  );

const restoreInventoryForOrder = async (orderId, session) => {
  const orderItems = await OrderItem.find({ order: orderId }).session(session).lean();

  for (const item of orderItems) {
    await ProductVariantItem.updateOne(
      { _id: item.productVariantItem },
      { $inc: { quantity: item.quantity } },
      { session },
    );
  }
};

const reserveInventory = async (normalizedItems, session) => {
  for (const item of normalizedItems) {
    const updatedItem = await ProductVariantItem.findOneAndUpdate(
      {
        _id: item.productVariantItem,
        quantity: { $gte: item.quantity },
      },
      { $inc: { quantity: -item.quantity } },
      {
        new: true,
        session,
      },
    );

    if (!updatedItem) {
      throw new AppError(
        "Insufficient inventory for one or more items",
        StatusCodes.CONFLICT,
      );
    }
  }
};

const create = async (actor, payload, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!actor?.userId) {
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
    }

    const normalizedItems = aggregateItems(payload.items);
    Helper.validateObjectIds(normalizedItems.map((item) => item.productVariantItem));

    const productItems = await ProductVariantItem.find({
      _id: { $in: normalizedItems.map((item) => item.productVariantItem) },
    })
      .populate("size", "name")
      .session(session);

    if (productItems.length !== normalizedItems.length) {
      throw new AppError(
        "One or more order items do not exist",
        StatusCodes.BAD_REQUEST,
      );
    }

    const itemMap = new Map(productItems.map((item) => [String(item._id), item]));

    for (const item of normalizedItems) {
      const productItem = itemMap.get(String(item.productVariantItem));
      if (!productItem || productItem.quantity < item.quantity) {
        throw new AppError(
          "One or more items do not have enough stock",
          StatusCodes.CONFLICT,
        );
      }
    }

    const orderId = new mongoose.Types.ObjectId();
    const orderCode = buildOrderCode();

    await reserveInventory(normalizedItems, session);

    const orderItemsPayload = normalizedItems.map((item) => {
      const productItem = itemMap.get(String(item.productVariantItem));
      return {
        _id: new mongoose.Types.ObjectId(),
        order: orderId,
        productVariantItem: productItem._id,
        productName: productItem.name,
        sizeName: productItem.size?.name || "",
        quantity: item.quantity,
        price: productItem.price,
        lineTotal: productItem.price * item.quantity,
      };
    });

    const subtotal = orderItemsPayload.reduce(
      (total, item) => total + item.lineTotal,
      0,
    );
    const totalItems = orderItemsPayload.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    await OrderItem.insertMany(orderItemsPayload, { session });

    await Order.create(
      [
        {
          _id: orderId,
          code: orderCode,
          user: actor.userId,
          name: payload.name,
          phone: payload.phone,
          city: payload.city,
          district: payload.district,
          ward: payload.ward,
          address: payload.address,
          note: payload.note,
          paymentMethod: payload.paymentMethod || "COD",
          paymentStatus: "PENDING",
          status: "PENDING",
          subtotal,
          total: subtotal,
          totalItems,
          inventoryReserved: true,
          orderItems: orderItemsPayload.map((item) => item._id),
        },
      ],
      { session },
    );

    let paymentUrl = null;
    if ((payload.paymentMethod || "COD") === "VNPAY") {
      paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: subtotal,
        vnp_IpAddr: getClientIp(req),
        vnp_TxnRef: orderCode,
        vnp_OrderInfo: `Thanh toan don hang ${orderCode}`,
        vnp_OrderType: "other",
        vnp_ReturnUrl: `${env.APP_HOST}/api/order/vnpay-return`,
        vnp_Locale: "vn",
      });
    }

    await session.commitTransaction();

    return {
      order: await populateOrderQuery(Order.findById(orderId)).lean(),
      paymentUrl,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getList = async (actor, query) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!actor?.userId) {
        throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
      }

      const {
        page = 1,
        limit = 10,
        all = false,
        sortBy = "createdAt",
        order = "desc",
        status,
        paymentStatus,
        paymentMethod,
        user,
      } = query;

      const filter = {};
      if (status) filter.status = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (paymentMethod) filter.paymentMethod = paymentMethod;

      if (actor.role === "admin") {
        if (user) filter.user = user;
      } else {
        filter.user = actor.userId;
      }

      const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "total",
        "status",
        "paymentStatus",
      ];
      const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";
      const sortOrder = order === "asc" ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      if (all === true || all === "true") {
        const data = await populateOrderQuery(Order.find(filter).sort(sort)).lean();
        return resolve({
          all: true,
          total: data.length,
          data,
        });
      }

      const skip = (page - 1) * limit;
      const [orders, total] = await Promise.all([
        populateOrderQuery(
          Order.find(filter).sort(sort).skip(skip).limit(limit),
        ).lean(),
        Order.countDocuments(filter),
      ]);

      resolve({
        data: orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getDetail = async (actor, _id) => {
  return new Promise(async (resolve, reject) => {
    try {
      Helper.validateObjectId(_id);

      const order = await populateOrderQuery(Order.findById(_id)).lean();
      if (!order) {
        throw new AppError("Order not found", StatusCodes.NOT_FOUND);
      }

      if (
        actor?.role !== "admin" &&
        String(order.user?._id || order.user) !== String(actor?.userId)
      ) {
        throw new AppError("Access denied", StatusCodes.FORBIDDEN);
      }

      resolve(order);
    } catch (error) {
      reject(error);
    }
  });
};

const updateStatus = async (_id, payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    Helper.validateObjectId(_id);

    const order = await Order.findById(_id).session(session);
    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }

    if (order.status === "COMPLETED") {
      throw new AppError(
        "Completed orders cannot be changed",
        StatusCodes.CONFLICT,
      );
    }

    if (payload.status === "CANCELLED" && order.inventoryReserved) {
      await restoreInventoryForOrder(order._id, session);
      order.inventoryReserved = false;
      order.paymentStatus =
        order.paymentStatus === "PAID" ? "REFUNDED" : "CANCELLED";
      order.cancelledAt = new Date();
    }

    order.status = payload.status;
    await order.save({ session });

    await session.commitTransaction();
    return await populateOrderQuery(Order.findById(order._id)).lean();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const cancel = async (actor, _id) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    Helper.validateObjectId(_id);

    const order = await Order.findById(_id).session(session);
    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }

    const isOwner = String(order.user) === String(actor?.userId);
    if (actor?.role !== "admin" && !isOwner) {
      throw new AppError("Access denied", StatusCodes.FORBIDDEN);
    }

    if (["SHIPPING", "COMPLETED"].includes(order.status)) {
      throw new AppError(
        "Orders that are shipping or completed cannot be cancelled",
        StatusCodes.CONFLICT,
      );
    }

    if (order.status === "CANCELLED") {
      throw new AppError(
        "Order has already been cancelled",
        StatusCodes.CONFLICT,
      );
    }

    if (order.inventoryReserved) {
      await restoreInventoryForOrder(order._id, session);
      order.inventoryReserved = false;
    }

    order.status = "CANCELLED";
    order.paymentStatus =
      order.paymentStatus === "PAID" ? "REFUNDED" : "CANCELLED";
    order.cancelledAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    return await populateOrderQuery(Order.findById(order._id)).lean();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const applyVnpayResult = async (query, verificationType = "return") => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const verify =
      verificationType === "ipn"
        ? vnpay.verifyIpnCall(query)
        : vnpay.verifyReturnUrl(query);

    if (!verify.isVerified) {
      await session.abortTransaction();
      return verificationType === "ipn"
        ? IpnFailChecksum
        : { success: false, message: "Fail checksum", verify };
    }

    const order = await Order.findOne({ code: verify.vnp_TxnRef }).session(session);
    if (!order) {
      await session.abortTransaction();
      return verificationType === "ipn"
        ? IpnOrderNotFound
        : { success: false, message: "Order not found", verify };
    }

    if (Number(verify.vnp_Amount) !== order.total) {
      await session.abortTransaction();
      return verificationType === "ipn"
        ? IpnInvalidAmount
        : { success: false, message: "Invalid amount", verify };
    }

    if (order.paymentStatus === "PAID") {
      await session.abortTransaction();
      return verificationType === "ipn"
        ? InpOrderAlreadyConfirmed
        : { success: true, message: "Order already confirmed", orderId: order._id };
    }

    if (verify.isSuccess) {
      order.paymentStatus = "PAID";
      order.status = order.status === "PENDING" ? "CONFIRMED" : order.status;
      order.paymentRef = verify.vnp_TransactionNo || verify.vnp_BankTranNo;
      order.paidAt = new Date();
    } else {
      if (order.inventoryReserved) {
        await restoreInventoryForOrder(order._id, session);
        order.inventoryReserved = false;
      }
      order.paymentStatus = "FAILED";
      order.status = "CANCELLED";
      order.cancelledAt = new Date();
    }

    await order.save({ session });
    await session.commitTransaction();

    return verificationType === "ipn"
      ? IpnSuccess
      : {
          success: verify.isSuccess,
          message: verify.message,
          orderId: order._id,
          code: order.code,
          paymentStatus: order.paymentStatus,
          status: order.status,
        };
  } catch (error) {
    await session.abortTransaction();
    if (verificationType === "ipn") {
      return IpnUnknownError;
    }
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  create,
  getList,
  getDetail,
  updateStatus,
  cancel,
  applyVnpayResult,
};
