const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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

departmentSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
departmentSchema.index({ isActive: 1, name: 1 });

const Department = mongoose.model("Department", departmentSchema);
module.exports = Department;
