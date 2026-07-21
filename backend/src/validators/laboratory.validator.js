const { body } = require('express-validator');

const validateCreateLaboratory = [
  body('name').trim().notEmpty().withMessage('Laboratory name is required'),
  body('code').trim().notEmpty().withMessage('Laboratory code is required')
    .isLength({ min: 2, max: 10 }).withMessage('Laboratory code must be 2-10 characters'),
];

const validateUpdateLaboratory = [
  body('name').optional().trim().notEmpty().withMessage('Laboratory name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
];

module.exports = {
  validateCreateLaboratory,
  validateUpdateLaboratory,
};
