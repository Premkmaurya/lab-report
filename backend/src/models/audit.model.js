const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Could be unauthenticated (e.g., failed login)
    },
    userEmail: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      default: "system",
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String, // e.g., 'Patient', 'Report', 'Doctor', 'Test', 'Auth'
      required: true,
      index: true,
    },
    entityId: {
      type: String, // Stored as string to support both ObjectIds and other identifiers
      required: false,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: false,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt (Timestamp)
  }
);

// Index for efficient querying by date
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
