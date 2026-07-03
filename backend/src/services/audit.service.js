const AuditLog = require("../models/audit.model");
const logger = require("../utils/logger");

class AuditService {
  /**
   * Log an audit event
   * @param {Object} data
   * @param {Object} data.req - Express request object to extract context
   * @param {String} data.action - Action performed (e.g., 'CREATED', 'UPDATED', 'DELETED', 'LOGIN')
   * @param {String} data.entity - Entity affected (e.g., 'Patient', 'Report', 'Auth')
   * @param {String} [data.entityId] - ID of the affected entity
   * @param {Object} [data.details] - Additional contextual details
   */
  static async log({ req, action, entity, entityId = null, details = null }) {
    try {
      const logEntry = new AuditLog({
        userId: req.user ? req.user.id : null,
        userEmail: req.user ? req.user.email : req.body?.email || null,
        role: req.user ? req.user.role : "system",
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        ipAddress: req.ip || req.connection.remoteAddress || "0.0.0.0",
        userAgent: req.get("User-Agent") || "Unknown",
        details,
      });

      // Save asynchronously. Do not await in the main request thread to avoid blocking.
      logEntry.save().catch((err) => {
        logger.error("Failed to save audit log:", { error: err.message, stack: err.stack });
      });
    } catch (error) {
      logger.error("Error generating audit log:", { error: error.message, stack: error.stack });
    }
  }
}

module.exports = AuditService;
