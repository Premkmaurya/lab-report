const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const tenantPlugin = require("../plugins/tenantPlugin");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.plugin(tenantPlugin);
departmentSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
departmentSchema.index({ name: 1, laboratoryId: 1 }, { unique: true });
departmentSchema.index({ isActive: 1, name: 1 });

const Department = mongoose.model("Department", departmentSchema);
module.exports = Department;
