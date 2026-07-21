const Laboratory = require('../models/laboratory.model');

/**
 * Injects tenant filter query criteria based on authenticated user's role and laboratoryId.
 */
const injectTenantFilter = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role === 'system_admin') {
      const targetLabId = req.query.laboratoryId || req.headers['x-laboratory-id'];
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
 */
const injectTenantOnCreate = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'system_admin') {
    const labId = req.body.laboratoryId || req.tenantFilter?.laboratoryId;
    if (!labId) {
      return res.status(400).json({ message: 'laboratoryId is required when creating resources as System Admin' });
    }
    req.body.laboratoryId = labId;
    return next();
  }

  req.body.laboratoryId = req.user.laboratoryId;
  next();
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
