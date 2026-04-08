const { StatusCodes } = require("http-status-codes");
const Contact = require("../models/contact.model");
const AppError = require("../utils/AppError");

const create = async (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const createdContact = await Contact.create({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        message: payload.message,
      });

      if (!createdContact) {
        throw new AppError("Could not create contact message", StatusCodes.BAD_REQUEST);
      }

      resolve(createdContact);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { create };
