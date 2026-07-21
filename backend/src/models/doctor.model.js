const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const tenantPlugin = require("../plugins/tenantPlugin");

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    signUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

doctorSchema.plugin(tenantPlugin);
doctorSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
doctorSchema.index({ laboratoryId: 1, name: 1 });

const doctorModel = mongoose.model("Doctor", doctorSchema);

module.exports = doctorModel;