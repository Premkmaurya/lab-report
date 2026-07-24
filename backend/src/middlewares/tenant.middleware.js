const Laboratory = require('../models/laboratory.model');
const Patient = require('../models/patient.model');

/**
 * Injects tenant filter query criteria based on authenticated user's role and laboratoryId.
 */
const injectTenantFilter = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role === 'system_admin') {
      const targetLabId = req.query.laboratoryId || req.headers['x-laboratory-id'] || req.body?.laboratoryId;
      if (targetLabId) {
        req.tenantFilter = { laboratoryId: targetLabId };
        req.laboratoryId = targetLabId;
      } else {
        req.tenantFilter = {};
        req.laboratoryId = null;
      }
      return next();
    }

    if (!req.user.laboratoryId) {
      return res.status(403).json({ message: 'User is not associated with any laboratory' });
    }

    req.tenantFilter = { laboratoryId: req.user.laboratoryId };
    req.laboratoryId = req.user.laboratoryId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Automatically attaches laboratoryId to request body for creation endpoints.
 * Makes laboratoryId optional ONLY for System Admin creating Global Tests or System Admin users.
 */
const injectTenantOnCreate = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.body) {
      req.body = {};
    }

    if (req.user.role === 'system_admin') {
      let labId = req.body.laboratoryId || req.tenantFilter?.laboratoryId || req.query.laboratoryId || req.headers['x-laboratory-id'];

      // If creating a patient test/report where patientId exists, attempt resolving from patient document
      if (!labId && req.body.patientId) {
        const patient = await Patient.findById(req.body.patientId);
        if (patient && patient.laboratoryId) {
          labId = patient.laboratoryId.toString();
        }
      }

      // Check if creating a Global Test or System Admin user
      const isGlobalTest = req.body.isGlobal === true || req.body.isGlobal === 'true' || req.query.isGlobal === 'true' || req.path?.includes('/global') || req.baseUrl?.includes('/global');
      const isSystemAdminUser = req.body.role === 'system_admin';

      if (!labId && (isGlobalTest || isSystemAdminUser)) {
        req.body.laboratoryId = null;
        req.laboratoryId = null;
        return next();
      }

      if (!labId) {
        return res.status(400).json({ message: 'laboratoryId is required when creating resources as System Admin' });
      }

      const labExists = await Laboratory.findById(labId);
      if (!labExists) {
        return res.status(400).json({ message: 'Selected laboratory does not exist' });
      }

      req.body.laboratoryId = labId;
      req.tenantFilter = { laboratoryId: labId };
      req.laboratoryId = labId;
      return next();
    }

    if (!req.user.laboratoryId) {
      return res.status(403).json({ message: 'User is not associated with any laboratory' });
    }

    req.body.laboratoryId = req.user.laboratoryId;
    req.tenantFilter = { laboratoryId: req.user.laboratoryId };
    req.laboratoryId = req.user.laboratoryId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies resource ownership against current tenant.
 */
const verifyTenantOwnership = (doc, req) => {
  if (!doc) return true;
  if (req.user?.role === 'system_admin') return true;

  if (!doc.laboratoryId || doc.laboratoryId.toString() !== req.user?.laboratoryId?.toString()) {
    return false;
  }
  return true;
};

module.exports = {
  injectTenantFilter,
  injectTenantOnCreate,
  verifyTenantOwnership,
};
