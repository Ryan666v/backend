const express = require("express");
const contactRouter = express.Router();
const contactController = require("../controllers/contact.controller");
const contactValidation = require("../validations/contact.validation");

contactRouter.post(
  "/create",
  contactValidation.createNew,
  contactController.create
);

module.exports = contactRouter;
