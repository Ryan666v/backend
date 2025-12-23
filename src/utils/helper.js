const mongoose = require("mongoose");
const AppError = require("./AppError");

const validateObjectId = (_id) => {
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new AppError("Invalid category id", StatusCodes.BAD_REQUEST);
  }
};
const validateObjectIds = (_ids) => {
  _ids.forEach((id) => validateObjectId(id));
};
const pickAllowedFields = (payload, allowedFields = []) => {
  return allowedFields.reduce((result, field) => {
    if (payload[field] !== undefined) {
      result[field] = payload[field];
    }
    return result;
  }, {});
};

module.exports = { validateObjectId, validateObjectIds, pickAllowedFields };
