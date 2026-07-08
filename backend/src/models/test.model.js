const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const subTestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['parameter', 'section'],
      default: 'parameter',
    },
    price: {
      type: Number,
      required: function() { return this.type === 'parameter'; },
      default: 0,
    },
    normalRange: {
      type: String,
      // optional: normal range may be omitted
    },
    unit: {
      type: String,
      // optional: unit may be omitted
    },
  },
  {
    timestamps: true,
    id: false,
  },
);

const testSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    subTests: [subTestSchema],
    createdAt: {
      type: Date,
      default: Date.now,
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

testSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
testSchema.index({ departmentId: 1 });
testSchema.index({ createdAt: -1 });

const testModel = mongoose.model("Test", testSchema);

module.exports = testModel;
