const express = require('express');
const router = express.Router();
const { userAuth, authorizeRoles } = require('../middlewares/auth.middleware');
const validateRequest = require('../validators/validationMiddleware');
const { validateCreateLaboratory, validateUpdateLaboratory } = require('../validators/laboratory.validator');
const {
  getLaboratories,
  getLaboratoryById,
  getLaboratoryUsers,
  getLaboratoryPatients,
  getLaboratoryDoctors,
  getLaboratoryTests,
  getLaboratoryReports,
  createLaboratory,
  updateLaboratory,
  updateLaboratoryStatus,
  deleteLaboratory,
} = require('../controllers/laboratory.controller');

// Access middleware: System Admin can view any lab; Lab Admin can view their own lab
const authorizeLabAccess = (req, res, next) => {
  if (req.user.role === 'system_admin') {
    return next();
  }
  const userLabId = req.user.laboratoryId ? req.user.laboratoryId.toString() : null;
  if (req.user.role === 'admin' && userLabId && userLabId === req.params.id) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only view your own laboratory details.',
  });
};

// All routes require user auth
router.use(userAuth);

// System Admin only list and creation
router.get('/', authorizeRoles('system_admin'), getLaboratories);
router.post('/', authorizeRoles('system_admin'), validateCreateLaboratory, validateRequest, createLaboratory);

// Laboratory Details & Sub-resources (System Admin OR Lab Admin for own lab)
router.get('/:id', authorizeLabAccess, getLaboratoryById);
router.get('/:id/users', authorizeLabAccess, getLaboratoryUsers);
router.get('/:id/patients', authorizeLabAccess, getLaboratoryPatients);
router.get('/:id/doctors', authorizeLabAccess, getLaboratoryDoctors);
router.get('/:id/tests', authorizeLabAccess, getLaboratoryTests);
router.get('/:id/reports', authorizeLabAccess, getLaboratoryReports);

// Updates & Deletion (System Admin or Lab Admin for own lab settings)
router.patch('/:id', authorizeLabAccess, validateUpdateLaboratory, validateRequest, updateLaboratory);
router.patch('/:id/status', authorizeRoles('system_admin'), updateLaboratoryStatus);
router.delete('/:id', authorizeRoles('system_admin'), deleteLaboratory);

module.exports = router;
