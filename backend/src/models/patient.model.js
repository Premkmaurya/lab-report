const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    referredDoctor: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

patientSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
patientSchema.index({ date: -1 });
patientSchema.index({ createdAt: -1 });

const patientModel = mongoose.model("Patient", patientSchema);

module.exports = patientModel;
