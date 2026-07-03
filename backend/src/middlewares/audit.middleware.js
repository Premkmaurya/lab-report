const AuditService = require("../services/audit.service");

/**
 * Express middleware to automatically log audit events based on successful responses.
 * It intercepts the res.json to extract the entity ID if available.
 * 
 * @param {String} action - The action performed (e.g., 'CREATED', 'UPDATED', 'DELETED', 'LOGIN')
 * @param {String} entity - The entity affected (e.g., 'Patient', 'Report', 'Doctor')
 * @returns {Function} Express middleware function
 */
const auditMiddleware = (action, entity) => {
  return (req, res, next) => {
    // Save original json and send functions to intercept the response payload
    const originalJson = res.json;
    const originalSend = res.send;

    let responseBody;

    // Override res.json
    res.json = function (body) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Override res.send (fallback)
    res.send = function (body) {
      if (!responseBody && typeof body === 'object') {
        responseBody = body;
      }
      return originalSend.call(this, body);
    };

    // Listen for the finish event to ensure the request was successful
    res.on("finish", () => {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let entityId = null;
        let details = null;

        // Try to intelligently extract the entity ID from common response structures
        if (responseBody) {
          // If the response has a direct data object (e.g., { patient: { _id: '...' } })
          const entityKey = entity.toLowerCase();
          
          if (responseBody[entityKey] && responseBody[entityKey]._id) {
            entityId = responseBody[entityKey]._id;
          } else if (responseBody.data && responseBody.data._id) {
            entityId = responseBody.data._id;
          } else if (responseBody.user && responseBody.user.id) {
            entityId = responseBody.user.id;
          } else if (req.params && req.params.id) {
            // Fallback to route params if the entity was updated/deleted
            entityId = req.params.id;
          }
        }

        // Special handling for auth routes
        if (entity === "Auth" && responseBody?.user) {
          entityId = responseBody.user.id || responseBody.user._id;
        }

        AuditService.log({
          req,
          action,
          entity,
          entityId,
          details,
        });
      }
    });

    next();
  };
};

module.exports = auditMiddleware;
