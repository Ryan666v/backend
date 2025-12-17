const { StatusCodes } = require("http-status-codes");
const UserServices = require("../services/userServices");
const createUser = async (req, res) => {
  try {
    const result = await UserServices.createUser(req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
  }
};
const login = async (req, res) => {
  try {
    const result = await UserServices.login(req.body);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    return res
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        status: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
  }
};

module.exports = { createUser };
