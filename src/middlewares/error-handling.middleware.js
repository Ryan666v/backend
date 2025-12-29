const { StatusCodes } = require("http-status-codes");
const errorHandlingMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || StatusCodes[err.statusCode];
  res.status(statusCode).json({
    status: statusCode,
    message,
  });
};

module.exports = { errorHandlingMiddleware };
