const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

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
        type: {
          type: String,
          enum: ['parameter', 'section'],
          default: 'parameter',
        },
        value: {
          type: String,
          required: function() { return this.type === 'parameter'; },
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

patientTestSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
patientTestSchema.index({ patientId: 1, createdAt: -1 });
patientTestSchema.index({ createdAt: -1 });

const patientTestModel = mongoose.model("PatientTest", patientTestSchema);

module.exports = patientTestModel;
