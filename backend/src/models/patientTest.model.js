const mongoose = require("mongoose");

const patientTestItemSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    result: [
      {
        parameter: {
          type: String,
          trim: true,
        },
        value: {
          type: String,
          required: true,
          trim: true,
        },
        unit: {
          type: String,
          trim: true,
        },
        normalRange: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    _id: false,
  },
);

const patientTestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    department:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    tests: [patientTestItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const patientTestModel = mongoose.model("PatientTest", patientTestSchema);

module.exports = patientTestModel;
