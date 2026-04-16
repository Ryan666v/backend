const { StatusCodes } = require("http-status-codes");
const { default: mongoose } = require("mongoose");
const crypto = require("crypto");
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
const User = require("../models/user.model");
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

const getVietnamDateParts = (date = new Date()) => {
  const vietnamDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
  );

  return {
    year: String(vietnamDate.getFullYear()).slice(-2),
    month: String(vietnamDate.getMonth() + 1).padStart(2, "0"),
    date: String(vietnamDate.getDate()).padStart(2, "0"),
  };
};

const buildZalopayAppTransId = (orderCode) => {
  const { year, month, date } = getVietnamDateParts();
  return `${year}${month}${date}_${orderCode}`;
};

const getClientIp = (req) =>
  req.headers["x-forwarded-for"] ||
  req.connection?.remoteAddress ||
  req.socket?.remoteAddress ||
  req.ip;

const getPublicApiBaseUrl = (req) => {
  if (env.API_PUBLIC_URL) {
    return env.API_PUBLIC_URL.replace(/\/$/, "");
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto || req.protocol || "http";
  const host = req.get("host");

  return `${protocol}://${host}`;
};

const getStorefrontBaseUrl = (req) =>
  (env.APP_HOST || env.CLIENT_URL || req.headers.origin || "").replace(/\/$/, "");

const ensureZalopayConfig = () => {
  if (!env.ZALOPAY_APP_ID || !env.ZALOPAY_KEY1 || !env.ZALOPAY_KEY2) {
    throw new AppError(
      "ZaloPay is not configured. Missing ZALOPAY_APP_ID, ZALOPAY_KEY1 or ZALOPAY_KEY2",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

const signHmacSha256 = (payload, secret) =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

const requestZalopay = async (endpoint, payload) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(
      Object.entries(payload).reduce((result, [key, value]) => {
        result[key] = value == null ? "" : String(value);
        return result;
      }, {}),
    ),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new AppError(
      data?.return_message || "ZaloPay request failed",
      StatusCodes.BAD_GATEWAY,
    );
  }

  return data;
};

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

const markOrderPaid = (order, paymentRef) => {
  order.paymentStatus = "PAID";
  order.status = order.status === "PENDING" ? "CONFIRMED" : order.status;
  order.paymentRef = paymentRef || order.paymentRef;
  order.paidAt = new Date();
};

const markOrderPaymentFailed = async (order, session) => {
  if (order.inventoryReserved) {
    await restoreInventoryForOrder(order._id, session);
    order.inventoryReserved = false;
  }

  order.paymentStatus = "FAILED";
  order.status = "CANCELLED";
  order.cancelledAt = new Date();
};

const buildPaymentResultPayload = (order, success, message) => ({
  success,
  message,
  orderId: order._id,
  code: order.code,
  paymentStatus: order.paymentStatus,
  status: order.status,
});

const buildZalopayCreatePayload = ({
  actor,
  orderCode,
  appTransId,
  subtotal,
  orderItemsPayload,
  req,
}) => {
  ensureZalopayConfig();

  const appId = Number(env.ZALOPAY_APP_ID);
  const appTime = Date.now();
  const appUser = String(actor.userId);
  const storefrontBaseUrl = getStorefrontBaseUrl(req);

  if (!storefrontBaseUrl) {
    throw new AppError(
      "Storefront URL is not configured. Set APP_HOST or CLIENT_URL before enabling ZaloPay",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  const item = JSON.stringify(
    orderItemsPayload.map((itemPayload) => ({
      itemid: String(itemPayload.productVariantItem),
      itemname: itemPayload.productName,
      itemprice: itemPayload.price,
      itemquantity: itemPayload.quantity,
    })),
  );
  const embedData = JSON.stringify({
    merchantinfo: orderCode,
    redirecturl: `${storefrontBaseUrl}/checkout/payment-result?provider=zalopay`,
  });
  const callbackUrl = `${getPublicApiBaseUrl(req)}/api/order/zalopay-callback`;
  const macInput = [
    appId,
    appTransId,
    appUser,
    subtotal,
    appTime,
    embedData,
    item,
  ].join("|");

  return {
    app_id: appId,
    app_user: appUser,
    app_time: appTime,
    amount: subtotal,
    app_trans_id: appTransId,
    embed_data: embedData,
    item,
    bank_code: "",
    description: `Thanh toan don hang ${orderCode}`,
    callback_url: callbackUrl,
    mac: signHmacSha256(macInput, env.ZALOPAY_KEY1),
  };
};

const queryZalopayTransaction = async (appTransId) => {
  ensureZalopayConfig();

  const appId = Number(env.ZALOPAY_APP_ID);
  const mac = signHmacSha256(
    `${appId}|${appTransId}|${env.ZALOPAY_KEY1}`,
    env.ZALOPAY_KEY1,
  );

  return requestZalopay(env.ZALOPAY_QUERY_ENDPOINT, {
    app_id: appId,
    app_trans_id: appTransId,
    mac,
  });
};

const applyOrderStatusChange = async (order, nextStatus, session) => {
  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (order.status === "COMPLETED") {
    throw new AppError(
      "Completed orders cannot be changed",
      StatusCodes.CONFLICT,
    );
  }

  if (nextStatus === "CANCELLED" && order.inventoryReserved) {
    await restoreInventoryForOrder(order._id, session);
    order.inventoryReserved = false;
    order.paymentStatus =
      order.paymentStatus === "PAID" ? "REFUNDED" : "CANCELLED";
    order.cancelledAt = new Date();
  }

  order.status = nextStatus;
  await order.save({ session });

  return order;
};

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
    const paymentMethod = payload.paymentMethod || "COD";
    const paymentAppTransId =
      paymentMethod === "ZALOPAY" ? buildZalopayAppTransId(orderCode) : null;

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
          paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING",
          subtotal,
          total: subtotal,
          totalItems,
          inventoryReserved: true,
          paymentAppTransId,
          orderItems: orderItemsPayload.map((item) => item._id),
        },
      ],
      { session },
    );

    let paymentUrl = null;
    if (paymentMethod === "VNPAY") {
      paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: subtotal,
        vnp_IpAddr: getClientIp(req),
        vnp_TxnRef: orderCode,
        vnp_OrderInfo: `Thanh toan don hang ${orderCode}`,
        vnp_OrderType: "other",
        vnp_ReturnUrl: `${env.APP_HOST}/checkout/payment-result`,
        vnp_Locale: "vn",
      });
    }

    if (paymentMethod === "ZALOPAY") {
      const response = await requestZalopay(
        env.ZALOPAY_CREATE_ENDPOINT,
        buildZalopayCreatePayload({
          actor,
          orderCode,
          appTransId: paymentAppTransId,
          subtotal,
          orderItemsPayload,
          req,
        }),
      );

      if (Number(response.return_code) !== 1 || !response.order_url) {
        throw new AppError(
          [
            response.return_message,
            response.sub_return_message,
            response.sub_return_code != null
              ? `sub_return_code=${response.sub_return_code}`
              : null,
            response.return_code != null
              ? `return_code=${response.return_code}`
              : null,
          ]
            .filter(Boolean)
            .join(" | ") || "Could not create ZaloPay payment",
          StatusCodes.BAD_GATEWAY,
        );
      }

      paymentUrl = response.order_url;
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
        search = "",
        createdFrom,
        createdTo,
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

      if (createdFrom || createdTo) {
        filter.createdAt = {};
        if (createdFrom) {
          filter.createdAt.$gte = new Date(createdFrom);
        }
        if (createdTo) {
          const endOfDay = new Date(createdTo);
          endOfDay.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = endOfDay;
        }
      }

      const normalizedSearch = String(search || "").trim();
      if (normalizedSearch) {
        const regex = new RegExp(normalizedSearch, "i");
        const matchedUsers = await User.find(
          {
            $or: [{ username: regex }, { email: regex }, { phone: regex }],
          },
          { _id: 1 }
        ).lean();

        const userIds = matchedUsers.map((matchedUser) => matchedUser._id);
        const searchConditions = [
          { code: regex },
          { name: regex },
          { phone: regex },
        ];

        if (userIds.length) {
          searchConditions.push({ user: { $in: userIds } });
        }

        filter.$or = searchConditions;
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
    await applyOrderStatusChange(order, payload.status, session);

    await session.commitTransaction();
    return await populateOrderQuery(Order.findById(order._id)).lean();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const bulkUpdateStatus = async (payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    Helper.validateObjectIds(payload.ids);

    const orders = await Order.find({
      _id: { $in: payload.ids },
    }).session(session);

    if (orders.length !== payload.ids.length) {
      throw new AppError("One or more orders were not found", StatusCodes.NOT_FOUND);
    }

    for (const order of orders) {
      await applyOrderStatusChange(order, payload.status, session);
    }

    await session.commitTransaction();

    return await populateOrderQuery(
      Order.find({ _id: { $in: payload.ids } }).sort({ createdAt: -1 })
    ).lean();
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
      markOrderPaid(order, verify.vnp_TransactionNo || verify.vnp_BankTranNo);
    } else {
      await markOrderPaymentFailed(order, session);
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

const applyZalopayCallback = async (callbackBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    ensureZalopayConfig();

    const dataStr = callbackBody?.data;
    const requestMac = callbackBody?.mac;

    if (!dataStr || !requestMac) {
      await session.abortTransaction();
      return {
        return_code: 2,
        return_message: "Missing callback payload",
      };
    }

    const mac = signHmacSha256(dataStr, env.ZALOPAY_KEY2);
    if (mac !== requestMac) {
      await session.abortTransaction();
      return {
        return_code: -1,
        return_message: "mac not equal",
      };
    }

    const callbackData = JSON.parse(dataStr);
    const order = await Order.findOne({
      paymentAppTransId: callbackData.app_trans_id,
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return {
        return_code: 2,
        return_message: "Order not found",
      };
    }

    if (Number(callbackData.amount) !== order.total) {
      await session.abortTransaction();
      return {
        return_code: 2,
        return_message: "Invalid amount",
      };
    }

    if (order.paymentStatus !== "PAID") {
      markOrderPaid(order, callbackData.zp_trans_id);
      await order.save({ session });
    }

    await session.commitTransaction();
    return {
      return_code: 1,
      return_message: "success",
    };
  } catch (error) {
    await session.abortTransaction();
    return {
      return_code: 0,
      return_message: error.message,
    };
  } finally {
    session.endSession();
  }
};

const applyZalopayReturn = async (query) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    ensureZalopayConfig();

    const checksumData = [
      query.appid ?? "",
      query.apptransid ?? "",
      query.pmcid ?? "",
      query.bankcode ?? "",
      query.amount ?? "",
      query.discountamount ?? "",
      query.status ?? "",
    ].join("|");
    const checksum = signHmacSha256(checksumData, env.ZALOPAY_KEY2);

    if (checksum !== query.checksum) {
      await session.abortTransaction();
      return {
        success: false,
        message: "Invalid ZaloPay checksum",
      };
    }

    const order = await Order.findOne({
      paymentAppTransId: query.apptransid,
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return {
        success: false,
        message: "Order not found",
      };
    }

    if (order.paymentStatus === "PAID") {
      await session.abortTransaction();
      return buildPaymentResultPayload(order, true, "Order already confirmed");
    }

    const queryResult = await queryZalopayTransaction(order.paymentAppTransId);
    const returnCode = Number(queryResult.return_code);

    if (returnCode === 1) {
      markOrderPaid(order, queryResult.zp_trans_id);
      await order.save({ session });
      await session.commitTransaction();
      return buildPaymentResultPayload(
        order,
        true,
        queryResult.return_message || "Payment confirmed",
      );
    }

    if (returnCode === 3) {
      await session.abortTransaction();
      return buildPaymentResultPayload(
        order,
        false,
        queryResult.return_message || "Payment is still pending confirmation",
      );
    }

    await markOrderPaymentFailed(order, session);
    await order.save({ session });
    await session.commitTransaction();

    return buildPaymentResultPayload(
      order,
      false,
      queryResult.return_message || "Payment failed",
    );
  } catch (error) {
    await session.abortTransaction();
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
  bulkUpdateStatus,
  cancel,
  applyVnpayResult,
  applyZalopayReturn,
  applyZalopayCallback,
};
