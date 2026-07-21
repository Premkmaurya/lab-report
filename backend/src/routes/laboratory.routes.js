const express = require('express');
const router = express.Router();
const { userAuth, authorizeRoles } = require('../middlewares/auth.middleware');
const validateRequest = require('../validators/validationMiddleware');
const { validateCreateLaboratory, validateUpdateLaboratory } = require('../validators/laboratory.validator');
const {
  getLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  updateLaboratoryStatus,
  deleteLaboratory,
} = require('../controllers/laboratory.controller');

// System Admin only endpoints
router.use(userAuth, authorizeRoles('system_admin'));

router.get('/', getLaboratories);
router.get('/:id', getLaboratoryById);
router.post('/', validateCreateLaboratory, validateRequest, createLaboratory);
router.patch('/:id', validateUpdateLaboratory, validateRequest, updateLaboratory);
router.patch('/:id/status', updateLaboratoryStatus);
router.delete('/:id', deleteLaboratory);

module.exports = router;
