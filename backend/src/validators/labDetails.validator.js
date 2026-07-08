const { body } = require("express-validator");

const allowedFields = [
  "laboratoryDisplayName",
  "letterheadAddressLine",
  "contactPhone",
  "contactEmail",
];

const requireAtLeastOneField = body().custom((value, { req }) => {
  const hasAny = allowedFields.some((f) => {
    const v = req.body[f];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });

  if (!hasAny) {
    throw new Error(
      "Please provide at least one of laboratoryDisplayName, letterheadAddressLine, contactPhone, contactEmail",
    );
  }

  return true;
});

const validateCreateLabDetails = [
  requireAtLeastOneField,
  body("contactEmail").optional().isEmail().withMessage("Invalid contact email"),
  body("contactPhone").optional().isString().isLength({ min: 3 }).withMessage("Invalid contact phone"),
];

const validateUpdateLabDetails = [
  requireAtLeastOneField,
  body("contactEmail").optional().isEmail().withMessage("Invalid contact email"),
  body("contactPhone").optional().isString().isLength({ min: 3 }).withMessage("Invalid contact phone"),
];

module.exports = {
  validateCreateLabDetails,
  validateUpdateLabDetails,
};
