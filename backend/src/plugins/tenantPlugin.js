const mongoose = require('mongoose');

/**
 * Mongoose plugin for Multi-Tenant schema isolation.
 * Automatically adds laboratoryId field and indexes to schemas.
 */
function tenantPlugin(schema) {
  // Add laboratoryId field if not present
  if (!schema.path('laboratoryId')) {
    schema.add({
      laboratoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laboratory',
        required: true,
        index: true,
      },
    });
  }
}

module.exports = tenantPlugin;
