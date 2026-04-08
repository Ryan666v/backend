const { StatusCodes } = require("http-status-codes");
const ContactServices = require("../services/contact.services");

const create = async (req, res, next) => {
  try {
    const result = await ContactServices.create(req.body);
    return res.status(StatusCodes.CREATED).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { create };
